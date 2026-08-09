// ============================================================================
// MSC (Maqbool Sports Complex) — Intelligent Chatbot Service
// Context-Aware Natural Language Assistant with Real-Time Database Access
// ============================================================================

import { MSC_KNOWLEDGE } from '@/data/mscKnowledge'
import { isCancellationEligible } from '@/data/policies'
import { createClient } from '@/lib/supabase/client'
import { format, addDays } from 'date-fns'

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
  lastSport?: 'cricket' | 'football' | 'bowling_machine'
  lastVenueSlug?: string
  lastDateStr?: string
  lastHour?: number
}

// ----------------------------------------------------------------------------
// 1. GREETING & CONVERSATIONAL TOKEN DETECTOR
// ----------------------------------------------------------------------------
function handleConversationalPhrases(query: string): ChatbotResponse | null {
  const q = query.trim().toLowerCase()

  // Exact / simple greetings
  if (['hi', 'hello', 'hey', 'hii', 'hiii', 'heyy', 'hola'].includes(q)) {
    return {
      text: "Hi! 👋 Welcome to Maqbool Sports Complex. How can I help you today? You can ask me about bookings, available slots, pricing, cricket, football, facilities, or anything else about MSC.",
      suggestions: ['🏏 Cricket', '⚽ Football', '📅 Check Availability', '💰 Pricing'],
    }
  }

  // Islamic Greetings
  if (q.includes('salam') || q.includes('assalamu alaikum') || q.includes('assalamualaikum') || q.includes('asalam')) {
    return {
      text: "Wa Alaikum Assalam! 👋 Welcome to Maqbool Sports Complex. How can I assist you with your booking or facility questions today?",
      suggestions: ['📅 Available Slots Today', '💰 View Pricing', '⚽ Football Turf', '🏏 Cricket Nets'],
    }
  }

  // Indic Greetings
  if (q.includes('namaste') || q.includes('namaskar')) {
    return {
      text: "Namaste! 🙏 Welcome to Maqbool Sports Complex. How can I help you today?",
      suggestions: ['🏏 Cricket Facilities', '⚽ Football Turf', '📅 Check Slots'],
    }
  }

  // Time-based greetings
  if (q.includes('good morning')) {
    return {
      text: "Good morning! ☀️ Welcome to MSC. We're open from 6:00 AM to 11:00 PM today. What sport or facility would you like to explore?",
      suggestions: ['📅 Slots Today', '⚽ Book Turf', '🏏 Cricket Nets'],
    }
  }

  if (q.includes('good evening') || q.includes('good afternoon')) {
    return {
      text: "Good evening! 🌙 Floodlights are on at MSC! How can I help with your match or practice session tonight?",
      suggestions: ['📅 Slots Tonight', '⚽ Football Turf', '🏏 Cricket Nets'],
    }
  }

  // Acknowledgments
  if (['ok', 'okay', 'great', 'awesome', 'got it', 'sure', 'alright', 'cool', 'perfect', 'noted'].includes(q)) {
    return {
      text: "Absolutely 👍 If you need anything, I'm right here. You can ask me about available slots, bookings, pricing, or our facilities.",
      suggestions: ['📅 Check Availability', '📖 How to Book', '💰 Pricing'],
    }
  }

  // Gratitude
  if (q.includes('thank') || q.includes('thx') || q.includes('shukriya') || q.includes('dhanyawad')) {
    return {
      text: "You're most welcome! 😊 Feel free to ask if you need anything else. See you on the turf! 🏏⚽",
      actionLink: { label: 'Book Your Slot', href: '/book-now' },
    }
  }

  // Goodbyes
  if (['bye', 'goodbye', 'see you', 'cya', 'tata', 'good bye', 'khuda hafiz', 'allah hafiz'].includes(q)) {
    return {
      text: "Goodbye! 👋 Hope to see you at Maqbool Sports Complex soon. Have a great game ahead!",
    }
  }

  return null
}

// ----------------------------------------------------------------------------
// 2. DYNAMIC CANCELLATION TIME PARSER
// Evaluates explicit user times (e.g. "booking at 8 PM, can I cancel at 4 PM?")
// ----------------------------------------------------------------------------
function parseTimeHypothetical(query: string): ChatbotResponse | null {
  const q = query.toLowerCase()

  if (!q.includes('cancel') && !q.includes('cancellation')) return null

  // Pattern: "booking is at 8 pm" / "booked at 8:00" and "cancel at 4 pm" / "at 2 pm"
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
        text: `Yes! If your booking is at ${bookingTimeMatch[1]} ${bookingTimeMatch[3].toUpperCase()} and you cancel at ${cancelTimeMatch[1]} ${cancelTimeMatch[3].toUpperCase()} (${hoursDiff} hours notice), you are outside the 5-hour cutoff. You are eligible for cancellation and refund under the MSC policy.`,
        actionLink: { label: 'Cancellation Policy Details', href: '/cancellation-policy', policy: 'cancellation' },
      }
    } else {
      return {
        text: `Unfortunately, that is inside the 5-hour cutoff (${hoursDiff > 0 ? `${hoursDiff} hours remaining` : 'already past'}). Cancellation and refund requests made 5 hours or less before the booking time are strictly not entertained under the standard policy.`,
        actionLink: { label: 'View Cancellation Policy', href: '/cancellation-policy', policy: 'cancellation' },
      }
    }
  }

  // General cancellation question
  if (q.includes('can i cancel') || q.includes('how to cancel') || q.includes('cancellation policy') || q.includes('cancellation window') || q.includes('cancel my booking')) {
    return {
      text: "Yes, cancellation requests are accepted only when they are made STRICTLY MORE THAN 5 HOURS before the scheduled booking time. The 5-hour cutoff is strict, so a request made at 5 hours or less remaining is not eligible for cancellation or refund.",
      actionLink: { label: 'Open Cancellation Policy', href: '/cancellation-policy', policy: 'cancellation' },
      suggestions: ['💳 Refund Policy', '📖 Book a Slot', '📞 Contact Support'],
    }
  }

  return null
}

// ----------------------------------------------------------------------------
// 3. REAL-TIME DATABASE AVAILABILITY SERVICE
// Queries Supabase for actual live slots across Football Turf and Cricket Nets
// ----------------------------------------------------------------------------
async function queryRealtimeAvailability(
  sportOrVenue: string,
  targetDateStr: string,
  targetHour?: number
): Promise<ChatbotResponse> {
  const supabase = createClient()

  try {
    // 1. Fetch Venue matching sport
    const isFootball = sportOrVenue.includes('foot') || sportOrVenue.includes('turf') || sportOrVenue.includes('soccer')
    const venueSlug = isFootball ? 'football-turf' : (sportOrVenue.includes('net 2') ? 'cricket-net-2' : 'cricket-net-1')

    const { data: venue } = await supabase
      .from('venues')
      .select('id, name, sport_type')
      .eq('slug', venueSlug)
      .maybeSingle()

    const targetVenueId = venue?.id || (isFootball ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002')
    const venueName = venue?.name || (isFootball ? 'Football Turf' : 'Cricket Net 1')

    // 2. Query bookings and reservations for target date
    const startOfDay = `${targetDateStr}T00:00:00`
    const endOfDay = `${targetDateStr}T23:59:59`

    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time, booking_status')
      .eq('venue_id', targetVenueId)
      .neq('booking_status', 'cancelled')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)

    const { data: reservations } = await supabase
      .from('slot_reservations')
      .select('start_time, end_time, status')
      .eq('venue_id', targetVenueId)
      .eq('status', 'active')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)

    const bookedHours = new Set<number>()

    if (activeBookings) {
      activeBookings.forEach((b) => {
        const hour = new Date(b.start_time).getHours()
        bookedHours.add(hour)
      })
    }

    if (reservations) {
      reservations.forEach((r) => {
        const hour = new Date(r.start_time).getHours()
        bookedHours.add(hour)
      })
    }

    // If a specific hour was queried (e.g. 7 PM = 19)
    if (typeof targetHour === 'number') {
      const displayHour = targetHour > 12 ? `${targetHour - 12}:00 PM` : `${targetHour}:00 AM`
      const isBooked = bookedHours.has(targetHour)

      // Past check if date is today
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const currentHour = new Date().getHours()
      const isPast = targetDateStr === todayStr && targetHour <= currentHour

      if (isPast) {
        return {
          text: `The ${displayHour} slot for today has already passed. I can check the remaining evening slots for you.`,
          actionLink: { label: 'View Today Calendar', href: `/book-now?venue=${venueSlug}` },
          suggestions: ['Tonight 8 PM', 'Tonight 9 PM', 'Tomorrow Morning'],
        }
      }

      if (!isBooked) {
        return {
          text: `Yes! ${isFootball ? '⚽' : '🏏'} The ${displayHour} slot for ${venueName} on ${targetDateStr === todayStr ? 'today' : targetDateStr} is currently AVAILABLE. Would you like to reserve it?`,
          actionLink: { label: `Book ${displayHour} Slot`, href: `/book-now?venue=${venueSlug}&date=${targetDateStr}` },
          suggestions: ['How do I book?', 'What is the price?', 'Check another time'],
        }
      } else {
        return {
          text: `The ${displayHour} slot for ${venueName} on ${targetDateStr === todayStr ? 'today' : targetDateStr} is already booked. Would you like me to find the nearest free slot?`,
          actionLink: { label: 'Check Full Schedule', href: `/book-now?venue=${venueSlug}&date=${targetDateStr}` },
          suggestions: ['Check 8 PM', 'Check 9 PM', 'Check Tomorrow'],
        }
      }
    }

    // General availability list for the day (6 AM to 10 PM)
    const currentHour = targetDateStr === format(new Date(), 'yyyy-MM-dd') ? new Date().getHours() : -1
    const availableSlots: string[] = []

    for (let h = 6; h <= 22; h++) {
      if (h > currentHour && !bookedHours.has(h)) {
        const timeLabel = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`
        availableSlots.push(timeLabel)
      }
    }

    const dateLabel = targetDateStr === format(new Date(), 'yyyy-MM-dd') ? 'today' : `on ${targetDateStr}`

    if (availableSlots.length === 0) {
      return {
        text: `All slots for ${venueName} ${dateLabel} are currently fully booked! Would you like to check tomorrow's availability?`,
        actionLink: { label: 'Check Tomorrow', href: `/book-now?venue=${venueSlug}` },
      }
    }

    const preview = availableSlots.slice(0, 5).join(', ')
    const count = availableSlots.length

    return {
      text: `We have ${count} slot(s) open for ${venueName} ${dateLabel}! Free times include: ${preview}${count > 5 ? ' and more' : ''}.`,
      actionLink: { label: 'Pick Your Slot & Book', href: `/book-now?venue=${venueSlug}&date=${targetDateStr}` },
      suggestions: ['Check Evening Slots', 'How much is it?', 'What about tomorrow?'],
    }
  } catch (err) {
    console.error('Error querying real-time chatbot availability:', err)
    return {
      text: "Our facilities are open daily from 6:00 AM to 11:00 PM. You can view all real-time available slots and book directly on our booking page.",
      actionLink: { label: 'View Live Booking Calendar', href: '/book-now' },
    }
  }
}

// ----------------------------------------------------------------------------
// 4. MAIN INTENT PROCESSOR
// ----------------------------------------------------------------------------
export async function processChatbotMessage(
  userQuery: string,
  context: ConversationContext = {}
): Promise<{ response: ChatbotResponse; updatedContext: ConversationContext }> {
  const q = userQuery.trim().toLowerCase()
  let updatedContext = { ...context }

  // 1. Check Natural Conversational Greetings
  const conversational = handleConversationalPhrases(userQuery)
  if (conversational) {
    return { response: conversational, updatedContext }
  }

  // 2. Check Cancellation Time Calculation Questions
  const cancellationHypothetical = parseTimeHypothetical(userQuery)
  if (cancellationHypothetical) {
    return { response: cancellationHypothetical, updatedContext }
  }

  // 3. Upcoming / Not Yet Available Sports (Polite roadmap answers)
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

  // 4. Cricket Experience
  if (
    q === 'cricket' ||
    q === 'i want to play cricket' ||
    q === 'can i play cricket' ||
    q === 'i want cricket' ||
    q.includes('cricket facility') ||
    q.includes('box cricket')
  ) {
    updatedContext.lastSport = 'cricket'
    return {
      response: {
        text: "Absolutely! 🏏 We have cricket facilities at MSC. If you're coming with a team, you can reserve the full turf (₹999/hr). If you're looking for practice, we also have professional cricket nets (₹299/hr), and automated bowling-machine practice is available too (₹299/hr). Would you like me to check available slots for you?",
        actionLink: { label: 'Book Cricket Facility', href: '/book-now?venue=cricket-net-1' },
        suggestions: ['Nets', 'Full Turf', 'Check Available Slots', 'Bowling Machine'],
      },
      updatedContext,
    }
  }

  // Cricket Nets Specific
  if (q === 'nets' || q.includes('cricket net') || q.includes('batting practice') || q.includes('bowling machine')) {
    updatedContext.lastSport = 'cricket'
    updatedContext.lastVenueSlug = 'cricket-net-1'
    return {
      response: {
        text: "Great! 🏏 Our cricket nets feature pro polyurethane turf and high-tension protective netting (₹299/hour). We also have the automated speed-variable bowling machine hookup at Net 2. What date or time are you looking to practice?",
        actionLink: { label: 'Book Cricket Nets', href: '/book-now?venue=cricket-net-1' },
        suggestions: ['Available Today', 'Available Tomorrow', 'How much is it?'],
      },
      updatedContext,
    }
  }

  // 5. Football Experience
  if (
    q === 'football' ||
    q === 'we want to play football' ||
    q === 'i want to play football' ||
    q.includes('soccer') ||
    q.includes('7v7') ||
    q.includes('7-a-side')
  ) {
    updatedContext.lastSport = 'football'
    updatedContext.lastVenueSlug = 'football-turf'
    return {
      response: {
        text: "Absolutely! ⚽ MSC has a dedicated 10,000+ sq. ft. 7-a-side synthetic football turf with high-lux floodlights (₹999/hour). Would you like me to check available slots and pricing for you?",
        actionLink: { label: 'Book Football Turf', href: '/book-now?venue=football-turf' },
        suggestions: ['What slots are free today?', 'Tomorrow Evening', 'What is the price?'],
      },
      updatedContext,
    }
  }

  // 6. Pricing Questions
  if (
    q.includes('price') ||
    q.includes('pricing') ||
    q.includes('cost') ||
    q.includes('rate') ||
    q.includes('how much') ||
    q.includes('charge') ||
    q.includes('charges')
  ) {
    const isSpecificFootball = q.includes('football') || q.includes('turf')
    const isSpecificCricket = q.includes('cricket') || q.includes('net')
    const isSpecificBowling = q.includes('bowling') || q.includes('machine')

    let priceText = ''
    if (isSpecificFootball) {
      priceText = "Our 10,000+ sq. ft. Football Turf is ₹999 per hour, which includes high-lux floodlights and goalposts."
    } else if (isSpecificCricket) {
      priceText = "Cricket Net 1 and Cricket Net 2 are ₹299 per hour each. You can also add the automated bowling machine for ₹299/hour."
    } else if (isSpecificBowling) {
      priceText = "The Automated Speed-Variable Bowling Machine add-on is ₹299 per hour and can be used on Cricket Net 2."
    } else {
      priceText = "Here are our authoritative prices:\n\n• Football Turf (7-a-side): ₹999 / hour\n• Cricket Net 1: ₹299 / hour\n• Cricket Net 2: ₹299 / hour\n• Automated Bowling Machine: ₹299 / hour\n\nYou can pay in full or choose a 50% advance online."
    }

    return {
      response: {
        text: priceText,
        actionLink: { label: 'Reserve at These Rates', href: '/book-now' },
        suggestions: ['📅 Check Available Slots', '📖 Booking Process', '❌ Cancellation Policy'],
      },
      updatedContext,
    }
  }

  // 7. Real-Time Slot Availability & Date Queries
  const isAvailabilityQuery =
    q.includes('available') ||
    q.includes('slot') ||
    q.includes('free') ||
    q.includes('open') ||
    q.includes('booked') ||
    q.includes('tonight') ||
    q.includes('today') ||
    q.includes('tomorrow') ||
    q.match(/\b\d{1,2}\s*(am|pm|pm\b|am\b)/i)

  if (isAvailabilityQuery) {
    let targetDateStr = format(new Date(), 'yyyy-MM-dd')
    if (q.includes('tomorrow')) {
      targetDateStr = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    }

    // Parse target hour if specified (e.g. 7 PM = 19, 6 AM = 6)
    let targetHour: number | undefined = undefined
    const timeMatch = q.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)

    if (timeMatch && (q.includes('pm') || q.includes('am') || q.includes('at') || q.includes('around') || q.includes('is'))) {
      let h = parseInt(timeMatch[1], 10)
      const isPM = timeMatch[3]?.toLowerCase() === 'pm' || (!timeMatch[3] && (q.includes('evening') || q.includes('night') || h < 6))
      if (isPM && h !== 12 && h < 12) h += 12
      if (h >= 6 && h <= 23) {
        targetHour = h
      }
    }

    if (q.includes('tonight') || q.includes('this evening')) {
      if (targetHour === undefined) targetHour = 19 // Default evening inquiry
    }

    const sport = updatedContext.lastSport || (q.includes('cricket') ? 'cricket' : 'football')
    const dynamicRes = await queryRealtimeAvailability(sport, targetDateStr, targetHour)

    return { response: dynamicRes, updatedContext }
  }

  // 8. Refund Policy Inquiries
  if (q.includes('refund') || q.includes('money back') || q.includes('payment return')) {
    return {
      response: {
        text: "Under MSC policy, refunds are eligible when a cancellation is requested strictly MORE THAN 5 HOURS prior to the session start time. Approved refunds are credited back to your original payment method in 5–7 business days.",
        actionLink: { label: 'Open Refund Policy', href: '/refund-policy', policy: 'refund' },
        suggestions: ['❌ Cancellation Policy', '📞 Contact Accounts', '📖 Book a Slot'],
      },
      updatedContext,
    }
  }

  // 9. Location & Contact Inquiries
  if (q.includes('location') || q.includes('where are you') || q.includes('address') || q.includes('where is msc') || q.includes('reach')) {
    return {
      response: {
        text: `Maqbool Sports Complex is located at ${MSC_KNOWLEDGE.complex.address}. We're open all 7 days from 6:00 AM to 11:00 PM. Call us at ${MSC_KNOWLEDGE.complex.contact.phone} for quick directions!`,
        actionLink: { label: 'View Contact & Map', href: '/contact' },
        suggestions: ['📞 Call +91 9682558775', '📅 Book a Slot', '💰 Pricing'],
      },
      updatedContext,
    }
  }

  // 10. Human Support Handoff (Payment disputes, technical problems, corporate/large tournaments)
  if (
    q.includes('payment failed') ||
    q.includes('payment issue') ||
    q.includes('dispute') ||
    q.includes('complaint') ||
    q.includes('talk to human') ||
    q.includes('speak to staff') ||
    q.includes('corporate') ||
    q.includes('large tournament') ||
    q.includes('technical issue')
  ) {
    return {
      response: {
        text: "I'd be glad to connect you with MSC management! For direct support with payments, accounts, or corporate bookings, please call us at +91 9682558775 or email info@maqboolsports.in.",
        actionLink: { label: 'Contact MSC Support', href: '/contact' },
      },
      updatedContext,
    }
  }

  // 11. What is MSC / About
  if (q.includes('what is msc') || q.includes('about msc') || q.includes('tell me about')) {
    return {
      response: {
        text: "Maqbool Sports Complex (MSC) is Baramulla's premier sports hub featuring 10,000+ sq. ft. of FIFA-grade synthetic turf, 2 professional cricket nets, automated bowling machine training, and floodlights. We're open daily from 6 AM to 11 PM.",
        actionLink: { label: 'Explore Facilities', href: '/facilities' },
        suggestions: ['⚽ Football Turf', '🏏 Cricket Nets', '💰 Pricing', '📅 Book Now'],
      },
      updatedContext,
    }
  }

  // 12. Safe Fallback (No Hallucination)
  return {
    response: {
      text: "I'm not completely sure I understood that. Could you rephrase it? You can ask me about MSC bookings, sports, facilities, pricing, availability, cancellation, refunds, or anything else related to the complex.",
      suggestions: ['🏏 Cricket', '⚽ Football', '📅 Availability', '💰 Pricing', '❌ Cancellation Policy'],
    },
    updatedContext,
  }
}
