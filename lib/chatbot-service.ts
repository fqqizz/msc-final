// ============================================================================
// MSC (Maqbool Sports Complex) — Intelligent Chatbot Service
// Deterministic Entity Resolution, Conversational Context & Live DB Queries
// ============================================================================

import { MSC_KNOWLEDGE } from '@/data/mscKnowledge'
import { isCancellationEligible } from '@/data/policies'
import { createClient } from '@/lib/supabase/client'
import { format, addDays } from 'date-fns'

// ----------------------------------------------------------------------------
// 1. CANONICAL FACILITY & RESOURCE DICTIONARY
// ----------------------------------------------------------------------------
export type CanonicalVenueId = 'football-turf' | 'cricket-net-1' | 'cricket-net-2'

export interface CanonicalVenueInfo {
  id: CanonicalVenueId
  name: string
  shortName: string
  sport: 'football' | 'cricket'
  defaultBasePrice: number
  emoji: string
  aliases: string[]
}

export const CANONICAL_VENUES: Record<CanonicalVenueId, CanonicalVenueInfo> = {
  'football-turf': {
    id: 'football-turf',
    name: 'Football / Box Cricket Turf',
    shortName: 'Football Turf',
    sport: 'football',
    defaultBasePrice: 999,
    emoji: '⚽',
    aliases: [
      'football turf',
      'football ground',
      'football pitch',
      'football',
      'box cricket turf',
      'box cricket',
      'turf',
      'main turf',
      'ground',
      '7v7',
      '7-a-side',
      '7 aside',
      'soccer',
    ],
  },
  'cricket-net-1': {
    id: 'cricket-net-1',
    name: 'Cricket Practice Net 1',
    shortName: 'Cricket Net 1',
    sport: 'cricket',
    defaultBasePrice: 299,
    emoji: '🏏',
    aliases: [
      'cricket net 1',
      'cricket practice net 1',
      'cricket net one',
      'net 1',
      'net one',
      'first net',
      'practice net 1',
      'batting net 1',
      'net1',
    ],
  },
  'cricket-net-2': {
    id: 'cricket-net-2',
    name: 'Cricket Practice Net 2',
    shortName: 'Cricket Net 2',
    sport: 'cricket',
    defaultBasePrice: 299,
    emoji: '🏏',
    aliases: [
      'cricket net 2',
      'cricket practice net 2',
      'cricket net two',
      'net 2',
      'net two',
      'second net',
      'practice net 2',
      'batting net 2',
      'net2',
    ],
  },
}

export interface ChatbotResponse {
  text: string
  actionLink?: {
    label: string
    href: string
    policy?: 'cancellation' | 'refund' | 'terms'
  }
  suggestions?: string[]
}

export interface ConversationContext {
  lastVenueId?: CanonicalVenueId
  lastDateStr?: string
  lastHour?: number
  pendingVenueChoiceForHour?: {
    dateStr: string
    hour: number
  }
}

// ----------------------------------------------------------------------------
// 2. DETERMINISTIC ENTITY RESOLUTION ENGINE
// ----------------------------------------------------------------------------
export type EntityResolutionResult =
  | { type: 'resolved'; venue: CanonicalVenueInfo }
  | { type: 'cricket_nets_ambiguous' }
  | { type: 'cricket_general' }
  | { type: 'bowling_machine' }
  | { type: 'none' }

export function resolveVenueEntity(query: string, context?: ConversationContext): EntityResolutionResult {
  const q = query.toLowerCase().replace(/[^\w\s\/-]/g, ' ')

  // 1. Check Specific Net 2 First
  if (
    q.includes('net 2') ||
    q.includes('net two') ||
    q.includes('net2') ||
    q.includes('second net') ||
    q.includes('cricket net 2')
  ) {
    return { type: 'resolved', venue: CANONICAL_VENUES['cricket-net-2'] }
  }

  // 2. Check Specific Net 1
  if (
    q.includes('net 1') ||
    q.includes('net one') ||
    q.includes('net1') ||
    q.includes('first net') ||
    q.includes('cricket net 1')
  ) {
    return { type: 'resolved', venue: CANONICAL_VENUES['cricket-net-1'] }
  }

  // 3. Check Football / Box Cricket Turf
  // "football turf", "football", "turf", "box cricket", "soccer", "7v7", "7-a-side"
  if (
    q.includes('football') ||
    q.includes('turf') ||
    q.includes('box cricket') ||
    q.includes('soccer') ||
    q.includes('7v7') ||
    q.includes('7-a-side') ||
    q.includes('7 aside')
  ) {
    return { type: 'resolved', venue: CANONICAL_VENUES['football-turf'] }
  }

  // 4. Check Bowling Machine Add-on
  if (q.includes('bowling machine') || (q.includes('bowling') && (q.includes('machine') || q.includes('robot') || q.includes('feeder')))) {
    return { type: 'bowling_machine' }
  }

  // 5. Check Generic "cricket net" / "practice net" / "nets" without number
  if (q.includes('cricket net') || q.includes('practice net') || q.includes('nets') || q.includes('net')) {
    return { type: 'cricket_nets_ambiguous' }
  }

  // 6. Check Generic "cricket"
  if (q.includes('cricket')) {
    return { type: 'cricket_general' }
  }

  // 7. Inherit from Context if available
  if (context?.lastVenueId && CANONICAL_VENUES[context.lastVenueId]) {
    return { type: 'resolved', venue: CANONICAL_VENUES[context.lastVenueId] }
  }

  return { type: 'none' }
}

// ----------------------------------------------------------------------------
// 3. ASIA/KOLKATA TIME & DATE UTILITIES
// ----------------------------------------------------------------------------
export function getNowKolkata(): { date: Date; dateStr: string; hour: number; minute: number } {
  // Current time in Asia/Kolkata (UTC+05:30)
  const now = new Date()
  const kolkataTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  const kDate = new Date(kolkataTimeStr)

  const dateStr = format(kDate, 'yyyy-MM-dd')
  const hour = kDate.getHours()
  const minute = kDate.getMinutes()

  return { date: kDate, dateStr, hour, minute }
}

export function parseTargetDate(query: string): string {
  const q = query.toLowerCase()
  const { dateStr } = getNowKolkata()

  if (q.includes('tomorrow')) {
    const tomorrow = addDays(new Date(), 1)
    const kTomorrow = new Date(tomorrow.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    return format(kTomorrow, 'yyyy-MM-dd')
  }

  // Check specific ISO dates YYYY-MM-DD
  const isoMatch = q.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (isoMatch) return isoMatch[0]

  return dateStr
}

export function parseTargetHour(query: string): number | null {
  const q = query.toLowerCase()

  // Match patterns like "9pm", "9 pm", "21:00", "9:00 pm", "9 in the evening", "tonight at 9"
  const timeMatch = q.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)

  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10)
    const isPM = timeMatch[3]?.toLowerCase() === 'pm' || (!timeMatch[3] && (q.includes('evening') || q.includes('night') || q.includes('tonight') || (h < 6 && h !== 0)))
    const isAM = timeMatch[3]?.toLowerCase() === 'am'

    if (isPM && h !== 12 && h < 12) h += 12
    if (isAM && h === 12) h = 0

    if (h >= 6 && h <= 23) {
      return h
    }
  }

  if (q.includes('tonight') || q.includes('this evening')) {
    return 19 // Default evening exploration hour
  }

  return null
}

// ----------------------------------------------------------------------------
// 4. REAL-TIME DATABASE AVAILABILITY SERVICE
// Queries Supabase RPC get_authoritative_slot_availability or authoritative tables
// ----------------------------------------------------------------------------
export async function queryAuthoritativeAvailability(
  venue: CanonicalVenueInfo,
  targetDateStr: string,
  targetHour: number | null
): Promise<ChatbotResponse> {
  const supabase = createClient()
  const { dateStr: todayKolkataStr, hour: currentKolkataHour, minute: currentKolkataMinute } = getNowKolkata()
  const isTargetToday = targetDateStr === todayKolkataStr

  try {
    // 1. Fetch Venue Record from Supabase
    const { data: vData } = await supabase
      .from('venues')
      .select('id, name, sport_type, slug')
      .eq('slug', venue.id)
      .maybeSingle()

    const venueId = vData?.id
    const venueDisplayName = vData?.name || venue.name
    const venueSlug = vData?.slug || venue.id

    // 2. Fetch Live Availability via Database RPC
    let slotRecords: any[] = []

    if (venueId) {
      const { data: rpcSlots, error: rpcErr } = await supabase.rpc('get_authoritative_slot_availability', {
        p_venue_id: venueId,
        p_date: targetDateStr,
      })

      if (!rpcErr && Array.isArray(rpcSlots) && rpcSlots.length > 0) {
        slotRecords = rpcSlots
      }
    }

    // Fallback: Direct Table Queries if RPC not available
    if (slotRecords.length === 0 && venueId) {
      const dayStart = `${targetDateStr}T00:00:00+05:30`
      const dayEnd = `${targetDateStr}T23:59:59+05:30`

      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time, end_time, booking_status')
        .eq('venue_id', venueId)
        .in('booking_status', ['confirmed', 'in_progress', 'locked'])
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)

      const { data: locks } = await supabase
        .from('slot_locks')
        .select('start_time, end_time, expires_at')
        .eq('venue_id', venueId)
        .gt('expires_at', new Date().toISOString())

      const { data: reservations } = await supabase
        .from('slot_reservations')
        .select('start_time, end_time, status')
        .eq('venue_id', venueId)
        .eq('status', 'active')

      const { data: baseRates } = await supabase
        .from('venue_base_rates')
        .select('base_price, effective_from')
        .eq('venue_id', venueId)
        .lte('effective_from', `${targetDateStr}T23:59:59+05:30`)
        .order('effective_from', { ascending: false })
        .limit(1)

      const activeBasePrice = baseRates?.[0]?.base_price ? Number(baseRates[0].base_price) : venue.defaultBasePrice

      for (let h = 6; h <= 22; h++) {
        // Slot [H, H+1]
        // Cutoff Rule: In Asia/Kolkata, slot is only past if current hour in Kolkata >= H + 1!
        const isPast = isTargetToday && currentKolkataHour >= (h + 1)

        const isBooked = bookings?.some((b) => {
          const bHour = new Date(b.start_time).getHours()
          return bHour === h
        }) || false

        const isLocked = locks?.some((l) => {
          const lHour = new Date(l.start_time).getHours()
          return lHour === h
        }) || false

        const isReserved = reservations?.some((r) => {
          const rHour = new Date(r.start_time).getHours()
          return rHour === h
        }) || false

        const isAvailable = !isPast && !isBooked && !isLocked && !isReserved
        let reason = 'Available'
        if (isPast) reason = 'Past Slot'
        else if (isReserved) reason = 'Reserved by MSC Management'
        else if (isLocked) reason = 'Temporary Checkout Lock'
        else if (isBooked) reason = 'Booked'

        slotRecords.push({
          slot_hour: h,
          is_available: isAvailable,
          effective_price: activeBasePrice,
          unavailable_reason: reason,
        })
      }
    }

    // Format target date label for human reading
    const humanDate = isTargetToday ? 'today' : `on ${format(new Date(targetDateStr), 'dd MMMM')}`

    // ------------------------------------------------------------------------
    // CASE A: SPECIFIC TARGET HOUR QUERIED (e.g. 9 PM = 21)
    // ------------------------------------------------------------------------
    if (typeof targetHour === 'number') {
      const displayHour = targetHour > 12 ? `${targetHour - 12}:00 PM` : targetHour === 12 ? '12:00 PM' : `${targetHour}:00 AM`
      const shortDisplay = targetHour > 12 ? `${targetHour - 12} PM` : targetHour === 12 ? '12 PM' : `${targetHour} AM`

      const targetSlot = slotRecords.find((s) => s.slot_hour === targetHour)
      const isAvailable = targetSlot?.is_available || false
      const effectivePrice = Number(targetSlot?.effective_price || venue.defaultBasePrice)
      const reason = targetSlot?.unavailable_reason || 'Booked'

      if (isAvailable) {
        return {
          text: `Yes. The ${venue.shortName} is available ${humanDate} at ${displayHour}. It is ₹${effectivePrice}/hour.`,
          actionLink: {
            label: `Book ${venue.shortName} at ${shortDisplay}`,
            href: `/book-now?venue=${venueSlug}&date=${targetDateStr}&hour=${targetHour}`,
          },
          suggestions: [
            `What about ${targetHour + 1 <= 22 ? (targetHour + 1 > 12 ? `${targetHour + 1 - 12} PM` : `${targetHour + 1} AM`) : 'Tomorrow'}?`,
            'What is the refund policy?',
            'Check another facility',
          ],
        }
      } else {
        // Find adjacent available slots
        const adjacentAvailable = slotRecords
          .filter((s) => s.is_available && Math.abs(s.slot_hour - targetHour) <= 2)
          .map((s) => (s.slot_hour > 12 ? `${s.slot_hour - 12} PM` : `${s.slot_hour} AM`))

        let suggestionText = ''
        if (adjacentAvailable.length > 0) {
          suggestionText = ` I can check ${adjacentAvailable.join(' or ')} for you.`
        } else {
          suggestionText = ' Would you like to check tomorrow or another time?'
        }

        if (reason.toLowerCase().includes('reserved')) {
          return {
            text: `The ${displayHour} ${venue.shortName} slot ${humanDate} is unavailable because it has been reserved.${suggestionText}`,
            actionLink: {
              label: `Check All ${venue.shortName} Slots`,
              href: `/book-now?venue=${venueSlug}&date=${targetDateStr}`,
            },
            suggestions: adjacentAvailable.map((h) => `Check ${h}`).concat(['Check Tomorrow', 'Check another facility']),
          }
        }

        if (reason.toLowerCase().includes('past')) {
          return {
            text: `The ${displayHour} slot ${humanDate} has already concluded.${suggestionText}`,
            actionLink: {
              label: `View Upcoming Slots`,
              href: `/book-now?venue=${venueSlug}&date=${targetDateStr}`,
            },
            suggestions: ['Check Tonight', 'Check Tomorrow', 'Check another facility'],
          }
        }

        return {
          text: `The ${displayHour} ${venue.shortName} slot is already booked ${humanDate}.${suggestionText}`,
          actionLink: {
            label: `Check Full ${venue.shortName} Schedule`,
            href: `/book-now?venue=${venueSlug}&date=${targetDateStr}`,
          },
          suggestions: adjacentAvailable.map((h) => `Check ${h}`).concat(['Check Tomorrow', 'Check another facility']),
        }
      }
    }

    // ------------------------------------------------------------------------
    // CASE B: FULL DAY AVAILABILITY SUMMARY
    // ------------------------------------------------------------------------
    const openSlots = slotRecords.filter((s) => s.is_available)
    const effectivePrice = Number(openSlots[0]?.effective_price || venue.defaultBasePrice)

    if (openSlots.length === 0) {
      return {
        text: `All slots for ${venue.shortName} ${humanDate} are currently fully booked! Would you like me to check tomorrow's availability?`,
        actionLink: {
          label: `Check Tomorrow's Slots`,
          href: `/book-now?venue=${venueSlug}&date=${format(addDays(new Date(), 1), 'yyyy-MM-dd')}`,
        },
        suggestions: ['Check Tomorrow', 'Check another facility', 'Contact MSC Support'],
      }
    }

    const openLabels = openSlots.map((s) => (s.slot_hour > 12 ? `${s.slot_hour - 12} PM` : s.slot_hour === 12 ? '12 PM' : `${s.slot_hour} AM`))
    const preview = openLabels.slice(0, 5).join(', ')

    return {
      text: `${venue.shortName} has ${openSlots.length} slot(s) open ${humanDate} at ₹${effectivePrice}/hour. Available times include: ${preview}${openSlots.length > 5 ? ' and more' : ''}.`,
      actionLink: {
        label: `Book ${venue.shortName} Slot`,
        href: `/book-now?venue=${venueSlug}&date=${targetDateStr}`,
      },
      suggestions: openLabels.slice(0, 3).map((h) => `Is ${h} open?`).concat(['What is the price?', 'Check another facility']),
    }
  } catch (err) {
    console.error('Error in queryAuthoritativeAvailability:', err)
    return {
      text: `Our ${venue.shortName} is open daily from 6:00 AM to 11:00 PM (₹${venue.defaultBasePrice}/hour). You can view all live available slots and book directly on our booking calendar.`,
      actionLink: {
        label: `View Live Calendar`,
        href: `/book-now?venue=${venue.id}&date=${targetDateStr}`,
      },
      suggestions: ['Check 8 PM', 'Check 9 PM', 'How do I book?'],
    }
  }
}

// ----------------------------------------------------------------------------
// 5. MAIN INTENT & CONTEXT PROCESSOR
// ----------------------------------------------------------------------------
export async function processChatbotMessage(
  userQuery: string,
  context: ConversationContext = {}
): Promise<{ response: ChatbotResponse; updatedContext: ConversationContext }> {
  const rawQ = userQuery.trim()
  const q = rawQ.toLowerCase()
  let updatedContext: ConversationContext = { ...context }

  // --------------------------------------------------------------------------
  // A. SELF-CORRECTION DETECTION
  // User: "i am saying football turf" / "i meant cricket net 2" / "no, football"
  // --------------------------------------------------------------------------
  const isSelfCorrection =
    q.startsWith('i am saying') ||
    q.startsWith('i said') ||
    q.startsWith('i meant') ||
    q.startsWith('no i mean') ||
    q.startsWith('no, i mean') ||
    q.startsWith('i am talking about') ||
    q.includes('not cricket') ||
    q.includes('not net') ||
    q.includes('wrong facility')

  if (isSelfCorrection) {
    const correctedEntity = resolveVenueEntity(q)
    if (correctedEntity.type === 'resolved') {
      const targetVenue = correctedEntity.venue
      updatedContext.lastVenueId = targetVenue.id

      const targetDate = updatedContext.lastDateStr || parseTargetDate(q)
      const targetHour = updatedContext.lastHour !== undefined ? updatedContext.lastHour : parseTargetHour(q)

      const displayHourStr = targetHour !== null && targetHour !== undefined
        ? (targetHour > 12 ? `${targetHour - 12}:00 PM` : `${targetHour}:00 AM`)
        : 'the requested time'

      // Query live availability for the corrected venue
      const liveRes = await queryAuthoritativeAvailability(targetVenue, targetDate, targetHour)

      return {
        response: {
          text: `You're right, my apologies for the mix-up! You meant the ${targetVenue.shortName}. Let me check its ${displayHourStr} availability for you.\n\n${liveRes.text}`,
          actionLink: liveRes.actionLink,
          suggestions: liveRes.suggestions,
        },
        updatedContext,
      }
    }
  }

  // --------------------------------------------------------------------------
  // B. NATURAL GREETINGS & CONVERSATIONAL PHRASES
  // --------------------------------------------------------------------------
  if (['hi', 'hello', 'hey', 'hii', 'hiii', 'heyy', 'hola'].includes(q)) {
    return {
      response: {
        text: "Hi! 👋 Welcome to Maqbool Sports Complex. How can I help you today? You can ask me about bookings, available slots, pricing, cricket, football, facilities, or anything else about MSC.",
        suggestions: ['⚽ Football Turf', '🏏 Cricket Nets', '📅 Check Availability', '💰 View Pricing'],
      },
      updatedContext,
    }
  }

  if (q.includes('salam') || q.includes('assalamu alaikum') || q.includes('assalamualaikum') || q.includes('asalam')) {
    return {
      response: {
        text: "Wa Alaikum Assalam! 👋 Welcome to Maqbool Sports Complex. How can I assist you with your booking or facility questions today?",
        suggestions: ['📅 Available Slots Today', '💰 View Pricing', '⚽ Football Turf', '🏏 Cricket Nets'],
      },
      updatedContext,
    }
  }

  if (q.includes('namaste') || q.includes('namaskar')) {
    return {
      response: {
        text: "Namaste! 🙏 Welcome to Maqbool Sports Complex. How can I help you today?",
        suggestions: ['🏏 Cricket Facilities', '⚽ Football Turf', '📅 Check Slots', '💰 Pricing'],
      },
      updatedContext,
    }
  }

  if (q.includes('good morning')) {
    return {
      response: {
        text: "Good morning! ☀️ Welcome to MSC. We're open from 6:00 AM to 11:00 PM today. What sport or facility would you like to explore?",
        suggestions: ['📅 Slots Today', '⚽ Football Turf', '🏏 Cricket Nets'],
      },
      updatedContext,
    }
  }

  if (q.includes('good evening') || q.includes('good afternoon')) {
    return {
      response: {
        text: "Good evening! 🌙 Floodlights are on at MSC! How can I help with your match or practice session tonight?",
        suggestions: ['📅 Slots Tonight', '⚽ Football Turf', '🏏 Cricket Nets'],
      },
      updatedContext,
    }
  }

  if (['ok', 'okay', 'great', 'awesome', 'got it', 'sure', 'alright', 'cool', 'perfect', 'noted'].includes(q)) {
    return {
      response: {
        text: "Absolutely 👍 If you need anything, I'm right here. You can ask me about available slots, bookings, pricing, or our facilities.",
        suggestions: ['📅 Check Availability', '📖 How to Book', '💰 Pricing'],
      },
      updatedContext,
    }
  }

  if (q.includes('thank') || q.includes('thx') || q.includes('shukriya') || q.includes('dhanyawad')) {
    return {
      response: {
        text: "You're most welcome! 😊 Feel free to ask if you have any other questions. See you on the turf! 🏏⚽",
        actionLink: { label: 'Book Your Slot', href: '/book-now' },
      },
      updatedContext,
    }
  }

  if (['bye', 'goodbye', 'see you', 'cya', 'tata', 'good bye', 'khuda hafiz', 'allah hafiz'].includes(q)) {
    return {
      response: {
        text: "Goodbye! 👋 Hope to see you at Maqbool Sports Complex soon. Have a great game ahead!",
      },
      updatedContext,
    }
  }

  // --------------------------------------------------------------------------
  // C. DYNAMIC CANCELLATION TIME CALCULATIONS
  // E.g. "My booking is at 8 PM, can I cancel at 4 PM?"
  // --------------------------------------------------------------------------
  if (q.includes('cancel') || q.includes('cancellation')) {
    const bookingTimeMatch = q.match(/(?:booking|match|session|booked)(?:\s+(?:is|at|for))?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
    const cancelTimeMatch = q.match(/(?:cancel|cancelling)(?:\s+(?:is|at|around))?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)

    if (bookingTimeMatch && cancelTimeMatch) {
      let bHour = parseInt(bookingTimeMatch[1], 10)
      const bIsPM = bookingTimeMatch[3].toLowerCase() === 'pm'
      if (bIsPM && bHour !== 12) bHour += 12
      if (!bIsPM && bHour === 12) bHour = 0

      let cHour = parseInt(cancelTimeMatch[1], 10)
      const cIsPM = cancelTimeMatch[3].toLowerCase() === 'pm'
      if (cIsPM && cHour !== 12) cHour += 12
      if (!cIsPM && cHour === 12) cHour = 0

      const hoursDiff = bHour - cHour

      if (hoursDiff > 5) {
        return {
          response: {
            text: `Yes. If your booking is at ${bookingTimeMatch[1]} ${bookingTimeMatch[3].toUpperCase()} and you cancel at ${cancelTimeMatch[1]} ${cancelTimeMatch[3].toUpperCase()} (${hoursDiff} hours notice), you are outside the 5-hour cutoff. You are eligible for cancellation and refund under the MSC policy.`,
            actionLink: { label: 'Cancellation Policy Details', href: '/cancellation-policy', policy: 'cancellation' },
          },
          updatedContext,
        }
      } else {
        return {
          response: {
            text: `Unfortunately, that is inside the 5-hour cutoff (${hoursDiff > 0 ? `${hoursDiff} hours remaining` : 'already past'}). Cancellation and refund requests made 5 hours or less before the booking time are strictly not entertained under the standard policy.`,
            actionLink: { label: 'View Cancellation Policy', href: '/cancellation-policy', policy: 'cancellation' },
          },
          updatedContext,
        }
      }
    }

    if (q.includes('can i cancel') || q.includes('how to cancel') || q.includes('cancellation policy') || q.includes('cancellation window') || q.includes('cancel my booking')) {
      return {
        response: {
          text: "Yes, cancellation requests are accepted only when they are made STRICTLY MORE THAN 5 HOURS before the scheduled booking time. The 5-hour cutoff is strict, so a request made at 5 hours or less remaining is not eligible for cancellation or refund.",
          actionLink: { label: 'Open Cancellation Policy', href: '/cancellation-policy', policy: 'cancellation' },
          suggestions: ['💳 Refund Policy', '📖 Book a Slot', '📞 Contact Support'],
        },
        updatedContext,
      }
    }
  }

  // --------------------------------------------------------------------------
  // D. UPCOMING / ROADMAP SPORTS (Zero Hallucination)
  // --------------------------------------------------------------------------
  for (const upcoming of MSC_KNOWLEDGE.upcomingSports) {
    const sName = upcoming.name.toLowerCase()
    if (q.includes(sName) || (sName.includes('basketball') && q.includes('hoop')) || (sName.includes('volleyball') && q.includes('volley'))) {
      return {
        response: {
          text: upcoming.response,
          suggestions: ['⚽ Football Turf', '🏏 Cricket Nets', '💰 View Pricing'],
        },
        updatedContext,
      }
    }
  }

  // --------------------------------------------------------------------------
  // E. PRICING INQUIRIES
  // --------------------------------------------------------------------------
  const isPricingQuery = q.includes('price') || q.includes('pricing') || q.includes('cost') || q.includes('rate') || q.includes('how much') || q.includes('charge')

  if (isPricingQuery) {
    const entity = resolveVenueEntity(q, updatedContext)

    if (entity.type === 'resolved') {
      const v = entity.venue
      updatedContext.lastVenueId = v.id
      return {
        response: {
          text: `${v.name} is ₹${v.defaultBasePrice} per hour${v.id === 'football-turf' ? ' (includes high-lux floodlights and 10,000+ sq. ft. synthetic turf)' : ' (pro turf with protective netting)'}. You can pay online in full or reserve with a 50% advance.`,
          actionLink: { label: `Book ${v.shortName}`, href: `/book-now?venue=${v.id}` },
          suggestions: [`Is ${v.shortName} available tonight?`, 'Check Tomorrow Slots', 'Refund Policy'],
        },
        updatedContext,
      }
    }

    if (entity.type === 'bowling_machine') {
      return {
        response: {
          text: "The Automated Speed-Variable Bowling Machine add-on is ₹299 per hour and can be used on Cricket Net 2.",
          actionLink: { label: 'Book Cricket Net 2 with Machine', href: '/book-now?venue=cricket-net-2' },
          suggestions: ['🏏 Cricket Net 1', '⚽ Football Turf', '📅 Check Availability'],
        },
        updatedContext,
      }
    }

    return {
      response: {
        text: "Here are our authoritative prices:\n\n• Football Turf (7-a-side): ₹999 / hour\n• Cricket Net 1: ₹299 / hour\n• Cricket Net 2: ₹299 / hour\n• Automated Bowling Machine: ₹299 / hour\n\nYou can pay in full or choose a 50% advance online.",
        actionLink: { label: 'Reserve at These Rates', href: '/book-now' },
        suggestions: ['📅 Check Available Slots', '📖 Booking Process', '❌ Cancellation Policy'],
      },
      updatedContext,
    }
  }

  // --------------------------------------------------------------------------
  // F. REAL-TIME AVAILABILITY & TIME SLOT QUERIES
  // --------------------------------------------------------------------------
  const targetDateStr = parseTargetDate(q)
  const targetHour = parseTargetHour(q)
  const hasTimeIndicator = targetHour !== null || q.includes('slot') || q.includes('available') || q.includes('free') || q.includes('open') || q.includes('booked') || q.includes('tonight') || q.includes('today') || q.includes('tomorrow')

  if (hasTimeIndicator) {
    if (targetHour !== null) updatedContext.lastHour = targetHour
    updatedContext.lastDateStr = targetDateStr

    // Resolve Facility Entity
    const entityResult = resolveVenueEntity(q, updatedContext)

    // Case 1: Canonical Venue Resolved (e.g. Football Turf, Cricket Net 1, Cricket Net 2)
    if (entityResult.type === 'resolved') {
      const targetVenue = entityResult.venue
      updatedContext.lastVenueId = targetVenue.id

      const liveResponse = await queryAuthoritativeAvailability(targetVenue, targetDateStr, targetHour)
      return { response: liveResponse, updatedContext }
    }

    // Case 2: User asked generic "cricket net" / "nets" without specifying Net 1 vs Net 2
    if (entityResult.type === 'cricket_nets_ambiguous') {
      const timeStr = targetHour !== null ? (targetHour > 12 ? `${targetHour - 12} PM` : `${targetHour} AM`) : 'today'
      return {
        response: {
          text: `We have two professional cricket practice nets! Which one would you like to check for ${timeStr}: Cricket Net 1 or Cricket Net 2 (with Bowling Machine hookup)?`,
          suggestions: [
            `Cricket Net 1 at ${timeStr}`,
            `Cricket Net 2 at ${timeStr}`,
            'Football Turf',
          ],
        },
        updatedContext,
      }
    }

    // Case 3: User asked generic "cricket"
    if (entityResult.type === 'cricket_general') {
      return {
        response: {
          text: "We offer cricket on our full 10,000+ sq. ft. turf (₹999/hr) as well as dedicated practice nets (₹299/hr). Which one would you like to check: Full Turf, Cricket Net 1, or Cricket Net 2?",
          suggestions: ['⚽ Football/Cricket Turf', '🏏 Cricket Net 1', '🏏 Cricket Net 2'],
        },
        updatedContext,
      }
    }

    // Case 4: No Venue Specified At All (e.g. "Is 9 PM slot open?")
    // NEVER GUESS. ASK CLARIFICATION.
    const timeDisplay = targetHour !== null ? (targetHour > 12 ? `${targetHour - 12}:00 PM` : `${targetHour}:00 AM`) : 'that time'
    return {
      response: {
        text: `Sure. Which facility would you like to check for ${timeDisplay}: Football Turf, Cricket Net 1, or Cricket Net 2?`,
        suggestions: [
          `Football Turf at ${timeDisplay}`,
          `Cricket Net 1 at ${timeDisplay}`,
          `Cricket Net 2 at ${timeDisplay}`,
        ],
      },
      updatedContext,
    }
  }

  // --------------------------------------------------------------------------
  // G. EXPLICIT FACILITY DISCOVERY (e.g. "football turf", "cricket net 1")
  // --------------------------------------------------------------------------
  const directEntity = resolveVenueEntity(q)
  if (directEntity.type === 'resolved') {
    const v = directEntity.venue
    updatedContext.lastVenueId = v.id
    return {
      response: {
        text: `You selected the ${v.name} (${v.emoji} ₹${v.defaultBasePrice}/hour). What date or time slot would you like to check for availability?`,
        actionLink: { label: `Book ${v.shortName}`, href: `/book-now?venue=${v.id}` },
        suggestions: ['Available Today', 'Available Tonight', 'Available Tomorrow', 'View Pricing'],
      },
      updatedContext,
    }
  }

  // --------------------------------------------------------------------------
  // H. REFUND POLICY, LOCATION, CONTACT, AND SUPPORT HANDOFF
  // --------------------------------------------------------------------------
  if (q.includes('refund') || q.includes('money back')) {
    return {
      response: {
        text: "Under MSC policy, refunds are eligible when a cancellation is requested strictly MORE THAN 5 HOURS prior to the session start time. Approved refunds are credited back to your original payment method in 5–7 business days.",
        actionLink: { label: 'Open Refund Policy', href: '/refund-policy', policy: 'refund' },
        suggestions: ['❌ Cancellation Policy', '📞 Contact Accounts', '📖 Book a Slot'],
      },
      updatedContext,
    }
  }

  if (q.includes('location') || q.includes('where are you') || q.includes('address') || q.includes('where is msc') || q.includes('reach')) {
    return {
      response: {
        text: `Maqbool Sports Complex is located at ${MSC_KNOWLEDGE.complex.address}. We're open all 7 days from 6:00 AM to 11:00 PM. Call us at ${MSC_KNOWLEDGE.complex.contact.phone} for directions!`,
        actionLink: { label: 'View Contact & Map', href: '/contact' },
        suggestions: ['📞 Call +91 9682558775', '📅 Book a Slot', '💰 Pricing'],
      },
      updatedContext,
    }
  }

  if (
    q.includes('payment failed') ||
    q.includes('payment issue') ||
    q.includes('dispute') ||
    q.includes('complaint') ||
    q.includes('talk to human') ||
    q.includes('speak to staff') ||
    q.includes('corporate') ||
    q.includes('tournament booking')
  ) {
    return {
      response: {
        text: "I'd be glad to connect you with MSC management! For direct support with payments, accounts, or corporate bookings, please call us at +91 9682558775 or email info@maqboolsports.in.",
        actionLink: { label: 'Contact MSC Support', href: '/contact' },
      },
      updatedContext,
    }
  }

  if (q.includes('what is msc') || q.includes('about msc') || q.includes('tell me about')) {
    return {
      response: {
        text: "Maqbool Sports Complex (MSC) is Baramulla's premier sports hub featuring 10,000+ sq. ft. of FIFA-grade synthetic turf, 2 professional cricket nets, automated bowling machine training, and floodlights. Open daily from 6 AM to 11 PM.",
        actionLink: { label: 'Explore Facilities', href: '/facilities' },
        suggestions: ['⚽ Football Turf', '🏏 Cricket Nets', '💰 Pricing', '📅 Book Now'],
      },
      updatedContext,
    }
  }

  // --------------------------------------------------------------------------
  // I. SAFE FALLBACK (No Hallucination)
  // --------------------------------------------------------------------------
  return {
    response: {
      text: "I'm not completely sure I understood that. Could you rephrase it? You can ask me about MSC bookings, sports, facilities, pricing, availability, cancellation, refunds, or anything else related to the complex.",
      suggestions: ['⚽ Football Turf', '🏏 Cricket Nets', '📅 Availability', '💰 Pricing', '❌ Cancellation Policy'],
    },
    updatedContext,
  }
}
