-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 007_notifications.sql
-- Module: 7. Notifications Engine & Dead Letter Queue (DLQ)
-- Description: Transactional notifications outbox (Resend Email & Interakt WhatsApp),
--              async queue with retry backoff, Dead Letter Queue (DLQ) for failed messages,
--              sent history logs, booking confirmation triggers, and RLS policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.notification_channel AS ENUM (
        'email',
        'whatsapp',
        'push',
        'sms'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.notification_status AS ENUM (
        'pending',
        'processing',
        'sent',
        'failed',
        'cancelled',
        'dlq'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLES & DEAD LETTER QUEUE (DLQ)
-- ----------------------------------------------------------------------------

-- Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    channel public.notification_channel NOT NULL,
    subject_template TEXT NULL,
    body_template TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Async Outbox Notification Queue
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    channel public.notification_channel NOT NULL,
    template_id UUID NULL REFERENCES public.notification_templates(id) ON DELETE SET NULL ON UPDATE CASCADE,
    subject TEXT NULL,
    body TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status public.notification_status NOT NULL DEFAULT 'pending',
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_log TEXT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Dead Letter Queue (DLQ - Permanent store for un-deliverable notifications)
CREATE TABLE IF NOT EXISTS public.notification_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_queue_id UUID NULL,
    recipient VARCHAR(255) NOT NULL,
    channel public.notification_channel NOT NULL,
    template_code VARCHAR(100) NULL,
    subject TEXT NULL,
    body TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    final_error_log TEXT NOT NULL,
    total_retries INTEGER NOT NULL,
    moved_to_dlq_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Gateway Sent Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NULL REFERENCES public.notification_queue(id) ON DELETE SET NULL ON UPDATE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    channel public.notification_channel NOT NULL,
    template_code VARCHAR(100) NULL,
    gateway_provider VARCHAR(50) NOT NULL,
    gateway_message_id VARCHAR(150) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'delivered',
    response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status, scheduled_at) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON public.notification_queue(recipient);
CREATE INDEX IF NOT EXISTS idx_notification_dlq_recipient ON public.notification_dlq(recipient, moved_to_dlq_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_queue ON public.notification_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON public.notification_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. FUNCTIONS & RPCs
-- ----------------------------------------------------------------------------

-- Function: Enqueue Notification Item
CREATE OR REPLACE FUNCTION public.enqueue_notification(
    p_recipient VARCHAR,
    p_channel public.notification_channel,
    p_template_code VARCHAR,
    p_payload JSONB DEFAULT '{}'::jsonb,
    p_subject TEXT DEFAULT NULL,
    p_body TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_template public.notification_templates%ROWTYPE;
    v_final_subject TEXT;
    v_final_body TEXT;
    v_queue_id UUID;
BEGIN
    IF p_template_code IS NOT NULL THEN
        SELECT * INTO v_template FROM public.notification_templates WHERE code = p_template_code AND is_active = TRUE AND deleted_at IS NULL;
        IF v_template.id IS NOT NULL THEN
            v_final_subject := COALESCE(p_subject, v_template.subject_template);
            v_final_body := COALESCE(p_body, v_template.body_template);
        END IF;
    END IF;

    v_final_subject := COALESCE(v_final_subject, p_subject, 'Maqbool Sports Complex Update');
    v_final_body := COALESCE(v_final_body, p_body, 'Notification from MSC OS.');

    INSERT INTO public.notification_queue (
        recipient,
        channel,
        template_id,
        subject,
        body,
        payload
    ) VALUES (
        p_recipient,
        p_channel,
        v_template.id,
        v_final_subject,
        v_final_body,
        p_payload
    )
    RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Move Exhausted Retries to Dead Letter Queue (DLQ)
CREATE OR REPLACE FUNCTION public.move_notification_to_dlq(
    p_queue_id UUID,
    p_error_reason TEXT
)
RETURNS VOID AS $$
DECLARE
    v_item public.notification_queue%ROWTYPE;
BEGIN
    SELECT * INTO v_item FROM public.notification_queue WHERE id = p_queue_id;
    IF v_item.id IS NULL THEN RETURN; END IF;

    INSERT INTO public.notification_dlq (
        original_queue_id,
        recipient,
        channel,
        subject,
        body,
        payload,
        final_error_log,
        total_retries
    ) VALUES (
        v_item.id,
        v_item.recipient,
        v_item.channel,
        v_item.subject,
        v_item.body,
        v_item.payload,
        p_error_reason,
        v_item.retry_count
    );

    UPDATE public.notification_queue
    SET status = 'dlq', error_log = p_error_reason, updated_at = NOW()
    WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger Function: Auto-Queue Notification on Booking Confirmation
CREATE OR REPLACE FUNCTION public.tr_on_booking_created_queue_notif()
RETURNS TRIGGER AS $$
DECLARE
    v_cust_phone TEXT;
    v_cust_email TEXT;
    v_cust_name TEXT;
    v_venue_name TEXT;
BEGIN
    SELECT p.phone, p.email, p.full_name 
    INTO v_cust_phone, v_cust_email, v_cust_name
    FROM public.user_profiles p WHERE p.id = NEW.customer_id;

    SELECT name INTO v_venue_name FROM public.venues WHERE id = NEW.venue_id;

    IF v_cust_phone IS NOT NULL THEN
        PERFORM public.enqueue_notification(
            v_cust_phone,
            'whatsapp'::public.notification_channel,
            'BOOKING_CONFIRMATION_WHATSAPP',
            jsonb_build_object(
                'booking_number', NEW.booking_number,
                'customer_name', v_cust_name,
                'venue_name', v_venue_name,
                'start_time', NEW.start_time,
                'end_time', NEW.end_time,
                'total_amount', NEW.total_amount
            )
        );
    END IF;

    IF v_cust_email IS NOT NULL THEN
        PERFORM public.enqueue_notification(
            v_cust_email,
            'email'::public.notification_channel,
            'BOOKING_CONFIRMATION_EMAIL',
            jsonb_build_object(
                'booking_number', NEW.booking_number,
                'customer_name', v_cust_name,
                'venue_name', v_venue_name,
                'start_time', NEW.start_time,
                'end_time', NEW.end_time,
                'total_amount', NEW.total_amount
            ),
            'Booking Confirmation - ' || NEW.booking_number
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_booking_notif_queue ON public.bookings;
CREATE TRIGGER tr_booking_notif_queue
    AFTER INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.tr_on_booking_created_queue_notif();

-- ----------------------------------------------------------------------------
-- 5. TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER tr_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_notification_queue_updated_at ON public.notification_queue;
CREATE TRIGGER tr_notification_queue_updated_at BEFORE UPDATE ON public.notification_queue FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_templates_staff_only" ON public.notification_templates;
CREATE POLICY "notification_templates_staff_only" ON public.notification_templates FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "notification_queue_staff_only" ON public.notification_queue;
CREATE POLICY "notification_queue_staff_only" ON public.notification_queue FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "notification_dlq_staff_only" ON public.notification_dlq;
CREATE POLICY "notification_dlq_staff_only" ON public.notification_dlq FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS "notification_logs_staff_only" ON public.notification_logs;
CREATE POLICY "notification_logs_staff_only" ON public.notification_logs FOR ALL USING (public.is_staff());

-- ----------------------------------------------------------------------------
-- 7. GRANTS & REALTIME
-- ----------------------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.notification_templates TO authenticated;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_queue;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 8. DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.notification_queue IS 'Asynchronous outbox queue for transactional WhatsApp & Email messages.';
COMMENT ON TABLE public.notification_dlq IS 'Dead Letter Queue (DLQ) retaining un-deliverable notifications after max retries.';
COMMENT ON TABLE public.notification_logs IS 'Sent logs containing message IDs from Resend / Interakt providers.';
COMMENT ON FUNCTION public.enqueue_notification IS 'Queues an outbound notification item for worker execution.';
COMMENT ON FUNCTION public.move_notification_to_dlq IS 'Moves failed notification to Dead Letter Queue upon retry exhaustion.';

-- ============================================================================
-- Migration Footer: 007_notifications.sql upgraded & complete
-- ============================================================================
