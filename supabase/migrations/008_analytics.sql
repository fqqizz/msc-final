-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 008_analytics.sql
-- Module: 8. Analytics, Materialized Reporting & Dashboard Performance Engine
-- Description: Materialized views for daily revenue, peak hour occupancy heatmaps, 
--              customer retention & repeat rate metrics, concurrent view refresh RPCs,
--              and executive dashboard metrics.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MATERIALIZED VIEWS
-- ----------------------------------------------------------------------------

-- Daily Revenue & Facility Breakdown Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_daily_revenue_analytics AS
SELECT 
    b.start_time::DATE AS report_date,
    v.id AS venue_id,
    v.name AS venue_name,
    v.sport_type,
    COUNT(b.id) AS total_bookings,
    COUNT(CASE WHEN b.booking_status = 'completed' THEN 1 END) AS completed_bookings,
    COUNT(CASE WHEN b.booking_status = 'cancelled' THEN 1 END) AS cancelled_bookings,
    COALESCE(SUM(CASE WHEN b.payment_status IN ('paid', 'partially_paid') THEN b.amount_paid ELSE 0 END), 0.00) AS gross_revenue,
    COALESCE(SUM(CASE WHEN b.booking_status = 'cancelled' THEN b.total_amount ELSE 0 END), 0.00) AS lost_revenue_cancellations,
    COALESCE(ROUND(AVG(CASE WHEN b.payment_status = 'paid' THEN b.total_amount END)::NUMERIC, 2), 0.00) AS avg_booking_value
FROM public.bookings b
JOIN public.venues v ON b.venue_id = v.id
WHERE b.deleted_at IS NULL AND v.deleted_at IS NULL
GROUP BY b.start_time::DATE, v.id, v.name, v.sport_type;

-- Unique Index for Concurrent Refresh
CREATE UNIQUE INDEX IF NOT EXISTS uq_idx_mv_daily_revenue ON public.mv_daily_revenue_analytics (report_date, venue_id);

-- Hourly Occupancy Heatmap Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_hourly_occupancy_heatmap AS
SELECT 
    v.id AS venue_id,
    v.name AS venue_name,
    EXTRACT(DOW FROM b.start_time AT TIME ZONE 'UTC')::INTEGER AS day_of_week,
    EXTRACT(HOUR FROM b.start_time AT TIME ZONE 'UTC')::INTEGER AS hour_of_day,
    COUNT(b.id) AS total_slots_booked,
    COALESCE(SUM(b.total_amount), 0.00) AS total_revenue_generated
FROM public.bookings b
JOIN public.venues v ON b.venue_id = v.id
WHERE b.booking_status IN ('confirmed', 'completed') AND b.deleted_at IS NULL AND v.deleted_at IS NULL
GROUP BY v.id, v.name, EXTRACT(DOW FROM b.start_time AT TIME ZONE 'UTC'), EXTRACT(HOUR FROM b.start_time AT TIME ZONE 'UTC');

CREATE UNIQUE INDEX IF NOT EXISTS uq_idx_mv_hourly_heatmap ON public.mv_hourly_occupancy_heatmap (venue_id, day_of_week, hour_of_day);

-- Customer Retention & Repeat Booking Rates Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_customer_retention_metrics AS
WITH monthly_customer_bookings AS (
    SELECT 
        DATE_TRUNC('month', b.start_time)::DATE AS month_start,
        b.customer_id,
        COUNT(b.id) AS booking_count
    FROM public.bookings b
    WHERE b.booking_status IN ('confirmed', 'completed') AND b.deleted_at IS NULL
    GROUP BY DATE_TRUNC('month', b.start_time)::DATE, b.customer_id
)
SELECT 
    mcb.month_start,
    COUNT(DISTINCT mcb.customer_id) AS total_active_customers,
    COUNT(DISTINCT CASE WHEN c.created_at >= mcb.month_start AND c.created_at < mcb.month_start + INTERVAL '1 month' THEN mcb.customer_id END) AS new_customers,
    COUNT(DISTINCT CASE WHEN mcb.booking_count > 1 OR c.created_at < mcb.month_start THEN mcb.customer_id END) AS returning_customers,
    ROUND(
        (COUNT(DISTINCT CASE WHEN mcb.booking_count > 1 OR c.created_at < mcb.month_start THEN mcb.customer_id END)::NUMERIC / 
         NULLIF(COUNT(DISTINCT mcb.customer_id), 0)::NUMERIC) * 100.0, 2
    ) AS repeat_customer_rate_pct
FROM monthly_customer_bookings mcb
JOIN public.customers c ON mcb.customer_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY mcb.month_start;

CREATE UNIQUE INDEX IF NOT EXISTS uq_idx_mv_customer_retention ON public.mv_customer_retention_metrics (month_start);

-- ----------------------------------------------------------------------------
-- 2. FUNCTIONS & RPCs
-- ----------------------------------------------------------------------------

-- RPC: Refresh All Analytics Materialized Views (Triggered by Cron Edge Function)
CREATE OR REPLACE FUNCTION public.refresh_analytics_materialized_views()
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_staff() AND current_user <> 'service_role' THEN
        RAISE EXCEPTION 'Access Denied: Staff or service role required.';
    END IF;

    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_revenue_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_hourly_occupancy_heatmap;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_customer_retention_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Get Revenue Report for Date Range
CREATE OR REPLACE FUNCTION public.get_revenue_report(
    p_start_date DATE,
    p_end_date DATE,
    p_venue_id UUID DEFAULT NULL
)
RETURNS TABLE (
    report_date DATE,
    venue_name VARCHAR,
    total_bookings BIGINT,
    completed_bookings BIGINT,
    cancelled_bookings BIGINT,
    gross_revenue NUMERIC(12,2),
    lost_revenue NUMERIC(12,2)
) AS $$
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        r.report_date,
        r.venue_name,
        r.total_bookings,
        r.completed_bookings,
        r.cancelled_bookings,
        r.gross_revenue,
        r.lost_revenue_cancellations AS lost_revenue
    FROM public.mv_daily_revenue_analytics r
    WHERE r.report_date BETWEEN p_start_date AND p_end_date
      AND (p_venue_id IS NULL OR r.venue_id = p_venue_id)
    ORDER BY r.report_date DESC, r.venue_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- RPC: Get Executive Dashboard KPI Metrics Overview
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB AS $$
DECLARE
    v_total_revenue NUMERIC(12,2);
    v_total_bookings INT;
    v_active_customers INT;
    v_cancellation_rate NUMERIC(5,2);
    v_top_venue TEXT;
    v_result JSONB;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    -- Total lifetime gross revenue
    SELECT COALESCE(SUM(amount_paid), 0.00) INTO v_total_revenue
    FROM public.bookings WHERE deleted_at IS NULL;

    -- Total bookings count
    SELECT COUNT(*) INTO v_total_bookings
    FROM public.bookings WHERE deleted_at IS NULL;

    -- Active customer count
    SELECT COUNT(*) INTO v_active_customers
    FROM public.customers WHERE deleted_at IS NULL AND is_blacklisted = FALSE;

    -- Cancellation Rate Percentage
    SELECT ROUND(
        (COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(*), 0)::NUMERIC) * 100.0, 2
    ) INTO v_cancellation_rate
    FROM public.bookings WHERE deleted_at IS NULL;

    -- Top Revenue Venue Name
    SELECT v.name INTO v_top_venue
    FROM public.bookings b
    JOIN public.venues v ON b.venue_id = v.id
    WHERE b.deleted_at IS NULL AND v.deleted_at IS NULL
    GROUP BY v.name
    ORDER BY SUM(b.amount_paid) DESC
    LIMIT 1;

    v_result := jsonb_build_object(
        'total_revenue', v_total_revenue,
        'total_bookings', v_total_bookings,
        'active_customers', v_active_customers,
        'cancellation_rate_pct', COALESCE(v_cancellation_rate, 0.00),
        'top_performing_venue', COALESCE(v_top_venue, 'None')
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 3. PERMISSIONS & GRANTS
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.mv_daily_revenue_analytics TO authenticated;
GRANT SELECT ON public.mv_hourly_occupancy_heatmap TO authenticated;
GRANT SELECT ON public.mv_customer_retention_metrics TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ----------------------------------------------------------------------------
-- 4. DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON MATERIALIZED VIEW public.mv_daily_revenue_analytics IS 'Aggregated daily revenue and completed vs cancelled booking metrics.';
COMMENT ON MATERIALIZED VIEW public.mv_hourly_occupancy_heatmap IS 'Occupancy matrix by day of week and hour for facility heatmaps.';
COMMENT ON MATERIALIZED VIEW public.mv_customer_retention_metrics IS 'Monthly customer retention and repeat player metrics.';
COMMENT ON FUNCTION public.refresh_analytics_materialized_views IS 'Concurrently refreshes analytics materialized views.';

-- ============================================================================
-- Migration Footer: 008_analytics.sql upgraded & complete
-- ============================================================================
