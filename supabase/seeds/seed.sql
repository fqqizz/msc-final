-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Initial Database Seed Script
-- Description: Inserts foundational roles, permissions, operational business settings,
--              feature flags, generic resource categories, facilities, 7-day operating hours,
--              peak pricing rules, notification templates, CMS hero banners, FAQs,
--              membership tiers, and promo coupons.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADMIN ROLES & PERMISSIONS
-- ----------------------------------------------------------------------------

INSERT INTO public.admin_roles (code, name, description, is_system_role)
VALUES 
    ('super_admin', 'Super Administrator', 'Full system access and database administration privileges.', true),
    ('owner', 'Complex Owner', 'Executive management access to financial reports, analytics, and staff settings.', true),
    ('reception', 'Reception Staff', 'Operational access to create walk-in bookings, collect cash, and manage schedules.', true),
    ('accountant', 'Finance & Accountant', 'Read-only financial access to export revenue reports and audit logs.', false)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.admin_permissions (permission_code, module, description)
VALUES 
    ('bookings.create', 'bookings', 'Ability to create manual/phone/walk-in bookings'),
    ('bookings.cancel', 'bookings', 'Ability to cancel customer bookings'),
    ('payments.refund', 'payments', 'Ability to trigger Razorpay or cash refunds'),
    ('pricing.update', 'venues', 'Ability to adjust peak rates and pricing rules'),
    ('cms.update', 'cms', 'Ability to publish testimonials, FAQs, and banners')
ON CONFLICT (permission_code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. OPERATIONAL BUSINESS SETTINGS & FEATURE FLAGS
-- ----------------------------------------------------------------------------

INSERT INTO public.business_settings (legal_business_name, gstin, currency, default_gst_percentage, allow_guest_checkout)
VALUES ('Maqbool Sports Complex', '22AAAAA0000A1Z5', 'INR', 18.00, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.feature_flags (flag_key, title, description, is_enabled)
VALUES 
    ('enable_coupons', 'Promo Coupons', 'Allows customers to redeem promo code discounts at checkout.', true),
    ('enable_memberships', 'Customer Memberships', 'Enables monthly subscription tiers with free play hours.', true),
    ('enable_academies', 'Coaching Academies', 'Enables academy enrollment and training schedules.', true),
    ('enable_corporate', 'Corporate Bookings', 'Enables B2B corporate contracts and custom pricing.', true),
    ('enable_merchandise', 'Merchandise Store', 'Enables online gear and apparel sales.', true),
    ('enable_ai_assistant', 'AI Booking Assistant', 'Enables natural language chatbot booking queries.', true)
ON CONFLICT (flag_key) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- ----------------------------------------------------------------------------
-- 3. GENERIC RESOURCE CATEGORIES, VENUES & RESOURCES SEED
-- ----------------------------------------------------------------------------

INSERT INTO public.resource_categories (name, description, is_per_slot_chargeable)
VALUES 
    ('Courts & Pitches', 'Main playing turf, courts, and net pitches', false),
    ('Bowling Machines', 'Automated speed and swing variable bowling machines', true),
    ('Equipment & Accessories', 'Footballs, bibs, cricket bats, and training cones', false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.venues (
    name, slug, sport_type, description, short_description, status, max_capacity, 
    dimensions, surface_type, rules_and_regulations, amenities, display_order, address
) VALUES 
(
    'Football Turf',
    'football-turf',
    'football',
    'State-of-the-art 7-a-side professional synthetic turf field equipped with modern floodlights and shock-absorbing rubber infill.',
    '7-a-side FIFA approved synthetic turf with floodlights.',
    'active',
    22,
    '100 x 60 ft',
    'FIFA Approved 50mm Artificial Grass',
    ARRAY['Studded football boots permitted', 'No smoking on turf', 'Arrive 10 minutes prior to slot start time'],
    ARRAY['Floodlights', 'Changing Rooms', 'Drinking Water', 'Parking', 'Spectator Seating'],
    1,
    'Maqbool Sports Complex, Sector 4, Srinagar'
),
(
    'Cricket Net 1',
    'cricket-net-1',
    'cricket',
    'Professional cricket net pitch with high-grade polyurethane turf and heavy-duty protective netting.',
    'Pro cricket practice pitch with polyurethane turf.',
    'active',
    8,
    '22 yards length x 10 ft width',
    'Polyurethane Synthetic Turf',
    ARRAY['Cricket spikes prohibited', 'Helmets mandatory for batter'],
    ARRAY['Floodlights', 'Protective Netting', 'Stumps Provided', 'Drinking Water'],
    2,
    'Maqbool Sports Complex, Sector 4, Srinagar'
),
(
    'Cricket Net 2',
    'cricket-net-2',
    'cricket',
    'Secondary professional cricket practice net with optional automated bowling machine hookup.',
    'Pro cricket net pitch with optional bowling machine.',
    'active',
    8,
    '22 yards length x 10 ft width',
    'Polyurethane Synthetic Turf',
    ARRAY['Cricket spikes prohibited', 'Helmets mandatory for batter'],
    ARRAY['Floodlights', 'Bowling Machine Port', 'Stumps Provided'],
    3,
    'Maqbool Sports Complex, Sector 4, Srinagar'
),
(
    'Bowling Nets',
    'bowling-nets',
    'bowling',
    'Upcoming automated speed-variable bowling lane with swing and spin controls.',
    'Next-gen automated bowling lanes.',
    'coming_soon',
    4,
    '22 yards length',
    'High Impact Synthetic Lane',
    ARRAY['Safety gear compulsory'],
    ARRAY['Automated Feeder', 'Speed Radar Display'],
    4,
    'Maqbool Sports Complex, Sector 4, Srinagar'
)
ON CONFLICT (slug) DO UPDATE 
SET status = EXCLUDED.status, description = EXCLUDED.description;

-- Resources Allocation
INSERT INTO public.resources (venue_id, category_id, name, code, status, hourly_extra_cost)
SELECT v.id, c.id, 'Football Main Pitch', 'FT-PITCH-1', 'available', 0.00 
FROM public.venues v, public.resource_categories c 
WHERE v.slug = 'football-turf' AND c.name = 'Courts & Pitches'
ON CONFLICT (venue_id, code) DO NOTHING;

INSERT INTO public.resources (venue_id, category_id, name, code, status, hourly_extra_cost)
SELECT v.id, c.id, 'Cricket Pitch Net 1', 'CN-NET-1', 'available', 0.00 
FROM public.venues v, public.resource_categories c 
WHERE v.slug = 'cricket-net-1' AND c.name = 'Courts & Pitches'
ON CONFLICT (venue_id, code) DO NOTHING;

INSERT INTO public.resources (venue_id, category_id, name, code, status, hourly_extra_cost)
SELECT v.id, c.id, 'Cricket Pitch Net 2', 'CN-NET-2', 'available', 0.00 
FROM public.venues v, public.resource_categories c 
WHERE v.slug = 'cricket-net-2' AND c.name = 'Courts & Pitches'
ON CONFLICT (venue_id, code) DO NOTHING;

-- Automated Bowling Machine (Shared resource at ₹299.00/hour)
INSERT INTO public.resources (venue_id, category_id, name, code, status, hourly_extra_cost)
SELECT v.id, c.id, 'Automated Bowling Machine #1', 'BM-CRICKET-01', 'available', 299.00 
FROM public.venues v, public.resource_categories c 
WHERE v.slug = 'cricket-net-2' AND c.name = 'Bowling Machines'
ON CONFLICT (venue_id, code) DO UPDATE 
SET hourly_extra_cost = 299.00, name = 'Automated Bowling Machine #1';

-- ----------------------------------------------------------------------------
-- 4. VENUE OPERATING HOURS SEED
-- ----------------------------------------------------------------------------

-- Set Operating Hours (0 to 6 = All days, 06:00 AM - 11:00 PM)
INSERT INTO public.venue_operating_hours (venue_id, day_of_week, open_time, close_time, slot_duration_minutes)
SELECT v.id, d.day, '06:00:00'::TIME, '23:00:00'::TIME, 60
FROM public.venues v
CROSS JOIN (SELECT generate_series(0, 6) AS day) d
ON CONFLICT (venue_id, day_of_week) DO NOTHING;

-- Seed Authoritative Base Rates (₹999 Football Turf, ₹299 Cricket Nets)
INSERT INTO public.venue_base_rates (venue_id, base_price, effective_from, reason)
SELECT id, CASE WHEN slug = 'football-turf' THEN 999.00 ELSE 299.00 END, '2025-01-01 00:00:00+05:30'::TIMESTAMPTZ, 'Authoritative Baseline'
FROM public.venues
WHERE slug IN ('football-turf', 'cricket-net-1', 'cricket-net-2')
ON CONFLICT DO NOTHING;

-- Cancellation Policies Seed
INSERT INTO public.cancellation_policies (name, min_notice_hours, refund_percentage, cancellation_fee, is_active)
VALUES
    ('Full Refund Notice', 24, 100.00, 0.00, true),
    ('Partial Refund Notice', 12, 50.00, 100.00, true),
    ('Non-Refundable Window', 0, 0.00, 0.00, true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. NOTIFICATION TEMPLATES SEED
-- ----------------------------------------------------------------------------

INSERT INTO public.notification_templates (code, name, channel, subject_template, body_template, variables)
VALUES 
(
    'BOOKING_CONFIRMATION_WHATSAPP',
    'Booking Confirmation WhatsApp Template',
    'whatsapp',
    NULL,
    'Hi {{customer_name}}, your booking {{booking_number}} for {{venue_name}} on {{start_time}} is CONFIRMED. Total: ₹{{total_amount}}. See you at Maqbool Sports Complex!',
    '["customer_name", "booking_number", "venue_name", "start_time", "total_amount"]'::jsonb
),
(
    'BOOKING_CONFIRMATION_EMAIL',
    'Booking Confirmation Email Template',
    'email',
    'Booking Confirmed - {{booking_number}}',
    'Hello {{customer_name}},\n\nYour reservation at Maqbool Sports Complex has been confirmed.\n\nBooking ID: {{booking_number}}\nFacility: {{venue_name}}\nTime: {{start_time}}\nTotal Amount: ₹{{total_amount}}\n\nThank you!',
    '["customer_name", "booking_number", "venue_name", "start_time", "total_amount"]'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. WEBSITE CMS SEED DATA
-- ----------------------------------------------------------------------------

INSERT INTO public.cms_website_settings (site_name, tagline, contact_email, contact_phone, whatsapp_number, address)
VALUES (
    'Maqbool Sports Complex',
    'Premium Football Turf & Cricket Nets Operating System',
    'support@maqboolsports.com',
    '+91 9906000000',
    '+91 9906000000',
    'Maqbool Sports Complex, Sector 4, Srinagar, Jammu & Kashmir 190001'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.cms_hero_banners (title, subtitle, cta_text, cta_link, background_media_url, display_order)
VALUES 
(
    'Kashmir’s Premier Sports Complex',
    'Book high-grade FIFA synthetic football turf and pro cricket net pitches online with instant slot confirmation.',
    'Book Slot Now',
    '/facilities',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200',
    1
)
ON CONFLICT DO NOTHING;

INSERT INTO public.cms_faqs (category, question, answer, display_order)
VALUES 
('Booking', 'How do I book a slot on the Football Turf?', 'Select your preferred facility on the website, pick an available time slot, complete online payment, and receive instant WhatsApp/Email receipts.', 1),
('Rules', 'What footwear is allowed on the synthetic turf?', 'Standard rubber studded football boots and turf shoes are allowed. Metal spikes are strictly prohibited.', 2),
('Cancellation', 'What is the cancellation and refund policy?', 'Cancellations made 24+ hours in advance receive a 100% refund. Cancellations made 12-24 hours in advance receive a 50% refund.', 3)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. MEMBERSHIPS & PROMO COUPONS SEED
-- ----------------------------------------------------------------------------

INSERT INTO public.membership_plans (name, tier, monthly_fee, discount_percentage, free_hours_per_month, perks)
VALUES 
('Gold Player Pass', 'gold', 1999.00, 10.00, 2, '["2 Free Hours/month", "10% off extra slots", "7-day advance booking window"]'::jsonb),
('VIP Pro Membership', 'VIP', 3999.00, 20.00, 5, '["5 Free Hours/month", "20% off all bookings", "Free Bowling Machine access", "Priority slot locking"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.coupons (code, title, discount_type, discount_value, min_spend, valid_to, max_uses)
VALUES 
('WELCOME100', 'Welcome ₹100 Flat Discount', 'flat', 100.00, 500.00, (NOW() + INTERVAL '1 year'), 500),
('TURF20', '20% Off Weekend Special', 'percentage', 20.00, 1000.00, (NOW() + INTERVAL '6 months'), 200)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Seed Data Execution Complete
-- ============================================================================
