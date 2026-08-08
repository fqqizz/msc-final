-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 002_customer_management.sql
-- Module: 2. Customer Management
-- Description: Customer metrics, play hours, lifetime value, automated last_seen & last_booking
--              tracking, full-text search tsvector, cached customer leaderboards, 
--              customer tags, internal CRM notes, audit metadata, soft deletes, and RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.customer_tier AS ENUM (
        'new',
        'regular',
        'vip',
        'blacklisted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- Customers table extending user_profiles with aggregate metrics & activity tracking
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tier public.customer_tier NOT NULL DEFAULT 'new',
    hours_played NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_bookings INTEGER NOT NULL DEFAULT 0,
    total_spend NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    preferred_venue_id UUID NULL, -- Deferred FK in 003_venue_management.sql
    last_booking_at TIMESTAMPTZ NULL,
    last_seen_at TIMESTAMPTZ NULL,
    emergency_contact_name VARCHAR(150) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    date_of_birth DATE NULL,
    internal_notes TEXT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    blacklist_reason TEXT NULL,

    -- Full Text Search Vector
    search_vector tsvector NULL,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_customer_metrics_non_negative CHECK (
        hours_played >= 0 AND total_bookings >= 0 AND total_spend >= 0
    )
);

-- Customer Tag Definitions
CREATE TABLE IF NOT EXISTS public.customer_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    color_code VARCHAR(10) NOT NULL DEFAULT '#3B82F6',
    description TEXT NULL,
    
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Notes (Internal log notes added by staff/reception)
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    author_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    note TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES & SEARCH OPTIMIZATION
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers(tier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_leaderboard ON public.customers(total_spend DESC, hours_played DESC) WHERE deleted_at IS NULL AND is_blacklisted = FALSE;
CREATE INDEX IF NOT EXISTS idx_customers_total_bookings ON public.customers(total_bookings DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_last_seen ON public.customers(last_seen_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_tags ON public.customers USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_customers_search_vector ON public.customers USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON public.customer_notes(customer_id, created_at DESC) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 4. CACHED / MATERIALIZED LEADERBOARD VIEW
-- ----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_customer_leaderboard AS
SELECT 
    c.id AS customer_id,
    p.full_name,
    p.avatar_url,
    c.tier,
    c.hours_played,
    c.total_bookings,
    c.total_spend,
    c.last_booking_at,
    ROW_NUMBER() OVER (ORDER BY c.total_spend DESC, c.hours_played DESC) AS rank
FROM public.customers c
JOIN public.user_profiles p ON c.id = p.id
WHERE c.deleted_at IS NULL AND p.deleted_at IS NULL AND c.is_blacklisted = FALSE AND p.role = 'customer';

CREATE UNIQUE INDEX IF NOT EXISTS uq_idx_mv_customer_leaderboard ON public.mv_customer_leaderboard(customer_id);

-- ----------------------------------------------------------------------------
-- 5. FUNCTIONS & RPCs
-- ----------------------------------------------------------------------------

-- Full Text Search Vector Generator Trigger Function
CREATE OR REPLACE FUNCTION public.update_customer_search_vector()
RETURNS TRIGGER AS $$
DECLARE
    v_profile RECORD;
BEGIN
    SELECT full_name, phone, email INTO v_profile
    FROM public.user_profiles WHERE id = NEW.id;

    NEW.search_vector := 
        to_tsvector('english', COALESCE(v_profile.full_name, '')) ||
        to_tsvector('english', COALESCE(v_profile.phone, '')) ||
        to_tsvector('english', COALESCE(v_profile.email, '')) ||
        to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), ''));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to increment customer metrics upon booking completion
CREATE OR REPLACE FUNCTION public.increment_customer_stats(
    p_customer_id UUID,
    p_hours NUMERIC(10,2),
    p_spend NUMERIC(12,2)
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.customers
    SET 
        hours_played = hours_played + COALESCE(p_hours, 0),
        total_spend = total_spend + COALESCE(p_spend, 0),
        total_bookings = total_bookings + 1,
        last_booking_at = NOW(),
        last_seen_at = NOW(),
        tier = CASE
            WHEN (total_spend + COALESCE(p_spend, 0)) >= 50000 THEN 'vip'::public.customer_tier
            WHEN (total_bookings + 1) >= 5 THEN 'regular'::public.customer_tier
            ELSE tier
        END,
        updated_at = NOW()
    WHERE id = p_customer_id AND deleted_at IS NULL;

    -- Refresh Leaderboard Materialized View asynchronously
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_customer_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Get Top Customer Leaderboard (Querying Materialized View for high performance)
CREATE OR REPLACE FUNCTION public.get_customer_leaderboard(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    customer_id UUID,
    full_name VARCHAR,
    avatar_url TEXT,
    tier public.customer_tier,
    hours_played NUMERIC(10,2),
    total_bookings INTEGER,
    total_spend NUMERIC(12,2),
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.customer_id,
        l.full_name,
        l.avatar_url,
        l.tier,
        l.hours_played,
        l.total_bookings,
        l.total_spend,
        l.rank
    FROM public.mv_customer_leaderboard l
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- RPC: Get Detailed Customer Profile for Admin/Reception
CREATE OR REPLACE FUNCTION public.get_customer_detail(p_customer_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF NOT public.is_staff() AND auth.uid() <> p_customer_id THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    SELECT jsonb_build_object(
        'id', c.id,
        'full_name', p.full_name,
        'phone', p.phone,
        'email', p.email,
        'avatar_url', p.avatar_url,
        'tier', c.tier,
        'hours_played', c.hours_played,
        'total_bookings', c.total_bookings,
        'total_spend', c.total_spend,
        'last_booking_at', c.last_booking_at,
        'last_seen_at', c.last_seen_at,
        'emergency_contact', jsonb_build_object(
            'name', c.emergency_contact_name,
            'phone', c.emergency_contact_phone
        ),
        'tags', c.tags,
        'is_blacklisted', c.is_blacklisted,
        'blacklist_reason', c.blacklist_reason,
        'created_at', c.created_at
    ) INTO v_result
    FROM public.customers c
    JOIN public.user_profiles p ON c.id = p.id
    WHERE c.id = p_customer_id AND c.deleted_at IS NULL AND p.deleted_at IS NULL;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS & AUTOMATION
-- ----------------------------------------------------------------------------

-- Trigger to auto-create customer entry when a user profile is created with role = 'customer'
CREATE OR REPLACE FUNCTION public.handle_new_customer_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'customer' THEN
        INSERT INTO public.customers (id, created_by)
        VALUES (NEW.id, NEW.id)
        ON CONFLICT (id) DO NOTHING;
    ELSE
        -- If user is staff/owner/super_admin, ensure they are NOT in customers table
        DELETE FROM public.customers WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_on_user_profile_customer_created ON public.user_profiles;
CREATE TRIGGER tr_on_user_profile_customer_created
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_customer_entry();

-- Search vector trigger
DROP TRIGGER IF EXISTS tr_customers_search_vector ON public.customers;
CREATE TRIGGER tr_customers_search_vector
    BEFORE INSERT OR UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_customer_search_vector();

-- Update timestamp triggers
DROP TRIGGER IF EXISTS tr_customers_updated_at ON public.customers;
CREATE TRIGGER tr_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_customer_notes_updated_at ON public.customer_notes;
CREATE TRIGGER tr_customer_notes_updated_at
    BEFORE UPDATE ON public.customer_notes
    FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

-- Audit triggers
DROP TRIGGER IF EXISTS tr_audit_customers ON public.customers;
CREATE TRIGGER tr_audit_customers
    AFTER INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.msc_audit_trigger();

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- Customers Policies
DROP POLICY IF EXISTS "customers_select_own_or_staff" ON public.customers;
CREATE POLICY "customers_select_own_or_staff"
    ON public.customers FOR SELECT
    USING ((id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "customers_update_own_or_staff" ON public.customers;
CREATE POLICY "customers_update_own_or_staff"
    ON public.customers FOR UPDATE
    USING ((id = auth.uid() AND deleted_at IS NULL) OR public.is_staff())
    WITH CHECK (
        (
            id = auth.uid() 
            AND tier = (SELECT tier FROM public.customers WHERE id = auth.uid())
            AND is_blacklisted = (SELECT is_blacklisted FROM public.customers WHERE id = auth.uid())
        )
        OR public.is_staff()
    );

DROP POLICY IF EXISTS "customers_insert_system_or_staff" ON public.customers;
CREATE POLICY "customers_insert_system_or_staff"
    ON public.customers FOR INSERT
    WITH CHECK (id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "customers_delete_owner_only" ON public.customers;
CREATE POLICY "customers_delete_owner_only"
    ON public.customers FOR DELETE
    USING (public.is_owner());

-- Customer Tags Policies
DROP POLICY IF EXISTS "customer_tags_select_all" ON public.customer_tags;
CREATE POLICY "customer_tags_select_all"
    ON public.customer_tags FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "customer_tags_modify_staff_only" ON public.customer_tags;
CREATE POLICY "customer_tags_modify_staff_only"
    ON public.customer_tags FOR ALL
    USING (public.is_staff());

-- Customer Notes Policies (Staff internal only)
DROP POLICY IF EXISTS "customer_notes_select_staff_only" ON public.customer_notes;
CREATE POLICY "customer_notes_select_staff_only"
    ON public.customer_notes FOR SELECT
    USING (public.is_staff() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "customer_notes_insert_staff_only" ON public.customer_notes;
CREATE POLICY "customer_notes_insert_staff_only"
    ON public.customer_notes FOR INSERT
    WITH CHECK (public.is_staff() AND author_id = auth.uid());

DROP POLICY IF EXISTS "customer_notes_update_author_or_owner" ON public.customer_notes;
CREATE POLICY "customer_notes_update_author_or_owner"
    ON public.customer_notes FOR UPDATE
    USING ((author_id = auth.uid() AND deleted_at IS NULL) OR public.is_owner());

DROP POLICY IF EXISTS "customer_notes_delete_owner_only" ON public.customer_notes;
CREATE POLICY "customer_notes_delete_owner_only"
    ON public.customer_notes FOR DELETE
    USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 8. GRANTS & REALTIME
-- ----------------------------------------------------------------------------
GRANT SELECT, UPDATE ON public.customers TO authenticated;
GRANT SELECT ON public.customer_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_notes TO authenticated;
GRANT SELECT ON public.mv_customer_leaderboard TO authenticated;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 9. DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.customers IS 'Extended CRM metrics, play hours, spend, and activity tracking for complex patrons.';
COMMENT ON TABLE public.customer_tags IS 'Tag dictionary for segmenting customers (e.g., Football Club, VIP, Night Owl).';
COMMENT ON TABLE public.customer_notes IS 'Staff-only internal CRM notes regarding customer preferences or behavior.';
COMMENT ON MATERIALIZED VIEW public.mv_customer_leaderboard IS 'High-performance cached leaderboard for top customers by spend and hours played.';

-- ============================================================================
-- Migration Footer: 002_customer_management.sql upgraded & complete
-- ============================================================================
