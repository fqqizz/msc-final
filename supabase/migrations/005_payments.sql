-- ============================================================================
-- MSC OS (Maqbool Sports Complex Operating System)
-- Migration: 005_payments.sql
-- Module: 5. Payments & Financial Ledger
-- Description: Razorpay integration, gateway attempt logging, full JSONB response retention,
--              partial/full payment records, auto invoice generation (INV-YYYY-XXXX),
--              refund logs, timeline integration, domain events, RLS, storage setup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.payment_gateway AS ENUM (
        'razorpay',
        'cash',
        'pos_terminal',
        'bank_transfer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method_type AS ENUM (
        'upi',
        'card',
        'netbanking',
        'wallet',
        'cash',
        'pos'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status_type AS ENUM (
        'pending',
        'authorized',
        'captured',
        'failed',
        'refunded',
        'partially_refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. SEQUENCES & INVOICE NUMBER GENERATOR
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1001 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS VARCHAR(30) AS $$
DECLARE
    v_year_str VARCHAR(4);
    v_seq_num BIGINT;
BEGIN
    v_year_str := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY');
    v_seq_num := NEXTVAL('public.invoice_number_seq');
    RETURN 'INV-' || v_year_str || '-' || LPAD(v_seq_num::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 3. TABLES
-- ----------------------------------------------------------------------------

-- Primary Payment Ledger
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    gateway public.payment_gateway NOT NULL DEFAULT 'razorpay',
    razorpay_order_id VARCHAR(100) NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(255) NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status public.payment_status_type NOT NULL DEFAULT 'pending',
    payment_method public.payment_method_type NOT NULL DEFAULT 'upi',
    raw_response JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full Razorpay API Payload Retention
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Gateway Payment Attempt Logs (Every API request/callback payload)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    razorpay_order_id VARCHAR(100) NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    error_code VARCHAR(100) NULL,
    error_description TEXT NULL,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full Request Body
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refund Records
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    razorpay_refund_id VARCHAR(100) NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    processed_by UUID NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tax Invoices & Receipts
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(30) UNIQUE NOT NULL DEFAULT public.generate_invoice_number(),
    booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    pdf_url TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'paid',
    
    -- Audit & Soft Delete
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    deleted_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- 4. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON public.payments(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment ON public.payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_attempts_booking ON public.payment_attempts(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- ----------------------------------------------------------------------------
-- 5. FUNCTIONS & RPCs
-- ----------------------------------------------------------------------------

-- RPC: Record Payment Attempt Log
CREATE OR REPLACE FUNCTION public.record_payment_attempt(
    p_booking_id UUID,
    p_razorpay_order_id VARCHAR,
    p_amount NUMERIC(10,2),
    p_status VARCHAR,
    p_error_code VARCHAR DEFAULT NULL,
    p_error_desc TEXT DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_attempt_id UUID;
BEGIN
    INSERT INTO public.payment_attempts (
        booking_id,
        razorpay_order_id,
        amount,
        status,
        error_code,
        error_description,
        raw_payload
    ) VALUES (
        p_booking_id,
        p_razorpay_order_id,
        p_amount,
        p_status,
        p_error_code,
        p_error_desc,
        p_payload
    )
    RETURNING id INTO v_attempt_id;

    IF p_status = 'attempt_failed' THEN
        PERFORM public.emit_domain_event('PaymentFailed', 'booking', p_booking_id, jsonb_build_object('order_id', p_razorpay_order_id, 'error', p_error_desc));
    END IF;

    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Process Successful Razorpay Payment Callback / Webhook
CREATE OR REPLACE FUNCTION public.process_payment_callback(
    p_booking_id UUID,
    p_razorpay_order_id VARCHAR,
    p_razorpay_payment_id VARCHAR,
    p_razorpay_signature VARCHAR,
    p_payment_method public.payment_method_type,
    p_amount NUMERIC(10,2),
    p_raw_response JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    payment_id UUID,
    invoice_id UUID,
    invoice_number VARCHAR,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_booking public.bookings%ROWTYPE;
    v_payment_id UUID;
    v_invoice_id UUID;
    v_inv_num VARCHAR;
BEGIN
    -- Retrieve booking
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
    IF v_booking.id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::VARCHAR, FALSE, 'Booking not found'::TEXT;
        RETURN;
    END IF;

    -- Upsert Payment Ledger Record
    INSERT INTO public.payments (
        booking_id,
        customer_id,
        gateway,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
        status,
        payment_method,
        raw_response,
        created_by
    ) VALUES (
        p_booking_id,
        v_booking.customer_id,
        'razorpay',
        p_razorpay_order_id,
        p_razorpay_payment_id,
        p_razorpay_signature,
        p_amount,
        'captured',
        p_payment_method,
        p_raw_response,
        auth.uid()
    )
    RETURNING id INTO v_payment_id;

    -- Update Booking Status & Amount Paid
    UPDATE public.bookings
    SET 
        payment_status = CASE 
            WHEN (amount_paid + p_amount) >= total_amount THEN 'paid'::public.booking_payment_status 
            ELSE 'partially_paid'::public.booking_payment_status 
        END,
        amount_paid = amount_paid + p_amount,
        booking_status = 'confirmed',
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Auto-Generate Tax Invoice
    INSERT INTO public.invoices (
        booking_id,
        customer_id,
        subtotal,
        tax_amount,
        total_amount,
        status,
        created_by
    ) VALUES (
        p_booking_id,
        v_booking.customer_id,
        v_booking.base_amount + v_booking.extra_charges - v_booking.discount_amount,
        v_booking.tax_amount,
        v_booking.total_amount,
        'paid',
        auth.uid()
    )
    ON CONFLICT (booking_id) DO UPDATE SET updated_at = NOW()
    RETURNING id, public.invoices.invoice_number INTO v_invoice_id, v_inv_num;

    -- Record Timeline Event
    INSERT INTO public.booking_timeline (booking_id, event_type, description, actor_id, metadata)
    VALUES (p_booking_id, 'PaymentCaptured', 'Payment ₹' || p_amount || ' captured via ' || p_payment_method, auth.uid(), jsonb_build_object('invoice_number', v_inv_num, 'razorpay_payment_id', p_razorpay_payment_id));

    -- Emit Domain Event
    PERFORM public.emit_domain_event('PaymentCaptured', 'payment', v_payment_id, jsonb_build_object('booking_id', p_booking_id, 'amount', p_amount, 'invoice_number', v_inv_num));

    RETURN QUERY SELECT v_payment_id, v_invoice_id, v_inv_num, TRUE, 'Payment processed and invoice generated successfully.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_payments_updated_at ON public.payments;
CREATE TRIGGER tr_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_refunds_updated_at ON public.refunds;
CREATE TRIGGER tr_refunds_updated_at BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_invoices_updated_at ON public.invoices;
CREATE TRIGGER tr_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.msc_update_timestamp();

DROP TRIGGER IF EXISTS tr_audit_payments ON public.payments;
CREATE TRIGGER tr_audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.msc_audit_trigger();

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Payments Policies
DROP POLICY IF EXISTS "payments_select_own_or_staff" ON public.payments;
CREATE POLICY "payments_select_own_or_staff" ON public.payments FOR SELECT USING ((customer_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

DROP POLICY IF EXISTS "payments_staff_modify" ON public.payments;
CREATE POLICY "payments_staff_modify" ON public.payments FOR ALL USING (public.is_staff());

-- Payment Attempts Policies
DROP POLICY IF EXISTS "payment_attempts_staff_only" ON public.payment_attempts;
CREATE POLICY "payment_attempts_staff_only" ON public.payment_attempts FOR ALL USING (public.is_staff());

-- Refunds Policies
DROP POLICY IF EXISTS "refunds_select_own_or_staff" ON public.refunds;
CREATE POLICY "refunds_select_own_or_staff" ON public.refunds FOR SELECT USING (EXISTS (SELECT 1 FROM public.payments WHERE payments.id = refunds.payment_id AND payments.customer_id = auth.uid()) OR public.is_staff());

DROP POLICY IF EXISTS "refunds_staff_modify" ON public.refunds;
CREATE POLICY "refunds_staff_modify" ON public.refunds FOR ALL USING (public.is_staff());

-- Invoices Policies
DROP POLICY IF EXISTS "invoices_select_own_or_staff" ON public.invoices;
CREATE POLICY "invoices_select_own_or_staff" ON public.invoices FOR SELECT USING ((customer_id = auth.uid() AND deleted_at IS NULL) OR public.is_staff());

-- ----------------------------------------------------------------------------
-- 8. GRANTS, STORAGE BUCKETS & REALTIME
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;
GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- Storage Buckets Setup: receipts, booking-receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('receipts', 'receipts', true, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('booking-receipts', 'booking-receipts', true, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Receipts
DROP POLICY IF EXISTS "Read Receipts" ON storage.objects;
CREATE POLICY "Read Receipts" ON storage.objects FOR SELECT USING (bucket_id IN ('receipts', 'booking-receipts'));

DROP POLICY IF EXISTS "Staff Upload Receipts" ON storage.objects;
CREATE POLICY "Staff Upload Receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('receipts', 'booking-receipts') AND (auth.role() = 'service_role' OR public.is_staff()));

-- ----------------------------------------------------------------------------
-- 9. DOCUMENTATION COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.payments IS 'Main financial ledger for online Razorpay and reception cash transactions retaining raw JSON responses.';
COMMENT ON TABLE public.invoices IS 'Tax invoices generated upon payment completion with GST breakdown.';
COMMENT ON FUNCTION public.process_payment_callback IS 'Webhook/Callback handler that verifies Razorpay signatures, updates booking state, and emits domain events.';

-- ============================================================================
-- Migration Footer: 005_payments.sql upgraded & complete
-- ============================================================================
