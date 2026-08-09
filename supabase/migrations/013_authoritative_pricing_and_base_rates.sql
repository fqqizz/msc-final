-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 013_authoritative_pricing_and_base_rates.sql
-- Module: 13. Authoritative Pricing, Effective Base Rates & Data Integrity
-- Description:
--   1. Authoritative base prices (Cricket Net 1: ₹299, Cricket Net 2: ₹299, Football Turf: ₹999, Bowling Machine: ₹299).
--   2. Effective-From Base Price history (Change base price from a future/current date/time).
--   3. Pricing Hierarchy: Slot Override -> Date Override -> Base Price History -> Default Base Price.
--   4. Purges obsolete demo pricing overrides and removes "Bowling Nets" venue.
--   5. Backend RPC `calculate_booking_amount` for authoritative Razorpay order validation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CLEANUP OBSOLETE / DEMO VENUES & PRICING OVERRIDES
-- ----------------------------------------------------------------------------
-- Remove any incorrect "Bowling Nets" venue references (MSC only has Net 1, Net 2, Football Turf & Bowling Machine add-on)
DELETE FROM public.venues WHERE slug = 'bowling-nets' OR name ILIKE '%bowling net%';

-- Ensure Bowling Machine Resource is exactly ₹299.00/hour
UPDATE public.resources 
SET name = 'Automated Bowling Machine #1',
    code = 'BM-CRICKET-01',
    hourly_extra_cost = 299.00,
    status = 'available'
WHERE code = 'BM-CRICKET-01' OR name ILIKE '%bowling machine%';

-- Purge obsolete demo pricing rules (e.g. 1200, 1800, 600, 1500, 1300, 350, 1000)
DELETE FROM public.pricing_rules 
WHERE name IN ('Turf Regular Daytime Rate', 'Turf Floodlight Peak Evening Rate', 'Cricket Net Hourly Rate')
   OR hourly_rate IN (1200.00, 1800.00, 600.00, 1500.00, 1300.00, 350.00, 1000.00);

-- Ensure correct base rates on venues table if column exists
DO $$ BEGIN
    UPDATE public.venues SET base_price = 999.00 WHERE slug = 'football-turf';
    UPDATE public.venues SET base_price = 299.00 WHERE slug IN ('cricket-net-1', 'cricket-net-2');
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. BASE PRICING HISTORY TABLE ("CHANGE BASE PRICE FROM NOW ON")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venue_base_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NULL REFERENCES public.resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    base_price NUMERIC(10, 2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason VARCHAR(255) NULL DEFAULT 'Base Price Update',
    changed_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_base_rate_target CHECK (venue_id IS NOT NULL OR resource_id IS NOT NULL),
    CONSTRAINT chk_positive_price CHECK (base_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venue_base_rates_lookup 
ON public.venue_base_rates(venue_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_resource_base_rates_lookup 
ON public.venue_base_rates(resource_id, effective_from DESC);

-- Enable RLS
ALTER TABLE public.venue_base_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active base rates" ON public.venue_base_rates;
DROP POLICY IF EXISTS "Staff and Owner full access to base rates" ON public.venue_base_rates;

CREATE POLICY "Public can view active base rates"
ON public.venue_base_rates FOR SELECT
USING (true);

CREATE POLICY "Staff and Owner full access to base rates"
ON public.venue_base_rates FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role::TEXT IN ('owner', 'super_admin', 'reception')
    )
);

-- Seed initial authoritative base rates if empty
INSERT INTO public.venue_base_rates (venue_id, base_price, effective_from, reason)
SELECT id, CASE WHEN slug = 'football-turf' THEN 999.00 ELSE 299.00 END, '2025-01-01 00:00:00+05:30'::TIMESTAMPTZ, 'Authoritative Baseline'
FROM public.venues
WHERE slug IN ('football-turf', 'cricket-net-1', 'cricket-net-2')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. RPC: CHANGE BASE PRICE FROM NOW ON (OR FUTURE DATE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.change_base_price(
    p_venue_id UUID DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_new_base_price NUMERIC DEFAULT 299.00,
    p_effective_from TIMESTAMPTZ DEFAULT NOW(),
    p_reason TEXT DEFAULT 'Base Rate Adjusted'
)
RETURNS JSONB AS $$
DECLARE
    v_actor_id UUID;
    v_target_name TEXT;
    v_record_id UUID;
BEGIN
    v_actor_id := auth.uid();

    IF p_venue_id IS NULL AND p_resource_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Must specify either venue_id or resource_id.');
    END IF;

    IF p_new_base_price < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Base price cannot be negative.');
    END IF;

    -- Fetch target name
    IF p_venue_id IS NOT NULL THEN
        SELECT name INTO v_target_name FROM public.venues WHERE id = p_venue_id;
    ELSE
        SELECT name INTO v_target_name FROM public.resources WHERE id = p_resource_id;
    END IF;

    -- Insert into history table
    INSERT INTO public.venue_base_rates (
        venue_id,
        resource_id,
        base_price,
        effective_from,
        reason,
        changed_by
    ) VALUES (
        p_venue_id,
        p_resource_id,
        p_new_base_price,
        p_effective_from,
        p_reason,
        v_actor_id
    ) RETURNING id INTO v_record_id;

    -- If resource and effective immediately, update resource extra cost
    IF p_resource_id IS NOT NULL AND p_effective_from <= NOW() THEN
        UPDATE public.resources SET hourly_extra_cost = p_new_base_price WHERE id = p_resource_id;
    END IF;

    -- Record Audit Log
    INSERT INTO public.audit_logs (
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        'BASE_PRICE_CHANGED',
        CASE WHEN p_venue_id IS NOT NULL THEN 'venue' ELSE 'resource' END,
        COALESCE(p_venue_id, p_resource_id),
        jsonb_build_object(
            'target_name', v_target_name,
            'new_base_price', p_new_base_price,
            'effective_from', p_effective_from,
            'reason', p_reason,
            'severity', 'INFO'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'record_id', v_record_id,
        'message', 'Base price updated successfully from ' || p_effective_from::TEXT
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 4. AUTHORITATIVE SLOT AVAILABILITY RPC (WITH FULL PRICING HIERARCHY)
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
    v_default_base_rate NUMERIC;
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
    v_historical_base_price NUMERIC;
    v_reason TEXT;
BEGIN
    -- 1. Exact Asia/Kolkata Time Evaluation
    v_now_kolkata := NOW() AT TIME ZONE 'Asia/Kolkata';
    v_today_kolkata := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
    v_current_hour := EXTRACT(HOUR FROM v_now_kolkata);
    v_current_minute := EXTRACT(MINUTE FROM v_now_kolkata);

    -- 2. Fetch Venue Base Type & Default Rate
    SELECT sport_type::TEXT INTO v_venue_type FROM public.venues WHERE id = p_venue_id;
    v_default_base_rate := CASE WHEN v_venue_type = 'football' THEN 999.00 ELSE 299.00 END;

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
        -- Slot [H, H+1] is ONLY past if current hour in Asia/Kolkata >= H + 1!
        IF p_date < v_today_kolkata THEN
            v_is_past := TRUE;
        ELSIF p_date > v_today_kolkata THEN
            v_is_past := FALSE;
        ELSE
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

        -- 10. Check Shared Bowling Machine Availability
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

        -- 11. AUTHORITATIVE PRICING RESOLUTION HIERARCHY:
        -- Level 1: Slot-specific override (Priority 10)
        -- Level 2: Date + Venue override (Priority 5)
        -- Level 3: Base Price History (Active on v_slot_start)
        -- Level 4: Default Base Venue Rate (₹999 Turf / ₹299 Nets)
        
        -- Start with Level 4: Default Base Rate
        v_slot_price := v_default_base_rate;

        -- Level 3: Check Base Price History for this venue active on v_slot_start
        SELECT base_price INTO v_historical_base_price
        FROM public.venue_base_rates
        WHERE venue_id = p_venue_id
          AND effective_from <= v_slot_start
        ORDER BY effective_from DESC
        LIMIT 1;

        IF v_historical_base_price IS NOT NULL THEN
            v_slot_price := v_historical_base_price;
        END IF;

        -- Level 1 & 2: Check Pricing Rules Overrides (Ordered by Priority DESC)
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

-- ----------------------------------------------------------------------------
-- 5. RPC: AUTHORITATIVE BACKEND BOOKING AMOUNT CALCULATION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_booking_amount(
    p_venue_id UUID,
    p_start_time TIMESTAMPTZ,
    p_duration_hours INTEGER DEFAULT 1,
    p_add_bowling_machine BOOLEAN DEFAULT FALSE,
    p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_venue RECORD;
    v_total_slot_amount NUMERIC := 0.00;
    v_bowling_rate NUMERIC := 299.00;
    v_bowling_total NUMERIC := 0.00;
    v_discount NUMERIC := 0.00;
    v_final_amount NUMERIC := 0.00;
    v_hour_offset INTEGER;
    v_current_slot_start TIMESTAMPTZ;
    v_slot_date DATE;
    v_slot_hour INTEGER;
    v_slot_price NUMERIC;
    v_override_price NUMERIC;
    v_historical_base_price NUMERIC;
    v_coupon RECORD;
BEGIN
    SELECT * INTO v_venue FROM public.venues WHERE id = p_venue_id;
    IF v_venue IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venue not found.');
    END IF;

    -- Fetch active Bowling Machine rate from resources
    SELECT COALESCE(hourly_extra_cost, 299.00) INTO v_bowling_rate
    FROM public.resources
    WHERE code = 'BM-CRICKET-01'
    LIMIT 1;

    -- Loop through each hour in booking duration
    FOR v_hour_offset IN 0..(p_duration_hours - 1) LOOP
        v_current_slot_start := p_start_time + (v_hour_offset || ' hours')::INTERVAL;
        v_slot_date := (v_current_slot_start AT TIME ZONE 'Asia/Kolkata')::DATE;
        v_slot_hour := EXTRACT(HOUR FROM (v_current_slot_start AT TIME ZONE 'Asia/Kolkata'));

        -- Base rate for venue type
        v_slot_price := CASE WHEN v_venue.sport_type = 'football' THEN 999.00 ELSE 299.00 END;

        -- Level 3: Base price history
        SELECT base_price INTO v_historical_base_price
        FROM public.venue_base_rates
        WHERE venue_id = p_venue_id
          AND effective_from <= v_current_slot_start
        ORDER BY effective_from DESC
        LIMIT 1;

        IF v_historical_base_price IS NOT NULL THEN
            v_slot_price := v_historical_base_price;
        END IF;

        -- Level 1 & 2: Pricing rules overrides
        SELECT hourly_rate INTO v_override_price
        FROM public.pricing_rules
        WHERE venue_id = p_venue_id
          AND (start_date IS NULL OR start_date <= v_slot_date)
          AND (end_date IS NULL OR end_date >= v_slot_date)
          AND (start_time <= (LPAD(v_slot_hour::TEXT, 2, '0') || ':00:00')::TIME)
          AND (end_time >= (LPAD((v_slot_hour + 1)::TEXT, 2, '0') || ':00:00')::TIME)
          AND deleted_at IS NULL
        ORDER BY priority DESC, created_at DESC
        LIMIT 1;

        IF v_override_price IS NOT NULL THEN
            v_slot_price := v_override_price;
        END IF;

        v_total_slot_amount := v_total_slot_amount + v_slot_price;
    END LOOP;

    -- Add bowling machine if selected for cricket net
    IF p_add_bowling_machine AND v_venue.sport_type = 'cricket' THEN
        v_bowling_total := v_bowling_rate * p_duration_hours;
    END IF;

    -- Check coupon discount if provided
    IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
        SELECT * INTO v_coupon FROM public.coupons 
        WHERE code = UPPER(TRIM(p_coupon_code))
          AND valid_to >= NOW()
          AND (min_spend IS NULL OR min_spend <= (v_total_slot_amount + v_bowling_total));

        IF v_coupon IS NOT NULL THEN
            IF v_coupon.discount_type = 'percentage' THEN
                v_discount := ROUND(((v_total_slot_amount + v_bowling_total) * v_coupon.discount_value / 100.0), 2);
            ELSE
                v_discount := LEAST(v_coupon.discount_value, (v_total_slot_amount + v_bowling_total));
            END IF;
        END IF;
    END IF;

    v_final_amount := (v_total_slot_amount + v_bowling_total) - v_discount;

    RETURN jsonb_build_object(
        'success', true,
        'venue_name', v_venue.name,
        'duration_hours', p_duration_hours,
        'base_amount', v_total_slot_amount,
        'bowling_rate', v_bowling_rate,
        'bowling_total', v_bowling_total,
        'discount_amount', v_discount,
        'total_amount', v_final_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable Realtime safely for venue_base_rates
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.venue_base_rates;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;
