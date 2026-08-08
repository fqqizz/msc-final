import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder_key'
export const resend = new Resend(resendApiKey)

export const OFFICIAL_SENDER = 'Maqbool Sports Complex <info@maqboolsports.in>'
export const ADMIN_NOTIFICATION_EMAIL = 'info@maqboolsports.in'

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    return await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: 'Welcome to Maqbool Sports Complex',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 16px;">
          <h2 style="color: #2BA84A; font-size: 24px;">Welcome to MSC, ${name}!</h2>
          <p style="color: #cccccc; font-size: 14px; line-height: 1.6;">
            Your player account has been successfully created. You can now book synthetic football turf & cricket net slots online instantly.
          </p>
          <div style="margin-top: 20px; padding: 15px; background-color: #0d1117; border-left: 4px solid #2BA84A; border-radius: 8px;">
            <p style="margin: 0; color: #aaaaaa; font-size: 12px;">Support Contact: info@maqboolsports.in | Baramulla, Jammu & Kashmir</p>
          </div>
        </div>
      `
    })
  } catch (err) {
    console.error('Error sending welcome email via Resend:', err)
  }
}

export async function sendBookingConfirmationEmail(params: {
  email: string
  name: string
  bookingNumber: string
  venueName: string
  dateStr: string
  timeStr: string
  amount: number
}) {
  try {
    return await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: params.email,
      subject: `Booking Confirmed — #${params.bookingNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 16px;">
          <h2 style="color: #2BA84A; margin-bottom: 10px;">Booking Confirmed!</h2>
          <p style="color: #cccccc;">Hello ${params.name}, your slot at Maqbool Sports Complex is confirmed.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #0d1117; border-radius: 10px;">
            <tr><td style="padding: 12px; border-bottom: 1px solid #222; color: #888;">Booking ID</td><td style="padding: 12px; border-bottom: 1px solid #222; color: #fff; font-weight: bold;">#${params.bookingNumber}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #222; color: #888;">Facility</td><td style="padding: 12px; border-bottom: 1px solid #222; color: #fff;">${params.venueName}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #222; color: #888;">Date & Time</td><td style="padding: 12px; border-bottom: 1px solid #222; color: #fff;">${params.dateStr} (${params.timeStr})</td></tr>
            <tr><td style="padding: 12px; color: #888;">Amount Paid</td><td style="padding: 12px; color: #2BA84A; font-weight: bold; font-size: 18px;">₹${params.amount}</td></tr>
          </table>

          <p style="color: #888888; font-size: 12px;">See you on the pitch! For support email info@maqboolsports.in</p>
        </div>
      `
    })
  } catch (err) {
    console.error('Error sending booking confirmation email via Resend:', err)
  }
}

export async function sendRefundNotificationEmail(params: {
  email: string
  bookingNumber: string
  amount: number
  status: 'requested' | 'completed' | 'failed'
}) {
  try {
    const title = params.status === 'completed' 
      ? 'Refund Processed' 
      : params.status === 'requested' 
      ? 'Refund Request Received' 
      : 'Refund Processing Issue'

    return await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: params.email,
      subject: `${title} — #${params.bookingNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 16px;">
          <h2 style="color: ${params.status === 'failed' ? '#EF4444' : '#2BA84A'};">${title}</h2>
          <p style="color: #cccccc;">Update regarding your booking #${params.bookingNumber}.</p>
          <p style="color: #ffffff; font-size: 16px;">Refund Amount: <strong>₹${params.amount}</strong></p>
          <p style="color: #888888; font-size: 12px;">For assistance, contact info@maqboolsports.in</p>
        </div>
      `
    })
  } catch (err) {
    console.error('Error sending refund email via Resend:', err)
  }
}

export async function sendAdminOperationalAlert(params: {
  title: string
  details: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}) {
  try {
    const color = params.severity === 'CRITICAL' ? '#EF4444' : params.severity === 'WARNING' ? '#F59E0B' : '#2BA84A'

    return await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `[MSC OS Alert - ${params.severity}] ${params.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 25px; border-radius: 12px; border-left: 6px solid ${color};">
          <h3 style="color: ${color}; margin: 0 0 10px 0;">${params.title}</h3>
          <p style="color: #dddddd; font-size: 14px; line-height: 1.5;">${params.details}</p>
          <p style="color: #666666; font-size: 11px; margin-top: 15px;">MSC OS Operational Alert Engine</p>
        </div>
      `
    })
  } catch (err) {
    console.error('Error sending admin operational alert via Resend:', err)
  }
}
