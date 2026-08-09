import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRefundNotificationEmail, sendAdminOperationalAlert } from '@/lib/email/resend'
import { isCancellationEligible } from '@/data/policies'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookingId, reason } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId parameter' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Fetch booking details
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*, venues(name), user_profiles(email, full_name)')
      .eq('id', bookingId)
      .maybeSingle()

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'Booking record not found' }, { status: 404 })
    }

    if (booking.booking_status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    // 2. Strict > 5-Hour Cancellation Window Enforcement
    const { isEligible: isRefundable, hoursRemaining } = isCancellationEligible(booking.start_time, new Date())
    const refundAmount = isRefundable ? (booking.amount_paid || booking.total_amount) : 0

    // 3. Update Booking & Payment Status in Supabase
    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        payment_status: isRefundable ? 'refund_pending' : 'cancelled_non_refundable',
        notes: `${booking.notes || ''} | Cancelled by user/admin. Reason: ${reason || 'Customer request'}`
      })
      .eq('id', bookingId)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // 4. Record Audit Log
    await supabase.from('audit_logs').insert({
      action: 'BOOKING_CANCELLED',
      entity_type: 'booking',
      entity_id: bookingId,
      details: {
        booking_number: booking.booking_number,
        hours_remaining: hoursRemaining.toFixed(1),
        is_refundable: isRefundable,
        refund_amount: refundAmount,
        reason: reason || 'Customer request',
      }
    })

    const customerEmail = booking.user_profiles?.email || 'info@maqboolsports.in'

    // 5. Send Resend Notifications
    if (isRefundable) {
      await sendRefundNotificationEmail({
        email: customerEmail,
        bookingNumber: booking.booking_number,
        amount: refundAmount,
        status: 'requested',
      })
    }

    await sendAdminOperationalAlert({
      title: `Booking Cancelled — #${booking.booking_number}`,
      details: `Venue: ${booking.venues?.name} | Refund Eligible: ${isRefundable ? `Yes (₹${refundAmount})` : 'No (< 5 hrs remaining)'}`,
      severity: isRefundable ? 'INFO' : 'WARNING',
    })

    return NextResponse.json({
      success: true,
      bookingNumber: booking.booking_number,
      isRefundable,
      refundAmount,
      message: isRefundable
        ? `Booking cancelled. Full refund of ₹${refundAmount} initiated.`
        : 'Booking cancelled. Cancellation was made less than 5 hours prior to session start, non-refundable per MSC policy.',
    })
  } catch (err: any) {
    console.error('Error handling booking cancellation:', err)
    return NextResponse.json({ error: err.message || 'Failed to cancel booking' }, { status: 500 })
  }
}
