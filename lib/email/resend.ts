import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder_key'
export const resend = new Resend(resendApiKey)

export const OFFICIAL_SENDER = 'Maqbool Sports Complex <info@maqboolsports.in>'

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    return await resend.emails.send({
      from: OFFICIAL_SENDER,
      to: email,
      subject: 'Welcome to Maqbool Sports Complex',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #050505; color: #ffffff; padding: 30px; border-radius: 16px;">
          <h2 style="color: #2BA84A; font-size: 24px;">Welcome to MSC OS, ${name}!</h2>
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
