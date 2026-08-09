# Maqbool Sports Complex (MSC) — Production Setup & Operations Manual

This document details the exact, step-by-step instructions required to configure, connect, and launch **Maqbool Sports Complex (MSC)** and the **MSC OS** administrative platform.

---

## 1. Environment Variable Matrix

Configure these environment variables in your local `.env.local` file and in **Vercel Project Settings**:

| Environment Variable | Scope / Exposure | Description & Location |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Browser + Server) | Supabase Project URL (`https://jcezdsooysowqaehnbbc.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Browser + Server) | Supabase Publishable / Anon API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER ONLY** | Supabase Service Role Secret Key (Never expose to browser) |
| `NEXT_PUBLIC_SITE_URL` | Public (Browser + Server) | Application Canonical Domain (`https://maqboolsports.in`) |
| `RAZORPAY_KEY_ID` | Public (Client Safe) | Razorpay Live/Test Key ID (`rzp_live_...` or `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | **SERVER ONLY** | Razorpay Secret Key |
| `RAZORPAY_WEBHOOK_SECRET` | **SERVER ONLY** | Razorpay Webhook Secret Key for signature verification |
| `RESEND_API_KEY` | **SERVER ONLY** | Resend API Key (`re_...`) |

> [!CAUTION]
> **Security Notice**: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `RESEND_API_KEY` must **never** be prefixed with `NEXT_PUBLIC_` or exposed in client bundles.

---

## 2. Authoritative Baseline Prices & Pricing Hierarchy

| Facility / Resource | Authoritative Base Rate | Description |
| :--- | :--- | :--- |
| **Cricket Net 1** | **₹299 / hour** | Pro synthetic cricket practice pitch |
| **Cricket Net 2** | **₹299 / hour** | Pro cricket net with bowling machine hookup |
| **Football Turf** | **₹999 / hour** | 10,000+ sq. ft. FIFA-grade synthetic turf |
| **Automated Bowling Machine (`BM-CRICKET-01`)** | **₹299 / hour** | Shared add-on across Cricket Net 1 & Net 2 |

### Authoritative Pricing Resolution Hierarchy:
1. **Slot-Specific Override** (`pricing_rules` priority 10)
2. **Date + Venue Override** (`pricing_rules` priority 5)
3. **Effective Base Rate History** (`venue_base_rates` active on slot date)
4. **Baseline Facility Rate** (₹999 Football Turf / ₹299 Cricket Nets)

---

## 3. Strict Cancellation Policy & Modal Experience

### A. Authoritative Single Source of Truth
All policies are defined in `data/policies.ts`:
- `cancellationPolicy`: Strict > 5-hour cutoff notice rule.
- `refundPolicy`: Clear distinction between cancellation and refund processing (5–7 business days).
- `termsAndConditions`: Complex rules, sportswear/footwear, safety, and conduct.

### B. Strict Cancellation Rule (`isCancellationEligible`)
A customer can request cancellation/rescheduling/refund **ONLY IF** the request is made **STRICTLY MORE THAN 5 HOURS** before the scheduled booking time.
- Request at **2:59 PM** for **8:00 PM** booking (5h 01m remaining) &rarr; **ELIGIBLE**.
- Request at **3:00 PM** for **8:00 PM** booking (5h 00m remaining) &rarr; **NOT ELIGIBLE**.
- Request at **3:01 PM** for **8:00 PM** booking (4h 59m remaining) &rarr; **NOT ELIGIBLE**.
- Request at **4:00 PM** for **8:00 PM** booking (4h 00m remaining) &rarr; **NOT ELIGIBLE**.

### C. Modal Experience & Dedicated Routes
- Clicking policy links anywhere on the site opens a small, accessible modal on the current page (`components/policy-modal.tsx`).
- Dedicated routes for SEO & deep linking:
  - `/cancellation-policy`
  - `/refund-policy`
  - `/terms-conditions` (with `/terms-and-conditions` alias)

---

## 4. Supabase Backend Setup & SQL Migrations

### A. Database Migrations
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** &rarr; **New Query**.
3. Run the SQL files located in `supabase/migrations/` sequentially:
   - `001_authentication.sql`
   - `002_customer_management.sql`
   - `003_venue_management.sql`
   - `004_booking_engine.sql`
   - `005_payments.sql`
   - `006_cms.sql`
   - `007_notifications.sql`
   - `008_analytics.sql`
   - `009_admin.sql`
   - `010_future.sql`
   - `011_enterprise_additions.sql`
   - `012_final_production_hardening.sql` *(Introduces `slot_reservations`, `reserve_owner_slot`, and `release_owner_slot`)*
   - `013_authoritative_pricing_and_base_rates.sql` *(Introduces `venue_base_rates`, `change_base_price`, `calculate_booking_amount`, removes obsolete "Bowling Nets" venue, and sets Bowling Machine to ₹299/hr)*
4. Run `supabase/seeds/seed.sql` to populate default venues and the Automated Bowling Machine resource.

### B. Storage Bucket Configuration
1. Go to **Storage** in the Supabase Sidebar.
2. Ensure the following buckets exist and are marked **Public**:
   - `avatars` (Public profile avatars)
   - `venues` (Facility photo assets)
   - `receipts` (PDF booking receipts, path pattern: `receipts/{booking_id}/MSC-{booking_number}.pdf`)

### C. Owner Admin Account Setup (Eihab Naseer)
1. Go to **Authentication** &rarr; **Users** &rarr; **Add User** &rarr; **Create User**.
2. Enter email (`owner@maqboolsports.in` or `eihab@maqboolsports.in`) and a secure password.
3. In SQL Editor, assign the `owner` role and name:
   ```sql
   INSERT INTO public.user_profiles (id, full_name, email, role, status)
   VALUES ('7e241e96-a2ab-469c-9076-0d1f9c10e943', 'Eihab Naseer', 'owner@maqboolsports.in', 'owner', 'active')
   ON CONFLICT (id) DO UPDATE SET full_name = 'Eihab Naseer', role = 'owner';
   ```
4. Navigating to `/admin/login` will now provide direct access to **MSC OS**. The owner account is strictly excluded from player leaderboards, player stats, and customer counts.

---

## 5. Razorpay Payment Gateway & Webhook Setup

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Account & Settings** &rarr; **API Keys** &rarr; **Generate Key**.
3. Copy **Key ID** to `RAZORPAY_KEY_ID` and **Key Secret** to `RAZORPAY_KEY_SECRET`.
4. Go to **Settings** &rarr; **Webhooks** &rarr; **Add New Webhook**.
5. Set Webhook URL:
   `https://maqboolsports.in/api/payments/webhook`
6. Set Secret: Copy secret to `RAZORPAY_WEBHOOK_SECRET`.
7. Select Events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
   - `refund.failed`

---

## 6. Resend Transactional Email Setup

1. Log in to [Resend Dashboard](https://resend.com).
2. Add and verify your custom domain: `maqboolsports.in`.
3. Add the required DNS records in your domain registrar (Namecheap/GoDaddy/Cloudflare):
   - **SPF**: `v=spf1 include:amazonses.com ~all`
   - **DKIM**: Add the 3 CNAME records generated by Resend.
   - **DMARC**: `v=DMARC1; p=none;`
4. Copy your API Key (`re_...`) to `RESEND_API_KEY`.
5. All system emails will be dispatched from:
   `Maqbool Sports Complex <info@maqboolsports.in>`.

---

## 7. MSC Customer Chatbot Intelligence

The customer chatbot (`components/chatbot.tsx`, `lib/chatbot-service.ts`, `data/mscKnowledge.ts`) features:
- **Natural conversational greeting handling** (Salam, Namaste, Hi, Hello, Okay, Bye, Thanks).
- **Real-Time Supabase Availability**: Answers queries like *"Is 7 PM free today?"* or *"What slots are open tomorrow?"* directly from live bookings and slot locks.
- **Authoritative Database Pricing**: Quotes accurate live rates (Turf: ₹999/hr, Nets: ₹299/hr, Bowling Machine: ₹299/hr).
- **Dynamic Time Cancellation Calculation**: Accurately computes remaining hours and explains eligibility without generic hardcoding.
- **Sport Specific Explanations**: Cricket (Full Turf vs Nets vs Bowling Machine) and Football (7v7 Turf).
- **Safe Fallback & Human Handoff**: Connects payment issues or tournament requests directly to MSC contact channels (+91 9682558775 / info@maqboolsports.in).
- **Zero Hallucinations**: Responds gracefully to non-existent sports (Basketball, Pickleball, Volleyball) without false promises.
