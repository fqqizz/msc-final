-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 001_authentication.sql
-- Module: 1. Authentication, System Foundations & Domain Event Infrastructure
-- Description: Core extensions, user profiles, authentication metadata, device tracking,
--              preferences, login history, audit logging, domain event bus, webhook logs,
--              auth helper functions, security definers, RLS policies, and storage setup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 2. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'super_admin',
        'owner',
        'reception',
        'customer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.user_status AS ENUM (
        'active',
        'suspended',
        'deactivated',
        'pending_verification'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.auth_method AS ENUM (
        'phone',
        'email',
        'oauth',
        'guest',
        'magic_link'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 3. UTILITY & SYSTEM TRIGGER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Standard updated_at timestamp and updated_by user tracker
CREATE OR REPLACE FUNCTION public.msc_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF auth.uid() IS NOT NULL THEN
        NEW.updated_by = COALESCE(NEW.updated_by, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Global Audit Logging Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(128) NOT NULL,
    record_id UUID NULL,
    action VARCHAR(32) NOT NULL, -- INSERT, UPDATE, DELETE, SOFT_DELETE
    old_data JSONB NULL,
    new_data JSONB NULL,
    changed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ip_address INET NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON public.audit_logs (changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION public.msc_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_record_id UUID := NULL;
BEGIN
    v_user_id := auth.uid();
    
    IF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        IF (v_old_data ? 'id') THEN
            v_record_id := (v_old_data->>'id')::UUID;
        END IF;
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, v_record_id, 'DELETE', v_old_data, v_user_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        IF (v_new_data ? 'id') THEN
            v_record_id := (v_new_data->>'id')::UUID;
        END IF;
        
        -- Detect soft delete
        IF (v_old_data->>'deleted_at' IS NULL AND v_new_data->>'deleted_at' IS NOT NULL) THEN
            INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
            VALUES (TG_TABLE_NAME, v_record_id, 'SOFT_DELETE', v_old_data, v_new_data, v_user_id);
        ELSE
            INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
            VALUES (TG_TABLE_NAME, v_record_id, 'UPDATE', v_old_data, v_new_data, v_user_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        IF (v_new_data ? 'id') THEN
            v_record_id := (v_new_data->>'id')::UUID;
        END IF;
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, v_record_id, 'INSERT', v_new_data, v_user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 4. DOMAIN EVENT BUS & WEBHOOK LOG INFRASTRUCTURE
-- ----------------------------------------------------------------------------

-- Global Domain Event Log Table
CREATE TABLE IF NOT EXISTS public.domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- e.g. CustomerRegistered, BookingCreated, PaymentFailed
    aggregate_type VARCHAR(100) NOT NULL, -- e.g. customer, booking, payment, venue
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_events_type ON public.domain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate ON public.domain_events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_created ON public.domain_events(created_at DESC);

-- Helper Function to Publish Domain Event
CREATE OR REPLACE FUNCTION public.emit_domain_event(
    p_event_type VARCHAR,
    p_aggregate_type VARCHAR,
    p_aggregate_id UUID,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.domain_events (
        event_type,
        aggregate_type,
        aggregate_id,
        payload,
        actor_id
    ) VALUES (
        p_event_type,
        p_aggregate_type,
        p_aggregate_id,
        p_payload,
        auth.uid()
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Raw Webhook Payload Logs Table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL, -- razorpay, interakt, resend
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,
    body JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature VARCHAR(255) NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    processing_status VARCHAR(30) NOT NULL DEFAULT 'received', -- received, processed, failed
    processing_time_ms INTEGER NULL,
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON public.webhook_logs(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(processing_status);

-- ----------------------------------------------------------------------------
-- 5. TABLES & CONSTRAINTS
-- ----------------------------------------------------------------------------

-- Profile Table linked 1:1 with Supabase Auth
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NULL,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(255) UNIQUE NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT NULL,
    role public.user_role NOT NULL DEFAULT 'customer',
    status public.user_status NOT NULL DEFAULT 'active',
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_user_profiles_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL OR is_guest = TRUE)
);

-- Device Trackers
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    device_token TEXT NOT NULL,
    device_type VARCHAR(50) NOT NULL DEFAULT 'web',
    device_name VARCHAR(100) NULL,
    os_version VARCHAR(50) NULL,
    app_version VARCHAR(50) NULL,
    is_trusted BOOLEAN NOT NULL DEFAULT TRUE,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT uq_user_device UNIQUE (user_id, device_token)
);

-- User UI Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    theme VARCHAR(20) NOT NULL DEFAULT 'system',
    notification_email BOOLEAN NOT NULL DEFAULT TRUE,
    notification_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
    notification_push BOOLEAN NOT NULL DEFAULT TRUE,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Login History Security Audit Table
CREATE TABLE IF NOT EXISTS public.user_login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    auth_method public.auth_method NOT NULL DEFAULT 'phone',
    ip_address INET NULL,
    user_agent TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    failure_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. AUTH SECURITY & ROLE HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
    SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
DECLARE
    v_role public.user_role;
BEGIN
    SELECT role INTO v_role
    FROM public.user_profiles
    WHERE id = auth.uid() AND deleted_at IS NULL;
    
    RETURN COALESCE(v_role, 'customer'::public.user_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT public.get_current_user_role() = 'super_admin'::public.user_role;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
    SELECT public.get_current_user_role() IN ('super_admin'::public.user_role, 'owner'::public.user_role);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_reception()
RETURNS BOOLEAN AS $$
    SELECT public.get_current_user_role() = 'reception'::public.user_role;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT public.get_current_user_role() IN ('super_admin'::public.user_role, 'owner'::public.user_role, 'reception'::public.user_role);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 7. INDEXES & FULL TEXT SEARCH
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_name_trgm ON public.user_profiles USING gin (full_name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 8. TRIGGERS & AUTOMATION
-- ----------------------------------------------------------------------------

-- Trigger to auto-create user_profile & preferences when auth.users receives new insert
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_email TEXT;
    v_role public.user_role := 'customer';
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Guest User');
    v_phone := NEW.phone;
    v_email := NEW.email;

    IF (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
        BEGIN
            v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
        EXCEPTION WHEN OTHERS THEN
            v_role := 'customer'::public.user_role;
        END;
    END IF;

    INSERT INTO public.user_profiles (
        id,
        full_name,
        phone,
        is_phone_verified,
        email,
        is_email_verified,
        role,
        is_guest,
        created_by
    ) VALUES (
        NEW.id,
        v_full_name,
        v_phone,
        CASE WHEN NEW.phone_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
        v_email,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
        v_role,
        CASE WHEN NEW.is_anonymous IS TRUE THEN TRUE ELSE FALSE END,
        NEW.id
    ) ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone),
        email = COALESCE(EXCLUDED.email, public.user_profiles.email);

    -- Create default preferences
    INSERT INTO public.user_preferences (user_id, created_by)
    VALUES (NEW.id, NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Emit Domain Event
    PERFORM public.emit_domain_event('CustomerRegistered', 'customer', NEW.id, jsonb_build_object('full_name', v_full_name, 'email', v_email, 'phone', v_phone));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
CREATE TRIGGER tr_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS tr_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER tr_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_user_devices_updated_at ON public.user_devices;
CREATE TRIGGER tr_user_devices_updated_at
    BEFORE UPDATE ON public.user_devices
    FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER tr_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

-- Apply audit triggers
DROP TRIGGER IF EXISTS tr_audit_user_profiles ON public.user_profiles;
CREATE TRIGGER tr_audit_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.msc_audit_trigger();

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
DROP POLICY IF EXISTS "user_profiles_select_own_or_staff" ON public.user_profiles;
CREATE POLICY "user_profiles_select_own_or_staff"
    ON public.user_profiles FOR SELECT
    USING ((id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "user_profiles_update_own_or_staff" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own_or_staff"
    ON public.user_profiles FOR UPDATE
    USING ((id = auth.uid() AND deleted_at IS NULL) OR public.is_staff())
    WITH CHECK (
        (id = auth.uid() AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()))
        OR public.is_owner()
    );

DROP POLICY IF EXISTS "user_profiles_insert_staff_or_system" ON public.user_profiles;
CREATE POLICY "user_profiles_insert_staff_or_system"
    ON public.user_profiles FOR INSERT
    WITH CHECK (id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "user_profiles_delete_owner_only" ON public.user_profiles;
CREATE POLICY "user_profiles_delete_owner_only"
    ON public.user_profiles FOR DELETE
    USING (public.is_owner());

-- User Devices Policies
DROP POLICY IF EXISTS "user_devices_select_own_or_staff" ON public.user_devices;
CREATE POLICY "user_devices_select_own_or_staff"
    ON public.user_devices FOR SELECT
    USING ((user_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "user_devices_insert_own" ON public.user_devices;
CREATE POLICY "user_devices_insert_own"
    ON public.user_devices FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_devices_update_own" ON public.user_devices;
CREATE POLICY "user_devices_update_own"
    ON public.user_devices FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_devices_delete_own" ON public.user_devices;
CREATE POLICY "user_devices_delete_own"
    ON public.user_devices FOR DELETE
    USING (user_id = auth.uid() OR public.is_staff());

-- Preferences Policies
DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
CREATE POLICY "user_preferences_select_own"
    ON public.user_preferences FOR SELECT
    USING ((user_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own"
    ON public.user_preferences FOR UPDATE
    USING (user_id = auth.uid());

-- Login History Policies
DROP POLICY IF EXISTS "login_history_select_own_or_staff" ON public.user_login_history;
CREATE POLICY "login_history_select_own_or_staff"
    ON public.user_login_history FOR SELECT
    USING (user_id = auth.uid() OR public.is_staff());

-- Audit Logs Policies
DROP POLICY IF EXISTS "audit_logs_select_owner_only" ON public.audit_logs;
CREATE POLICY "audit_logs_select_owner_only"
    ON public.audit_logs FOR SELECT
    USING (public.is_owner());

-- Domain Events & Webhook Logs Policies
DROP POLICY IF EXISTS "domain_events_staff_only" ON public.domain_events;
CREATE POLICY "domain_events_staff_only" ON public.domain_events FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "webhook_logs_staff_only" ON public.webhook_logs;
CREATE POLICY "webhook_logs_staff_only" ON public.webhook_logs FOR ALL USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- 10. PERMISSIONS & GRANTS
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT SELECT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT ON public.user_login_history TO authenticated;

-- ----------------------------------------------------------------------------
-- 11. REALTIME & STORAGE BUCKET SETUP
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- Storage Bucket setup for Avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Storage Policies for Avatars
DROP POLICY IF EXISTS "Avatar Images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar Images are publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ----------------------------------------------------------------------------
-- 12. DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.user_profiles IS 'Stores core user profile data connected 1:1 to Supabase auth.users.';
COMMENT ON TABLE public.user_devices IS 'Tracks push notification tokens and trusted devices per user.';
COMMENT ON TABLE public.user_preferences IS 'Stores application UI theme and notification preference toggles.';
COMMENT ON TABLE public.user_login_history IS 'Security audit trail of user login attempts and devices.';
COMMENT ON TABLE public.audit_logs IS 'Global database change audit log table capturing row-level modifications.';
COMMENT ON TABLE public.domain_events IS 'Global domain event bus log capturing business activity.';
COMMENT ON TABLE public.webhook_logs IS 'Permanent log of raw inbound webhooks from payment & messaging gateways.';
COMMENT ON FUNCTION public.get_current_user_role IS 'Returns the MSC OS role of the currently authenticated request.';
COMMENT ON FUNCTION public.is_staff IS 'Returns TRUE if current user is super_admin, owner, or reception staff.';

-- ============================================================================
-- Migration Footer: 001_authentication.sql upgraded & complete
-- ============================================================================
