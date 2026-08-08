import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_placeholder'
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'

const razorpay = new Razorpay({
  key_id,
  key_secret,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency = 'INR', bookingId, bookingNumber } = body

    if (!amount || !bookingId) {
      return NextResponse.json({ error: 'Missing required parameters amount or bookingId' }, { status: 400 })
    }

    // Razorpay amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: `receipt_${bookingNumber || bookingId.slice(0, 8)}`,
      notes: {
        booking_id: bookingId,
        booking_number: bookingNumber || '',
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
