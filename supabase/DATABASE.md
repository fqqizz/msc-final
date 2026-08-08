# MSC OS (Maqbool Sports Complex Operating System) - Database Reference Manual

A comprehensive technical reference of all schema tables, views, custom functions, RPC endpoints, and security policies in **MSC OS**.

---

## Modules & Table Inventory

| Module | Table Name | Description | Key Indexes & Features |
| :--- | :--- | :--- | :--- |
| **Module 1: Authentication** | `user_profiles` | 1:1 user profile extending `auth.users` | Phone/Email unique index, trigram search on full_name, auto signup trigger |
| | `user_devices` | Device tokens & mobile push targets | Composite `(user_id, device_token)` |
| | `user_preferences` | UI theme, language, and notification toggles | Unique `user_id` |
| | `user_login_history` | Security audit trail of logins | Indexed on `user_id, created_at` |
| | `audit_logs` | Global row modification history | Indexed on `table_name, record_id` |
| | `domain_events` | Global domain event bus log | Indexed on `event_type`, `aggregate_id` |
| | `webhook_logs` | Raw inbound webhook log history | Indexed on `provider`, `processing_status` |
| **Module 2: Customer CRM** | `customers` | Lifetime value, play hours, spend, tier | FTS `search_vector`, `last_booking_at` & `last_seen_at` auto-tracking |
| | `customer_tags` | Tag dictionary | Unique name |
| | `customer_notes` | Staff internal notes on customer behavior | Indexed on `customer_id` |
| | `mv_customer_leaderboard` | Materialized high-performance leaderboard | Unique index `customer_id` |
| **Module 3: Venue Management** | `venues` | Sports facilities catalog | Unique name, slug, sport_type index |
| | `resource_categories` | Generic category definitions (Courts, Bowling Machines) | Unique `name` |
| | `resources` | Sub-allocations & equipment inventory | Unique `(venue_id, code)` |
| | `venue_images` | Gallery media per venue | Indexed on `venue_id, display_order` |
| | `venue_operating_hours` | Weekly opening & closing times | Unique `(venue_id, day_of_week)` |
| | `pricing_rules` | Dynamic pricing engine matrix | Priority ordered lookup index |
| | `pricing_rule_history` | Audit trail of rate changes | Indexed on `pricing_rule_id` |
| | `venue_maintenance_logs` | Scheduled maintenance windows | Overlap check index |
| | `venue_availability_cache` | Precomputed slot availability cache | Unique `(venue_id, start_time, end_time)` |
| **Module 4: Booking Engine** | `slot_locks` | 5-minute temporary reservation locks | Expiry index, advisory locking RPC |
| | `bookings` | Core booking register | Unique `booking_number` (MSC-YYYYMMDD-XXXX), time overlap index |
| | `booking_timeline` | Immutable step-by-step lifecycle history log | Indexed on `booking_id, created_at` |
| | `booking_resources` | Allocated sub-equipment per booking | Unique `(booking_id, resource_id)` |
| | `cancellation_policies` | Notice window & refund percentage rules | Notice hours ordering |
| | `cancellation_requests` | Cancellation processing log | Indexed on `booking_id` |
| **Module 5: Payments** | `payments` | Financial transactions ledger (Full JSONB responses) | Razorpay order & payment ID indexes |
| | `payment_attempts` | Gateway request/callback payload log history | Indexed on `booking_id` |
| | `refunds` | Refund records & Razorpay refund IDs | Indexed on `payment_id` |
| | `invoices` | Tax invoices (INV-YYYY-XXXX) with GST | Unique `invoice_number`, unique `booking_id` |
| **Module 6: CMS & Settings** | `business_settings` | Separated operational settings (GSTIN, tax rates, buffer times) | Single record configuration |
| | `cms_hero_banners` | Homepage banner slider | Indexed on `is_active, display_order` |
| | `cms_testimonials` | Customer reviews & ratings (FTS) | FTS `search_vector` GIN index |
| | `cms_faqs` | FAQs grouped by category (FTS) | FTS `search_vector` GIN index |
| | `cms_gallery_items` | Media gallery items | Indexed on `category, is_published` |
| | `cms_website_settings` | Global contact, SEO, and social metadata | Single record configuration |
| **Module 7: Notifications** | `notification_templates` | WhatsApp & Email message templates | Unique `code` |
| | `notification_queue` | Outbox queue with retry mechanism | Partial index on `status = pending` |
| | `notification_dlq` | Dead Letter Queue for failed notifications | Indexed on `recipient` |
| | `notification_logs` | Delivered message gateway response logs | Indexed on `queue_id` |
| **Module 8: Analytics** | `mv_daily_revenue_analytics` | Materialized view for daily revenue | Unique index `(report_date, venue_id)` |
| | `mv_hourly_occupancy_heatmap` | Materialized view for hourly heatmaps | Unique index `(venue_id, day_of_week, hour_of_day)` |
| | `mv_customer_retention_metrics` | Materialized view for customer repeat rates | Unique index `(month_start)` |
| **Module 9: Admin** | `feature_flags` | Dynamic module feature toggles | Unique `flag_key` |
| | `scheduled_jobs` | Background cron job scheduler status tracker | Unique `job_name` |
| | `admin_roles` | System & custom roles | Unique `code` |
| | `admin_permissions` | Granular capability catalog | Unique `permission_code` |
| | `admin_role_permissions` | Role-to-Permission mapping | Primary Key `(role_id, permission_id)` |
| | `admin_user_roles` | User-to-Role mapping | Primary Key `(user_id, role_id)` |
| | `admin_system_settings` | Global system KV configuration | Unique `setting_key` |
| **Module 10: Future Growth** | `membership_plans` | Monthly subscription tiers | Unique `name` |
| | `member_subscriptions` | Customer active memberships | Indexed on `customer_id, status` |
| | `coupons` | Promo codes with usage limits | Unique `code` |
| | `coupon_redemptions` | Coupon usage log per booking | Unique `(booking_id, coupon_id)` |
| | `referrals` | Customer referral program | Unique `referee_id` |
| | `coaching_academies` | Sports academy catalog | Indexed on `sport` |
| | `academy_enrollments` | Enrolled academy students | Indexed on `customer_id` |
| | `merchandise_products` | Merchandise catalog & stock (FTS) | FTS `search_vector` GIN index |
| | `merchandise_orders` | Customer gear orders | Indexed on `customer_id` |
| | `corporate_bookings` | B2B corporate group contracts | Indexed on `company_name` |
| **Module 11: Enterprise Additions** | `system_versions` | Database migration & deployment versioning | Unique `migration_name` |
| | `backup_metadata` | Database snapshot metadata records | Unique `backup_id` |
| | `system_health` | System metrics log (failed jobs, queue size, storage) | Indexed on `recorded_at` |
| | `api_keys` | Developer & B2B integration API keys | Unique `key_hash` |
| | `saved_cards` | Saved gateway payment card tokens | Unique `(customer_id, gateway_token)` |
| | `customer_wallets` | Customer digital wallet balance ledger | Unique `customer_id` |
| | `wallet_transactions` | Wallet transaction ledger (credits, debits) | Indexed on `wallet_id` |
| | `booking_waitlist` | Slot reservation waitlist | Auto-notifies on cancellation |
| | `booking_extensions` | Engine for extending active play by 30/60 mins | Indexed on `booking_id` |
| | `customer_achievements` | Gamified player badges & rewards | Unique `code` |
| | `customer_unlocked_achievements` | Player unlocked badges | Unique `(customer_id, achievement_id)` |
| | `ai_logs` | AI Assistant query & completion logs | Indexed on `customer_id` |
| | `support_tickets` | Customer service support ticket register | Unique `ticket_number` (TCK-YYYYMMDD-XXXX) |
| | `support_messages` | Support ticket conversation thread | Indexed on `ticket_id` |

---

## Primary Stored Procedures & Diagnostic RPCs

### Diagnostic Query RPC: `get_msc_os_platform_stats()`
Execute this RPC to inspect system scale and object counts:
```sql
SELECT public.get_msc_os_platform_stats();
```
**Returns**:
- `indexes_count`: Count of active indexes on public schema
- `triggers_count`: Count of database triggers
- `functions_count`: Count of stored procedures/routines
- `views_count`: Count of normal & materialized views
- `tables_count`: Count of public base tables
- `database_pretty_size`: Total database size formatted (e.g. "12 MB")

### Slot Extension RPC: `extend_booking(...)`
- **Parameters**: `p_booking_id`, `p_additional_minutes`
- **Behavior**: Verifies that no following booking overlaps with the extended interval, calculates duration and 18% GST rate, extends `end_time` on the booking, and logs a timeline event.

### Waitlist RPC: `join_booking_waitlist(...)`
- **Parameters**: `p_venue_id`, `p_start_time`, `p_end_time`
- **Behavior**: Registers customer on the slot waitlist. When a confirmed booking for that slot is cancelled, trigger `tr_waitlist_cancellation_notify` automatically queues WhatsApp notifications to active waitlisted players!
