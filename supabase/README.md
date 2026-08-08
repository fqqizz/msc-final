# MSC OS (Maqbool Sports Complex Operating System) - Backend Documentation

An enterprise-grade, production-ready backend architecture for **MSC OS** built on **Supabase** (PostgreSQL 15+, Supabase Auth, Storage, Edge Functions, Row Level Security, Realtime, and PGCrypto).

---

## Technical Stack & Features

- **Database**: PostgreSQL 15+ with `uuid-ossp`, `pgcrypto`, `pg_trgm` extensions.
- **Authentication**: Phone-first Supabase Auth with custom user profile extensions, role-based security, device tokens, and preferences.
- **Concurrency & Booking Lock**: 5-minute reservation slot lock engine (`slot_locks`) preventing double bookings under high traffic.
- **Payment Gateway**: Seamless Razorpay order creation, payment capture, callback verification, auto-generated tax invoices (`INV-YYYY-XXXX`), and refund processing.
- **Notifications Outbox**: Multi-channel transactional messages (WhatsApp via Interakt, Email via Resend) with exponential retry backoff.
- **Storage Infrastructure**: 10 distinct storage buckets with strict Row Level Security (RLS) policies.
- **Analytics & Heatmaps**: Materialized views for daily revenue metrics, peak hour occupancy heatmaps, and customer retention metrics.
- **Edge Functions**: 8 TypeScript Deno Edge Functions for serverless async workloads.

---

## Directory Structure

```
supabase/
├── migrations/
│   ├── 001_authentication.sql        # Extensions, user profiles, auth helper functions, RLS, audit logs
│   ├── 002_customer_management.sql   # Customer CRM, stats, play hours, leaderboard RPCs
│   ├── 003_venue_management.sql      # Venues, resources, operating schedules, peak pricing engine
│   ├── 004_booking_engine.sql        # 5-min slot reservation locks, booking numbers (MSC-YYYYMMDD-XXXX)
│   ├── 005_payments.sql              # Razorpay integration, payment attempts, tax invoices, refunds
│   ├── 006_cms.sql                   # Hero banners, testimonials, FAQs, gallery, site settings
│   ├── 007_notifications.sql         # Resend Email & Interakt WhatsApp outbox queue & triggers
│   ├── 008_analytics.sql             # Materialized views, occupancy heatmaps, revenue reports
│   ├── 009_admin.sql                 # Granular RBAC, admin user roles, global cross-module search
│   └── 010_future.sql                # Memberships, promo coupons, referrals, coaching academy, merch
├── functions/
│   ├── booking-confirmation/index.ts # Booking workflow orchestrator
│   ├── whatsapp-notification/index.ts# Interakt WhatsApp API integration
│   ├── email-notification/index.ts   # Resend Email API integration
│   ├── receipt-generation/index.ts   # HTML/PDF receipt builder & storage uploader
│   ├── refund-webhook/index.ts       # Razorpay refund event handler
│   ├── razorpay-webhook/index.ts     # Razorpay payment verification webhook
│   ├── notification-queue/index.ts   # Queue worker for notification retries
│   └── daily-analytics/index.ts      # Cron job for refreshing analytics views
├── storage/
│   └── setup_storage.sql             # Central storage buckets setup & security policies
├── seeds/
│   └── seed.sql                      # Production setup data (venues, operating hours, rates, templates)
├── README.md                         # Setup & deployment guide
└── DATABASE.md                       # Comprehensive schema & RPC reference manual
```

---

## Deployment & Setup Guide

### 1. Initialize Supabase Local CLI

```bash
npx supabase init
npx supabase start
```

### 2. Apply Migrations in Sequence

Migrations are dependency-safe and must be applied in numeric order:

```bash
npx supabase db push
# Or manually apply via Supabase SQL Editor:
# Execute 001_authentication.sql through 010_future.sql sequentially.
```

### 3. Setup Storage & Seed Initial Data

```bash
npx supabase db execute --file supabase/storage/setup_storage.sql
npx supabase db execute --file supabase/seeds/seed.sql
```

### 4. Set Edge Function Environment Variables

In your Supabase Dashboard under Project Settings -> Edge Functions -> Secrets:

```bash
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
INTERAKT_API_KEY=...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

### 5. Deploy Edge Functions

```bash
npx supabase functions deploy booking-confirmation
npx supabase functions deploy whatsapp-notification
npx supabase functions deploy email-notification
npx supabase functions deploy receipt-generation
npx supabase functions deploy refund-webhook
npx supabase functions deploy razorpay-webhook
npx supabase functions deploy notification-queue
npx supabase functions deploy daily-analytics
```

---

## Realtime Channels

The following tables are added to `supabase_realtime`:
- `public.user_profiles`
- `public.customers`
- `public.venues`
- `public.resources`
- `public.bookings`
- `public.slot_locks`
- `public.payments`
- `public.invoices`
- `public.notification_queue`
