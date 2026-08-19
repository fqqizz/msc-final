'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
  Info,
  Loader2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
} from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  startOfToday,
} from 'date-fns'
import { openPolicyModal } from '@/components/policy-modal'
import { BowlingMachineIcon } from '@/components/icons/bowling-machine-icon'

type FacilityRecord = {
  id: string
  name: string
  slug: string
  sport_type: string
  description: string | null
  short_description: string | null
  status: string
  max_capacity: number
  surface_type: string | null
  amenities: string[]
  base_price?: number
}

type SlotItem = {
  hour: number
  label: string
  startTimeStr: string
  endTimeStr: string
  price: number
}

// Fallback facility profiles to guarantee reliable loading even during transient network or database pauses
const FALLBACK_FACILITIES: FacilityRecord[] = [
  {
    id: 'football-turf',
    name: 'Football Turf',
    slug: 'football-turf',
    sport_type: 'football',
    description: '10,000+ sq. ft. 7-a-side professional synthetic turf field equipped with high-lux floodlights.',
    short_description: '7-a-side FIFA approved synthetic turf with floodlights.',
    status: 'active',
    max_capacity: 22,
    surface_type: 'FIFA Approved 50mm Artificial Grass',
    amenities: ['Floodlights', 'Changing Rooms', 'Drinking Water', 'Parking'],
    base_price: 999,
  },
  {
    id: 'cricket-net-1',
    name: 'Cricket Net 1',
    slug: 'cricket-net-1',
    sport_type: 'cricket',
    description: 'Professional cricket net pitch with high-grade polyurethane turf and heavy-duty protective netting.',
    short_description: 'Pro cricket practice pitch with polyurethane turf.',
    status: 'active',
    max_capacity: 8,
    surface_type: 'Polyurethane Synthetic Turf',
    amenities: ['Floodlights', 'Protective Netting', 'Stumps Provided'],
    base_price: 299,
  },
  {
    id: 'cricket-net-2',
    name: 'Cricket Net 2',
    slug: 'cricket-net-2',
    sport_type: 'cricket',
    description: 'Secondary professional cricket practice net with optional automated bowling machine hookup.',
    short_description: 'Pro cricket net pitch with optional bowling machine.',
    status: 'active',
    max_capacity: 8,
    surface_type: 'Polyurethane Synthetic Turf',
    amenities: ['Floodlights', 'Bowling Machine Port', 'Stumps Provided'],
    base_price: 299,
  },
]

const FACILITY_IMAGES: Record<string, string> = {
  'football-turf': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp',
  'cricket-net-1': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
  'cricket-net-2': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
}

// Stages:
// 1 = FACILITY
// 2 = DATE
// 3 = TIME
// 4 = ADD-ONS (Skipped for facilities without add-ons like Football Turf)
// 5 = CHECKOUT
type BookingStage = 1 | 2 | 3 | 4 | 5

function BookingFlowContent() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // State
  const [stage, setStage] = useState<BookingStage>(1)
  const [facilities, setFacilities] = useState<FacilityRecord[]>(FALLBACK_FACILITIES)
  const [selectedFacility, setSelectedFacility] = useState<FacilityRecord | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([])
  const [selectedSlots, setSelectedSlots] = useState<SlotItem[]>([])

  // Add-ons & Rates
  const [addBowlingMachine, setAddBowlingMachine] = useState<boolean>(false)
  const [bowlingRate, setBowlingRate] = useState<number>(299)
  const [paymentType, setPaymentType] = useState<'full' | 'half'>('full')

  // Customer Details (Name & Phone Required; Email Optional per Requirement 13)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [acceptAllPolicies, setAcceptAllPolicies] = useState(false)

  // Status & Error States
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true)
  const [facilitiesLoadError, setFacilitiesLoadError] = useState<string | null>(null)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Prefill details for logged-in user
  useEffect(() => {
    if (user && profile) {
      if (!customerName) setCustomerName(profile.full_name || '')
      if (!customerPhone) setCustomerPhone(profile.phone || '')
      if (!customerEmail) setCustomerEmail(user.email || '')
    }
  }, [user, profile])

  // 1. Fetch Authoritative Facilities & Live Base Prices from Supabase
  const loadFacilities = useCallback(async () => {
    try {
      setIsLoadingFacilities(true)
      setFacilitiesLoadError(null)

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('status', 'active')
        .neq('slug', 'bowling-nets')
        .order('display_order', { ascending: true })

      if (error) {
        console.warn('Could not load venues from Supabase, using standard fallback profile:', error.message)
        setFacilitiesLoadError('Unable to load live facility status from server. Displaying offline directory.')
        // Keep fallback facilities
      } else if (data && data.length > 0) {
        setFacilities(data)
      }

      // Fetch shared bowling machine rate from resources table
      const { data: resData } = await supabase
        .from('resources')
        .select('*')
        .eq('code', 'BM-CRICKET-01')
        .maybeSingle()

      if (resData && resData.hourly_extra_cost) {
        setBowlingRate(Number(resData.hourly_extra_cost))
      }
    } catch (err: any) {
      console.error('Error fetching facilities:', err)
      setFacilitiesLoadError('We couldn’t connect to the database right now. Please check your connection.')
    } finally {
      setIsLoadingFacilities(false)
    }
  }, [supabase])

  useEffect(() => {
    loadFacilities()
  }, [loadFacilities])

  // 2. Parse Deep-link Context (e.g. ?facility=football-turf or ?venue=cricket-net-1)
  // Context preservation: If facility is preselected from a card/CTA, skip directly to Step 2: Date!
  useEffect(() => {
    if (facilities.length === 0) return

    const facilityParam = searchParams.get('facility') || searchParams.get('venue')
    const dateParam = searchParams.get('date')

    if (facilityParam) {
      const found = facilities.find(
        (f) =>
          f.slug.toLowerCase() === facilityParam.toLowerCase() ||
          f.id.toLowerCase() === facilityParam.toLowerCase() ||
          f.name.toLowerCase().includes(facilityParam.toLowerCase())
      )
      if (found) {
        setSelectedFacility(found)
        // Advance directly to Step 2: Date Selection because facility is already chosen!
        setStage(2)
      }
    }

    if (dateParam) {
      const parsedDate = new Date(dateParam)
      if (!isNaN(parsedDate.getTime()) && !isBefore(parsedDate, startOfToday())) {
        setSelectedDate(parsedDate)
        setCurrentMonth(parsedDate)
      }
    }
  }, [facilities, searchParams])

  // Check if selected facility supports add-ons (Cricket nets with bowling machine)
  const facilityHasAddons = selectedFacility?.sport_type === 'cricket'

  // Dynamic progress steps calculation (Requirement 6)
  // Football Turf -> [FACILITY, DATE, TIME, CHECKOUT]
  // Cricket Net with add-on -> [FACILITY, DATE, TIME, ADD-ONS, CHECKOUT]
  const progressSteps = facilityHasAddons
    ? [
        { num: 1, label: 'FACILITY', stageId: 1 as BookingStage },
        { num: 2, label: 'DATE', stageId: 2 as BookingStage },
        { num: 3, label: 'TIME', stageId: 3 as BookingStage },
        { num: 4, label: 'ADD-ONS', stageId: 4 as BookingStage },
        { num: 5, label: 'CHECKOUT', stageId: 5 as BookingStage },
      ]
    : [
        { num: 1, label: 'FACILITY', stageId: 1 as BookingStage },
        { num: 2, label: 'DATE', stageId: 2 as BookingStage },
        { num: 3, label: 'TIME', stageId: 3 as BookingStage },
        { num: 4, label: 'CHECKOUT', stageId: 5 as BookingStage },
      ]

  // Calculate Active Progress Index
  const activeStepIndex = progressSteps.findIndex((s) => s.stageId === stage)
  const totalStepsCount = progressSteps.length

  // 3. Compute Real-time Slot Availability for Selected Facility & Date
  const calculateSlots = useCallback(async () => {
    if (!selectedFacility || !selectedDate) {
      setAvailableSlots([])
      return
    }

    try {
      setIsLoadingSlots(true)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const isToday = isSameDay(selectedDate, new Date())
      const currentHour = new Date().getHours()

      // Primary: Authoritative RPC query
      const { data: rpcSlots, error: rpcErr } = await supabase.rpc('get_authoritative_slot_availability', {
        p_venue_id: selectedFacility.id,
        p_date: dateStr,
      })

      if (!rpcErr && rpcSlots && Array.isArray(rpcSlots) && rpcSlots.length > 0) {
        const mapped: SlotItem[] = rpcSlots
          .filter((slot: any) => slot.is_available === true)
          .map((slot: any) => {
            const h = Number(slot.slot_hour)
            const h12 = h % 12 === 0 ? 12 : h % 12
            const ampm = h < 12 ? 'AM' : 'PM'
            const nextH = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12
            const nextAmpm = (h + 1) < 12 ? 'AM' : 'PM'

            return {
              hour: h,
              label: `${h12}:00 ${ampm} - ${nextH}:00 ${nextAmpm}`,
              startTimeStr: slot.start_time,
              endTimeStr: slot.end_time,
              price: Number(
                slot.price ||
                  (selectedFacility.base_price
                    ? Number(selectedFacility.base_price)
                    : selectedFacility.sport_type === 'football'
                    ? 999
                    : 299)
              ),
            }
          })

        setAvailableSlots(mapped)
        setSelectedSlots([])
        return
      }

      // Fallback query across operating hours (06:00 to 23:00)
      const dayStart = `${dateStr}T00:00:00+05:30`
      const dayEnd = `${dateStr}T23:59:59+05:30`

      const [bookingsRes, resRes, locksRes, priceRulesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('start_time, end_time')
          .eq('venue_id', selectedFacility.id)
          .neq('booking_status', 'cancelled')
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd),
        supabase
          .from('slot_reservations')
          .select('start_time, end_time')
          .eq('venue_id', selectedFacility.id)
          .eq('status', 'active')
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd),
        supabase
          .from('slot_locks')
          .select('start_time, end_time, expires_at')
          .eq('venue_id', selectedFacility.id)
          .gt('expires_at', new Date().toISOString())
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd),
        supabase
          .from('pricing_rules')
          .select('*')
          .eq('venue_id', selectedFacility.id)
          .is('deleted_at', null)
          .lte('start_date', dateStr)
          .gte('end_date', dateStr),
      ])

      const bookedSlots = bookingsRes.data || []
      const reservedSlots = resRes.data || []
      const lockedSlots = locksRes.data || []
      const pricingRules = priceRulesRes.data || []

      const computed: SlotItem[] = []
      const defaultBase = selectedFacility.base_price
        ? Number(selectedFacility.base_price)
        : selectedFacility.sport_type === 'football'
        ? 999
        : 299

      for (let h = 6; h <= 22; h++) {
        // Skip past slots for today
        if (isToday && h <= currentHour) continue

        const startIso = `${dateStr}T${h.toString().padStart(2, '0')}:00:00+05:30`
        const endIso = `${dateStr}T${(h + 1).toString().padStart(2, '0')}:00:00+05:30`

        const isBooked = bookedSlots.some(
          (b) => new Date(b.start_time).getTime() === new Date(startIso).getTime()
        )
        const isReserved = reservedSlots.some(
          (r) => new Date(r.start_time).getTime() === new Date(startIso).getTime()
        )
        const isLocked = lockedSlots.some(
          (l) => new Date(l.start_time).getTime() === new Date(startIso).getTime()
        )

        if (!isBooked && !isReserved && !isLocked) {
          const rule = pricingRules.find(
            (r) =>
              (!r.start_time || r.start_time <= `${h}:00:00`) &&
              (!r.end_time || r.end_time >= `${h + 1}:00:00`)
          )

          const slotPrice = rule ? Number(rule.hourly_rate || rule.price) : defaultBase
          const h12 = h % 12 === 0 ? 12 : h % 12
          const ampm = h < 12 ? 'AM' : 'PM'
          const nextH = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12
          const nextAmpm = (h + 1) < 12 ? 'AM' : 'PM'

          computed.push({
            hour: h,
            label: `${h12}:00 ${ampm} - ${nextH}:00 ${nextAmpm}`,
            startTimeStr: startIso,
            endTimeStr: endIso,
            price: slotPrice,
          })
        }
      }

      setAvailableSlots(computed)
      setSelectedSlots([])
    } catch (err) {
      console.error('Error calculating slot availability:', err)
    } finally {
      setIsLoadingSlots(false)
    }
  }, [selectedFacility, selectedDate, supabase])

  useEffect(() => {
    calculateSlots()
  }, [calculateSlots])

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const today = startOfToday()

  const handleSlotToggle = (slot: SlotItem) => {
    if (selectedSlots.some((s) => s.hour === slot.hour)) {
      setSelectedSlots(selectedSlots.filter((s) => s.hour !== slot.hour))
    } else {
      setSelectedSlots([...selectedSlots, slot].sort((a, b) => a.hour - b.hour))
    }
  }

  const getSlotSubtotal = () => {
    return selectedSlots.reduce((sum, s) => sum + s.price, 0)
  }

  const getBowlingSubtotal = () => {
    return addBowlingMachine && selectedFacility?.sport_type === 'cricket'
      ? selectedSlots.length * bowlingRate
      : 0
  }

  const getSubtotal = () => {
    return getSlotSubtotal() + getBowlingSubtotal()
  }

  const getPayableNow = () => {
    const total = getSubtotal()
    return paymentType === 'half' ? Math.ceil(total / 2) : total
  }

  // Handle Slot Lock & Booking Initiation
  const handleProceedToPayment = async () => {
    if (!selectedFacility || selectedSlots.length === 0) return

    // Requirement 13: Name & Phone are REQUIRED; Email is OPTIONAL
    if (!customerName.trim()) {
      setErrorMessage('Please provide your Full Name.')
      return
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Please provide your Phone Number for booking confirmation & WhatsApp updates.')
      return
    }

    if (customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(customerEmail.trim())) {
        setErrorMessage('Please provide a valid email address or leave it blank.')
        return
      }
    }

    if (!acceptAllPolicies) {
      setErrorMessage(
        'Please agree to the Terms & Conditions, Cancellation Policy and Refund Policy to complete your booking.'
      )
      return
    }

    setIsLocking(true)
    setErrorMessage(null)

    try {
      // 1. Lock all selected slots using database RPC create_slot_lock
      for (const slot of selectedSlots) {
        const { data: lockSuccess, error: lockErr } = await supabase.rpc('create_slot_lock', {
          p_venue_id: selectedFacility.id,
          p_resource_id: null,
          p_start_time: slot.startTimeStr,
          p_end_time: slot.endTimeStr,
        })

        if (lockErr || !lockSuccess) {
          // Non-blocking fallback
          console.warn('Slot lock notice:', lockErr?.message)
        }
      }

      // 2. Generate database booking number via RPC
      const { data: bNum } = await supabase.rpc('generate_booking_number')
      const bookingNumber = bNum || `MSC-${Date.now().toString().slice(-6)}`

      const slotTotal = getSlotSubtotal()
      const bowlingTotal = getBowlingSubtotal()
      const totalAmount = slotTotal + bowlingTotal
      const amountPaid = getPayableNow()

      const firstSlot = selectedSlots[0]
      const lastSlot = selectedSlots[selectedSlots.length - 1]

      // 3. Create confirmed booking record in Supabase
      const { data: newBooking, error: bookingErr } = await supabase
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          customer_id: user?.id || '00000000-0000-0000-0000-000000000000',
          venue_id: selectedFacility.id,
          start_time: firstSlot.startTimeStr,
          end_time: lastSlot.endTimeStr,
          duration_hours: selectedSlots.length,
          booking_status: 'confirmed',
          payment_status: paymentType === 'half' ? 'partially_paid' : 'paid',
          booking_source: 'online_customer',
          base_amount: slotTotal,
          extra_charges: bowlingTotal,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          notes: `Customer: ${customerName.trim()} (${customerPhone.trim()})${
            customerEmail.trim() ? ` [${customerEmail.trim()}]` : ''
          } ${bowlingTotal > 0 ? '[With Automated Bowling Machine]' : ''}`,
        })
        .select('*')
        .single()

      if (bookingErr) {
        setErrorMessage(bookingErr.message)
        setIsLocking(false)
        return
      }

      router.push(`/booking/success/${newBooking.id}`)
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while locking your slot.')
    } finally {
      setIsLocking(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#061a12] text-slate-100 flex flex-col pt-24 relative overflow-hidden">
      {/* Ambient Atmospheric Emerald Glows */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-[#00A86B]/10 blur-[130px] pointer-events-none transform-gpu"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 right-[-120px] w-[500px] h-[500px] rounded-full bg-[#005C43]/10 blur-[150px] pointer-events-none transform-gpu"
        aria-hidden="true"
      />

      <Navigation />

      <section className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full relative z-10">
        {/* Dynamic Progress Indicator (Intelligently reflects actual flow) */}
        <div className="mb-8 bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 shadow-xl shadow-black/30">
          <div className="flex items-center justify-between overflow-x-auto text-xs font-semibold no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1">
            {progressSteps.map((step, idx) => {
              const isActive = step.stageId === stage
              const isPassed =
                activeStepIndex !== -1 &&
                idx < activeStepIndex

              return (
                <div key={step.label} className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#00A86B] text-slate-950 font-extrabold shadow-md shadow-[#00A86B]/30'
                        : isPassed
                        ? 'bg-[#005C43] text-emerald-200 border border-[#00A86B]/40'
                        : 'bg-[#091b12] text-slate-500 border border-white/5'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={
                      isActive
                        ? 'text-white font-bold'
                        : isPassed
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                    }
                  >
                    {step.label}
                  </span>
                  {idx < progressSteps.length - 1 && <span className="text-emerald-500/30 mx-2">›</span>}
                </div>
              )
            })}
          </div>

          {/* Dynamic Progress Fill Bar */}
          <div className="w-full bg-[#07170f] h-1.5 rounded-full mt-3 overflow-hidden border border-emerald-500/10">
            <motion.div
              className="bg-[#00A86B] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,168,107,0.7)]"
              initial={false}
              animate={{
                width: `${
                  totalStepsCount > 0
                    ? ((Math.max(0, activeStepIndex) + 1) / totalStepsCount) * 100
                    : 20
                }%`,
              }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-200 text-xs shadow-lg">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* STEP 1: CHOOSE YOUR FACILITY */}
          {/* ========================================================================= */}
          {stage === 1 && (
            <motion.div
              key="stage-1-facilities"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A86B]">Step 1 of {totalStepsCount}</span>
                <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">CHOOSE YOUR FACILITY</h1>
                <p className="text-xs text-slate-300 mt-1">Select your preferred sports facility at Maqbool Sports Complex</p>
              </div>

              {facilitiesLoadError && (
                <div className="p-4 bg-amber-950/70 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-200 text-xs shadow-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-400 shrink-0" />
                    <span>{facilitiesLoadError}</span>
                  </div>
                  <button
                    onClick={loadFacilities}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}

              {/* Mobile Compact Facility Cards (Clean, NO text overlay on images) */}
              <div className="flex flex-col gap-3.5 md:hidden px-1">
                {facilities.map((f) => {
                  const isSelected = selectedFacility?.id === f.id
                  const basePrice = f.base_price
                    ? Number(f.base_price)
                    : f.sport_type === 'football'
                    ? 999
                    : 299
                  const imageSrc = FACILITY_IMAGES[f.slug] || FACILITY_IMAGES['football-turf']

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFacility(f)
                        setStage(2)
                      }}
                      className={`bg-[#0e2419] border rounded-2xl p-3.5 cursor-pointer transition-all flex items-center gap-3.5 shadow-md active:scale-[0.99] ${
                        isSelected
                          ? 'border-[#00A86B] ring-2 ring-[#00A86B]/30 bg-[#005C43]/20'
                          : 'border-emerald-500/20 hover:border-[#00A86B]/60'
                      }`}
                    >
                      {/* Thumbnail with NO overlaid text */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#040d07]">
                        <Image src={imageSrc} alt={f.name} fill className="object-cover" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h3 className="text-sm font-bold text-white leading-tight truncate">{f.name}</h3>
                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                            {f.short_description || f.description}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-emerald-500/15 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#00A86B]">
                            ₹{basePrice} <span className="text-[10px] text-slate-400 font-normal">/ hr</span>
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFacility(f)
                              setStage(2)
                            }}
                            className="px-3.5 py-1.5 bg-[#00A86B] hover:bg-[#007A52] text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
                          >
                            Select Facility
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop 3-Column Facility Cards (Clean, NO text overlay on images) */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                {facilities.map((f) => {
                  const isSelected = selectedFacility?.id === f.id
                  const basePrice = f.base_price
                    ? Number(f.base_price)
                    : f.sport_type === 'football'
                    ? 999
                    : 299
                  const imageSrc = FACILITY_IMAGES[f.slug] || FACILITY_IMAGES['football-turf']

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFacility(f)
                        setStage(2)
                      }}
                      className={`bg-[#0e2419] border rounded-3xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-xl shadow-black/30 hover:border-[#00A86B]/60 ${
                        isSelected
                          ? 'border-[#00A86B] ring-2 ring-[#00A86B]/30'
                          : 'border-emerald-500/20'
                      }`}
                    >
                      {/* Image container without overlay text */}
                      <div className="relative h-44 w-full bg-[#040d07]">
                        <Image src={imageSrc} alt={f.name} fill className="object-cover" />
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">{f.name}</h3>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                            {f.short_description || f.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block font-medium">Rate</span>
                            <span className="text-base font-extrabold text-[#00A86B]">
                              ₹{basePrice} <span className="text-xs text-slate-400 font-normal">/ hr</span>
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFacility(f)
                              setStage(2)
                            }}
                            className="px-4 py-2 bg-[#00A86B] hover:bg-[#007A52] text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                          >
                            Select Facility
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CHOOSE YOUR DATE */}
          {/* ========================================================================= */}
          {stage === 2 && (
            <motion.div
              key="stage-2-date"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
            >
              {/* Selected Facility Context Bar */}
              <div className="flex items-center justify-between bg-[#091b12] border border-emerald-500/25 p-4 rounded-2xl shadow-sm">
                <div>
                  <span className="text-[11px] text-emerald-400/80 uppercase font-semibold">Selected Facility</span>
                  <p className="font-bold text-white text-sm">{selectedFacility?.name || 'Football Turf'}</p>
                </div>
                <button
                  onClick={() => setStage(1)}
                  className="px-3.5 py-1.5 bg-[#0e2419] hover:bg-[#133223] text-emerald-300 hover:text-white font-medium text-xs rounded-xl flex items-center gap-1.5 border border-emerald-500/25 transition-all"
                >
                  <RotateCcw size={14} /> Change Facility
                </button>
              </div>

              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A86B]">Step 2 of {totalStepsCount}</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">CHOOSE YOUR DATE</h2>
                <p className="text-xs text-slate-300 mt-1">Select your preferred play session date on the calendar</p>
              </div>

              {/* Month Header Navigation */}
              <div className="flex items-center justify-between max-w-sm mx-auto pt-2 pb-4 border-b border-emerald-500/15">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-xl bg-[#091b12] hover:bg-[#0f2c1e] text-slate-300 hover:text-white border border-emerald-500/20 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-white tracking-wide">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-xl bg-[#091b12] hover:bg-[#0f2c1e] text-slate-300 hover:text-white border border-emerald-500/20 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-emerald-400/70 py-1">
                  <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {daysInMonth.map((day) => {
                    const isPast = isBefore(day, today)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)

                    return (
                      <button
                        key={day.toISOString()}
                        disabled={isPast}
                        onClick={() => {
                          setSelectedDate(day)
                          setStage(3)
                        }}
                        className={`h-12 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#00A86B] text-slate-950 font-extrabold shadow-lg shadow-[#00A86B]/30 ring-2 ring-emerald-300'
                            : isPast
                            ? 'text-slate-600 cursor-not-allowed bg-[#06140d]/60 border border-transparent'
                            : 'text-slate-200 bg-[#091b12] border border-emerald-500/20 hover:border-[#00A86B] hover:bg-[#0f2c1e] hover:text-white'
                        }`}
                      >
                        <span>{format(day, 'd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-emerald-500/15">
                <button
                  onClick={() => setStage(1)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium"
                >
                  ← Back to Facilities
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: CHOOSE YOUR TIME SLOTS */}
          {/* ========================================================================= */}
          {stage === 3 && (
            <motion.div
              key="stage-3-time"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
            >
              <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
                <div>
                  <span className="text-[11px] text-emerald-400/80 uppercase font-semibold">Selected Facility & Date</span>
                  <p className="font-bold text-white text-sm">
                    {selectedFacility?.name} · {selectedDate && format(selectedDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStage(1)}
                    className="px-3 py-1.5 bg-[#091b12] hover:bg-[#0f2c1e] text-emerald-300 hover:text-white font-medium text-xs rounded-xl border border-emerald-500/25 transition-all"
                  >
                    Change Facility
                  </button>
                  <button
                    onClick={() => setStage(2)}
                    className="px-3 py-1.5 bg-[#091b12] hover:bg-[#0f2c1e] text-emerald-300 hover:text-white font-medium text-xs rounded-xl border border-emerald-500/25 transition-all"
                  >
                    Change Date
                  </button>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A86B]">Step 3 of {totalStepsCount}</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">SELECT YOUR STARTING TIME</h2>
                <p className="text-xs text-slate-300 mt-1">Click to select one or multiple consecutive hourly slots</p>
              </div>

              {isLoadingSlots ? (
                <div className="py-12 text-center text-slate-300">
                  <Loader2 size={32} className="animate-spin mx-auto text-[#00A86B] mb-2" />
                  Querying real-time slot availability...
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlots.some((s) => s.hour === slot.hour)
                    return (
                      <button
                        key={slot.hour}
                        onClick={() => handleSlotToggle(slot)}
                        className={`p-4 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'border-[#00A86B] bg-[#00A86B] text-slate-950 font-bold shadow-lg shadow-[#00A86B]/30 ring-2 ring-emerald-300'
                            : 'border-emerald-500/20 bg-[#091b12] text-slate-200 hover:border-[#00A86B] hover:text-white hover:bg-[#0f2c1e]'
                        }`}
                      >
                        <span className="text-xs font-semibold block">{slot.label}</span>
                        <span
                          className={`text-xs mt-1 block ${
                            isSelected ? 'text-slate-950 font-extrabold' : 'text-[#00A86B] font-bold'
                          }`}
                        >
                          ₹{slot.price}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-emerald-500/25 rounded-2xl bg-[#091b12]/50">
                  <CalendarIcon className="mx-auto text-slate-400 mb-2" size={36} />
                  <p className="text-xs text-slate-300">No open slots remaining for this facility & date.</p>
                  <button
                    onClick={() => setStage(2)}
                    className="mt-3 px-4 py-2 bg-[#00A86B] hover:bg-[#007A52] text-white font-semibold text-xs rounded-xl transition-all"
                  >
                    Select Another Date
                  </button>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-emerald-500/15">
                <button onClick={() => setStage(2)} className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium">
                  ← Back to Date
                </button>
                <button
                  onClick={() => {
                    // Intelligent routing: If facility has add-ons, go to Step 4. If not (Football), skip directly to Step 5 (Checkout)!
                    if (facilityHasAddons) {
                      setStage(4)
                    } else {
                      setStage(5)
                    }
                  }}
                  disabled={selectedSlots.length === 0}
                  className="px-6 py-2.5 bg-[#00A86B] hover:bg-[#007A52] disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  {facilityHasAddons ? 'Continue to Add-ons →' : 'Proceed to Checkout →'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: ADD-ONS (ONLY SHOWN FOR APPLICABLE CRICKET NET BOOKINGS) */}
          {/* ========================================================================= */}
          {stage === 4 && facilityHasAddons && (
            <motion.div
              key="stage-4-addons"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
            >
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A86B]">Step 4 of {totalStepsCount}</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">FACILITY ADD-ONS & OPTIONS</h2>
                <p className="text-xs text-slate-300 mt-1">Optional equipment for your training session</p>
              </div>

              <div className="p-6 bg-[#091b12] border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#00A86B]/15 flex items-center justify-center text-[#00A86B]">
                      <BowlingMachineIcon size={22} className="text-[#00A86B]" />
                    </div>
                    <h3 className="text-base font-bold text-white">Automated Bowling Machine</h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5">
                    Variable speed & swing automated bowling machine during your reserved session.
                  </p>
                  <p className="text-xs text-[#00A86B] font-bold mt-2">Rate: +₹{bowlingRate} / hour</p>
                </div>

                <button
                  onClick={() => setAddBowlingMachine(!addBowlingMachine)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    addBowlingMachine
                      ? 'bg-[#00A86B] text-white shadow-md shadow-[#00A86B]/30'
                      : 'bg-[#0e2419] border border-emerald-500/30 text-emerald-300 hover:bg-[#133223]'
                  }`}
                >
                  {addBowlingMachine ? '✓ Included' : '+ Add Bowling Machine'}
                </button>
              </div>

              <div className="flex justify-between pt-4 border-t border-emerald-500/15">
                <button onClick={() => setStage(3)} className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium">
                  ← Back to Time Slots
                </button>
                <button
                  onClick={() => setStage(5)}
                  className="px-6 py-2.5 bg-[#00A86B] hover:bg-[#007A52] text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  Proceed to Checkout →
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: DETAILS & FINAL CHECKOUT */}
          {/* ========================================================================= */}
          {stage === 5 && (
            <motion.div
              key="stage-5-checkout"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
            >
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00A86B]">Final Step</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">CHECKOUT & PAYMENT</h2>
              </div>

              {/* Player Contact Form (Name & Phone Required; Email Optional) */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-[#00A86B] uppercase tracking-wider">Player Identity</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Player Name"
                    className="w-full px-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      Phone Number (Required for WhatsApp Confirmation) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 99060 00000"
                      className="w-full px-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="player@example.com (Optional)"
                      className="w-full px-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]"
                    />
                  </div>
                </div>
              </div>

              {/* Session Summary Card */}
              <div className="p-5 bg-[#091b12] border border-emerald-500/25 rounded-2xl space-y-3 text-xs shadow-inner">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-emerald-500/20">Booking Summary</h3>
                <div className="flex justify-between py-1 border-b border-emerald-500/10">
                  <span className="text-slate-400">Facility</span>
                  <span className="font-bold text-white">{selectedFacility?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-500/10">
                  <span className="text-slate-400">Date</span>
                  <span className="font-bold text-white">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-500/10">
                  <span className="text-slate-400">Time Slot(s)</span>
                  <span className="font-bold text-[#00A86B]">{selectedSlots.map((s) => s.label).join(', ')}</span>
                </div>
                {addBowlingMachine && facilityHasAddons && (
                  <div className="flex justify-between py-1 border-b border-emerald-500/10 text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <BowlingMachineIcon size={14} className="text-[#00A86B]" />
                      Automated Bowling Machine
                    </span>
                    <span className="font-bold">+₹{selectedSlots.length * bowlingRate}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-white">Total Amount</span>
                  <span className="font-extrabold text-[#00A86B] text-lg">₹{getSubtotal()}</span>
                </div>
              </div>

              {/* Payment Option Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Payment Option</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentType === 'full'
                        ? 'border-[#00A86B] bg-[#005C43]/40 text-white font-semibold ring-1 ring-[#00A86B]/40 shadow-sm'
                        : 'border-emerald-500/20 bg-[#091b12] text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    <span className="text-xs font-bold block">100% Full Payment</span>
                    <span className="text-sm font-extrabold text-[#00A86B] mt-1 block">₹{getSubtotal()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('half')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentType === 'half'
                        ? 'border-[#00A86B] bg-[#005C43]/40 text-white font-semibold ring-1 ring-[#00A86B]/40 shadow-sm'
                        : 'border-emerald-500/20 bg-[#091b12] text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    <span className="text-xs font-bold block">50% Advance Payment</span>
                    <span className="text-sm font-extrabold text-[#00A86B] mt-1 block">₹{Math.ceil(getSubtotal() / 2)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pay balance at facility</span>
                  </button>
                </div>
              </div>

              {/* Single Policy Agreement Checkbox */}
              <div className="p-4 bg-[#091b12] border border-emerald-500/25 rounded-xl text-xs text-slate-300 shadow-inner">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptAllPolicies}
                    onChange={(e) => setAcceptAllPolicies(e.target.checked)}
                    className="mt-0.5 rounded border-emerald-500/30 bg-[#06140d] text-[#00A86B] focus:ring-[#00A86B]"
                  />
                  <span className="leading-relaxed">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openPolicyModal('terms')
                      }}
                      className="text-[#00A86B] font-semibold underline hover:text-emerald-300 cursor-pointer inline p-0 bg-transparent border-none text-xs"
                    >
                      Terms & Conditions
                    </button>
                    ,{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openPolicyModal('cancellation')
                      }}
                      className="text-[#00A86B] font-semibold underline hover:text-emerald-300 cursor-pointer inline p-0 bg-transparent border-none text-xs"
                    >
                      Cancellation Policy
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openPolicyModal('refund')
                      }}
                      className="text-[#00A86B] font-semibold underline hover:text-emerald-300 cursor-pointer inline p-0 bg-transparent border-none text-xs"
                    >
                      Refund Policy
                    </button>
                    .
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-emerald-500/15">
                <button
                  onClick={() => {
                    if (facilityHasAddons) {
                      setStage(4)
                    } else {
                      setStage(3)
                    }
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium"
                >
                  ← Back to {facilityHasAddons ? 'Add-ons' : 'Time Slots'}
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={isLocking || !acceptAllPolicies}
                  className="px-8 py-3 bg-[#00A86B] hover:bg-[#007A52] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2"
                >
                  {isLocking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Locking Slot...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} /> Pay ₹{getPayableNow()} & Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </main>
  )
}

export default function BookNowPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#061a12] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#00A86B]" />
        </div>
      }
    >
      <BookingFlowContent />
    </Suspense>
  )
}
