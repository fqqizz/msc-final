import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/bookings?search=&status=&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')

  const supabase = createServiceClient()

  // ── Fetch bookings with venue data ──────────────────────────────────────────
  let query = supabase
    .from('bookings')
    .select(`
      id, booking_number, customer_id, venue_id,
      start_time, end_time, duration_hours,
      booking_status, payment_status,
      total_amount, amount_paid, metadata,
      created_at
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (status && status !== 'all') {
    query = query.eq('booking_status', status)
  }

  if (date) {
    const dayStart = `${date}T00:00:00`
    const dayEnd = `${date}T23:59:59`
    query = query.gte('start_time', dayStart).lte('start_time', dayEnd)
  }

  const { data: rawBookings, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  // ── Fetch venue names in batch ───────────────────────────────────────────────
  const venueIds = [...new Set((rawBookings ?? []).map(b => b.venue_id))]
  const { data: venues } = venueIds.length
    ? await supabase.from('venues').select('id, name, slug').in('id', venueIds)
    : { data: [] }

  const venueMap = Object.fromEntries((venues ?? []).map(v => [v.id, v]))

  // ── Enrich bookings ─────────────────────────────────────────────────────────
  const bookings = (rawBookings ?? []).map(b => {
    const meta = (b.metadata ?? {}) as Record<string, unknown>
    const venue = venueMap[b.venue_id] ?? { name: 'Unknown', slug: '' }
    return {
      id: b.id,
      booking_number: b.booking_number,
      venue_name: venue.name,
      venue_slug: venue.slug,
      customer_name: String(meta.customer_name ?? ''),
      customer_phone: String(meta.customer_phone ?? ''),
      customer_email: meta.customer_email ? String(meta.customer_email) : null,
      start_time: b.start_time,
      end_time: b.end_time,
      duration_hours: Number(b.duration_hours),
      booking_status: b.booking_status,
      payment_status: b.payment_status,
      total_amount: Number(b.total_amount),
      amount_paid: Number(b.amount_paid),
      slot_labels: Array.isArray(meta.slot_labels) ? meta.slot_labels as string[] : [],
      created_at: b.created_at,
    }
  })

  // ── Compute stats ────────────────────────────────────────────────────────────
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  // Re-fetch all bookings for stats (not filtered)
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('start_time, booking_status, payment_status, total_amount, amount_paid')
    .is('deleted_at', null)
    .neq('booking_status', 'cancelled')

  const stats = (allBookings ?? []).reduce(
    (acc, b) => {
      const bookingDate = b.start_time.slice(0, 10)
      const isToday = bookingDate === todayStr
      const isThisMonth = bookingDate >= monthStart
      const paid = Number(b.amount_paid)

      if (isToday) {
        acc.today_bookings++
        acc.today_revenue += paid
      }
      if (isThisMonth) {
        acc.this_month_bookings++
        acc.this_month_revenue += paid
      }
      if (b.payment_status === 'partially_paid' || b.payment_status === 'unpaid') {
        acc.pending_payments++
      }
      acc.total_bookings++
      return acc
    },
    {
      today_bookings: 0,
      today_revenue: 0,
      this_month_bookings: 0,
      this_month_revenue: 0,
      pending_payments: 0,
      total_bookings: 0,
    }
  )

  return NextResponse.json({ bookings, stats })
}
