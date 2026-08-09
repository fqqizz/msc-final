import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

export function generateBookingReceiptPDF(booking: any): Buffer {
  const doc = new jsPDF()

  // Header Banner
  doc.setFillColor(5, 5, 5)
  doc.rect(0, 0, 210, 42, 'F')

  doc.setTextColor(43, 168, 74)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('MAQBOOL SPORTS COMPLEX', 14, 20)

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('OFFICIAL BOOKING RECEIPT & TAX INVOICE', 14, 28)
  doc.text('Baramulla, Jammu & Kashmir 190001 | info@maqboolsports.in | maqboolsports.in', 14, 35)

  // Booking Info Box
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Booking Reference: #${booking.booking_number}`, 14, 54)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Date Issued: ${format(new Date(booking.created_at || new Date()), 'dd MMM yyyy, hh:mm a')}`, 130, 54)

  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.line(14, 59, 196, 59)

  // Facility & Customer Details
  const venueName = booking.venues?.name || 'Football Turf'
  const sessionDate = format(new Date(booking.start_time), 'EEEE, dd MMMM yyyy')
  const sessionTime = `${format(new Date(booking.start_time), 'hh:mm a')} - ${format(new Date(booking.end_time), 'hh:mm a')}`

  doc.setFontSize(9)
  doc.text('SESSION DETAILS:', 14, 69)
  doc.setFont('helvetica', 'bold')
  doc.text(`Facility: ${venueName}`, 14, 76)
  doc.text(`Date: ${sessionDate}`, 14, 82)
  doc.text(`Time: ${sessionTime} (${booking.duration_hours || 1} Hour)`, 14, 88)

  doc.setFont('helvetica', 'normal')
  doc.text('CUSTOMER / PLAYER:', 120, 69)
  doc.setFont('helvetica', 'bold')
  doc.text(booking.user_profiles?.full_name || booking.notes?.split('-')[0]?.replace('Walk-in Player:', '')?.trim() || 'MSC Player', 120, 76)
  doc.setFont('helvetica', 'normal')
  doc.text(booking.user_profiles?.phone || booking.notes?.match(/\((.*?)\)/)?.[1] || 'Online Booking', 120, 82)
  doc.text(booking.user_profiles?.email || 'info@maqboolsports.in', 120, 88)

  doc.line(14, 96, 196, 96)

  // Itemized Table
  doc.setFillColor(245, 245, 245)
  doc.rect(14, 102, 182, 9, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Description / Item', 18, 108)
  doc.text('Qty / Duration', 110, 108)
  doc.text('Amount (INR)', 158, 108)

  doc.setFont('helvetica', 'normal')
  let currentY = 120

  // 1. Venue Charge
  const baseRate = Number(booking.base_amount || (venueName.includes('Football') ? 999 : 299))
  doc.text(`${venueName} Pitch Slot`, 18, currentY)
  doc.text(`${booking.duration_hours || 1} Hour(s)`, 110, currentY)
  doc.text(`Rs. ${baseRate.toFixed(2)}`, 158, currentY)
  currentY += 10

  // 2. Extra Equipment / Bowling Machine
  if (Number(booking.extra_charges) > 0 || (booking.notes && booking.notes.includes('Bowling Machine'))) {
    const extra = Number(booking.extra_charges) || (299 * (booking.duration_hours || 1))
    doc.text('Automated Bowling Machine Add-On', 18, currentY)
    doc.text(`${booking.duration_hours || 1} Hour(s)`, 110, currentY)
    doc.text(`Rs. ${extra.toFixed(2)}`, 158, currentY)
    currentY += 10
  }

  // 3. Discount if any
  if (Number(booking.discount_amount) > 0) {
    doc.text('Promotional Coupon Discount', 18, currentY)
    doc.text('Applied', 110, currentY)
    doc.text(`-Rs. ${Number(booking.discount_amount).toFixed(2)}`, 158, currentY)
    currentY += 10
  }

  doc.line(14, currentY + 2, 196, currentY + 2)
  currentY += 14

  // Total Summary
  const total = Number(booking.total_amount || baseRate)
  const paid = Number(booking.amount_paid || total)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`Gross Total: Rs. ${total.toFixed(2)}`, 130, currentY)
  currentY += 7
  doc.text(`Amount Paid: Rs. ${paid.toFixed(2)}`, 130, currentY)
  currentY += 8

  doc.setTextColor(43, 168, 74)
  doc.setFontSize(11)
  doc.text(`Payment Status: ${paid >= total ? 'PAID & CONFIRMED' : 'PARTIALLY PAID (50%)'}`, 130, currentY)

  // Policy Footer
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Cancellation Policy: 100% refund for 24h+ notice. 50% refund for 12-24h notice. Non-refundable within 12h.', 14, 210)
  doc.text('This is an authentic computer-generated digital tax receipt issued by MSC OS (maqboolsports.in).', 14, 216)

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
