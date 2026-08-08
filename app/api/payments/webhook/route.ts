import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmationEmail, sendAdminOperationalAlert } from '@/lib/email/resend'

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // Verify Webhook Signature if secret exists
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyText)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('Invalid Razorpay webhook signature!')
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
      }
    }

    const payload = JSON.parse(bodyText)
    const event = payload.event
    const entity = payload.payload?.payment?.entity || payload.payload?.refund?.entity
    const notes = entity?.notes || {}
    const bookingId = notes.booking_id

    const supabase = createAdminClient()

    // 1. PAYMENT CAPTURED EVENT
    if (event === 'payment.captured') {
      const razorpayPaymentId = entity.id
      const razorpayOrderId = entity.order_id
      const amountPaid = entity.amount / 100

      // Idempotency check: verify if payment was already recorded
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('razorpay_payment_id', razorpayPaymentId)
        .maybeSingle()

      if (existingPayment && existingPayment.status === 'captured') {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 })
      }

      if (bookingId) {
        // Update booking status to confirmed & paid
        const { data: booking } = await supabase
          .from('bookings')
          .select('*, venues(name)')
          .eq('id', bookingId)
          .single()

        if (booking) {
          await supabase
            .from('bookings')
            .update({
              booking_status: 'confirmed',
              payment_status: 'paid',
              amount_paid: amountPaid,
            })
            .eq('id', bookingId)

          // Record payment entry
          await supabase.from('payments').insert({
            booking_id: bookingId,
            customer_id: booking.customer_id,
            gateway: 'razorpay',
            razorpay_payment_id: razorpayPaymentId,
            razorpay_order_id: razorpayOrderId,
            amount: amountPaid,
            currency: entity.currency || 'INR',
            status: 'captured',
            payment_method: entity.method || 'online',
            raw_response: payload,
          })

          // Record persistent Admin Notification
          await supabase.from('audit_logs').insert({
            action: 'PAYMENT_CAPTURED',
            entity_type: 'booking',
            entity_id: bookingId,
            details: {
              event: 'payment.captured',
              booking_number: booking.booking_number,
              amount: amountPaid,
              severity: 'INFO',
            },
          })

          // Notify Admin via Email Outbox
          await sendAdminOperationalAlert({
            title: `New Booking Confirmed — #${booking.booking_number}`,
            details: `Venue: ${booking.venues?.name || 'MSC Turf'} | Amount: ₹${amountPaid} | Payment ID: ${razorpayPaymentId}`,
            severity: 'INFO',
          })
        }
      }
    }

    // 2. PAYMENT FAILED EVENT
    else if (event === 'payment.failed') {
      const razorpayPaymentId = entity.id
      const failureReason = entity.error_description || 'Payment Failed'

      if (bookingId) {
        await supabase
          .from('bookings')
          .update({ payment_status: 'failed' })
          .eq('id', bookingId)

        await supabase.from('audit_logs').insert({
          action: 'PAYMENT_FAILED',
          entity_type: 'booking',
          entity_id: bookingId,
          details: {
            reason: failureReason,
            severity: 'WARNING',
          },
        })

        await sendAdminOperationalAlert({
          title: `Payment Failed for Booking`,
          details: `Booking ID: ${bookingId} | Reason: ${failureReason}`,
          severity: 'WARNING',
        })
      }
    }

    // 3. REFUND PROCESSED EVENT
    else if (event === 'refund.processed') {
      const refundAmount = entity.amount / 100
      if (bookingId) {
        await supabase
          .from('bookings')
          .update({ payment_status: 'refunded', booking_status: 'cancelled' })
          .eq('id', bookingId)

        await sendAdminOperationalAlert({
          title: `Refund Processed Successfully`,
          details: `Booking ID: ${bookingId} | Refunded Amount: ₹${refundAmount}`,
          severity: 'INFO',
        })
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (err: any) {
    console.error('Error handling Razorpay webhook:', err)
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 })
  }
}
