import { jsPDF } from 'jspdf'
import { format } from 'date-fns'

export function generateBookingReceiptPDF(booking: any): Buffer {
  const doc = new jsPDF()

  // Header Banner
  doc.setFillColor(5, 5, 5)
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(43, 168, 74)
  doc.setFontSize(22)
  doc.text('MAQBOOL SPORTS COMPLEX', 14, 22)

  doc.setTextColor(200, 200, 200)
  doc.setFontSize(10)
  doc.text('OFFICIAL BOOKING RECEIPT & TAX INVOICE', 14, 30)

  // Booking Info Box
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.text(`Receipt #: ${booking.booking_number}`, 14, 55)
  doc.text(`Date Issued: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 140, 55)

  doc.setLineWidth(0.5)
  doc.line(14, 60, 196, 60)

  // Facility & Customer Details
  doc.setFontSize(10)
  doc.text('FACILITY LOCATION:', 14, 72)
  doc.setFont('helvetica', 'bold')
  doc.text('Maqbool Sports Complex, Baramulla, J&K 190001', 14, 78)
  doc.setFont('helvetica', 'normal')
  doc.text('Email: info@maqboolsports.in', 14, 84)

  doc.text('CUSTOMER / PLAYER:', 120, 72)
  doc.setFont('helvetica', 'bold')
  doc.text(booking.notes || 'MSC Customer', 120, 78)

  doc.line(14, 94, 196, 94)

  // Itemized Table
  doc.setFillColor(240, 240, 240)
  doc.rect(14, 100, 182, 10, 'F')

  doc.setFont('helvetica', 'bold')
  doc.text('Description', 18, 107)
  doc.text('Duration', 110, 107)
  doc.text('Amount (INR)', 160, 107)

  doc.setFont('helvetica', 'normal')
  const venueName = booking.venues?.name || 'Football Turf'
  doc.text(`${venueName} Slot Reservation`, 18, 120)
  doc.text(`${booking.duration_hours || 1} Hour(s)`, 110, 120)
  doc.text(`Rs. ${booking.total_amount}`, 160, 120)

  doc.line(14, 130, 196, 130)

  // Total Summary
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`Total Amount Paid: Rs. ${booking.amount_paid || booking.total_amount}`, 120, 145)
  doc.setTextColor(43, 168, 74)
  doc.text('Status: CONFIRMED & PAID', 120, 153)

  // Policy Footer
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.text('Cancellation Policy: Refunds allowed strictly more than 5 hours prior to session start time.', 14, 180)
  doc.text('This is a computer generated digital receipt issued by MSC OS (maqboolsports.in).', 14, 186)

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
