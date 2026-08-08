-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 006_cms.sql
-- Module: 6. Website CMS & Operational Business Settings
-- Description: Hero banners, customer testimonials, FAQs (FTS), gallery media showcase,
--              separated operational business settings vs website CMS settings, RLS, storage.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLES & SEPARATED BUSINESS SETTINGS
-- ----------------------------------------------------------------------------

-- Operational Business Settings (Tax rates, GST numbers, buffer times, currency)
CREATE TABLE IF NOT EXISTS public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_business_name VARCHAR(200) NOT NULL DEFAULT 'Maqbool Sports Complex',
    gstin VARCHAR(30) NULL DEFAULT '22AAAAA0000A1Z5',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    default_gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    slot_buffer_minutes INTEGER NOT NULL DEFAULT 0,
    allow_guest_checkout BOOLEAN NOT NULL DEFAULT TRUE,
    require_phone_verification BOOLEAN NOT NULL DEFAULT TRUE,
    operational_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Audit
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hero Media Banners
CREATE TABLE IF NOT EXISTS public.cms_hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    subtitle TEXT NULL,
    cta_text VARCHAR(50) NULL DEFAULT 'Book Turf Now',
    cta_link VARCHAR(255) NULL DEFAULT '/facilities',
    background_media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Customer Testimonials
CREATE TABLE IF NOT EXISTS public.cms_testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(150) NOT NULL,
    designation VARCHAR(100) NULL DEFAULT 'Regular Player',
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5) DEFAULT 5,
    quote TEXT NOT NULL,
    avatar_url TEXT NULL,
    verified_booking_id UUID NULL REFERENCES public.bookings(id) ON DELETE SET NULL ON UPDATE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,

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

-- Frequently Asked Questions (FAQs)
CREATE TABLE IF NOT EXISTS public.cms_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,

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

-- Website Media Gallery
CREATE TABLE IF NOT EXISTS public.cms_gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Football',
    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
    media_url TEXT NOT NULL,
    thumbnail_url TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Global Website CMS Branding & SEO Configuration
CREATE TABLE IF NOT EXISTS public.cms_website_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name VARCHAR(150) NOT NULL DEFAULT 'Maqbool Sports Complex',
    tagline VARCHAR(255) NULL DEFAULT 'Premium Football Turf & Cricket Nets in Srinagar',
    logo_url TEXT NULL,
    favicon_url TEXT NULL,
    contact_email VARCHAR(255) NOT NULL DEFAULT 'info@maqboolsports.com',
    contact_phone VARCHAR(20) NOT NULL DEFAULT '+91 9906000000',
    whatsapp_number VARCHAR(20) NOT NULL DEFAULT '+91 9906000000',
    address TEXT NOT NULL DEFAULT 'Maqbool Sports Complex, Srinagar, Jammu & Kashmir',
    google_maps_url TEXT NULL,
    opening_hours_summary VARCHAR(255) DEFAULT 'Open Daily: 6:00 AM - 11:00 PM',
    social_links JSONB NOT NULL DEFAULT '{
        "instagram": "https://instagram.com/maqboolsports",
        "facebook": "https://facebook.com/maqboolsports",
        "youtube": "https://youtube.com/maqboolsports"
    }'::jsonb,
    seo_metadata JSONB NOT NULL DEFAULT '{
        "meta_title": "Maqbool Sports Complex - Turf & Cricket Booking",
        "meta_description": "Book Kashmir premium Football Turf and Cricket Nets online. Instant reservation and slot locking.",
        "keywords": ["football turf srinagar", "cricket nets srinagar", "sports complex kashmir"]
    }'::jsonb,

    -- Audit
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. INDEXES & FTS SEARCH VECTORS
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_hero_active ON public.cms_hero_banners(is_active, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON public.cms_testimonials(is_published, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_testimonials_fts ON public.cms_testimonials USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.cms_faqs(category, is_published, display_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_faqs_fts ON public.cms_faqs USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.cms_gallery_items(category, is_published, display_order) WHERE deleted_at IS NULL;

-- FTS Vector Triggers for FAQs and Testimonials
CREATE OR REPLACE FUNCTION public.update_cms_fts_vectors()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'cms_faqs' THEN
        NEW.search_vector := to_tsvector('english', COALESCE(NEW.question, '') || ' ' || COALESCE(NEW.answer, ''));
    ELSIF TG_TABLE_NAME = 'cms_testimonials' THEN
        NEW.search_vector := to_tsvector('english', COALESCE(NEW.customer_name, '') || ' ' || COALESCE(NEW.quote, ''));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_faqs_fts ON public.cms_faqs;
CREATE TRIGGER tr_faqs_fts BEFORE INSERT OR UPDATE ON public.cms_faqs FOR EACH ROW EXECUTE FUNCTION public.update_cms_fts_vectors();

DROP TRIGGER IF EXISTS tr_testimonials_fts ON public.cms_testimonials;
CREATE TRIGGER tr_testimonials_fts BEFORE INSERT OR UPDATE ON public.cms_testimonials FOR EACH ROW EXECUTE FUNCTION public.update_cms_fts_vectors();

-- ----------------------------------------------------------------------------
-- 3. TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_business_settings_updated_at ON public.business_settings;
CREATE TRIGGER tr_business_settings_updated_at BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_cms_hero_updated_at ON public.cms_hero_banners;
CREATE TRIGGER tr_cms_hero_updated_at BEFORE UPDATE ON public.cms_hero_banners FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_cms_testimonials_updated_at ON public.cms_testimonials;
CREATE TRIGGER tr_cms_testimonials_updated_at BEFORE UPDATE ON public.cms_testimonials FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_cms_faqs_updated_at ON public.cms_faqs;
CREATE TRIGGER tr_cms_faqs_updated_at BEFORE UPDATE ON public.cms_faqs FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_cms_gallery_updated_at ON public.cms_gallery_items;
CREATE TRIGGER tr_cms_gallery_updated_at BEFORE UPDATE ON public.cms_gallery_items FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_cms_settings_updated_at ON public.cms_website_settings;
CREATE TRIGGER tr_cms_settings_updated_at BEFORE UPDATE ON public.cms_website_settings FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_website_settings ENABLE ROW LEVEL SECURITY;

-- Business Settings Policies
DROP POLICY IF EXISTS "business_settings_staff_read" ON public.business_settings;
CREATE POLICY "business_settings_staff_read" ON public.business_settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "business_settings_owner_modify" ON public.business_settings;
CREATE POLICY "business_settings_owner_modify" ON public.business_settings FOR ALL USING (public.is_owner());

-- Public read access for website frontend
DROP POLICY IF EXISTS "cms_hero_public_select" ON public.cms_hero_banners;
CREATE POLICY "cms_hero_public_select" ON public.cms_hero_banners FOR SELECT USING ((is_active = TRUE AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "cms_testimonials_public_select" ON public.cms_testimonials;
CREATE POLICY "cms_testimonials_public_select" ON public.cms_testimonials FOR SELECT USING ((is_published = TRUE AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "cms_faqs_public_select" ON public.cms_faqs;
CREATE POLICY "cms_faqs_public_select" ON public.cms_faqs FOR SELECT USING ((is_published = TRUE AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "cms_gallery_public_select" ON public.cms_gallery_items;
CREATE POLICY "cms_gallery_public_select" ON public.cms_gallery_items FOR SELECT USING ((is_published = TRUE AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "cms_settings_public_select" ON public.cms_website_settings;
CREATE POLICY "cms_settings_public_select" ON public.cms_website_settings FOR SELECT USING (TRUE);

-- Staff modification policies
DROP POLICY IF EXISTS "cms_hero_staff_modify" ON public.cms_hero_banners;
CREATE POLICY "cms_hero_staff_modify" ON public.cms_hero_banners FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "cms_testimonials_staff_modify" ON public.cms_testimonials;
CREATE POLICY "cms_testimonials_staff_modify" ON public.cms_testimonials FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "cms_faqs_staff_modify" ON public.cms_faqs;
CREATE POLICY "cms_faqs_staff_modify" ON public.cms_faqs FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "cms_gallery_staff_modify" ON public.cms_gallery_items;
CREATE POLICY "cms_gallery_staff_modify" ON public.cms_gallery_items FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "cms_settings_staff_modify" ON public.cms_website_settings;
CREATE POLICY "cms_settings_staff_modify" ON public.cms_website_settings FOR ALL USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- 5. GRANTS & STORAGE BUCKETS
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.business_settings TO anon, authenticated;
GRANT SELECT ON public.cms_hero_banners TO anon, authenticated;
GRANT SELECT ON public.cms_testimonials TO anon, authenticated;
GRANT SELECT ON public.cms_faqs TO anon, authenticated;
GRANT SELECT ON public.cms_gallery_items TO anon, authenticated;
GRANT SELECT ON public.cms_website_settings TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Storage Buckets Setup: logos, admin-assets, testimonials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('logos', 'logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']),
    ('admin-assets', 'admin-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    ('testimonials', 'testimonials', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public Read CMS Buckets" ON storage.objects;
CREATE POLICY "Public Read CMS Buckets" ON storage.objects FOR SELECT USING (bucket_id IN ('logos', 'admin-assets', 'testimonials'));

DROP POLICY IF EXISTS "Staff Upload CMS Buckets" ON storage.objects;
CREATE POLICY "Staff Upload CMS Buckets" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('logos', 'admin-assets', 'testimonials') AND public.is_staff());

-- ----------------------------------------------------------------------------
-- 6. DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.business_settings IS 'Separated operational parameters (GSTIN, default tax rates, buffer times, currency) distinct from CMS UI settings.';
COMMENT ON TABLE public.cms_hero_banners IS 'Homepage hero slider banners and promotional media.';
COMMENT ON TABLE public.cms_testimonials IS 'Customer reviews and verified play experiences with full text search.';
COMMENT ON TABLE public.cms_website_settings IS 'Global operational metadata, SEO tags, contact info, and social links.';

-- ============================================================================
-- Migration Footer: 006_cms.sql upgraded & complete
-- ============================================================================
