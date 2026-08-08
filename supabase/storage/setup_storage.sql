-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Storage Infrastructure Setup & Security Policies
-- Description: Centralized declaration of all 10 required storage buckets and 
--              their fine-grained Row Level Security (RLS) policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE STORAGE BUCKETS
-- ----------------------------------------------------------------------------

-- Avatars Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Gallery Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Venues Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('venues', 'venues', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- Receipts Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', true, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Logos Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logos', 'logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Documents Bucket (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760;

-- Hero Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('hero', 'hero', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

-- Testimonials Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('testimonials', 'testimonials', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Booking Receipts Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('booking-receipts', 'booking-receipts', true, 5242880, ARRAY['application/pdf', 'text/html'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Admin Assets Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('admin-assets', 'admin-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

-- ----------------------------------------------------------------------------
-- 2. STORAGE ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Public Buckets Read Policy
DROP POLICY IF EXISTS "Public Storage Select" ON storage.objects;
CREATE POLICY "Public Storage Select"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('avatars', 'gallery', 'venues', 'receipts', 'logos', 'hero', 'testimonials', 'booking-receipts', 'admin-assets'));

-- User Avatar Upload Policy
DROP POLICY IF EXISTS "Avatar Upload Self" ON storage.objects;
CREATE POLICY "Avatar Upload Self"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Staff Upload Policy for Public Media
DROP POLICY IF EXISTS "Staff Upload Public Storage" ON storage.objects;
CREATE POLICY "Staff Upload Public Storage"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id IN ('gallery', 'venues', 'receipts', 'logos', 'hero', 'testimonials', 'booking-receipts', 'admin-assets')
        AND (public.is_staff() OR auth.role() = 'service_role')
    );

-- Private Documents Access Policy (Staff Only)
DROP POLICY IF EXISTS "Private Documents Staff Policy" ON storage.objects;
CREATE POLICY "Private Documents Staff Policy"
    ON storage.objects FOR ALL
    USING (bucket_id = 'documents' AND public.is_staff());

-- ============================================================================
-- Storage Setup Complete
-- ============================================================================
