import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateBookingReceiptPDF } from '@/lib/receipt-generator'
import { isBefore, subDays } from 'date-fns'

// Configurable secure receipt download retention period (90 days)
const RECEIPT_EXPIRY_DAYS = 90

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bookingId = searchParams.get('booking_id')

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking_id parameter' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, venues(name), user_profiles(full_name, phone, email)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking record not found' }, { status: 404 })
  }

  // Secure Expiry Check: Receipts for bookings created beyond the retention window expire
  const bookingCreatedAt = new Date(booking.created_at || booking.start_time)
  const expiryThreshold = subDays(new Date(), RECEIPT_EXPIRY_DAYS)

  if (isBefore(bookingCreatedAt, expiryThreshold)) {
    return NextResponse.json(
      {
        error: `Receipt download access for Booking #${booking.booking_number} has expired (${RECEIPT_EXPIRY_DAYS}-day security lifecycle). Please contact reception at info@maqboolsports.in for historical audit statements.`,
      },
      { status: 410 }
    )
  }

  const pdfBuffer = generateBookingReceiptPDF(booking)

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="MSC-Receipt-${booking.booking_number}.pdf"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  })
}
