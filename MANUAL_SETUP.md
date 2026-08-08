# MSC OS — Production Configuration Required & Manual Setup Guide

This document outlines all manual setup and deployment steps required to launch **Maqbool Sports Complex OS (MSC OS)** to production.

---

## 1. Supabase Database & Auth Configuration
- **Where**: Supabase Dashboard -> Project Settings -> API / Authentication.
- **What**:
  - Run database migrations (`supabase/migrations/*.sql`) and seed script (`supabase/seeds/seed.sql`).
  - Enable Email/Password Auth in Supabase Auth Settings.
  - Set Site URL to `https://maqboolsports.in` and Redirect URLs to `https://maqboolsports.in/reset-password`, `https://maqboolsports.in/dashboard`.
- **Why**: Supabase is the single source of truth for RLS security, booking locks, customer identities, and admin authorization.
- **How to Test**: Register a new user at `/register` and verify a record is created in `auth.users` and `public.user_profiles`.

---

## 2. Resend Email Setup
- **Where**: Resend Dashboard (`https://resend.com`) -> Domains.
- **What**:
  - Add domain `maqboolsports.in`.
  - Configure DNS records (SPF, DKIM, DMARC) at your domain registrar.
  - Obtain API Key and set `RESEND_API_KEY` in production environment variables.
  - Verified Sender: `info@maqboolsports.in`.
- **Why**: Resend delivers transactional emails for welcome messages, booking receipts, confirmations, and cancellation updates.
- **How to Test**: Trigger a test booking or registration and verify receipt at `info@maqboolsports.in`.

---

## 3. Razorpay Payment Gateway
- **Where**: Razorpay Dashboard (`https://dashboard.razorpay.com`) -> Settings -> API Keys & Webhooks.
- **What**:
  - Generate Live Key ID and Key Secret.
  - Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in environment variables.
  - Configure Webhook URL: `https://maqboolsports.in/api/payments/webhook` for event `payment.captured`.
- **Why**: Enables instant online payments via UPI, Credit/Debit cards, and Netbanking with server verification.
- **How to Test**: Complete a test slot booking and verify `payments` row created in Supabase database.

---

## 4. OAuth Social Logins (Google, Facebook, Apple)
- **Where**: Supabase Dashboard -> Authentication -> Providers.
- **What**:
  - Configure Google OAuth Client ID & Secret in Google Cloud Console.
  - Configure Facebook App ID & App Secret in Meta for Developers.
  - Configure Apple Service ID & Secret Key in Apple Developer Console.
- **Why**: Allows one-tap social login for players.
- **How to Test**: Click Google/Facebook/Apple login buttons on `/login`.

---

## 5. Storage Buckets & Realtime Engine
- **Where**: Supabase Dashboard -> Storage & Realtime.
- **What**:
  - Ensure public buckets exist: `avatars`, `gallery`, `venues`, `receipts`, `booking-receipts`.
  - Enable Realtime subscriptions for `bookings`, `slot_locks`, `payment_attempts`.
- **Why**: Stores user avatars, facility photos, and generated PDF receipts.

---

## 6. Production Deployment (Vercel)
- **Where**: Vercel Dashboard -> Project Settings -> Environment Variables.
- **What**:
  - Import all environment variables from `.env.example`.
  - Deploy using `npm run build` or GitHub automatic integration.
