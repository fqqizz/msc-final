// ============================================================================
// MSC (Maqbool Sports Complex) — Authoritative Policy Architecture
// Single Source of Truth for Cancellation Policy, Refund Policy & Terms
// ============================================================================

export interface PolicySection {
  title: string
  content: string | string[]
  badge?: string
}

export interface PolicyDocument {
  id: 'cancellation' | 'refund' | 'terms'
  title: string
  subtitle: string
  lastUpdated: string
  summary: {
    highlight: string
    description: string
  }
  sections: PolicySection[]
}

/**
 * Strict Cancellation Eligibility Check:
 * Rule: Cancellation is permitted STRICTLY MORE THAN 5 HOURS before scheduled start time.
 * At 5 hours 0 minutes: NOT ELIGIBLE.
 * At 4 hours 59 minutes: NOT ELIGIBLE.
 * At 5 hours 1 minute: ELIGIBLE.
 */
export function isCancellationEligible(
  bookingStartTime: string | Date | number,
  currentTime: string | Date | number = new Date()
): {
  isEligible: boolean
  hoursRemaining: number
  minutesRemaining: number
  statusMessage: string
} {
  const startMs = new Date(bookingStartTime).getTime()
  const nowMs = new Date(currentTime).getTime()
  const diffMs = startMs - nowMs

  const hoursRemaining = diffMs / (1000 * 60 * 60)
  const minutesRemaining = Math.floor(diffMs / (1000 * 60))

  // STRICTLY MORE THAN 5 HOURS (diffMs > 5 * 3600 * 1000)
  const isEligible = diffMs > 5 * 60 * 60 * 1000

  let statusMessage = ''
  if (diffMs <= 0) {
    statusMessage = 'Booking session has already started or concluded. Non-cancellable.'
  } else if (isEligible) {
    statusMessage = `Eligible for cancellation (${hoursRemaining.toFixed(1)} hours remaining until start time). Request is outside the strict 5-hour cutoff.`
  } else {
    statusMessage = `Non-cancellable (${hoursRemaining.toFixed(1)} hours remaining). Requests within 5 hours or less before session start are strictly not entertained.`
  }

  return {
    isEligible,
    hoursRemaining: Math.max(0, Number(hoursRemaining.toFixed(2))),
    minutesRemaining: Math.max(0, minutesRemaining),
    statusMessage,
  }
}

// ----------------------------------------------------------------------------
// 1. CANCELLATION POLICY
// ----------------------------------------------------------------------------
export const cancellationPolicy: PolicyDocument = {
  id: 'cancellation',
  title: 'Cancellation Policy',
  subtitle: 'Clear, transparent cancellation guidelines for Maqbool Sports Complex bookings.',
  lastUpdated: 'August 2026',
  summary: {
    highlight: 'Strict 5-Hour Notice Window',
    description: 'Cancellations must be requested strictly more than 5 hours prior to the scheduled booking start time to qualify for cancellation or refund processing.',
  },
  sections: [
    {
      title: '1. Strict 5-Hour Advance Notice Rule',
      content: [
        'All cancellation or rescheduling requests must be submitted strictly more than 5 hours (300+ minutes) prior to the booked session start time.',
        'Requests submitted at exactly 5 hours remaining (e.g. at 3:00 PM for an 8:00 PM booking) or less than 5 hours remaining are strictly NOT eligible.',
        'Once a booking enters the restricted 5-hour window, the slot is locked and cannot be cancelled or refunded under standard policy.',
      ],
    },
    {
      title: '2. Time Calculation & Examples',
      content: [
        'Example: For a match scheduled at 8:00 PM:',
        '• Request at 2:59 PM (5h 01m remaining) → Eligible for cancellation.',
        '• Request at 3:00 PM (5h 00m remaining) → NOT eligible for cancellation.',
        '• Request at 4:00 PM (4h 00m remaining) → NOT eligible for cancellation.',
        '• Request at 7:00 PM (1h 00m remaining) → NOT eligible for cancellation.',
      ],
    },
    {
      title: '3. No-Show Policy',
      content: [
        'Players or teams who fail to arrive for their confirmed booking (No-Show) forfeit the entire booking amount.',
        'No refunds, credits, or automatic reschedulings are provided for no-shows.',
      ],
    },
    {
      title: '4. Rescheduling Requests',
      content: [
        'Rescheduling is permitted only if requested more than 5 hours prior to the original slot.',
        'All rescheduled slots are subject to venue and slot availability in the booking calendar.',
      ],
    },
    {
      title: '5. Facility & Weather Exceptions',
      content: [
        'In the rare event that Maqbool Sports Complex must close due to severe unplayable weather, power outages, or mandatory facility maintenance, full cancellations or priority rescheduling will be coordinated by MSC management.',
      ],
    },
    {
      title: '6. How to Submit a Cancellation',
      content: [
        'To cancel an eligible booking, use the cancellation option in your customer profile dashboard or contact MSC support at info@maqboolsports.in or +91 9682558775 with your Booking Reference number.',
      ],
    },
  ],
}

// ----------------------------------------------------------------------------
// 2. REFUND POLICY
// ----------------------------------------------------------------------------
export const refundPolicy: PolicyDocument = {
  id: 'refund',
  title: 'Refund Policy',
  subtitle: 'Understanding refund processing, eligibility criteria, and payment workflows at MSC.',
  lastUpdated: 'August 2026',
  summary: {
    highlight: 'Fair & Transparent Refunds',
    description: 'Eligible booking cancellations submitted outside the 5-hour window are processed back to the original payment method.',
  },
  sections: [
    {
      title: '1. Distinction Between Cancellation & Refund',
      content: [
        'Cancellation is the operational release of your reserved sports pitch or cricket net.',
        'A Refund is the financial return of funds paid, which is governed by your cancellation timing and payment mode.',
      ],
    },
    {
      title: '2. Refund Eligibility Criteria',
      content: [
        'Refunds are approved exclusively under the following verified conditions:',
        '• Valid booking cancellations submitted strictly more than 5 hours before session start time.',
        '• Session cancelled by Maqbool Sports Complex due to weather, maintenance, or unavoidable operational factors.',
        '• Verified duplicate payments or technical double-charge transactions on the payment gateway.',
      ],
    },
    {
      title: '3. Non-Refundable Situations',
      content: [
        'Refunds are strictly NOT provided for:',
        '• Cancellations made 5 hours or less prior to the scheduled start time.',
        '• Player or team No-Shows.',
        '• Tournament, championship, or league registration fees once confirmed.',
        '• Active membership subscriptions after activation.',
      ],
    },
    {
      title: '4. Refund Processing Timeline',
      content: [
        'Approved refunds are initiated through our payment gateway (Razorpay) back to the original source payment method (UPI, Bank Account, Credit/Debit Card).',
        'Standard bank processing typically takes 5 to 7 business days depending on your banking institution.',
      ],
    },
    {
      title: '5. Partial & Advance Payments',
      content: [
        'For bookings confirmed under the 50% advance payment option, any eligible refund is calculated based on the actual advance amount paid.',
      ],
    },
    {
      title: '6. Support & Inquiries',
      content: [
        'For payment disputes or refund tracking, email info@maqboolsports.in with your Booking ID and Razorpay Payment Reference.',
      ],
    },
  ],
}

// ----------------------------------------------------------------------------
// 3. TERMS & CONDITIONS
// ----------------------------------------------------------------------------
export const termsAndConditions: PolicyDocument = {
  id: 'terms',
  title: 'Terms & Conditions',
  subtitle: 'General rules, facility regulations, and terms of service for Maqbool Sports Complex.',
  lastUpdated: 'August 2026',
  summary: {
    highlight: 'Safe & Respectful Sportsmanship',
    description: 'By booking or entering Maqbool Sports Complex, all players and guests agree to adhere to our complex regulations.',
  },
  sections: [
    {
      title: '1. Facility Use & Conduct',
      content: [
        'All visitors, players, and teams must comply with the directives of MSC staff and match referees.',
        'Respectful conduct towards fellow players, officials, and facility infrastructure is strictly required.',
        'Smoking, alcohol consumption, and prohibited substances are strictly banned within the complex premises.',
      ],
    },
    {
      title: '2. Footwear & Equipment Guidelines',
      content: [
        'Football Turf: Rubber-studded turf shoes or standard flat sports sneakers only. Metal spikes or sharp studs are strictly prohibited to protect the synthetic pitch.',
        'Cricket Nets: Helmets and protective gear are mandatory while batting against pace or the automated bowling machine.',
      ],
    },
    {
      title: '3. Bookings & Timings',
      content: [
        'All bookings must be confirmed in advance via the website or complex reception.',
        'Sessions begin and end strictly at the booked time. Please vacate the playing surface promptly at the conclusion of your allocated hour to respect incoming players.',
      ],
    },
    {
      title: '4. Safety, Liability & Property Damage',
      content: [
        'All players participate at their own risk. Maqbool Sports Complex is not liable for personal injuries or lost belongings.',
        'Any deliberate damage to floodlights, netting, synthetic turf, or automated bowling machines will be charged to the responsible individual or team.',
      ],
    },
    {
      title: '5. Automated Bowling Machine Rules',
      content: [
        'The automated bowling machine must be operated under the supervision of trained MSC staff.',
        'Unauthorized tampering with machine speed or feeding mechanics is prohibited.',
      ],
    },
    {
      title: '6. Amendments to Terms',
      content: [
        'Maqbool Sports Complex reserves the right to modify these terms and operational guidelines at any time.',
      ],
    },
  ],
}

// Map of all policy documents
export const POLICIES: Record<'cancellation' | 'refund' | 'terms', PolicyDocument> = {
  cancellation: cancellationPolicy,
  refund: refundPolicy,
  terms: termsAndConditions,
}
