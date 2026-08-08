-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 003_venue_management.sql
-- Module: 3. Venue Management & Generic Resource Inventory
-- Description: Facilities catalog, generic resource categories & sub-equipment inventory,
--              venue gallery media, operating schedules, peak pricing engine with price history,
--              precomputed availability cache, maintenance logs, soft deletes, RLS & storage setup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.sport_type AS ENUM (
        'football',
        'cricket',
        'bowling',
        'pickleball',
        'volleyball',
        'basketball',
        'badminton',
        'multi_purpose'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.venue_status AS ENUM (
        'active',
        'maintenance',
        'inactive',
        'coming_soon'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.resource_status AS ENUM (
        'available',
        'maintenance',
        'out_of_service',
        'reserved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLES & GENERIC RESOURCE INVENTORY
-- ----------------------------------------------------------------------------

-- Venues Table (Facilities: Turf, Nets, Courts)
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    sport_type public.sport_type NOT NULL,
    description TEXT NULL,
    short_description VARCHAR(300) NULL,
    status public.venue_status NOT NULL DEFAULT 'active',
    maintenance_reason TEXT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 22,
    dimensions VARCHAR(100) NULL,
    surface_type VARCHAR(100) NULL,
    rules_and_regulations TEXT[] NOT NULL DEFAULT '{}',
    amenities TEXT[] NOT NULL DEFAULT '{}',
    display_order INTEGER NOT NULL DEFAULT 0,
    address TEXT NULL,
    latitude NUMERIC(10, 7) NULL,
    longitude NUMERIC(10, 7) NULL,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Deferred Foreign Key Link for preferred_venue_id on public.customers
DO $$ BEGIN
    ALTER TABLE public.customers
    ADD CONSTRAINT fk_customers_preferred_venue 
    FOREIGN KEY (preferred_venue_id) REFERENCES public.venues(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Generic Resource Categories (e.g. Courts, Bowling Machines, Footballs, Bibs, Training Equipment)
CREATE TABLE IF NOT EXISTS public.resource_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL,
    is_per_slot_chargeable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generic Resources Catalog (Sub-allocations attached to venues or general complex inventory)
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    category_id UUID NOT NULL REFERENCES public.resource_categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    status public.resource_status NOT NULL DEFAULT 'available',
    serial_number VARCHAR(100) NULL,
    hourly_extra_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT uq_resource_venue_code UNIQUE (venue_id, code)
);

-- Venue Gallery Media
CREATE TABLE IF NOT EXISTS public.venue_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255) NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operating Hours per Day of Week (0 = Sunday, 6 = Saturday)
CREATE TABLE IF NOT EXISTS public.venue_operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL DEFAULT '06:00:00',
    close_time TIME NOT NULL DEFAULT '23:00:00',
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (slot_duration_minutes IN (30, 60, 90, 120)),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_venue_day UNIQUE (venue_id, day_of_week)
);

-- Pricing Rules Engine Matrix
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NULL REFERENCES public.resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    name VARCHAR(100) NOT NULL,
    day_of_week INTEGER NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL DEFAULT '06:00:00',
    end_time TIME NOT NULL DEFAULT '23:00:00',
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    is_peak_hour BOOLEAN NOT NULL DEFAULT FALSE,
    is_weekend BOOLEAN NOT NULL DEFAULT FALSE,
    start_date DATE NULL,
    end_date DATE NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Pricing Rule Change History Audit Table (Prevents overwriting rate history)
CREATE TABLE IF NOT EXISTS public.pricing_rule_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_rule_id UUID NOT NULL REFERENCES public.pricing_rules(id) ON DELETE CASCADE ON UPDATE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    old_hourly_rate NUMERIC(10, 2) NOT NULL,
    new_hourly_rate NUMERIC(10, 2) NOT NULL,
    changed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    change_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maintenance Log Schedule
CREATE TABLE IF NOT EXISTS public.venue_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    resource_id UUID NULL REFERENCES public.resources(id) ON DELETE CASCADE ON UPDATE CASCADE,
    title VARCHAR(150) NOT NULL,
    reason TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    performed_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_maintenance_times CHECK (end_time > start_time)
);

-- Precomputed Availability Cache Table
CREATE TABLE IF NOT EXISTS public.venue_availability_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE ON UPDATE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    reason TEXT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_venue_slot_cache UNIQUE (venue_id, start_time, end_time)
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_venues_sport_status ON public.venues(sport_type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venues_slug ON public.venues(slug);
CREATE INDEX IF NOT EXISTS idx_resources_venue_status ON public.resources(venue_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venue_images_venue ON public.venue_images(venue_id, display_order);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_venue_lookup ON public.pricing_rules(venue_id, day_of_week, start_time, end_time, priority DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pricing_rule_history_rule ON public.pricing_rule_history(pricing_rule_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_venue_times ON public.venue_maintenance_logs(venue_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_availability_cache_lookup ON public.venue_availability_cache(venue_id, slot_date, is_available);

-- ----------------------------------------------------------------------------
-- 4. FUNCTIONS & RPCs
-- ----------------------------------------------------------------------------

-- Function: Calculate total booking price based on duration, peak rates, resources
CREATE OR REPLACE FUNCTION public.calculate_booking_price(
    p_venue_id UUID,
    p_resource_ids UUID[],
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    base_price NUMERIC(10,2),
    resource_extra_cost NUMERIC(10,2),
    total_price NUMERIC(10,2),
    duration_hours NUMERIC(5,2),
    applied_rule_id UUID
) AS $$
DECLARE
    v_day_of_week INT;
    v_time_start TIME;
    v_duration NUMERIC(5,2);
    v_base_rate NUMERIC(10,2) := 0.00;
    v_extra_cost NUMERIC(10,2) := 0.00;
    v_rule_id UUID := NULL;
    v_res_id UUID;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_start_time AT TIME ZONE 'UTC');
    v_time_start := (p_start_time AT TIME ZONE 'UTC')::TIME;
    v_duration := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600.0;

    IF v_duration <= 0 THEN
        RAISE EXCEPTION 'Invalid booking interval';
    END IF;

    -- Lookup highest priority matching pricing rule
    SELECT id, hourly_rate INTO v_rule_id, v_base_rate
    FROM public.pricing_rules
    WHERE venue_id = p_venue_id
      AND deleted_at IS NULL
      AND (day_of_week IS NULL OR day_of_week = v_day_of_week)
      AND v_time_start >= start_time AND v_time_start < end_time
      AND (start_date IS NULL OR (p_start_time::DATE >= start_date AND p_start_time::DATE <= end_date))
    ORDER BY priority DESC, hourly_rate DESC
    LIMIT 1;

    -- Fallback base rate if no specific rule matched
    IF v_base_rate IS NULL OR v_base_rate = 0.00 THEN
        v_base_rate := 1000.00;
    END IF;

    -- Add extra resource costs
    IF p_resource_ids IS NOT NULL AND array_length(p_resource_ids, 1) > 0 THEN
        FOREACH v_res_id IN ARRAY p_resource_ids LOOP
            SELECT v_extra_cost + (hourly_extra_cost * v_duration)
            INTO v_extra_cost
            FROM public.resources
            WHERE id = v_res_id AND deleted_at IS NULL;
        END LOOP;
    END IF;

    base_price := ROUND((v_base_rate * v_duration)::NUMERIC, 2);
    resource_extra_cost := ROUND(COALESCE(v_extra_cost, 0.00)::NUMERIC, 2);
    total_price := base_price + resource_extra_cost;
    duration_hours := v_duration;
    applied_rule_id := v_rule_id;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Function: Check Venue Maintenance Status
CREATE OR REPLACE FUNCTION public.is_venue_under_maintenance(
    p_venue_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.venue_maintenance_logs
    WHERE venue_id = p_venue_id
      AND is_completed = FALSE
      AND (start_time, end_time) OVERLAPS (p_start_time, p_end_time);

    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 5. TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger to track price changes into history table
CREATE OR REPLACE FUNCTION public.tr_on_pricing_rule_rate_changed()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.hourly_rate <> NEW.hourly_rate THEN
        INSERT INTO public.pricing_rule_history (
            pricing_rule_id,
            venue_id,
            old_hourly_rate,
            new_hourly_rate,
            changed_by
        ) VALUES (
            OLD.id,
            OLD.venue_id,
            OLD.hourly_rate,
            NEW.hourly_rate,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_pricing_rate_history ON public.pricing_rules;
CREATE TRIGGER tr_pricing_rate_history
    AFTER UPDATE ON public.pricing_rules
    FOR EACH ROW EXECUTE FUNCTION public.tr_on_pricing_rule_rate_changed();

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS tr_venues_updated_at ON public.venues;
CREATE TRIGGER tr_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_resources_updated_at ON public.resources;
CREATE TRIGGER tr_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_pricing_rules_updated_at ON public.pricing_rules;
CREATE TRIGGER tr_pricing_rules_updated_at BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

-- Audit triggers
DROP TRIGGER IF EXISTS tr_audit_venues ON public.venues;
CREATE TRIGGER tr_audit_venues AFTER INSERT OR UPDATE OR DELETE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.msc_audit_trigger();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rule_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_availability_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for active venues & media
DROP POLICY IF EXISTS "venues_public_select" ON public.venues;
CREATE POLICY "venues_public_select" ON public.venues FOR SELECT USING ((status <> 'inactive' AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "venues_staff_modify" ON public.venues;
CREATE POLICY "venues_staff_modify" ON public.venues FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "resource_categories_public_select" ON public.resource_categories;
CREATE POLICY "resource_categories_public_select" ON public.resource_categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "resources_public_select" ON public.resources;
CREATE POLICY "resources_public_select" ON public.resources FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "resources_staff_modify" ON public.resources;
CREATE POLICY "resources_staff_modify" ON public.resources FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "venue_images_public_select" ON public.venue_images;
CREATE POLICY "venue_images_public_select" ON public.venue_images FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "venue_images_staff_modify" ON public.venue_images;
CREATE POLICY "venue_images_staff_modify" ON public.venue_images FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "venue_operating_hours_public_select" ON public.venue_operating_hours;
CREATE POLICY "venue_operating_hours_public_select" ON public.venue_operating_hours FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "venue_operating_hours_staff_modify" ON public.venue_operating_hours;
CREATE POLICY "venue_operating_hours_staff_modify" ON public.venue_operating_hours FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "pricing_rules_public_select" ON public.pricing_rules;
CREATE POLICY "pricing_rules_public_select" ON public.pricing_rules FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "pricing_rules_staff_modify" ON public.pricing_rules;
CREATE POLICY "pricing_rules_staff_modify" ON public.pricing_rules FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "pricing_rule_history_staff_only" ON public.pricing_rule_history;
CREATE POLICY "pricing_rule_history_staff_only" ON public.pricing_rule_history FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "venue_maintenance_logs_staff_only" ON public.venue_maintenance_logs;
CREATE POLICY "venue_maintenance_logs_staff_only" ON public.venue_maintenance_logs FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "venue_availability_cache_public_select" ON public.venue_availability_cache;
CREATE POLICY "venue_availability_cache_public_select" ON public.venue_availability_cache FOR SELECT USING (TRUE);

-- ----------------------------------------------------------------------------
-- 7. GRANTS, STORAGE BUCKETS & REALTIME
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.venues TO anon, authenticated;
GRANT SELECT ON public.resource_categories TO anon, authenticated;
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT SELECT ON public.venue_images TO anon, authenticated;
GRANT SELECT ON public.venue_operating_hours TO anon, authenticated;
GRANT SELECT ON public.pricing_rules TO anon, authenticated;
GRANT SELECT ON public.venue_availability_cache TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.venues;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- Storage Buckets Setup: venues, gallery, hero
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('venues', 'venues', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
    ('hero', 'hero', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Venues, Gallery, Hero
DROP POLICY IF EXISTS "Public Read Venue Buckets" ON storage.objects;
CREATE POLICY "Public Read Venue Buckets" ON storage.objects FOR SELECT USING (bucket_id IN ('venues', 'gallery', 'hero'));

DROP POLICY IF EXISTS "Staff Upload Venue Buckets" ON storage.objects;
CREATE POLICY "Staff Upload Venue Buckets" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('venues', 'gallery', 'hero') AND public.is_staff());

-- ----------------------------------------------------------------------------
-- 8. DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.venues IS 'Primary facility catalog (Football Turf, Cricket Nets, Bowling Lanes, etc.).';
COMMENT ON TABLE public.resource_categories IS 'Generic category definitions for complex inventory items (Courts, Bowling Machines, Bibs).';
COMMENT ON TABLE public.resources IS 'Sub-allocations or specific equipment attached to a venue or complex inventory.';
COMMENT ON TABLE public.pricing_rules IS 'Dynamic pricing matrix handling peak hour surcharges, weekend rates, and custom dates.';
COMMENT ON TABLE public.pricing_rule_history IS 'Audit history tracking rate adjustments over time.';
COMMENT ON TABLE public.venue_availability_cache IS 'Precomputed slot availability cache for high throughput availability lookups.';

-- ============================================================================
-- Migration Footer: 003_venue_management.sql upgraded & complete
-- ============================================================================
