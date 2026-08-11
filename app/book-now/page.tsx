'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Users, CreditCard, ChevronLeft, ChevronRight, Check, ArrowLeft, Info, Loader2, AlertCircle, ShieldCheck, RotateCcw } from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfToday } from 'date-fns'
import { openPolicyModal } from '@/components/policy-modal'
import { BowlingMachineIcon } from '@/components/icons/bowling-machine-icon'

type VenueRecord = {
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

// Verified high-res MSC venue images
const VENUE_IMAGES: Record<string, string> = {
  'football-turf': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp',
  'cricket-net-1': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
  'cricket-net-2': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
}

export default function BookNowPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Streamlined 5 Booking Stages: 1: DATE, 2: VENUE, 3: TIME, 4: DURATION & ADDONS, 5: DETAILS & CHECKOUT
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5>(1)

  // Selection States
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [venues, setVenues] = useState<VenueRecord[]>([])
  const [selectedVenue, setSelectedVenue] = useState<VenueRecord | null>(null)
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([])
  const [selectedSlots, setSelectedSlots] = useState<SlotItem[]>([])
  
  // Add-ons & Payment Options
  const [addBowlingMachine, setAddBowlingMachine] = useState<boolean>(false)
  const [bowlingRate, setBowlingRate] = useState<number>(299)
  const [paymentType, setPaymentType] = useState<'full' | 'half'>('full')

  // Customer Form & Single Policy Checkbox at Checkout
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [acceptAllPolicies, setAcceptAllPolicies] = useState(false)

  // Loading & Locking Status
  const [isLoadingVenues, setIsLoadingVenues] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isLocking, setIsLocking] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Prefill details for logged in user
  useEffect(() => {
    if (user && profile) {
      if (!customerName) setCustomerName(profile.full_name || '')
      if (!customerPhone) setCustomerPhone(profile.phone || '')
      if (!customerEmail) setCustomerEmail(user.email || '')
    }
  }, [user, profile])

  // 1. Fetch Venues & Base Prices from Supabase
  useEffect(() => {
    async function loadVenues() {
      try {
        setIsLoadingVenues(true)
        const { data } = await supabase
          .from('venues')
          .select('*')
          .eq('status', 'active')
          .neq('slug', 'bowling-nets')
          .order('display_order', { ascending: true })

        if (data && data.length > 0) {
          setVenues(data)
        }

        // Fetch shared bowling machine rate from resources
        const { data: resData } = await supabase
          .from('resources')
          .select('*')
          .eq('code', 'BM-CRICKET-01')
          .maybeSingle()

        if (resData && resData.hourly_extra_cost) {
          setBowlingRate(Number(resData.hourly_extra_cost))
        }
      } catch (err) {
        console.error('Error fetching venues:', err)
      } finally {
        setIsLoadingVenues(false)
      }
    }
    loadVenues()
  }, [])

  // 2. Parse Deep-link Search Parameters (e.g. ?venue=football-turf&date=2026-08-11&hour=21)
  useEffect(() => {
    if (typeof window === 'undefined' || venues.length === 0) return

    try {
      const params = new URLSearchParams(window.location.search)
      const venueParam = params.get('venue')
      const dateParam = params.get('date')
      const hourParam = params.get('hour')

      if (venueParam) {
        const found = venues.find(
          (v) => v.slug.toLowerCase() === venueParam.toLowerCase() ||
                 v.name.toLowerCase().includes(venueParam.toLowerCase())
        )
        if (found) {
          setSelectedVenue(found)
          if (dateParam) {
            const parsedDate = new Date(dateParam)
            if (!isNaN(parsedDate.getTime())) {
              setSelectedDate(parsedDate)
              setCurrentMonth(parsedDate)
              setStage(3)
            } else {
              setStage(2)
            }
          } else {
            setStage(2)
          }
        }
      } else if (dateParam) {
        const parsedDate = new Date(dateParam)
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate)
          setCurrentMonth(parsedDate)
          setStage(2)
        }
      }
    } catch (e) {
      console.error('Error parsing booking URL params:', e)
    }
  }, [venues])

  // 3. Compute Real-time Slot Availability for Selected Venue & Date
  const calculateSlots = async () => {
    if (!selectedVenue || !selectedDate) {
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
        p_venue_id: selectedVenue.id,
        p_date: dateStr
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
              price: Number(slot.price || (selectedVenue.sport_type === 'football' ? 999 : 299))
            }
          })

        setAvailableSlots(mapped)
        setSelectedSlots([])
        return
      }

      // Fallback query across 17 operating hours (06:00 to 23:00)
      const dayStart = `${dateStr}T00:00:00+05:30`
      const dayEnd = `${dateStr}T23:59:59+05:30`

      const [bookingsRes, resRes, locksRes, priceRulesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('start_time, end_time')
          .eq('venue_id', selectedVenue.id)
          .neq('booking_status', 'cancelled')
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd),
        supabase
          .from('slot_reservations')
          .select('start_time, end_time')
          .eq('venue_id', selectedVenue.id)
          .eq('status', 'active')
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd),
        supabase
          .from('slot_locks')
          .select('start_time, end_time, expires_at')
          .eq('venue_id', selectedVenue.id)
          .gt('expires_at', new Date().toISOString())
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd),
        supabase
          .from('pricing_rules')
          .select('*')
          .eq('venue_id', selectedVenue.id)
          .is('deleted_at', null)
          .lte('start_date', dateStr)
          .gte('end_date', dateStr),
      ])

      const bookedSlots = bookingsRes.data || []
      const reservedSlots = resRes.data || []
      const lockedSlots = locksRes.data || []
      const pricingRules = priceRulesRes.data || []

      const computed: SlotItem[] = []
      const defaultBase = selectedVenue.sport_type === 'football' ? 999 : 299

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

          const slotPrice = rule ? Number(rule.price) : defaultBase
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
  }

  useEffect(() => {
    calculateSlots()
  }, [selectedVenue, selectedDate])

  // Real-time Availability Subscription
  useEffect(() => {
    if (!selectedVenue || !selectedDate) return

    const channel = supabase
      .channel(`public-availability-${selectedVenue.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => calculateSlots())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_reservations' }, () => calculateSlots())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_locks' }, () => calculateSlots())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pricing_rules' }, () => calculateSlots())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedVenue, selectedDate])

  // Calendar Month Generation
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
    return (addBowlingMachine && selectedVenue?.sport_type === 'cricket') ? selectedSlots.length * bowlingRate : 0
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
    if (!selectedVenue || selectedSlots.length === 0) return
    if (!customerName || !customerPhone || !customerEmail) {
      setErrorMessage('Please provide your Name, Phone Number, and Email Address.')
      return
    }
    if (!acceptAllPolicies) {
      setErrorMessage('Please agree to the Terms & Conditions, Cancellation Policy and Refund Policy to complete your booking.')
      return
    }

    setIsLocking(true)
    setErrorMessage(null)

    try {
      // 1. Lock all selected slots using database RPC create_slot_lock
      for (const slot of selectedSlots) {
        const { data: lockSuccess, error: lockErr } = await supabase.rpc('create_slot_lock', {
          p_venue_id: selectedVenue.id,
          p_start_time: slot.startTimeStr,
          p_end_time: slot.endTimeStr,
          p_user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          p_ttl_minutes: 5
        })

        if (lockErr || !lockSuccess) {
          setErrorMessage('That slot was just booked by another player. Please choose another time.')
          setIsLocking(false)
          return
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
          venue_id: selectedVenue.id,
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
          notes: `Customer: ${customerName} (${customerPhone}) ${bowlingTotal > 0 ? '[With Automated Bowling Machine]' : ''}`
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

  const stageTitles = ['DATE', 'VENUE', 'TIME', 'DURATION', 'CHECKOUT']

  return (
    <main className="min-h-screen bg-[#07140d] text-slate-100 flex flex-col pt-24 relative overflow-hidden">
      {/* Ambient Atmospheric Emerald Glows */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none transform-gpu"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 right-[-120px] w-[500px] h-[500px] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none transform-gpu"
        aria-hidden="true"
      />

      <Navigation />

      <section className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full relative z-10">
        {/* Minimal Progress Indicator */}
        <div className="mb-8 bg-[#0d2217]/85 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 shadow-xl shadow-black/30">
          {/* Horizontally swipeable step labels with zero native scrollbar track */}
          <div className="flex items-center justify-between overflow-x-auto text-xs font-semibold no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1">
            {stageTitles.map((stName, idx) => {
              const stNum = idx + 1
              const isActive = stage === stNum
              const isPassed = stage > stNum

              return (
                <div key={stName} className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/30'
                      : isPassed
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#091810] text-slate-500 border border-white/5'
                  }`}>
                    {stNum}
                  </span>
                  <span className={isActive ? 'text-white font-bold' : isPassed ? 'text-emerald-300' : 'text-slate-400'}>
                    {stName}
                  </span>
                  {idx < stageTitles.length - 1 && <span className="text-emerald-500/30 mx-2">›</span>}
                </div>
              )
            })}
          </div>

          {/* MSC Booking Progress Fill Bar */}
          <div className="w-full bg-[#07170f] h-1.5 rounded-full mt-3 overflow-hidden border border-emerald-500/10">
            <motion.div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(43,168,74,0.7)]"
              initial={false}
              animate={{ width: `${(stage / stageTitles.length) * 100}%` }}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-500/40 rounded-2xl flex items-start gap-3 text-red-200 text-xs shadow-lg">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* DARK EMERALD / CHARCOAL THEME STAGE CONTAINER */}
        <AnimatePresence mode="wait">
          {/* STAGE 1: CALENDAR ONLY */}
          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
            >
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Step 1 of 5</span>
                <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">CHOOSE YOUR DATE</h1>
                <p className="text-xs text-slate-400 mt-1">Select your preferred play session date on the MSC calendar</p>
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

              {/* Calendar Days */}
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
                          setStage(2)
                        }}
                        className={`h-12 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400'
                            : isPast
                            ? 'text-slate-600 cursor-not-allowed bg-[#06140d]/60 border border-transparent'
                            : 'text-slate-200 bg-[#091b12] border border-emerald-500/20 hover:border-emerald-400 hover:bg-[#0f2c1e] hover:text-white'
                        }`}
                      >
                        <span>{format(day, 'd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: VENUES SELECTION */}
          {stage === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-[#0d2217]/85 backdrop-blur-xl border border-emerald-500/20 p-4 rounded-2xl shadow-xl shadow-black/20">
                <div>
                  <span className="text-[11px] text-emerald-400/80 uppercase font-semibold">Selected Date</span>
                  <p className="font-bold text-white text-sm">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => setStage(1)}
                  className="px-3.5 py-1.5 bg-[#091b12] hover:bg-[#0f2c1e] text-emerald-300 hover:text-white font-medium text-xs rounded-xl flex items-center gap-1.5 border border-emerald-500/25 transition-all"
                >
                  <RotateCcw size={14} /> Change Date
                </button>
              </div>

              <div className="text-center py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Step 2 of 5</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">CHOOSE YOUR VENUE</h2>
              </div>

              {/* MOBILE COMPACT RECTANGULAR VENUE CARDS (Minimal Scrolling, Floating Margins) */}
              <div className="flex flex-col gap-3 md:hidden px-1">
                {venues.map((v) => {
                  const isSelected = selectedVenue?.id === v.id
                  const basePrice = v.sport_type === 'football' ? 999 : 299
                  const imageSrc = VENUE_IMAGES[v.slug] || VENUE_IMAGES['football-turf']

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVenue(v)
                        setStage(3)
                      }}
                      className={`bg-[#0e2419] border rounded-2xl p-3 cursor-pointer transition-all flex items-center gap-3.5 shadow-md active:scale-[0.99] ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/40'
                          : 'border-emerald-500/20 hover:border-emerald-400/60'
                      }`}
                    >
                      {/* Compact Image Thumbnail */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#06140d]">
                        <Image src={imageSrc} alt={v.name} fill className="object-cover" />
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-slate-950/85 backdrop-blur-xs rounded-md text-[9px] font-bold text-emerald-400 uppercase border border-emerald-500/30">
                          {v.sport_type}
                        </div>
                      </div>

                      {/* Content & Price */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight truncate">{v.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{v.short_description || v.description}</p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-emerald-500/15 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold text-emerald-400">
                              ₹{basePrice} <span className="text-[10px] text-slate-400 font-normal">/ hr</span>
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVenue(v)
                              setStage(3)
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* DESKTOP 3-COLUMN VENUE CARDS */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                {venues.map((v) => {
                  const isSelected = selectedVenue?.id === v.id
                  const basePrice = v.sport_type === 'football' ? 999 : 299
                  const imageSrc = VENUE_IMAGES[v.slug] || VENUE_IMAGES['football-turf']

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVenue(v)
                        setStage(3)
                      }}
                      className={`bg-[#0e2419] border rounded-3xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-xl shadow-black/30 hover:border-emerald-400/60 ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'border-emerald-500/20'
                      }`}
                    >
                      <div className="relative h-44 w-full bg-[#06140d]">
                        <Image src={imageSrc} alt={v.name} fill className="object-cover" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/85 backdrop-blur-sm rounded-lg text-[10px] font-bold text-emerald-400 uppercase border border-emerald-500/30">
                          {v.sport_type}
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-white">{v.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{v.short_description || v.description}</p>
                        </div>

                        <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block font-medium">Rate</span>
                            <span className="text-base font-extrabold text-emerald-400">₹{basePrice} <span className="text-xs text-slate-400 font-normal">/ hr</span></span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVenue(v)
                              setStage(3)
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                          >
                            Select Venue
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* STAGE 3: TIME SLOTS */}
          {stage === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
            >
              <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
                <div>
                  <span className="text-[11px] text-emerald-400/80 uppercase font-semibold">Selected Venue & Date</span>
                  <p className="font-bold text-white text-sm">{selectedVenue?.name} · {selectedDate && format(selectedDate, 'MMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => setStage(2)}
                  className="px-3.5 py-1.5 bg-[#091b12] hover:bg-[#0f2c1e] text-emerald-300 hover:text-white font-medium text-xs rounded-xl flex items-center gap-1.5 border border-emerald-500/25 transition-all"
                >
                  <RotateCcw size={14} /> Change Venue
                </button>
              </div>

              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Step 3 of 5</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">SELECT YOUR STARTING TIME</h2>
                <p className="text-xs text-slate-400 mt-1">Only available slots are displayed (past/booked excluded)</p>
              </div>

              {isLoadingSlots ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 size={32} className="animate-spin mx-auto text-emerald-400 mb-2" />
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
                            ? 'border-emerald-500 bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400'
                            : 'border-emerald-500/20 bg-[#091b12] text-slate-200 hover:border-emerald-400 hover:text-white hover:bg-[#0f2c1e]'
                        }`}
                      >
                        <span className="text-xs font-semibold block">{slot.label}</span>
                        <span className={`text-xs mt-1 block ${isSelected ? 'text-slate-950 font-extrabold' : 'text-emerald-400 font-bold'}`}>
                          ₹{slot.price}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-emerald-500/25 rounded-2xl bg-[#091b12]/50">
                  <CalendarIcon className="mx-auto text-slate-500 mb-2" size={36} />
                  <p className="text-xs text-slate-400">No available slots for this venue & date.</p>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-emerald-500/15">
                <button onClick={() => setStage(2)} className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium">
                  ← Back to Venues
                </button>
                <button
                  onClick={() => setStage(4)}
                  disabled={selectedSlots.length === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  Continue to Duration →
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 4: DURATION & ADDONS */}
          {stage === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
            >
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Step 4 of 5</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">FACILITY ADD-ONS & OPTIONS</h2>
              </div>

              {selectedVenue?.sport_type === 'cricket' ? (
                <div className="p-6 bg-[#091b12] border border-emerald-500/25 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                        <BowlingMachineIcon size={22} className="text-emerald-400" />
                      </div>
                      <h4 className="text-base font-bold text-white">Automated Bowling Machine</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      Variable speed & swing automated bowling machine during your reserved session.
                    </p>
                    <p className="text-xs text-emerald-400 font-bold mt-2">Rate: +₹{bowlingRate} / hour</p>
                  </div>

                  <button
                    onClick={() => setAddBowlingMachine(!addBowlingMachine)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      addBowlingMachine
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-[#0e2419] border border-emerald-500/30 text-emerald-300 hover:bg-[#133223]'
                    }`}
                  >
                    {addBowlingMachine ? '✓ Included' : '+ Add Bowling Machine'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 bg-[#091b12]/50 border border-emerald-500/15 rounded-2xl">
                  No extra equipment add-ons required for Football Turf.
                </p>
              )}

              <div className="flex justify-between pt-4 border-t border-emerald-500/15">
                <button onClick={() => setStage(3)} className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium">
                  ← Back to Time Slots
                </button>
                <button
                  onClick={() => setStage(5)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  Proceed to Checkout →
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 5: DETAILS & FINAL CHECKOUT (SINGLE POLICY CHECKBOX) */}
          {stage === 5 && (
            <motion.div
              key="stage-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0e2419]/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/40"
            >
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Step 5 of 5</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">CHECKOUT & PAYMENT</h2>
              </div>

              {/* Player Contact Form */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Player Identity</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Player Name"
                    className="w-full px-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 99060 00000"
                      className="w-full px-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="info@maqboolsports.in"
                      className="w-full px-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Session Summary Card */}
              <div className="p-5 bg-[#091b12] border border-emerald-500/25 rounded-2xl space-y-3 text-xs shadow-inner">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-emerald-500/20">Booking Summary</h4>
                <div className="flex justify-between py-1 border-b border-emerald-500/10">
                  <span className="text-slate-400">Facility</span>
                  <span className="font-bold text-white">{selectedVenue?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-500/10">
                  <span className="text-slate-400">Date</span>
                  <span className="font-bold text-white">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-500/10">
                  <span className="text-slate-400">Time Slot(s)</span>
                  <span className="font-bold text-emerald-400">{selectedSlots.map((s) => s.label).join(', ')}</span>
                </div>
                {addBowlingMachine && (
                  <div className="flex justify-between py-1 border-b border-emerald-500/10 text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <BowlingMachineIcon size={14} className="text-emerald-400" />
                      Automated Bowling Machine
                    </span>
                    <span className="font-bold">+₹{selectedSlots.length * bowlingRate}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-white">Total Amount</span>
                  <span className="font-extrabold text-emerald-400 text-lg">₹{getSubtotal()}</span>
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
                        ? 'border-emerald-500 bg-emerald-950/70 text-white font-semibold ring-1 ring-emerald-500/40 shadow-sm'
                        : 'border-emerald-500/20 bg-[#091b12] text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    <span className="text-xs font-bold block">100% Full Payment</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-1 block">₹{getSubtotal()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('half')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentType === 'half'
                        ? 'border-emerald-500 bg-emerald-950/70 text-white font-semibold ring-1 ring-emerald-500/40 shadow-sm'
                        : 'border-emerald-500/20 bg-[#091b12] text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    <span className="text-xs font-bold block">50% Advance Payment</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-1 block">₹{Math.ceil(getSubtotal() / 2)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pay balance at facility</span>
                  </button>
                </div>
              </div>

              {/* SINGLE POLICY CHECKBOX AT CHECKOUT */}
              <div className="p-4 bg-[#091b12] border border-emerald-500/25 rounded-xl text-xs text-slate-300 shadow-inner">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptAllPolicies}
                    onChange={(e) => setAcceptAllPolicies(e.target.checked)}
                    className="mt-0.5 rounded border-emerald-500/30 bg-[#06140d] text-emerald-500 focus:ring-emerald-500"
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
                      className="text-emerald-400 font-semibold underline hover:text-emerald-300 cursor-pointer inline p-0 bg-transparent border-none text-xs"
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
                      className="text-emerald-400 font-semibold underline hover:text-emerald-300 cursor-pointer inline p-0 bg-transparent border-none text-xs"
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
                      className="text-emerald-400 font-semibold underline hover:text-emerald-300 cursor-pointer inline p-0 bg-transparent border-none text-xs"
                    >
                      Refund Policy
                    </button>
                    .
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-emerald-500/15">
                <button onClick={() => setStage(4)} className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium">
                  ← Back to Options
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={isLocking || !acceptAllPolicies}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2"
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
