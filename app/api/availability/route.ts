import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { SlotAvailability } from '@/lib/supabase/types'

// GET /api/availability?venue_id=<uuid>&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const venueId = searchParams.get('venue_id')
  const date = searchParams.get('date') // e.g. 2026-08-10

  if (!venueId || !date) {
    return NextResponse.json({ error: 'venue_id and date are required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // 1. Fetch venue with pricing rules
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('id, name, slug, status')
    .eq('id', venueId)
    .is('deleted_at', null)
    .single()

  if (venueError || !venue) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  }

  if (venue.status !== 'active') {
    return NextResponse.json({ error: 'Venue is not available' }, { status: 400 })
  }

  // 2. Fetch pricing rules for this venue
  const { data: pricingRules } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('venue_id', venueId)
    .is('deleted_at', null)
    .order('priority', { ascending: false })

  // 3. Fetch all confirmed bookings for this date + venue
  const dayStart = `${date}T00:00:00+05:30`
  const dayEnd = `${date}T23:59:59+05:30`

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('start_time, end_time, booking_status')
    .eq('venue_id', venueId)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .in('booking_status', ['confirmed', 'checked_in', 'pending'])
    .is('deleted_at', null)

  // 4. Fetch slot locks (temp holds during booking flow)
  const { data: slotLocks } = await supabase
    .from('slot_locks')
    .select('start_time, end_time')
    .eq('venue_id', venueId)
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .gt('expires_at', new Date().toISOString())

  // 5. Fetch maintenance windows
  const { data: maintenanceLogs } = await supabase
    .from('venue_maintenance_logs')
    .select('start_time, end_time')
    .eq('venue_id', venueId)
    .lte('start_time', dayEnd)
    .gte('end_time', dayStart)
    .eq('is_completed', false)

  // 6. Get operating hours for this day of week
  const dayOfWeek = new Date(date).getDay() // 0=Sun, 6=Sat
  const { data: operatingHours } = await supabase
    .from('venue_operating_hours')
    .select('*')
    .eq('venue_id', venueId)
    .eq('day_of_week', dayOfWeek)
    .single()

  // Determine open/close hours
  const openHour = operatingHours && !operatingHours.is_closed
    ? parseInt(operatingHours.open_time.split(':')[0])
    : 6
  const closeHour = operatingHours && !operatingHours.is_closed
    ? parseInt(operatingHours.close_time.split(':')[0])
    : 22
  const isClosed = operatingHours?.is_closed ?? false

  if (isClosed) {
    return NextResponse.json({ slots: [], message: 'Venue is closed on this day' })
  }

  // 7. Build hourly slot grid
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  const blockedHours = new Set<number>()
  ;(existingBookings ?? []).forEach(b => {
    const startH = new Date(b.start_time).getHours()
    const endH = new Date(b.end_time).getHours()
    for (let h = startH; h < endH; h++) blockedHours.add(h)
  })
  ;(slotLocks ?? []).forEach(l => {
    const startH = new Date(l.start_time).getHours()
    const endH = new Date(l.end_time).getHours()
    for (let h = startH; h < endH; h++) blockedHours.add(h)
  })
  ;(maintenanceLogs ?? []).forEach(m => {
    const startH = new Date(m.start_time).getHours()
    const endH = new Date(m.end_time).getHours()
    for (let h = startH; h < endH; h++) blockedHours.add(h)
  })

  // Helper: get price for a given hour using pricing rules
  function getPriceForHour(hour: number): { price: number; isPeak: boolean } {
    const timeStr = `${String(hour).padStart(2, '0')}:00:00`
    const candidates = (pricingRules ?? []).filter(r => {
      if (r.deleted_at) return false
      // day of week match
      if (r.day_of_week !== null && r.day_of_week !== dayOfWeek) return false
      // weekend match
      if (r.is_weekend !== null && r.is_weekend !== isWeekend) return false
      // time range
      if (timeStr < r.start_time || timeStr >= r.end_time) return false
      // date range
      if (r.start_date && date < r.start_date) return false
      if (r.end_date && date > r.end_date) return false
      return true
    })
    if (candidates.length > 0) {
      const best = candidates[0] // already sorted by priority desc
      return { price: Number(best.hourly_rate), isPeak: best.is_peak_hour }
    }
    // Fallback: no rule found — return 0 (admin hasn't configured pricing yet)
    return { price: 0, isPeak: false }
  }

  function formatHour(h: number): string {
    const start = h === 0 ? 12 : h > 12 ? h - 12 : h
    const end = (h + 1) === 0 ? 12 : (h + 1) > 12 ? (h + 1) - 12 : h + 1
    const sp = h >= 12 ? 'PM' : 'AM'
    const ep = (h + 1) >= 12 ? 'PM' : 'AM'
    return `${start} ${sp} – ${end} ${ep}`
  }

  const slots: SlotAvailability[] = []
  for (let h = openHour; h < closeHour; h++) {
    const { price, isPeak } = getPriceForHour(h)
    const startISO = `${date}T${String(h).padStart(2, '0')}:00:00`
    const endISO = `${date}T${String(h + 1).padStart(2, '0')}:00:00`
    slots.push({
      hour: h,
      label: formatHour(h),
      start_time: startISO,
      end_time: endISO,
      available: !blockedHours.has(h),
      price,
      is_peak: isPeak,
    })
  }

  return NextResponse.json({ slots, venue })
}
