-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 012_final_production_hardening.sql
-- Module: 12. Final Production Hardening & Availability Engine
-- Description: Real-time slot reservations, release RPCs, authoritative slot availability
--              with Asia/Kolkata current-hour cutoff semantics, pricing precedence,
--              shared bowling machine concurrency, double-booking prevention & RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SLOT RESERVATIONS TABLE (Owner / Staff Operational Blocks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.slot_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NULL REFERENCES public.resources(id) ON DELETE SET NULL ON UPDATE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reserved_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    reason VARCHAR(255) NOT NULL DEFAULT 'Owner Reserved',
    customer_name VARCHAR(150) NULL,
    customer_phone VARCHAR(50) NULL,
    internal_notes TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ NULL,
    released_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_reservation_times CHECK (end_time > start_time)
);

-- Indexes for ultra-fast availability lookups & real-time filters
CREATE INDEX IF NOT EXISTS idx_slot_reservations_lookup 
ON public.slot_reservations(venue_id, start_time, end_time, status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_slot_reservations_time 
ON public.slot_reservations(start_time, end_time);

-- Enable RLS
ALTER TABLE public.slot_reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public can view active reservations for availability check" ON public.slot_reservations;
DROP POLICY IF EXISTS "Staff and Owner full access to reservations" ON public.slot_reservations;

-- RLS Policies
-- Public can read active reservations (so slots disappear from public booking flow)
CREATE POLICY "Public can view active reservations for availability check"
ON public.slot_reservations FOR SELECT
USING (status = 'active');

-- Staff/Owner can perform full CRUD on reservations (Strictly using valid user_role values)
CREATE POLICY "Staff and Owner full access to reservations"
ON public.slot_reservations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role::TEXT IN ('owner', 'super_admin', 'reception')
    )
);

-- ----------------------------------------------------------------------------
-- 2. OWNER RESERVE SLOT RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_owner_slot(
    p_venue_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_reason TEXT DEFAULT 'Owner Reserved',
    p_customer_name TEXT DEFAULT NULL,
    p_customer_phone TEXT DEFAULT NULL,
    p_internal_notes TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_existing_booking UUID;
    v_existing_res UUID;
    v_reservation_id UUID;
    v_actor_id UUID;
    v_venue_name TEXT;
BEGIN
    v_actor_id := auth.uid();

    -- Check if already booked
    SELECT id INTO v_existing_booking
    FROM public.bookings
    WHERE venue_id = p_venue_id
      AND booking_status IN ('confirmed', 'in_progress', 'locked')
      AND start_time < p_end_time
      AND end_time > p_start_time
    LIMIT 1;

    IF v_existing_booking IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'A confirmed booking already exists for this time slot.'
        );
    END IF;

    -- Check if already actively reserved
    SELECT id INTO v_existing_res
    FROM public.slot_reservations
    WHERE venue_id = p_venue_id
      AND status = 'active'
      AND start_time < p_end_time
      AND end_time > p_start_time
    LIMIT 1;

    IF v_existing_res IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This slot is already actively reserved.'
        );
    END IF;

    -- Insert reservation
    INSERT INTO public.slot_reservations (
        venue_id,
        resource_id,
        start_time,
        end_time,
        reserved_by,
        reason,
        customer_name,
        customer_phone,
        internal_notes,
        status
    ) VALUES (
        p_venue_id,
        p_resource_id,
        p_start_time,
        p_end_time,
        v_actor_id,
        COALESCE(p_reason, 'Owner Reserved'),
        p_customer_name,
        p_customer_phone,
        p_internal_notes,
        'active'
    )
    RETURNING id INTO v_reservation_id;

    -- Fetch venue name for audit
    SELECT name INTO v_venue_name FROM public.venues WHERE id = p_venue_id;

    -- Record Audit Log
    INSERT INTO public.audit_logs (
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        'SLOT_RESERVED',
        'slot_reservation',
        v_reservation_id,
        jsonb_build_object(
            'venue_name', v_venue_name,
            'start_time', p_start_time,
            'end_time', p_end_time,
            'reason', p_reason,
            'customer_name', p_customer_name,
            'severity', 'INFO'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'message', 'Slot successfully reserved.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 3. OWNER RELEASE RESERVED SLOT RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_owner_slot(
    p_reservation_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_res RECORD;
    v_actor_id UUID;
BEGIN
    v_actor_id := auth.uid();

    SELECT * INTO v_res
    FROM public.slot_reservations
    WHERE id = p_reservation_id AND status = 'active';

    IF v_res IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Active reservation not found.'
        );
    END IF;

    UPDATE public.slot_reservations
    SET status = 'released',
        released_at = NOW(),
        released_by = v_actor_id
    WHERE id = p_reservation_id;

    -- Record Audit Log
    INSERT INTO public.audit_logs (
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        'SLOT_RELEASED',
        'slot_reservation',
        p_reservation_id,
        jsonb_build_object(
            'venue_id', v_res.venue_id,
            'start_time', v_res.start_time,
            'end_time', v_res.end_time,
            'severity', 'INFO'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Slot reservation released successfully. Slot is now available.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 4. AUTHORITATIVE SLOT AVAILABILITY RPC (WITH ASIA/KOLKATA CURRENT-HOUR CUTOFF)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_authoritative_slot_availability(
    p_venue_id UUID,
    p_date DATE
)
RETURNS TABLE (
    slot_hour INTEGER,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_available BOOLEAN,
    effective_price NUMERIC,
    bowling_machine_available BOOLEAN,
    unavailable_reason TEXT
) AS $$
DECLARE
    v_now_kolkata TIMESTAMPTZ;
    v_today_kolkata DATE;
    v_current_hour INTEGER;
    v_current_minute INTEGER;
    v_venue_type TEXT;
    v_base_rate NUMERIC;
    v_hour INTEGER;
    v_slot_start TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
    v_is_past BOOLEAN;
    v_is_booked BOOLEAN;
    v_is_locked BOOLEAN;
    v_is_reserved BOOLEAN;
    v_is_maintenance BOOLEAN;
    v_bm_resource_id UUID;
    v_bm_occupied BOOLEAN;
    v_slot_price NUMERIC;
    v_override_price NUMERIC;
    v_reason TEXT;
BEGIN
    -- 1. Exact Asia/Kolkata Time Evaluation
    v_now_kolkata := NOW() AT TIME ZONE 'Asia/Kolkata';
    v_today_kolkata := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
    v_current_hour := EXTRACT(HOUR FROM v_now_kolkata);
    v_current_minute := EXTRACT(MINUTE FROM v_now_kolkata);

    -- 2. Fetch Venue Base Details
    SELECT sport_type::TEXT INTO v_venue_type FROM public.venues WHERE id = p_venue_id;
    v_base_rate := CASE WHEN v_venue_type = 'football' THEN 999.00 ELSE 299.00 END;

    -- 3. Shared Bowling Machine Resource ID
    SELECT id INTO v_bm_resource_id 
    FROM public.resources 
    WHERE code = 'BM-CRICKET-01' 
    LIMIT 1;

    -- 4. Loop Through Operating Hours: 6:00 AM (06:00) to 11:00 PM (23:00)
    FOR v_hour IN 6..22 LOOP
        -- Construct Timestamps in Asia/Kolkata (+05:30)
        v_slot_start := (p_date::TEXT || ' ' || LPAD(v_hour::TEXT, 2, '0') || ':00:00+05:30')::TIMESTAMPTZ;
        v_slot_end := (p_date::TEXT || ' ' || LPAD((v_hour + 1)::TEXT, 2, '0') || ':00:00+05:30')::TIMESTAMPTZ;

        -- 5. CRITICAL TIME CUTOFF RULE:
        -- For a 1-hour slot (e.g. 1:00 PM - 2:00 PM / v_hour = 13):
        -- At 1:05 PM, 1:30 PM, 1:59:59 PM (v_current_hour = 13), the slot is STILL CURRENT & BOOKABLE.
        -- At 2:00:00 PM (v_current_hour = 14), the slot has finished and DISAPPEARS.
        IF p_date < v_today_kolkata THEN
            v_is_past := TRUE;
        ELSIF p_date > v_today_kolkata THEN
            v_is_past := FALSE;
        ELSE
            -- For today: only past if current hour has exceeded the slot's end hour (v_hour + 1)
            v_is_past := (v_current_hour >= (v_hour + 1));
        END IF;

        -- 6. Check Active Bookings
        SELECT EXISTS (
            SELECT 1 FROM public.bookings
            WHERE venue_id = p_venue_id
              AND booking_status IN ('confirmed', 'in_progress', 'locked')
              AND start_time < v_slot_end
              AND end_time > v_slot_start
        ) INTO v_is_booked;

        -- 7. Check Active 5-minute Slot Locks
        SELECT EXISTS (
            SELECT 1 FROM public.slot_locks
            WHERE venue_id = p_venue_id
              AND expires_at > NOW()
              AND start_time < v_slot_end
              AND end_time > v_slot_start
        ) INTO v_is_locked;

        -- 8. Check Active Owner Slot Reservations
        SELECT EXISTS (
            SELECT 1 FROM public.slot_reservations
            WHERE venue_id = p_venue_id
              AND status = 'active'
              AND start_time < v_slot_end
              AND end_time > v_slot_start
        ) INTO v_is_reserved;

        -- 9. Check Maintenance
        SELECT EXISTS (
            SELECT 1 FROM public.venue_maintenance_logs
            WHERE venue_id = p_venue_id
              AND NOT is_completed
              AND start_time < v_slot_end
              AND end_time > v_slot_start
        ) INTO v_is_maintenance;

        -- 10. Check Shared Bowling Machine Availability (across Net 1 and Net 2)
        IF v_bm_resource_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM public.booking_resources br
                JOIN public.bookings b ON b.id = br.booking_id
                WHERE br.resource_id = v_bm_resource_id
                  AND b.booking_status IN ('confirmed', 'in_progress', 'locked')
                  AND b.start_time < v_slot_end
                  AND b.end_time > v_slot_start
            ) OR EXISTS (
                SELECT 1 FROM public.slot_locks sl
                WHERE sl.resource_id = v_bm_resource_id
                  AND sl.expires_at > NOW()
                  AND sl.start_time < v_slot_end
                  AND sl.end_time > v_slot_start
            ) OR EXISTS (
                SELECT 1 FROM public.slot_reservations sr
                WHERE sr.resource_id = v_bm_resource_id
                  AND sr.status = 'active'
                  AND sr.start_time < v_slot_end
                  AND sr.end_time > v_slot_start
            ) INTO v_bm_occupied;
        ELSE
            v_bm_occupied := FALSE;
        END IF;

        -- 11. Calculate Effective Pricing with Precedence:
        -- 1. Slot specific override
        -- 2. Date + Venue override
        -- 3. Base venue price
        v_slot_price := v_base_rate;

        -- Check Date + Venue override (priority 5) or Slot specific override (priority 10)
        SELECT hourly_rate INTO v_override_price
        FROM public.pricing_rules
        WHERE venue_id = p_venue_id
          AND (start_date IS NULL OR start_date <= p_date)
          AND (end_date IS NULL OR end_date >= p_date)
          AND (start_time <= (LPAD(v_hour::TEXT, 2, '0') || ':00:00')::TIME)
          AND (end_time >= (LPAD((v_hour + 1)::TEXT, 2, '0') || ':00:00')::TIME)
          AND deleted_at IS NULL
        ORDER BY priority DESC, created_at DESC
        LIMIT 1;

        IF v_override_price IS NOT NULL THEN
            v_slot_price := v_override_price;
        END IF;

        -- Determine Reason if unavailable
        IF v_is_past THEN
            v_reason := 'Past Slot';
        ELSIF v_is_booked THEN
            v_reason := 'Booked';
        ELSIF v_is_reserved THEN
            v_reason := 'Reserved by Admin';
        ELSIF v_is_locked THEN
            v_reason := 'In Checkout';
        ELSIF v_is_maintenance THEN
            v_reason := 'Maintenance';
        ELSE
            v_reason := NULL;
        END IF;

        -- Return Row
        slot_hour := v_hour;
        start_time := v_slot_start;
        end_time := v_slot_end;
        is_available := (NOT v_is_past AND NOT v_is_booked AND NOT v_is_reserved AND NOT v_is_locked AND NOT v_is_maintenance);
        effective_price := v_slot_price;
        bowling_machine_available := (NOT v_bm_occupied);
        unavailable_reason := v_reason;

        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable Realtime safely (handles duplicate publication additions gracefully)
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.slot_reservations;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_rules;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;
