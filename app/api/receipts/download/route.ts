import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateBookingReceiptPDF } from '@/lib/receipt-generator'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('booking_id')

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking_id parameter' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, venues(name)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking record not found' }, { status: 404 })
  }

  const pdfBuffer = generateBookingReceiptPDF(booking)

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="MSC-Receipt-${booking.booking_number}.pdf"`
    }
  })
}
