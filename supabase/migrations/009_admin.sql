-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 009_admin.sql
-- Module: 9. Admin Management, Feature Flags & Scheduled Job Engine
-- Description: Fine-grained RBAC permission matrix, admin user roles, feature flag engine,
--              scheduled cron job trackers, cross-module FTS search, system KV store, RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLES & FEATURE FLAGS & SCHEDULED JOBS
-- ----------------------------------------------------------------------------

-- Dynamic Feature Flags Table (Toggle modules without redeploying code)
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key VARCHAR(100) UNIQUE NOT NULL, -- e.g. enable_coupons, enable_memberships, enable_academies, enable_b2b
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Audit
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled Background Job Scheduler Log Table
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) UNIQUE NOT NULL, -- e.g. booking_reminders, analytics_refresh, lock_cleanup, notif_retries
    cron_expression VARCHAR(50) NOT NULL DEFAULT '0 * * * *',
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, paused, executing, failed
    last_run_at TIMESTAMPTZ NULL,
    next_run_at TIMESTAMPTZ NULL,
    last_status VARCHAR(30) NULL,
    error_log TEXT NULL,

    -- Audit
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Roles Dictionary
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Granular Permissions Catalog
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role Permission Mapping
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
    role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (role_id, permission_id)
);

-- User Role Assignments
CREATE TABLE IF NOT EXISTS public.admin_user_roles (
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    granted_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, role_id)
);

-- System Settings Register (KV Store)
CREATE TABLE IF NOT EXISTS public.admin_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT NULL,

    -- Audit
    updated_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON public.scheduled_jobs(status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role ON public.admin_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user ON public.admin_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_system_settings(setting_key);

-- ----------------------------------------------------------------------------
-- 3. FUNCTIONS & RPCs
-- ----------------------------------------------------------------------------

-- Function: Check Feature Flag Status
CREATE OR REPLACE FUNCTION public.is_feature_enabled(
    p_flag_key VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_enabled BOOLEAN := FALSE;
BEGIN
    SELECT is_enabled INTO v_enabled
    FROM public.feature_flags
    WHERE flag_key = p_flag_key;

    RETURN COALESCE(v_enabled, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function: Check if user has specific permission code
CREATE OR REPLACE FUNCTION public.has_permission(
    p_user_id UUID,
    p_permission_code VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has BOOLEAN := FALSE;
BEGIN
    IF public.is_owner() THEN
        RETURN TRUE;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.admin_user_roles ur
        JOIN public.admin_role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.admin_permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
          AND p.permission_code = p_permission_code
    ) INTO v_has;

    RETURN v_has;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- RPC: Global Admin Search across Customers, Bookings, Payments, Venues using Full Text Search / Trigram
CREATE OR REPLACE FUNCTION public.search_global_admin(
    p_query TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_customers JSONB;
    v_bookings JSONB;
    v_payments JSONB;
    v_venues JSONB;
    v_search_pattern TEXT;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Access Denied: Staff only.';
    END IF;

    v_search_pattern := '%' || p_query || '%';

    -- Search Customers by FTS or Trigram Match
    SELECT COALESCE(jsonb_agg(c_row), '[]'::jsonb) INTO v_customers
    FROM (
        SELECT p.id, p.full_name, p.phone, p.email, c.tier, c.total_spend
        FROM public.user_profiles p
        JOIN public.customers c ON p.id = c.id
        WHERE (p.full_name ILIKE v_search_pattern OR p.phone ILIKE v_search_pattern OR p.email ILIKE v_search_pattern OR c.search_vector @@ plainto_tsquery('english', p_query))
          AND p.deleted_at IS NULL AND c.deleted_at IS NULL
        LIMIT 5
    ) c_row;

    -- Search Bookings
    SELECT COALESCE(jsonb_agg(b_row), '[]'::jsonb) INTO v_bookings
    FROM (
        SELECT b.id, b.booking_number, p.full_name AS customer_name, v.name AS venue_name, b.start_time, b.booking_status, b.total_amount
        FROM public.bookings b
        JOIN public.user_profiles p ON b.customer_id = p.id
        JOIN public.venues v ON b.venue_id = v.id
        WHERE (b.booking_number ILIKE v_search_pattern OR p.full_name ILIKE v_search_pattern OR p.phone ILIKE v_search_pattern)
          AND b.deleted_at IS NULL AND v.deleted_at IS NULL
        LIMIT 5
    ) b_row;

    -- Search Payments by Gateway IDs
    SELECT COALESCE(jsonb_agg(pay_row), '[]'::jsonb) INTO v_payments
    FROM (
        SELECT pay.id, pay.razorpay_payment_id, pay.amount, pay.status, pay.payment_method, pay.created_at
        FROM public.payments pay
        WHERE (pay.razorpay_payment_id ILIKE v_search_pattern OR pay.razorpay_order_id ILIKE v_search_pattern) AND pay.deleted_at IS NULL
        LIMIT 5
    ) pay_row;

    -- Search Venues
    SELECT COALESCE(jsonb_agg(v_row), '[]'::jsonb) INTO v_venues
    FROM (
        SELECT v.id, v.name, v.sport_type, v.status
        FROM public.venues v
        WHERE v.name ILIKE v_search_pattern AND v.deleted_at IS NULL
        LIMIT 5
    ) v_row;

    RETURN jsonb_build_object(
        'customers', v_customers,
        'bookings', v_bookings,
        'payments', v_payments,
        'venues', v_venues
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER tr_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_scheduled_jobs_updated_at ON public.scheduled_jobs;
CREATE TRIGGER tr_scheduled_jobs_updated_at BEFORE UPDATE ON public.scheduled_jobs FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_admin_roles_updated_at ON public.admin_roles;
CREATE TRIGGER tr_admin_roles_updated_at BEFORE UPDATE ON public.admin_roles FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_admin_system_settings_updated_at ON public.admin_system_settings;
CREATE TRIGGER tr_admin_system_settings_updated_at BEFORE UPDATE ON public.admin_system_settings FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_system_settings ENABLE ROW LEVEL SECURITY;

-- Feature Flags Policies
DROP POLICY IF EXISTS "feature_flags_public_read" ON public.feature_flags;
CREATE POLICY "feature_flags_public_read" ON public.feature_flags FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "feature_flags_owner_modify" ON public.feature_flags;
CREATE POLICY "feature_flags_owner_modify" ON public.feature_flags FOR ALL USING (public.is_owner());

-- Scheduled Jobs Policies
DROP POLICY IF EXISTS "scheduled_jobs_staff_only" ON public.scheduled_jobs;
CREATE POLICY "scheduled_jobs_staff_only" ON public.scheduled_jobs FOR ALL USING (public.is_staff());

-- Admin Roles Policies
DROP POLICY IF EXISTS "admin_roles_owner_only" ON public.admin_roles;
CREATE POLICY "admin_roles_owner_only" ON public.admin_roles FOR ALL USING (public.is_owner());

-- Admin System Settings Policies
DROP POLICY IF EXISTS "admin_system_settings_staff_read" ON public.admin_system_settings;
CREATE POLICY "admin_system_settings_staff_read" ON public.admin_system_settings FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "admin_system_settings_owner_modify" ON public.admin_system_settings;
CREATE POLICY "admin_system_settings_owner_modify" ON public.admin_system_settings FOR ALL USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 6. GRANTS & DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.feature_flags TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

COMMENT ON TABLE public.feature_flags IS 'Dynamic feature toggle registry to enable/disable platform capabilities (Coupons, Memberships, Academies).';
COMMENT ON TABLE public.scheduled_jobs IS 'Cron job scheduler status tracker for background tasks (reminders, analytics, cleanup).';
COMMENT ON TABLE public.admin_roles IS 'Role definitions for admin users (Super Admin, Owner, Reception Manager, Accountant).';
COMMENT ON FUNCTION public.is_feature_enabled IS 'Returns TRUE if a platform feature flag is enabled.';

-- ============================================================================
-- Migration Footer: 009_admin.sql upgraded & complete
-- ============================================================================
