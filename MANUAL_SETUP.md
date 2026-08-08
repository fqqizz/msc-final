# Maqbool Sports Complex (MSC) — Complete Manual Setup & Deployment Guide

This document details the exact, step-by-step instructions required to manually configure, connect, and launch **Maqbool Sports Complex (MSC)** and **MSC OS**.

---

## 1. Environment Variable Matrix

Configure these environment variables in your local `.env.local` file and in **Vercel Project Settings**:

| Environment Variable | Scope / Exposure | Description & Location |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Browser + Server) | Supabase Project URL (`https://your-project-id.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Browser + Server) | Supabase Publishable / Anon API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | **SERVER ONLY** | Supabase Service Role Secret Key (Never expose to browser) |
| `NEXT_PUBLIC_SITE_URL` | Public (Browser + Server) | Application Canonical Domain (`https://maqboolsports.in`) |
| `RAZORPAY_KEY_ID` | Public (Client Safe) | Razorpay Live/Test Key ID (`rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | **SERVER ONLY** | Razorpay Secret Key |
| `RAZORPAY_WEBHOOK_SECRET` | **SERVER ONLY** | Razorpay Webhook Secret Key for signature verification |
| `RESEND_API_KEY` | **SERVER ONLY** | Resend API Key (`re_...`) |

> [!CAUTION]
> **Security Notice**: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `RESEND_API_KEY` must **never** be prefixed with `NEXT_PUBLIC_` or exposed in client bundles.

---

## 2. Supabase Backend Setup

### A. Database Migrations
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select project `jcezdsooysowqaehnbbc` (or your active project).
3. Go to **SQL Editor** &rarr; **New Query**.
4. Run each SQL file located in `supabase/migrations/` sequentially:
   - `001_authentication.sql`
   - `002_venues_and_facilities.sql`
   - `003_customers_and_profiles.sql`
   - `004_booking_engine.sql`
   - `005_payments_and_gateways.sql`
   - `006_memberships_and_loyalty.sql`
   - `007_notifications.sql`
   - `008_pricing_overrides.sql`
   - `009_audit_logs.sql`
   - `010_leaderboard_rpc.sql`
   - `011_enterprise_additions.sql`
5. Run `supabase/seeds/seed.sql` to populate default venues (Cricket Net 1, Cricket Net 2, Football Turf) and the Automated Bowling Machine resource (`BM-CRICKET-01`).

### B. Storage Bucket Configuration
1. Go to **Storage** in the Supabase Sidebar.
2. Ensure the following buckets exist and are marked **Public**:
   - `avatars` (Public profile avatars)
   - `venues` (Facility photo assets)
   - `receipts` (PDF booking receipts, path pattern: `receipts/{booking_id}/MSC-{booking_number}.pdf`)

### C. Creating the Owner Admin Account
1. Go to **Authentication** &rarr; **Users** &rarr; **Add User** &rarr; **Create User**.
2. Enter email (e.g. `owner@maqboolsports.in`) and a secure password.
3. Once created, copy the `UUID` of the user.
4. Go to **SQL Editor** and execute:
   ```sql
   INSERT INTO public.user_profiles (id, full_name, email, role, status)
   VALUES ('7e241e96-a2ab-469c-9076-0d1f9c10e943', 'MSC Complex Owner', 'owner@maqboolsports.in', 'owner', 'active')
   ON CONFLICT (id) DO UPDATE SET role = 'owner';
   ```
5. Navigating to `/admin/login` will now allow owner sign-in into **MSC OS**.

---

## 3. Razorpay Payment Gateway & Webhook Setup

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

## 4. Resend Transactional Email Setup

1. Log in to [Resend Dashboard](https://resend.com/dashboard).
2. Go to **Domains** &rarr; **Add Domain** &rarr; Enter `maqboolsports.in`.
3. Add the generated DNS records (SPF, DKIM, DMARC) inside your domain DNS provider (Cloudflare/GoDaddy/Hostinger).
4. Verify domain status in Resend.
5. Go to **API Keys** &rarr; **Create API Key** &rarr; Copy key to `RESEND_API_KEY`.
6. Outgoing email address standard: `info@maqboolsports.in`.

---

## 5. Vercel Deployment Checklist

1. Connect your GitHub repository `https://github.com/fqqizz/msc-final` in Vercel.
2. Set Framework Preset to **Next.js**.
3. Add all environment variables listed in Section 1.
4. Click **Deploy**.
5. After deployment completes, set up Custom Domain `maqboolsports.in` under **Settings** &rarr; **Domains**.
