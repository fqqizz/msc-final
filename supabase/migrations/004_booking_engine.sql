-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 004_booking_engine.sql
-- Module: 4. Booking Engine & Immutable Audit Timeline
-- Description: Concurrency-safe 5-minute reservation slot locks, double-booking prevention,
--              booking numbers (MSC-YYYYMMDD-XXXX), generic resource allocations,
--              immutable booking lifecycle timeline, cancellation rules, domain events, RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM (
        'draft',
        'locked',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'no_show'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_payment_status AS ENUM (
        'unpaid',
        'partially_paid',
        'paid',
        'refunded',
        'partially_refunded',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_source AS ENUM (
        'online_customer',
        'walk_in',
        'phone',
        'reception_manual',
        'admin_reserved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. SEQUENCES & HELPER FUNCTION FOR BOOKING NUMBER GENERATION
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START WITH 1001 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS VARCHAR(30) AS $$
DECLARE
    v_date_str VARCHAR(8);
    v_seq_num BIGINT;
BEGIN
    v_date_str := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYYMMDD');
    v_seq_num := NEXTVAL('public.booking_number_seq');
    RETURN 'MSC-' || v_date_str || '-' || LPAD(v_seq_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 3. TABLES & IMMUTABLE BOOKING TIMELINE
-- ----------------------------------------------------------------------------

-- Concurrency Slot Locks (5-Minute Temporary Hold)
CREATE TABLE IF NOT EXISTS public.slot_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NULL REFERENCES public.resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    locked_by_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    session_id VARCHAR(100) NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    
    -- Audit
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_slot_lock_times CHECK (end_time > start_time)
);

-- Core Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(30) UNIQUE NOT NULL DEFAULT public.generate_booking_number(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_hours NUMERIC(5, 2) NOT NULL CHECK (duration_hours > 0),
    booking_status public.booking_status NOT NULL DEFAULT 'confirmed',
    payment_status public.booking_payment_status NOT NULL DEFAULT 'unpaid',
    booking_source public.booking_source NOT NULL DEFAULT 'online_customer',
    
    base_amount NUMERIC(10, 2) NOT NULL CHECK (base_amount >= 0),
    extra_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (extra_charges >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    
    cancellation_reason TEXT NULL,
    cancelled_at TIMESTAMPTZ NULL,
    notes TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_booking_times CHECK (end_time > start_time)
);

-- Immutable Booking Timeline Event Log Table
CREATE TABLE IF NOT EXISTS public.booking_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- BookingCreated, PaymentCaptured, ReceiptGenerated, ReminderSent, Cancelled, Completed
    description TEXT NOT NULL,
    actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Booking Resource Mapping (Allocated pitch / bowling machine / bibs / floodlights)
CREATE TABLE IF NOT EXISTS public.booking_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    extra_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_booking_resource UNIQUE (booking_id, resource_id)
);

-- Cancellation Policies Rules
CREATE TABLE IF NOT EXISTS public.cancellation_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    min_notice_hours INTEGER NOT NULL CHECK (min_notice_hours >= 0),
    refund_percentage NUMERIC(5, 2) NOT NULL CHECK (refund_percentage BETWEEN 0 AND 100),
    cancellation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cancellation Requests Log
CREATE TABLE IF NOT EXISTS public.cancellation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    reason TEXT NOT NULL,
    eligible_refund_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    processed_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    processed_at TIMESTAMPTZ NULL,
    
    -- Audit & Soft Delete
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- ----------------------------------------------------------------------------
-- 4. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_slot_locks_expiry ON public.slot_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_slot_locks_lookup ON public.slot_locks(venue_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id, start_time DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_venue_times ON public.bookings(venue_id, start_time, end_time, booking_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status, payment_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_number ON public.bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_booking ON public.booking_timeline(booking_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_booking_resources_booking ON public.booking_resources(booking_id);

-- ----------------------------------------------------------------------------
-- 5. RPC FUNCTIONS FOR LOCKING & BOOKING LIFECYCLE
-- ----------------------------------------------------------------------------

-- Function: Purge Expired Temporary Slot Locks
CREATE OR REPLACE FUNCTION public.release_expired_locks()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INT;
BEGIN
    DELETE FROM public.slot_locks
    WHERE expires_at < NOW();

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Concurrency-Safe 5-Minute Slot Reservation Lock
CREATE OR REPLACE FUNCTION public.create_slot_lock(
    p_venue_id UUID,
    p_resource_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_session_id VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    lock_id UUID,
    expires_at TIMESTAMPTZ,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_overlap_count INT;
    v_lock_id UUID;
    v_expiry TIMESTAMPTZ;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TIMESTAMPTZ, FALSE, 'Authentication Required'::TEXT;
        RETURN;
    END IF;

    -- Clean up stale locks first
    PERFORM public.release_expired_locks();

    -- Acquire Advisory Lock based on venue hash to serialize concurrent requests for same facility
    PERFORM pg_advisory_xact_lock(hashtext(p_venue_id::text));

    -- Check if venue is under maintenance
    IF public.is_venue_under_maintenance(p_venue_id, p_start_time, p_end_time) THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TIMESTAMPTZ, FALSE, 'Venue is under scheduled maintenance during this time slot.'::TEXT;
        RETURN;
    END IF;

    -- Check for overlapping confirmed or locked bookings
    SELECT COUNT(*) INTO v_overlap_count
    FROM public.bookings
    WHERE venue_id = p_venue_id
      AND booking_status IN ('confirmed', 'in_progress', 'locked')
      AND deleted_at IS NULL
      AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);

    IF v_overlap_count > 0 THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TIMESTAMPTZ, FALSE, 'Requested slot is already booked.'::TEXT;
        RETURN;
    END IF;

    -- Check for overlapping active slot locks by other users
    SELECT COUNT(*) INTO v_overlap_count
    FROM public.slot_locks
    WHERE venue_id = p_venue_id
      AND locked_by_user_id <> v_user_id
      AND expires_at > NOW()
      AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);

    IF v_overlap_count > 0 THEN
        RETURN QUERY SELECT NULL::UUID, NULL::TIMESTAMPTZ, FALSE, 'Requested slot is temporarily reserved by another user. Try again in 5 minutes.'::TEXT;
        RETURN;
    END IF;

    -- Upsert/Create 5-minute reservation lock
    v_expiry := NOW() + INTERVAL '5 minutes';
    
    INSERT INTO public.slot_locks (
        venue_id,
        resource_id,
        start_time,
        end_time,
        locked_by_user_id,
        session_id,
        expires_at,
        created_by
    ) VALUES (
        p_venue_id,
        p_resource_id,
        p_start_time,
        p_end_time,
        v_user_id,
        p_session_id,
        v_expiry,
        v_user_id
    )
    RETURNING id INTO v_lock_id;

    RETURN QUERY SELECT v_lock_id, v_expiry, TRUE, 'Slot successfully locked for 5 minutes.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Atomic Conversion from Slot Lock to Confirmed Booking
CREATE OR REPLACE FUNCTION public.confirm_booking(
    p_lock_id UUID,
    p_customer_id UUID,
    p_resource_ids UUID[],
    p_booking_source public.booking_source DEFAULT 'online_customer',
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    booking_id UUID,
    booking_number VARCHAR,
    total_amount NUMERIC(10,2),
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_lock public.slot_locks%ROWTYPE;
    v_price_rec RECORD;
    v_booking_id UUID;
    v_booking_num VARCHAR;
    v_tax NUMERIC(10,2);
    v_res_id UUID;
BEGIN
    -- Verify lock
    SELECT * INTO v_lock
    FROM public.slot_locks
    WHERE id = p_lock_id AND expires_at > NOW();

    IF v_lock.id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, 0.00::NUMERIC, FALSE, 'Lock expired or invalid. Please select your slot again.'::TEXT;
        RETURN;
    END IF;

    -- Calculate exact pricing
    SELECT * INTO v_price_rec
    FROM public.calculate_booking_price(v_lock.venue_id, p_resource_ids, v_lock.start_time, v_lock.end_time);

    v_tax := ROUND((v_price_rec.total_price * 0.18)::NUMERIC, 2); -- 18% GST

    -- Create Confirmed Booking
    INSERT INTO public.bookings (
        customer_id,
        venue_id,
        start_time,
        end_time,
        duration_hours,
        booking_status,
        payment_status,
        booking_source,
        base_amount,
        extra_charges,
        tax_amount,
        total_amount,
        created_by,
        notes
    ) VALUES (
        p_customer_id,
        v_lock.venue_id,
        v_lock.start_time,
        v_lock.end_time,
        v_price_rec.duration_hours,
        'confirmed',
        'unpaid',
        p_booking_source,
        v_price_rec.base_price,
        v_price_rec.resource_extra_cost,
        v_tax,
        v_price_rec.total_price + v_tax,
        auth.uid(),
        p_notes
    )
    RETURNING id, public.bookings.booking_number INTO v_booking_id, v_booking_num;

    -- Map allocated resources
    IF p_resource_ids IS NOT NULL AND array_length(p_resource_ids, 1) > 0 THEN
        FOREACH v_res_id IN ARRAY p_resource_ids LOOP
            INSERT INTO public.booking_resources (booking_id, resource_id, extra_cost)
            SELECT v_booking_id, v_res_id, r.hourly_extra_cost * v_price_rec.duration_hours
            FROM public.resources r WHERE r.id = v_res_id;
        END LOOP;
    END IF;

    -- Record Timeline Event
    INSERT INTO public.booking_timeline (booking_id, event_type, description, actor_id)
    VALUES (v_booking_id, 'BookingCreated', 'Booking ' || v_booking_num || ' created via ' || p_booking_source, auth.uid());

    -- Emit Domain Event
    PERFORM public.emit_domain_event('BookingCreated', 'booking', v_booking_id, jsonb_build_object('booking_number', v_booking_num, 'total_amount', (v_price_rec.total_price + v_tax)));

    -- Update Customer Activity Stats
    UPDATE public.customers
    SET last_booking_at = NOW(), last_seen_at = NOW(), preferred_venue_id = COALESCE(preferred_venue_id, v_lock.venue_id)
    WHERE id = p_customer_id;

    -- Release slot lock after confirmation
    DELETE FROM public.slot_locks WHERE id = p_lock_id;

    RETURN QUERY SELECT v_booking_id, v_booking_num, (v_price_rec.total_price + v_tax), TRUE, 'Booking confirmed successfully.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Cancel Booking & Compute Refund Eligibility
CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id UUID,
    p_reason TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    refund_eligible_amount NUMERIC(10,2),
    message TEXT
) AS $$
DECLARE
    v_booking public.bookings%ROWTYPE;
    v_notice_hours NUMERIC(10,2);
    v_policy public.cancellation_policies%ROWTYPE;
    v_refund_amount NUMERIC(10,2) := 0.00;
BEGIN
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND deleted_at IS NULL;

    IF v_booking.id IS NULL THEN
        RETURN QUERY SELECT FALSE, 0.00::NUMERIC, 'Booking not found.'::TEXT;
        RETURN;
    END IF;

    IF v_booking.booking_status IN ('cancelled', 'completed') THEN
        RETURN QUERY SELECT FALSE, 0.00::NUMERIC, 'Booking is already finalised or cancelled.'::TEXT;
        RETURN;
    END IF;

    -- Calculate notice window in hours
    v_notice_hours := EXTRACT(EPOCH FROM (v_booking.start_time - NOW())) / 3600.0;

    -- Find matching cancellation policy
    SELECT * INTO v_policy
    FROM public.cancellation_policies
    WHERE is_active = TRUE AND v_notice_hours >= min_notice_hours
    ORDER BY min_notice_hours DESC
    LIMIT 1;

    IF v_policy.id IS NOT NULL AND v_booking.amount_paid > 0 THEN
        v_refund_amount := ROUND(((v_booking.amount_paid * (v_policy.refund_percentage / 100.0)) - v_policy.cancellation_fee)::NUMERIC, 2);
        IF v_refund_amount < 0 THEN v_refund_amount := 0.00; END IF;
    END IF;

    -- Update booking state
    UPDATE public.bookings
    SET 
        booking_status = 'cancelled',
        cancellation_reason = p_reason,
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Record Timeline Event
    INSERT INTO public.booking_timeline (booking_id, event_type, description, actor_id, metadata)
    VALUES (p_booking_id, 'Cancelled', 'Booking cancelled: ' || p_reason, auth.uid(), jsonb_build_object('refund_eligible', v_refund_amount));

    -- Emit Domain Event
    PERFORM public.emit_domain_event('BookingCancelled', 'booking', p_booking_id, jsonb_build_object('reason', p_reason, 'refund_amount', v_refund_amount));

    -- Log cancellation request record
    INSERT INTO public.cancellation_requests (
        booking_id,
        requested_by,
        reason,
        eligible_refund_amount,
        status
    ) VALUES (
        p_booking_id,
        auth.uid(),
        p_reason,
        v_refund_amount,
        CASE WHEN v_refund_amount > 0 THEN 'pending' ELSE 'approved' END
    );

    RETURN QUERY SELECT TRUE, v_refund_amount, 'Booking cancelled successfully.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_bookings_updated_at ON public.bookings;
CREATE TRIGGER tr_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_audit_bookings ON public.bookings;
CREATE TRIGGER tr_audit_bookings AFTER INSERT OR UPDATE OR DELETE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.msc_audit_trigger();

-- Trigger to increment customer stats when booking completed
CREATE OR REPLACE FUNCTION public.tr_on_booking_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_status = 'completed' AND OLD.booking_status <> 'completed' THEN
        PERFORM public.increment_customer_stats(NEW.customer_id, NEW.duration_hours, NEW.total_amount);
        
        INSERT INTO public.booking_timeline (booking_id, event_type, description)
        VALUES (NEW.id, 'Completed', 'Booking completed naturally');
        
        PERFORM public.emit_domain_event('BookingCompleted', 'booking', NEW.id, jsonb_build_object('customer_id', NEW.customer_id));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_booking_completed_stats ON public.bookings;
CREATE TRIGGER tr_booking_completed_stats
    AFTER UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.tr_on_booking_completed();

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Slot Locks Policies
DROP POLICY IF EXISTS "slot_locks_select_own_or_staff" ON public.slot_locks;
CREATE POLICY "slot_locks_select_own_or_staff" ON public.slot_locks FOR SELECT USING (locked_by_user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "slot_locks_insert_own" ON public.slot_locks;
CREATE POLICY "slot_locks_insert_own" ON public.slot_locks FOR INSERT WITH CHECK (locked_by_user_id = auth.uid());

DROP POLICY IF EXISTS "slot_locks_delete_own_or_staff" ON public.slot_locks;
CREATE POLICY "slot_locks_delete_own_or_staff" ON public.slot_locks FOR DELETE USING (locked_by_user_id = auth.uid() OR public.is_staff());

-- Bookings Policies
DROP POLICY IF EXISTS "bookings_select_own_or_staff" ON public.bookings;
CREATE POLICY "bookings_select_own_or_staff" ON public.bookings FOR SELECT USING ((customer_id = auth.uid() AND deleted_at IS NULL) OR created_by = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "bookings_insert_own_or_staff" ON public.bookings;
CREATE POLICY "bookings_insert_own_or_staff" ON public.bookings FOR INSERT WITH CHECK (customer_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "bookings_update_own_or_staff" ON public.bookings;
CREATE POLICY "bookings_update_own_or_staff" ON public.bookings FOR UPDATE USING ((customer_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

-- Booking Timeline Policies
DROP POLICY IF EXISTS "booking_timeline_select_own_or_staff" ON public.booking_timeline;
CREATE POLICY "booking_timeline_select_own_or_staff" ON public.booking_timeline FOR SELECT USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_timeline.booking_id AND (b.customer_id = auth.uid() OR public.is_staff())));

-- Booking Resources Policies
DROP POLICY IF EXISTS "booking_resources_select" ON public.booking_resources;
CREATE POLICY "booking_resources_select" ON public.booking_resources FOR SELECT USING (TRUE);

-- Cancellation Policies
DROP POLICY IF EXISTS "cancellation_policies_public_select" ON public.cancellation_policies;
CREATE POLICY "cancellation_policies_public_select" ON public.cancellation_policies FOR SELECT USING (TRUE);

-- Cancellation Requests
DROP POLICY IF EXISTS "cancellation_requests_select_own_or_staff" ON public.cancellation_requests;
CREATE POLICY "cancellation_requests_select_own_or_staff" ON public.cancellation_requests FOR SELECT USING ((requested_by = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

-- ----------------------------------------------------------------------------
-- 8. GRANTS & REALTIME
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON public.slot_locks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT ON public.booking_timeline TO authenticated;
GRANT SELECT ON public.booking_resources TO authenticated;
GRANT SELECT ON public.cancellation_policies TO anon, authenticated;
GRANT SELECT, INSERT ON public.cancellation_requests TO authenticated;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_locks;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 9. DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.slot_locks IS 'Temporary 5-minute reservation locks to prevent concurrent double-booking.';
COMMENT ON TABLE public.bookings IS 'Core booking register for sports complex slots, walk-ins, and phone reservations.';
COMMENT ON TABLE public.booking_timeline IS 'Immutable step-by-step lifecycle history log for every booking.';
COMMENT ON FUNCTION public.create_slot_lock IS 'Acquires a concurrency-safe 5-minute lock on a facility slot.';
COMMENT ON FUNCTION public.confirm_booking IS 'Atomically converts a slot lock into a confirmed MSC booking and emits domain events.';

-- ============================================================================
-- Migration Footer: 004_booking_engine.sql upgraded & complete
-- ============================================================================
