-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 010_future.sql
-- Module: 10. Future Expansion & Growth Platform
-- Description: Subscriptions & Memberships, Coupons & Promo Discounts, Customer Referral System,
--              Coaching Academies, Merchandise Inventory & Orders, Corporate Group Contracts,
--              Feature Flag integration, Soft Deletes, Audit Metadata, RLS & Storage setup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

-- Membership Plans
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    tier VARCHAR(50) NOT NULL DEFAULT 'gold',
    monthly_fee NUMERIC(10, 2) NOT NULL CHECK (monthly_fee >= 0),
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (discount_percentage BETWEEN 0 AND 100),
    free_hours_per_month INTEGER NOT NULL DEFAULT 2 CHECK (free_hours_per_month >= 0),
    perks JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Customer Subscriptions
CREATE TABLE IF NOT EXISTS public.member_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    remaining_free_hours INTEGER NOT NULL DEFAULT 2,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Coupons & Promotional Discounts
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_spend NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_discount NUMERIC(10, 2) NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 100,
    current_uses INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_coupon_dates CHECK (valid_to > valid_from)
);

-- Coupon Redemption Records
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    discount_applied NUMERIC(10, 2) NOT NULL CHECK (discount_applied >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_booking_coupon UNIQUE (booking_id, coupon_id)
);

-- Referral System Trackers
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    referee_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    referral_code VARCHAR(30) NOT NULL,
    reward_amount NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coaching Academies
CREATE TABLE IF NOT EXISTS public.coaching_academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport public.sport_type NOT NULL,
    title VARCHAR(150) NOT NULL,
    coach_name VARCHAR(150) NOT NULL,
    schedule_info TEXT NOT NULL,
    monthly_fee NUMERIC(10, 2) NOT NULL CHECK (monthly_fee >= 0),
    max_students INTEGER NOT NULL DEFAULT 30,
    current_students INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Academy Enrollments
CREATE TABLE IF NOT EXISTS public.academy_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES public.coaching_academies(id) ON DELETE CASCADE ON UPDATE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    student_age INTEGER NOT NULL CHECK (student_age BETWEEN 4 AND 70),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Merchandise Catalog
CREATE TABLE IF NOT EXISTS public.merchandise_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Apparel',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Full Text Search Vector
    search_vector tsvector NULL,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Merchandise Orders
CREATE TABLE IF NOT EXISTS public.merchandise_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status public.booking_payment_status NOT NULL DEFAULT 'unpaid',
    fulfillment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    shipping_address TEXT NULL,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Corporate Group Contracts
CREATE TABLE IF NOT EXISTS public.corporate_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(50) NULL,
    contact_person VARCHAR(150) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contract_details TEXT NULL,
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00 CHECK (discount_rate BETWEEN 0 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- 2. INDEXES & FTS VECTORS
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_member_subscriptions_cust ON public.member_subscriptions(customer_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_cust ON public.academy_enrollments(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_merchandise_sku ON public.merchandise_products(sku) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_merchandise_fts ON public.merchandise_products USING gin(search_vector);

CREATE OR REPLACE FUNCTION public.update_merchandise_fts_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.category, '') || ' ' || COALESCE(NEW.sku, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_merchandise_fts ON public.merchandise_products;
CREATE TRIGGER tr_merchandise_fts BEFORE INSERT OR UPDATE ON public.merchandise_products FOR EACH ROW EXECUTE FUNCTION public.update_merchandise_fts_vector();

-- ----------------------------------------------------------------------------
-- 3. FUNCTIONS & RPCs WITH FEATURE FLAG INTEGRATION
-- ----------------------------------------------------------------------------

-- RPC: Validate Coupon Code for Checkout
CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code VARCHAR,
    p_spend_amount NUMERIC(10,2)
)
RETURNS TABLE (
    coupon_id UUID,
    discount_amount NUMERIC(10,2),
    is_valid BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_coupon public.coupons%ROWTYPE;
    v_calculated_discount NUMERIC(10,2) := 0.00;
BEGIN
    -- Feature flag check
    IF NOT public.is_feature_enabled('enable_coupons') THEN
        RETURN QUERY SELECT NULL::UUID, 0.00::NUMERIC, FALSE, 'Coupon feature is currently disabled.'::TEXT;
        RETURN;
    END IF;

    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(p_code)
      AND is_active = TRUE
      AND deleted_at IS NULL
      AND NOW() BETWEEN valid_from AND valid_to;

    IF v_coupon.id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, 0.00::NUMERIC, FALSE, 'Invalid or expired coupon code.'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.current_uses >= v_coupon.max_uses THEN
        RETURN QUERY SELECT NULL::UUID, 0.00::NUMERIC, FALSE, 'Coupon redemptions limit reached.'::TEXT;
        RETURN;
    END IF;

    IF p_spend_amount < v_coupon.min_spend THEN
        RETURN QUERY SELECT NULL::UUID, 0.00::NUMERIC, FALSE, ('Minimum spend of ₹' || v_coupon.min_spend || ' required.')::TEXT;
        RETURN;
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
        v_calculated_discount := ROUND((p_spend_amount * (v_coupon.discount_value / 100.0))::NUMERIC, 2);
        IF v_coupon.max_discount IS NOT NULL AND v_calculated_discount > v_coupon.max_discount THEN
            v_calculated_discount := v_coupon.max_discount;
        END IF;
    ELSE
        v_calculated_discount := v_coupon.discount_value;
    END IF;

    RETURN QUERY SELECT v_coupon.id, v_calculated_discount, TRUE, 'Coupon applied successfully.'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_membership_plans_updated_at ON public.membership_plans;
CREATE TRIGGER tr_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_member_subscriptions_updated_at ON public.member_subscriptions;
CREATE TRIGGER tr_member_subscriptions_updated_at BEFORE UPDATE ON public.member_subscriptions FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_coupons_updated_at ON public.coupons;
CREATE TRIGGER tr_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_coaching_academies_updated_at ON public.coaching_academies;
CREATE TRIGGER tr_coaching_academies_updated_at BEFORE UPDATE ON public.coaching_academies FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_merchandise_products_updated_at ON public.merchandise_products;
CREATE TRIGGER tr_merchandise_products_updated_at BEFORE UPDATE ON public.merchandise_products FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "membership_plans_public_select" ON public.membership_plans;
CREATE POLICY "membership_plans_public_select" ON public.membership_plans FOR SELECT USING ((is_active = TRUE AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "member_subscriptions_select_own_or_staff" ON public.member_subscriptions;
CREATE POLICY "member_subscriptions_select_own_or_staff" ON public.member_subscriptions FOR SELECT USING ((customer_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "coupons_public_select" ON public.coupons;
CREATE POLICY "coupons_public_select" ON public.coupons FOR SELECT USING ((is_active = TRUE AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "coupon_redemptions_select_own_or_staff" ON public.coupon_redemptions;
CREATE POLICY "coupon_redemptions_select_own_or_staff" ON public.coupon_redemptions FOR SELECT USING (customer_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "coaching_academies_public_select" ON public.coaching_academies;
CREATE POLICY "coaching_academies_public_select" ON public.coaching_academies FOR SELECT USING ((is_active = TRUE AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "academy_enrollments_select_own_or_staff" ON public.academy_enrollments;
CREATE POLICY "academy_enrollments_select_own_or_staff" ON public.academy_enrollments FOR SELECT USING ((customer_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "merchandise_products_public_select" ON public.merchandise_products;
CREATE POLICY "merchandise_products_public_select" ON public.merchandise_products FOR SELECT USING ((is_active = TRUE AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "merchandise_orders_select_own_or_staff" ON public.merchandise_orders;
CREATE POLICY "merchandise_orders_select_own_or_staff" ON public.merchandise_orders FOR SELECT USING ((customer_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "corporate_bookings_staff_only" ON public.corporate_bookings;
CREATE POLICY "corporate_bookings_staff_only" ON public.corporate_bookings FOR ALL USING (public.is_staff());

-- Staff Modification Override Policies
DROP POLICY IF EXISTS "future_plans_staff_modify" ON public.membership_plans;
CREATE POLICY "future_plans_staff_modify" ON public.membership_plans FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "future_coupons_staff_modify" ON public.coupons;
CREATE POLICY "future_coupons_staff_modify" ON public.coupons FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "future_academies_staff_modify" ON public.coaching_academies;
CREATE POLICY "future_academies_staff_modify" ON public.coaching_academies FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "future_merch_staff_modify" ON public.merchandise_products;
CREATE POLICY "future_merch_staff_modify" ON public.merchandise_products FOR ALL USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- 6. GRANTS, STORAGE BUCKET & COMMENTS
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.membership_plans TO anon, authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT SELECT ON public.coaching_academies TO anon, authenticated;
GRANT SELECT ON public.merchandise_products TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Storage Bucket Setup: documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Staff Document Access" ON storage.objects;
CREATE POLICY "Staff Document Access" ON storage.objects FOR ALL USING (bucket_id = 'documents' AND public.is_staff());

COMMENT ON TABLE public.membership_plans IS 'Monthly subscription tiers with free hours and venue booking discounts.';
COMMENT ON TABLE public.coupons IS 'Promo code system for checkout discounts with Feature Flag integration.';
COMMENT ON TABLE public.coaching_academies IS 'Sports academy enrollment and coaching schedule management.';

-- ============================================================================
-- Migration Footer: 010_future.sql upgraded & complete
-- ============================================================================
