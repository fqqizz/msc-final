import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const BookingSchema = z.object({
  venue_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(z.object({
    hour: z.number().int().min(0).max(23),
    label: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    price: z.number().nonnegative(),
  })).min(1),
  customer_name: z.string().min(2).max(100),
  customer_phone: z.string().min(10).max(15),
  customer_email: z.string().email().optional().or(z.literal('')),
  payment_type: z.enum(['full', 'advance']),
  notes: z.string().optional(),
})

function generateBookingNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `MSC-${date}-${suffix}`
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const data = parsed.data
  const supabase = createServiceClient()

  // 1. Verify venue exists and is active
  const { data: venue, error: venueErr } = await supabase
    .from('venues')
    .select('id, name, slug, status')
    .eq('id', data.venue_id)
    .is('deleted_at', null)
    .single()

  if (venueErr || !venue || venue.status !== 'active') {
    return NextResponse.json({ error: 'Venue not found or unavailable' }, { status: 404 })
  }

  // 2. Double-check slot availability (prevent race conditions)
  const dayStart = `${data.date}T00:00:00`
  const dayEnd = `${data.date}T23:59:59`

  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id, start_time, end_time')
    .eq('venue_id', data.venue_id)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .in('booking_status', ['confirmed', 'checked_in', 'pending'])
    .is('deleted_at', null)

  const conflictHours = new Set<number>()
  ;(conflicts ?? []).forEach(b => {
    const startH = new Date(b.start_time).getHours()
    const endH = new Date(b.end_time).getHours()
    for (let h = startH; h < endH; h++) conflictHours.add(h)
  })

  const conflictingSlot = data.slots.find(s => conflictHours.has(s.hour))
  if (conflictingSlot) {
    return NextResponse.json({
      error: `Slot ${conflictingSlot.label} is no longer available. Please refresh and try again.`
    }, { status: 409 })
  }

  // 3. Find or create customer profile
  let customerId: string

  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('phone', data.customer_phone)
    .is('deleted_at', null)
    .single()

  if (existingProfile) {
    customerId = existingProfile.id
  } else {
    // Create a new guest user profile
    const { data: newProfile, error: profileErr } = await supabase
      .from('user_profiles')
      .insert({
        full_name: data.customer_name,
        phone: data.customer_phone,
        email: data.customer_email || null,
        role: 'customer',
        status: 'active',
        is_guest: true,
        is_phone_verified: false,
        is_email_verified: false,
        metadata: {},
      })
      .select('id')
      .single()

    if (profileErr || !newProfile) {
      return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 })
    }
    customerId = newProfile.id

    // Also create a customer record
    await supabase.from('customers').insert({
      id: customerId,
      tier: 'new',
      hours_played: 0,
      total_bookings: 0,
      total_spend: 0,
      is_blacklisted: false,
      tags: [],
    })
  }

  // 4. Compute amounts
  const totalAmount = data.slots.reduce((sum, s) => sum + s.price, 0)
  const advanceAmount = Math.ceil(totalAmount * 0.5)
  const amountPaid = data.payment_type === 'full' ? totalAmount : advanceAmount

  // 5. Build start/end times (first slot start → last slot end)
  const sortedSlots = [...data.slots].sort((a, b) => a.hour - b.hour)
  const startTime = sortedSlots[0].start_time
  const endTime = sortedSlots[sortedSlots.length - 1].end_time
  const durationHours = sortedSlots.length

  // 6. Insert booking
  const bookingNumber = generateBookingNumber()

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert({
      booking_number: bookingNumber,
      customer_id: customerId,
      venue_id: data.venue_id,
      start_time: startTime,
      end_time: endTime,
      duration_hours: durationHours,
      booking_status: 'confirmed',
      payment_status: data.payment_type === 'full' ? 'paid' : 'partially_paid',
      booking_source: 'online_customer',
      base_amount: totalAmount,
      extra_charges: 0,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      notes: data.notes || null,
      metadata: {
        slot_labels: sortedSlots.map(s => s.label),
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || null,
        payment_type: data.payment_type,
      },
    })
    .select('id, booking_number, start_time, end_time, total_amount, amount_paid, payment_status, booking_status, metadata')
    .single()

  if (bookingErr || !booking) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }

  // 7. Log in booking_timeline
  await supabase.from('booking_timeline').insert({
    booking_id: booking.id,
    event_type: 'booking_created',
    description: `Booking created online by ${data.customer_name}`,
    metadata: { source: 'web', payment_type: data.payment_type },
  })

  // 8. Send confirmation email via Resend
  if (data.customer_email) {
    try {
      const slotLabels = sortedSlots.map(s => s.label).join(', ')
      const bookingDate = new Date(data.date).toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })

      await resend.emails.send({
        from: 'Maqbool Sports Complex <bookings@maqboolsports.com>',
        to: data.customer_email,
        subject: `Booking Confirmed – ${bookingNumber}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f8fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#1a4731;padding:32px 40px;text-align:center;">
      <h1 style="color:#2BA84A;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Maqbool Sports Complex</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Baramulla, Kashmir</p>
    </div>

    <!-- Confirmation Banner -->
    <div style="background:#E8F5EC;padding:24px 40px;border-bottom:1px solid #d4edda;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;background:#2BA84A;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:white;font-size:20px;">✓</span>
        </div>
        <div>
          <p style="margin:0;font-size:18px;font-weight:700;color:#146B3A;">Booking Confirmed!</p>
          <p style="margin:4px 0 0;font-size:14px;color:#2BA84A;">Your slot has been reserved successfully.</p>
        </div>
      </div>
    </div>

    <!-- Booking Details -->
    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 20px;font-size:16px;font-weight:600;color:#0A0A0C;text-transform:uppercase;letter-spacing:0.5px;">Booking Details</h2>
      
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;color:#666;font-size:14px;width:45%;border-bottom:1px solid #f0f0f0;">Booking Reference</td>
          <td style="padding:10px 0;font-weight:700;font-size:14px;color:#0A0A0C;border-bottom:1px solid #f0f0f0;">${bookingNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">Venue</td>
          <td style="padding:10px 0;font-weight:600;font-size:14px;color:#0A0A0C;border-bottom:1px solid #f0f0f0;">${venue.name}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">Date</td>
          <td style="padding:10px 0;font-weight:600;font-size:14px;color:#0A0A0C;border-bottom:1px solid #f0f0f0;">${bookingDate}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">Time Slots</td>
          <td style="padding:10px 0;font-weight:600;font-size:14px;color:#0A0A0C;border-bottom:1px solid #f0f0f0;">${slotLabels}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">Duration</td>
          <td style="padding:10px 0;font-weight:600;font-size:14px;color:#0A0A0C;border-bottom:1px solid #f0f0f0;">${durationHours} hour${durationHours > 1 ? 's' : ''}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#666;font-size:14px;border-bottom:1px solid #f0f0f0;">Total Amount</td>
          <td style="padding:10px 0;font-weight:600;font-size:14px;color:#0A0A0C;border-bottom:1px solid #f0f0f0;">₹${totalAmount.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#666;font-size:14px;">Amount Paid</td>
          <td style="padding:10px 0;font-weight:700;font-size:16px;color:#2BA84A;">₹${amountPaid.toLocaleString('en-IN')} ${data.payment_type === 'advance' ? '(Advance)' : '(Full)'}</td>
        </tr>
        ${data.payment_type === 'advance' ? `
        <tr>
          <td style="padding:10px 0;color:#666;font-size:14px;">Balance Due at Venue</td>
          <td style="padding:10px 0;font-weight:600;font-size:14px;color:#EF4444;">₹${(totalAmount - amountPaid).toLocaleString('en-IN')}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- Important Info -->
    <div style="margin:0 40px 32px;background:#FFF9E6;border:1px solid #FCD34D;border-radius:12px;padding:20px;">
      <p style="margin:0 0 8px;font-weight:600;font-size:14px;color:#92400E;">Important Information</p>
      <ul style="margin:0;padding-left:20px;color:#78350F;font-size:13px;line-height:1.8;">
        <li>Please arrive 10 minutes before your slot time</li>
        <li>Bring this confirmation email or quote your booking reference</li>
        ${data.payment_type === 'advance' ? '<li>Balance payment is due at the venue before your slot starts</li>' : ''}
        <li>For assistance, call: +91-XXX-XXX-XXXX</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafb;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
      <p style="margin:0 0 8px;font-size:13px;color:#666;">Maqbool Sports Complex | Baramulla, Kashmir</p>
      <p style="margin:0;font-size:12px;color:#999;">For cancellations or changes, contact us at least 24 hours in advance.</p>
    </div>
  </div>
</body>
</html>`,
      })
    } catch (emailError) {
      // Non-fatal — booking already created, just log
      console.error('[v0] Email send failed:', emailError)
    }
  }

  return NextResponse.json({
    success: true,
    booking: {
      id: booking.id,
      booking_number: booking.booking_number,
      venue_name: venue.name,
      date: data.date,
      slot_labels: sortedSlots.map(s => s.label),
      duration_hours: durationHours,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance_due: totalAmount - amountPaid,
      payment_status: booking.payment_status,
      booking_status: booking.booking_status,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
    }
  }, { status: 201 })
}

// GET /api/bookings?ref=MSC-20260807-XXXXXX
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')

  if (!ref) {
    return NextResponse.json({ error: 'ref is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, booking_number, start_time, end_time, duration_hours,
      booking_status, payment_status, total_amount, amount_paid, metadata,
      venue_id
    `)
    .eq('booking_number', ref)
    .is('deleted_at', null)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Get venue name
  const { data: venue } = await supabase
    .from('venues')
    .select('name')
    .eq('id', booking.venue_id)
    .single()

  const meta = booking.metadata as Record<string, unknown>

  return NextResponse.json({
    booking: {
      ...booking,
      venue_name: venue?.name ?? 'Unknown Venue',
      customer_name: meta?.customer_name ?? '',
      customer_phone: meta?.customer_phone ?? '',
      customer_email: meta?.customer_email ?? null,
      slot_labels: meta?.slot_labels ?? [],
      payment_type: meta?.payment_type ?? 'full',
      balance_due: Number(booking.total_amount) - Number(booking.amount_paid),
    }
  })
}
