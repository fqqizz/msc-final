import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10).max(2000),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const data = parsed.data
  const supabase = createServiceClient()

  // Save to support_tickets (using existing schema)
  // First create a guest user profile if email/phone provided
  let customerId: string | null = null

  if (data.phone || data.email) {
    const query = data.phone
      ? supabase.from('user_profiles').select('id').eq('phone', data.phone).is('deleted_at', null)
      : supabase.from('user_profiles').select('id').eq('email', data.email!).is('deleted_at', null)

    const { data: existing } = await query.single()

    if (existing) {
      customerId = existing.id
    } else {
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({
          full_name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          role: 'guest',
          status: 'active',
          is_guest: true,
          is_phone_verified: false,
          is_email_verified: false,
          metadata: {},
        })
        .select('id')
        .single()
      customerId = newProfile?.id ?? null
    }
  }

  if (customerId) {
    await supabase.from('support_tickets').insert({
      ticket_number: `TKT-${Date.now()}`,
      customer_id: customerId,
      subject: data.subject || 'General Inquiry',
      category: 'general',
      priority: 'normal',
      status: 'open',
    })
  }

  // Notify admin via Resend
  try {
    await resend.emails.send({
      from: 'MSC Website <noreply@maqboolsports.com>',
      to: 'admin@maqboolsports.com',
      subject: `New Contact Message: ${data.subject || 'General Inquiry'}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h2 style="color:#2BA84A;">New Contact Message</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#666;width:30%;">Name</td><td style="padding:8px 0;font-weight:600;">${data.name}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;">${data.email || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${data.phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666;">Subject</td><td style="padding:8px 0;">${data.subject || '—'}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f8fafb;border-radius:8px;">
            <p style="margin:0;color:#333;">${data.message}</p>
          </div>
        </div>
      `,
    })

    // Auto-reply if email provided
    if (data.email) {
      await resend.emails.send({
        from: 'Maqbool Sports Complex <noreply@maqboolsports.com>',
        to: data.email,
        subject: 'We received your message – Maqbool Sports Complex',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;">
            <h2 style="color:#2BA84A;">Thank you, ${data.name}!</h2>
            <p style="color:#555;">We have received your message and will get back to you within 24 hours.</p>
            <p style="color:#555;">If you have an urgent inquiry, please call us directly.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#999;font-size:12px;">Maqbool Sports Complex | Baramulla, Kashmir</p>
          </div>
        `,
      })
    }
  } catch (emailErr) {
    console.error('[v0] Contact email failed:', emailErr)
  }

  return NextResponse.json({ success: true, message: 'Message received. We will get back to you soon.' })
}
