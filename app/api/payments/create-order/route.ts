import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_placeholder'
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'

const razorpay = new Razorpay({
  key_id,
  key_secret,
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency = 'INR', bookingId, bookingNumber, paymentOption = 'full' } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing required parameter bookingId' }, { status: 400 })
    }

    // 1. Authoritative Backend Validation from Supabase Booking Record
    let validatedAmount = Number(amount)

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*, venues(name, sport_type)')
      .eq('id', bookingId)
      .maybeSingle()

    if (booking) {
      const totalAmount = Number(booking.total_amount || booking.base_amount || 299)
      const payableAmount = paymentOption === 'half' ? Math.ceil(totalAmount / 2) : totalAmount
      validatedAmount = payableAmount
    }

    if (!validatedAmount || validatedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payable amount' }, { status: 400 })
    }

    // 2. Razorpay amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(validatedAmount * 100),
      currency,
      receipt: `receipt_${bookingNumber || (booking?.booking_number) || bookingId.slice(0, 8)}`,
      notes: {
        booking_id: bookingId,
        booking_number: bookingNumber || (booking?.booking_number) || '',
      },
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    })
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err)
    return NextResponse.json({ error: err.message || 'Failed to create payment order' }, { status: 500 })
  }
}
