-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 011_enterprise_additions.sql
-- Module: 11. Enterprise Platform Additions & System Infrastructure
-- Description: Booking waitlist engine, saved card tokens, customer digital wallets,
--              booking extension engine, support ticketing, system health monitoring,
--              developer API keys, gamified achievements, AI query logs, deployment versioning,
--              backup metadata, and platform diagnostic stats RPC.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.waitlist_status AS ENUM (
        'active',
        'notified',
        'expired',
        'converted',
        'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ticket_status AS ENUM (
        'open',
        'in_progress',
        'waiting_on_customer',
        'resolved',
        'closed'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ticket_priority AS ENUM (
        'low',
        'medium',
        'high',
        'urgent'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.wallet_tx_type AS ENUM (
        'topup',
        'booking_payment',
        'refund_credit',
        'cashback',
        'referral_reward',
        'adjustment'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.extension_status AS ENUM (
        'pending',
        'approved',
        'paid',
        'rejected'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. SYSTEM VERSIONS & BACKUP METADATA
-- ----------------------------------------------------------------------------

-- Migration & Deployment Version Tracker
CREATE TABLE IF NOT EXISTS public.system_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number VARCHAR(50) NOT NULL,
    migration_name VARCHAR(150) UNIQUE NOT NULL,
    checksum VARCHAR(64) NULL,
    description TEXT NULL,
    applied_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Register this migration version
INSERT INTO public.system_versions (version_number, migration_name, description)
VALUES ('1.1.0', '011_enterprise_additions.sql', 'Added waitlists, digital wallets, booking extensions, support tickets, system health, and API keys.')
ON CONFLICT (migration_name) DO UPDATE SET applied_at = NOW();

-- Backup Metadata Registry (Tracks database snapshot metadata)
CREATE TABLE IF NOT EXISTS public.backup_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id VARCHAR(100) UNIQUE NOT NULL,
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'supabase_s3',
    backup_type VARCHAR(20) NOT NULL DEFAULT 'full', -- full, incremental, WAL
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    storage_path TEXT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Health Metrics Monitoring Log
CREATE TABLE IF NOT EXISTS public.system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL DEFAULT 'routine_check',
    failed_jobs_count INTEGER NOT NULL DEFAULT 0,
    pending_queue_size INTEGER NOT NULL DEFAULT 0,
    webhook_failures_count INTEGER NOT NULL DEFAULT 0,
    storage_usage_bytes BIGINT NOT NULL DEFAULT 0,
    db_size_bytes BIGINT NOT NULL DEFAULT 0,
    health_status VARCHAR(20) NOT NULL DEFAULT 'healthy', -- healthy, degraded, critical
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. DEVELOPER API KEYS & CUSTOMER DIGITAL WALLETS
-- ----------------------------------------------------------------------------

-- Developer & B2B Integration API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL, -- e.g. msc_live_
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{"read"}'::text[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NULL,
    
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved Payment Cards / Gateway Tokens (Fast Checkout)
CREATE TABLE IF NOT EXISTS public.saved_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    gateway_customer_id VARCHAR(100) NOT NULL,
    gateway_token VARCHAR(100) NOT NULL,
    card_last4 VARCHAR(4) NOT NULL,
    card_network VARCHAR(30) NOT NULL DEFAULT 'visa', -- visa, mastercard, rupay
    expiry_month INTEGER NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year INTEGER NOT NULL CHECK (expiry_year >= 2024),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_customer_card_token UNIQUE (customer_id, gateway_token)
);

-- Customer Digital Wallet
CREATE TABLE IF NOT EXISTS public.customer_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wallet Transaction History Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.customer_wallets(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tx_type public.wallet_tx_type NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0),
    reference_id UUID NULL, -- booking_id or payment_id reference
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. BOOKING WAITLIST & BOOKING EXTENSION ENGINES
-- ----------------------------------------------------------------------------

-- Slot Reservation Waitlist Engine
CREATE TABLE IF NOT EXISTS public.booking_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NULL REFERENCES public.resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status public.waitlist_status NOT NULL DEFAULT 'active',
    notified_at TIMESTAMPTZ NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours'),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_waitlist_times CHECK (end_time > start_time)
);

-- Live Booking Extension Engine (Extend active playing time by 30/60 mins)
CREATE TABLE IF NOT EXISTS public.booking_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    additional_minutes INTEGER NOT NULL CHECK (additional_minutes IN (30, 60, 90, 120)),
    additional_amount NUMERIC(10, 2) NOT NULL CHECK (additional_amount >= 0),
    payment_status public.booking_payment_status NOT NULL DEFAULT 'unpaid',
    status public.extension_status NOT NULL DEFAULT 'pending',
    requested_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    approved_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. GAMIFICATION ACHIEVEMENTS & AI LOGS
-- ----------------------------------------------------------------------------

-- Customer Achievement Definitions
CREATE TABLE IF NOT EXISTS public.customer_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. NIGHT_OWL, CENTURION, TURF_LEGEND
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    badge_icon_url TEXT NULL,
    reward_points INTEGER NOT NULL DEFAULT 50,
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unlocked Customer Achievements
CREATE TABLE IF NOT EXISTS public.customer_unlocked_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.customer_achievements(id) ON DELETE CASCADE ON UPDATE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_customer_achievement UNIQUE (customer_id, achievement_id)
);

-- AI Assistant Interaction Query Logs
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NULL REFERENCES public.customers(id) ON DELETE SET NULL ON UPDATE CASCADE,
    session_id VARCHAR(100) NULL,
    prompt TEXT NOT NULL,
    completion TEXT NOT NULL,
    intent_detected VARCHAR(100) NULL, -- e.g. book_turf, check_price, cancel_booking
    tokens_used INTEGER NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. SUPPORT TICKETING SYSTEM
-- ----------------------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START WITH 1001 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS VARCHAR(30) AS $$
DECLARE
    v_date_str VARCHAR(8);
    v_seq_num BIGINT;
BEGIN
    v_date_str := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYYMMDD');
    v_seq_num := NEXTVAL('public.ticket_number_seq');
    RETURN 'TCK-' || v_date_str || '-' || LPAD(v_seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(30) UNIQUE NOT NULL DEFAULT public.generate_ticket_number(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    booking_id UUID NULL REFERENCES public.bookings(id) ON DELETE SET NULL ON UPDATE CASCADE,
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General', -- Booking, Payment, Facility, Refund
    priority public.ticket_priority NOT NULL DEFAULT 'medium',
    status public.ticket_status NOT NULL DEFAULT 'open',
    assigned_to UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Support Ticket Messages / Conversation Threads
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE ON UPDATE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_booking_waitlist_slot ON public.booking_waitlist(venue_id, start_time, status);
CREATE INDEX IF NOT EXISTS idx_saved_cards_cust ON public.saved_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_extensions_booking ON public.booking_extensions(booking_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_cust ON public.support_tickets(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_cust ON public.ai_logs(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_recorded ON public.system_health(recorded_at DESC);

-- ----------------------------------------------------------------------------
-- 8. RPC FUNCTIONS & AUTOMATED TRIGGERS
-- ----------------------------------------------------------------------------

-- RPC: Join Booking Waitlist
CREATE OR REPLACE FUNCTION public.join_booking_waitlist(
    p_venue_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    waitlist_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_cust_id UUID;
    v_id UUID;
BEGIN
    v_cust_id := auth.uid();
    IF v_cust_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Authentication required.'::TEXT;
        RETURN;
    END IF;

    INSERT INTO public.booking_waitlist (
        venue_id,
        customer_id,
        start_time,
        end_time
    ) VALUES (
        p_venue_id,
        v_cust_id,
        p_start_time,
        p_end_time
    )
    RETURNING id INTO v_id;

    RETURN QUERY SELECT v_id, TRUE, 'Added to waitlist. We will notify you if a slot opens up!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Extend Active Booking by 30/60 minutes
CREATE OR REPLACE FUNCTION public.extend_booking(
    p_booking_id UUID,
    p_additional_minutes INTEGER
)
RETURNS TABLE (
    extension_id UUID,
    additional_amount NUMERIC(10,2),
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_booking public.bookings%ROWTYPE;
    v_new_end TIMESTAMPTZ;
    v_overlap INT;
    v_price_rec RECORD;
    v_ext_id UUID;
    v_extra_cost NUMERIC(10,2);
BEGIN
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND deleted_at IS NULL;
    IF v_booking.id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, 0.00::NUMERIC, FALSE, 'Booking not found.'::TEXT;
        RETURN;
    END IF;

    v_new_end := v_booking.end_time + (p_additional_minutes || ' minutes')::INTERVAL;

    -- Check if extension slot overlaps with future bookings
    SELECT COUNT(*) INTO v_overlap
    FROM public.bookings
    WHERE venue_id = v_booking.venue_id
      AND id <> p_booking_id
      AND booking_status IN ('confirmed', 'in_progress', 'locked')
      AND deleted_at IS NULL
      AND (start_time, end_time) OVERLAPS (v_booking.end_time, v_new_end);

    IF v_overlap > 0 THEN
        RETURN QUERY SELECT NULL::UUID, 0.00::NUMERIC, FALSE, 'Slot extension is unavailable because another booking follows.'::TEXT;
        RETURN;
    END IF;

    -- Calculate extension pricing
    SELECT * INTO v_price_rec FROM public.calculate_booking_price(v_booking.venue_id, NULL, v_booking.end_time, v_new_end);
    v_extra_cost := ROUND((v_price_rec.total_price * 1.18)::NUMERIC, 2); -- Incl 18% GST

    INSERT INTO public.booking_extensions (
        booking_id,
        additional_minutes,
        additional_amount,
        requested_by,
        status
    ) VALUES (
        p_booking_id,
        p_additional_minutes,
        v_extra_cost,
        auth.uid(),
        'approved'
    )
    RETURNING id INTO v_ext_id;

    -- Update Booking End Time and Total Amount
    UPDATE public.bookings
    SET 
        end_time = v_new_end,
        duration_hours = duration_hours + (p_additional_minutes / 60.0),
        total_amount = total_amount + v_extra_cost,
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Record Timeline
    INSERT INTO public.booking_timeline (booking_id, event_type, description, actor_id)
    VALUES (p_booking_id, 'BookingExtended', 'Booking extended by ' || p_additional_minutes || ' mins', auth.uid());

    RETURN QUERY SELECT v_ext_id, v_extra_cost, TRUE, 'Booking extended successfully!'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger Function: Auto-Notify Waitlist on Booking Cancellation
CREATE OR REPLACE FUNCTION public.tr_notify_waitlist_on_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    v_wl RECORD;
BEGIN
    IF NEW.booking_status = 'cancelled' AND OLD.booking_status <> 'cancelled' THEN
        FOR v_wl IN 
            SELECT w.id, w.customer_id, p.phone, p.email, p.full_name
            FROM public.booking_waitlist w
            JOIN public.user_profiles p ON w.customer_id = p.id
            WHERE w.venue_id = NEW.venue_id
              AND w.status = 'active'
              AND (w.start_time, w.end_time) OVERLAPS (NEW.start_time, NEW.end_time)
        LOOP
            -- Queue WhatsApp notification
            IF v_wl.phone IS NOT NULL THEN
                PERFORM public.enqueue_notification(
                    v_wl.phone,
                    'whatsapp'::public.notification_channel,
                    'WAITLIST_SLOT_OPEN_WHATSAPP',
                    jsonb_build_object('customer_name', v_wl.full_name, 'start_time', NEW.start_time)
                );
            END IF;

            UPDATE public.booking_waitlist
            SET status = 'notified', notified_at = NOW()
            WHERE id = v_wl.id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_waitlist_cancellation_notify ON public.bookings;
CREATE TRIGGER tr_waitlist_cancellation_notify
    AFTER UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.tr_notify_waitlist_on_cancellation();

-- ----------------------------------------------------------------------------
-- 9. PLATFORM DIAGNOSTIC & STATS RPC FUNCTION
-- ----------------------------------------------------------------------------

-- RPC: Get Complete MSC OS Backend Metrics & Object Counts
CREATE OR REPLACE FUNCTION public.get_msc_os_platform_stats()
RETURNS JSONB AS $$
DECLARE
    v_indexes_count BIGINT;
    v_triggers_count BIGINT;
    v_functions_count BIGINT;
    v_views_count BIGINT;
    v_tables_count BIGINT;
    v_db_size TEXT;
    v_result JSONB;
BEGIN
    IF NOT public.is_staff() AND current_user <> 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: Staff privilege required.';
    END IF;

    -- Count indexes in public schema
    SELECT COUNT(*) INTO v_indexes_count
    FROM pg_indexes WHERE schemaname = 'public';

    -- Count triggers
    SELECT COUNT(*) INTO v_triggers_count
    FROM pg_trigger;

    -- Count stored functions/procedures in public schema
    SELECT COUNT(*) INTO v_functions_count
    FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

    -- Count views (normal & materialized)
    SELECT COUNT(*) INTO v_views_count
    FROM pg_views WHERE schemaname = 'public';

    -- Count tables in public schema
    SELECT COUNT(*) INTO v_tables_count
    FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    -- Database size
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO v_db_size;

    v_result := jsonb_build_object(
        'indexes_count', v_indexes_count,
        'triggers_count', v_triggers_count,
        'functions_count', v_functions_count,
        'views_count', v_views_count,
        'tables_count', v_tables_count,
        'database_pretty_size', v_db_size,
        'generated_at', NOW()
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 10. TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER tr_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_customer_wallets_updated_at ON public.customer_wallets;
CREATE TRIGGER tr_customer_wallets_updated_at BEFORE UPDATE ON public.customer_wallets FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_booking_waitlist_updated_at ON public.booking_waitlist;
CREATE TRIGGER tr_booking_waitlist_updated_at BEFORE UPDATE ON public.booking_waitlist FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_booking_extensions_updated_at ON public.booking_extensions;
CREATE TRIGGER tr_booking_extensions_updated_at BEFORE UPDATE ON public.booking_extensions FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER tr_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.system_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_unlocked_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- System Policies
DROP POLICY IF EXISTS "system_versions_staff_read" ON public.system_versions;
CREATE POLICY "system_versions_staff_read" ON public.system_versions FOR SELECT USING (public.is_staff());

DROP POLICY IF EXISTS "system_health_staff_only" ON public.system_health;
CREATE POLICY "system_health_staff_only" ON public.system_health FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "api_keys_select_own" ON public.api_keys;
CREATE POLICY "api_keys_select_own" ON public.api_keys FOR SELECT USING (owner_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "saved_cards_select_own" ON public.saved_cards;
CREATE POLICY "saved_cards_select_own" ON public.saved_cards FOR SELECT USING (customer_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "customer_wallets_select_own" ON public.customer_wallets;
CREATE POLICY "customer_wallets_select_own" ON public.customer_wallets FOR SELECT USING (customer_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "booking_waitlist_select_own" ON public.booking_waitlist;
CREATE POLICY "booking_waitlist_select_own" ON public.booking_waitlist FOR SELECT USING (customer_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "support_tickets_select_own" ON public.support_tickets;
CREATE POLICY "support_tickets_select_own" ON public.support_tickets FOR SELECT USING ((customer_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "support_messages_select_own" ON public.support_messages;
CREATE POLICY "support_messages_select_own" ON public.support_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = support_messages.ticket_id AND (t.customer_id = auth.uid() OR public.is_staff())));

-- ----------------------------------------------------------------------------
-- 12. GRANTS, REALTIME & COMMENTS
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.customer_achievements TO anon, authenticated;
GRANT SELECT ON public.customer_wallets TO authenticated;
GRANT SELECT ON public.saved_cards TO authenticated;
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_waitlist;
EXCEPTION WHEN OTHERS THEN null;
END $$;

COMMENT ON TABLE public.booking_waitlist IS 'Customer slot waitlist notifying players when cancelled slots become available.';
COMMENT ON TABLE public.booking_extensions IS 'Engine allowing active players to extend play duration by 30/60 minutes live.';
COMMENT ON TABLE public.customer_wallets IS 'Digital wallet balance ledger for credits, cashback, and instant refunds.';
COMMENT ON TABLE public.support_tickets IS 'Customer service ticketing system for complex support inquiries.';
COMMENT ON FUNCTION public.get_msc_os_platform_stats IS 'Returns database statistics, total index count, trigger count, procedure count, and views count.';

-- ============================================================================
-- Migration Footer: 011_enterprise_additions.sql complete
-- ============================================================================
