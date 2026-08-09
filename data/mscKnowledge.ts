// ============================================================================
// MSC (Maqbool Sports Complex) — Authoritative Knowledge Base
// Structured Knowledge Architecture for Customer Chatbot & Assistant
// ============================================================================

export interface SportFacility {
  name: string
  slug: string
  sport: 'cricket' | 'football' | 'upcoming'
  description: string
  basePrice: number
  unit: string
  capacity: string
  dimensions: string
  features: string[]
  isAvailable: boolean
}

export const MSC_KNOWLEDGE = {
  complex: {
    name: 'Maqbool Sports Complex (MSC)',
    tagline: 'Premier Sports Hub in Baramulla, Kashmir',
    shortDescription:
      'Nestled amidst the scenic mountain landscapes of Baramulla, MSC features 10,000+ sq. ft. of FIFA-grade synthetic turf, two professional cricket nets, automated bowling machine training, and professional floodlights.',
    city: 'Baramulla',
    state: 'Jammu & Kashmir',
    pincode: '193101',
    address: 'Sangri Colony, Baramulla, Jammu and Kashmir, 193101',
    landmark: 'Near Sangri Colony, Baramulla',
    operatingHours: {
      openTime: '6:00 AM',
      closeTime: '11:00 PM',
      days: 'Open all 7 days a week (Monday to Sunday)',
      slotDuration: '60 minutes per slot',
      peakHours: 'Evening floodlit slots (5:00 PM to 10:00 PM) are in high demand.',
    },
    contact: {
      phone: '+91 9682558775',
      displayPhone: '+91 9682558775',
      email: 'info@maqboolsports.in',
      instagram: '@msc_baramulla',
      instagramUrl: 'https://www.instagram.com/msc_baramulla',
      facebookUrl: 'https://www.facebook.com/profile.php?id=61579371065902',
      website: 'https://maqboolsports.in',
    },
  },

  pricing: {
    footballTurf: {
      name: 'Football Turf (7-a-side / Full Ground)',
      slug: 'football-turf',
      rate: 999,
      unit: '₹999 / hour',
      description: '10,000+ sq. ft. multi-sport synthetic turf with high-lux floodlights.',
    },
    cricketNet1: {
      name: 'Cricket Net 1',
      slug: 'cricket-net-1',
      rate: 299,
      unit: '₹299 / hour',
      description: 'Pro cricket practice net with high-grade polyurethane turf and heavy-duty netting.',
    },
    cricketNet2: {
      name: 'Cricket Net 2',
      slug: 'cricket-net-2',
      rate: 299,
      unit: '₹299 / hour',
      description: 'Secondary pro cricket net with optional automated bowling machine hookup.',
    },
    bowlingMachine: {
      name: 'Automated Bowling Machine Add-On',
      code: 'BM-CRICKET-01',
      rate: 299,
      unit: '₹299 / hour',
      description: 'Speed-variable automated bowling machine with swing, pace, and spin controls.',
    },
    paymentModes: [
      '100% Full Online Payment via UPI, Cards, Net Banking',
      '50% Advance Online Payment (Remaining 50% payable at venue reception)',
    ],
  },

  facilities: [
    {
      name: 'Football Turf',
      slug: 'football-turf',
      sport: 'football',
      description: '10,000+ sq. ft. professional synthetic turf for 7-a-side football and box cricket.',
      basePrice: 999,
      unit: '₹999/hour',
      capacity: 'Up to 14 players (7v7)',
      dimensions: '10,000+ sq. ft.',
      features: ['High-lux LED floodlights', 'FIFA-grade synthetic turf', 'Marked boundaries', 'Goalposts with nets'],
      isAvailable: true,
    },
    {
      name: 'Cricket Net 1',
      slug: 'cricket-net-1',
      sport: 'cricket',
      description: 'Dedicated batting and bowling net with true-bounce polyurethane turf.',
      basePrice: 299,
      unit: '₹299/hour',
      capacity: 'Up to 6 players',
      dimensions: '22 yards length pitch',
      features: ['Protective netting', 'Floodlights', 'Stumps provided', 'Drinking water'],
      isAvailable: true,
    },
    {
      name: 'Cricket Net 2',
      slug: 'cricket-net-2',
      sport: 'cricket',
      description: 'Pro cricket net pitch with optional automated bowling machine access.',
      basePrice: 299,
      unit: '₹299/hour',
      capacity: 'Up to 6 players',
      dimensions: '22 yards length pitch',
      features: ['Bowling machine hookup', 'Protective netting', 'Floodlights', 'Stumps provided'],
      isAvailable: true,
    },
  ] as SportFacility[],

  upcomingSports: [
    {
      name: 'Basketball',
      emoji: '🏀',
      response:
        "Not yet! 🏀 We're working toward bringing more sports and facilities to MSC, including basketball courts. Stay tuned for updates! In the meantime, our football turf and cricket nets are fully open.",
    },
    {
      name: 'Pickleball',
      emoji: '🎾',
      response:
        "Not currently, but we'd love to bring more sports experiences like pickleball to MSC in the future. Stay tuned! 🎾",
    },
    {
      name: 'Volleyball',
      emoji: '🏐',
      response:
        "Volleyball isn't currently available at MSC, but we're always looking at new sports and facilities to add. Stay tuned! 🏐",
    },
    {
      name: 'Badminton / Tennis',
      emoji: '🏸',
      response:
        "Badminton & tennis courts are on our future roadmap as we expand MSC! Currently, we offer football turf, cricket nets, and automated bowling machine sessions.",
    },
  ],

  amenities: [
    'Professional high-lux LED floodlights for night matches',
    'Changing rooms & clean washrooms',
    'Complimentary parking space for two-wheelers and cars',
    'Pure chilled drinking water facility',
    'Spectator seating area with scenic mountain view',
    '24/7 CCTV surveillance and security',
  ],

  cancellationAndRefundSummary: {
    rule: 'Strictly MORE THAN 5 HOURS prior to scheduled booking start time.',
    cutoffDetails: 'Requests made 5 hours or less before session start are strictly non-cancellable and non-refundable.',
    refundProcessing: 'Approved refunds are credited back to the original payment source within 5–7 business days.',
    noShowPolicy: 'No-shows forfeit 100% of the booking fee.',
  },

  faqs: [
    {
      q: 'How do I book a slot at MSC?',
      a: 'Click "Book Now" on our website (maqboolsports.in/book-now), pick your date, choose your facility (Turf or Cricket Nets), select your 1-hour slots, and pay via UPI/Card (full or 50% advance).',
    },
    {
      q: 'Can I cancel my booking?',
      a: 'Yes, cancellations are permitted strictly MORE THAN 5 HOURS before your booked session start time. Requests made within 5 hours or less are non-cancellable and non-refundable.',
    },
    {
      q: 'What is the price of the football turf?',
      a: 'The football turf is ₹999 per hour. It includes full floodlights and 10,000+ sq. ft. playing area.',
    },
    {
      q: 'What is the price for cricket practice nets?',
      a: 'Cricket Net 1 and Cricket Net 2 are ₹299 per hour each. You can also add the automated bowling machine for ₹299/hour.',
    },
    {
      q: 'What are the operating hours of MSC?',
      a: 'MSC is open every day from 6:00 AM to 11:00 PM, all 7 days a week.',
    },
    {
      q: 'Is parking available at the complex?',
      a: 'Yes, MSC provides free parking for both cars and two-wheelers.',
    },
    {
      q: 'What footwear is allowed on the turf?',
      a: 'Rubber turf shoes or standard flat sports sneakers are recommended. Metal spikes or sharp studs are strictly prohibited.',
    },
    {
      q: 'Can we book for tournaments or corporate events?',
      a: 'Yes! For large tournaments or corporate bookings, please contact MSC management directly at +91 9682558775 or email info@maqboolsports.in.',
    },
  ],
}
