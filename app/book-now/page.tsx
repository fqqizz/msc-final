'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Users, CreditCard, ChevronLeft, ChevronRight, Check, ArrowLeft, Info, Loader2, AlertCircle, ShieldCheck, Wrench, RotateCcw } from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfToday } from 'date-fns'
import { openPolicyModal } from '@/components/policy-modal'

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

  // 2. Fetch Availability Slots (REAL AUTHORITATIVE AVAILABILITY & REALTIME DISAPPEARANCE)
  const calculateSlots = async () => {
    if (!selectedVenue || !selectedDate) return

    try {
      setIsLoadingSlots(true)
      setErrorMessage(null)

      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      // Attempt Authoritative RPC first
      const { data: rpcSlots, error: rpcErr } = await supabase.rpc('get_authoritative_slot_availability', {
        p_venue_id: selectedVenue.id,
        p_date: dateStr,
      })

      if (!rpcErr && Array.isArray(rpcSlots) && rpcSlots.length > 0) {
        const computed: SlotItem[] = rpcSlots
          .filter((s: any) => s.is_available)
          .map((s: any) => {
            const h = s.slot_hour
            const startLabel = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`
            const endLabel = (h + 1) > 12 ? `${(h + 1) - 12} PM` : (h + 1) === 12 ? '12 PM' : `${h + 1} AM`

            return {
              hour: h,
              label: `${startLabel} - ${endLabel}`,
              startTimeStr: s.start_time,
              endTimeStr: s.end_time,
              price: Number(s.effective_price) || (selectedVenue.sport_type === 'football' ? 999 : 299),
            }
          })

        setAvailableSlots(computed)
        setSelectedSlots([])
        setIsLoadingSlots(false)
        return
      }

      // Fallback Direct Supabase Query with Exact Asia/Kolkata Cutoff Semantics
      const dayStart = `${dateStr}T00:00:00Z`
      const dayEnd = `${dateStr}T23:59:59Z`

      // 1. Fetch confirmed bookings
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('start_time, end_time, booking_status')
        .eq('venue_id', selectedVenue.id)
        .in('booking_status', ['confirmed', 'in_progress', 'locked'])
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)

      // 2. Fetch active temporary slot locks
      const { data: activeLocks } = await supabase
        .from('slot_locks')
        .select('start_time, end_time, expires_at')
        .eq('venue_id', selectedVenue.id)
        .gt('expires_at', new Date().toISOString())

      // 3. Fetch active owner slot reservations
      const { data: activeReservations } = await supabase
        .from('slot_reservations')
        .select('start_time, end_time, status')
        .eq('venue_id', selectedVenue.id)
        .eq('status', 'active')

      // 4. Fetch pricing overrides
      const { data: pricingOverrides } = await supabase
        .from('pricing_rules')
        .select('hourly_rate, start_time, end_time, start_date, end_date, priority')
        .eq('venue_id', selectedVenue.id)
        .is('deleted_at', null)
        .order('priority', { ascending: false })

      // Asia/Kolkata Timezone calculations
      const nowKolkata = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
      const isToday = dateStr === format(nowKolkata, 'yyyy-MM-dd')
      const currentHour = nowKolkata.getHours()

      const baseHourlyRate = selectedVenue.sport_type === 'football' ? 999 : 299
      const computed: SlotItem[] = []

      for (let hour = 6; hour <= 22; hour++) {
        const startTime = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00+05:30`)
        const endTime = new Date(`${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00+05:30`)

        // CRITICAL TIME CUTOFF: Slot [hour, hour+1] only ends when currentHour >= hour + 1!
        // At 1:05 PM (currentHour = 13), 1–2 PM (hour = 13) has 13 >= 14 -> FALSE (still available!)
        // At 2:00 PM (currentHour = 14), 1–2 PM (hour = 13) has 14 >= 14 -> TRUE (disappears!)
        const isPast = isToday && currentHour >= (hour + 1)

        const isBooked = existingBookings?.some((b) => {
          const bStart = new Date(b.start_time).getUTCHours()
          return bStart === hour
        }) || false

        const isLocked = activeLocks?.some((l) => {
          const lStart = new Date(l.start_time).getUTCHours()
          return lStart === hour
        }) || false

        const isReserved = activeReservations?.some((r) => {
          const rStart = new Date(r.start_time).getUTCHours()
          return rStart === hour
        }) || false

        // DISAPPEARANCE RULE: EXCLUDE UNAVAILABLE SLOTS COMPLETELY
        if (!isPast && !isBooked && !isLocked && !isReserved) {
          const startLabel = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`
          const endLabel = (hour + 1) > 12 ? `${(hour + 1) - 12} PM` : (hour + 1) === 12 ? '12 PM' : `${hour + 1} AM`

          // Check pricing override precedence
          let slotPrice = baseHourlyRate
          if (pricingOverrides && pricingOverrides.length > 0) {
            const match = pricingOverrides.find((po) => {
              if (po.start_date && po.start_date > dateStr) return false
              if (po.end_date && po.end_date < dateStr) return false
              return true
            })
            if (match) slotPrice = Number(match.hourly_rate)
          }

          computed.push({
            hour,
            label: `${startLabel} - ${endLabel}`,
            startTimeStr: startTime.toISOString(),
            endTimeStr: endTime.toISOString(),
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

  // Light Calendar Month Generation
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
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pt-24">
      <Navigation />

      <section className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Minimal Progress Indicator */}
        <div className="mb-8 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between overflow-x-auto text-xs font-semibold text-slate-500">
            {stageTitles.map((stName, idx) => {
              const stNum = idx + 1
              const isActive = stage === stNum
              const isPassed = stage > stNum

              return (
                <div key={stName} className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-emerald-600 text-white shadow-sm' : isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {stNum}
                  </span>
                  <span className={isActive ? 'text-slate-900 font-bold' : isPassed ? 'text-emerald-700' : ''}>
                    {stName}
                  </span>
                  {idx < stageTitles.length - 1 && <span className="text-slate-300 mx-2">›</span>}
                </div>
              )
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* WHITE LIGHT THEME STAGE CONTAINER */}
        <AnimatePresence mode="wait">
          {/* STAGE 1: CALENDAR ONLY */}
          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
            >
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 1 of 5</span>
                <h1 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">CHOOSE YOUR DATE</h1>
                <p className="text-xs text-slate-500 mt-1">Select your preferred play session date on the MSC calendar</p>
              </div>

              {/* Month Header Navigation */}
              <div className="flex items-center justify-between max-w-sm mx-auto pt-2 pb-4 border-b border-slate-100">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-slate-900 tracking-wide">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Calendar Days */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 py-1">
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
                            ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                            : isPast
                            ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                            : 'text-slate-800 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700'
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
              <div className="flex items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Selected Date</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => setStage(1)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Change Date
                </button>
              </div>

              <div className="text-center py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 2 of 5</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">CHOOSE YOUR VENUE</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      className={`bg-white border rounded-3xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between shadow-sm hover:shadow-lg ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <div className="relative h-44 w-full bg-slate-100">
                        <Image src={imageSrc} alt={v.name} fill className="object-cover" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white uppercase">
                          {v.sport_type}
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{v.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{v.short_description || v.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block font-medium">Rate</span>
                            <span className="text-base font-extrabold text-emerald-600">₹{basePrice} <span className="text-xs text-slate-500 font-normal">/ hr</span></span>
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
              className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Selected Venue & Date</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedVenue?.name} · {selectedDate && format(selectedDate, 'MMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => setStage(2)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Change Venue
                </button>
              </div>

              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 3 of 5</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">SELECT YOUR STARTING TIME</h2>
                <p className="text-xs text-slate-500 mt-1">Only available slots are displayed (past/booked excluded)</p>
              </div>

              {isLoadingSlots ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 size={32} className="animate-spin mx-auto text-emerald-600 mb-2" />
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
                            ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-400'
                        }`}
                      >
                        <span className="text-xs font-semibold block">{slot.label}</span>
                        <span className={`text-xs mt-1 block ${isSelected ? 'text-emerald-100' : 'text-emerald-600 font-bold'}`}>
                          ₹{slot.price}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                  <CalendarIcon className="mx-auto text-slate-400 mb-2" size={36} />
                  <p className="text-xs text-slate-500">No available slots for this venue & date.</p>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button onClick={() => setStage(2)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 font-medium">
                  ← Back to Venues
                </button>
                <button
                  onClick={() => setStage(4)}
                  disabled={selectedSlots.length === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
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
              className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
            >
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 4 of 5</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">FACILITY ADD-ONS & OPTIONS</h2>
              </div>

              {selectedVenue?.sport_type === 'cricket' ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wrench size={18} className="text-sky-600" />
                      <h4 className="text-base font-bold text-slate-900">Automated Bowling Machine</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Variable speed & swing automated bowling machine during your reserved session.
                    </p>
                    <p className="text-xs text-sky-700 font-bold mt-2">Rate: +₹{bowlingRate} / hour</p>
                  </div>

                  <button
                    onClick={() => setAddBowlingMachine(!addBowlingMachine)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                      addBowlingMachine
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {addBowlingMachine ? '✓ Included' : '+ Add Bowling Machine'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center">No extra equipment add-ons required for Football Turf.</p>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button onClick={() => setStage(3)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 font-medium">
                  ← Back to Time Slots
                </button>
                <button
                  onClick={() => setStage(5)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
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
              className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
            >
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Step 5 of 5</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">CHECKOUT & PAYMENT</h2>
              </div>

              {/* Player Contact Form */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Player Identity</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Player Name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 99060 00000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="info@maqboolsports.in"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Session Summary Card */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 text-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">Booking Summary</h4>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Facility</span>
                  <span className="font-bold text-slate-900">{selectedVenue?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Date</span>
                  <span className="font-bold text-slate-900">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Time Slot(s)</span>
                  <span className="font-bold text-emerald-700">{selectedSlots.map((s) => s.label).join(', ')}</span>
                </div>
                {addBowlingMachine && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60 text-sky-700">
                    <span>Automated Bowling Machine</span>
                    <span className="font-bold">+₹{selectedSlots.length * bowlingRate}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="font-extrabold text-emerald-600 text-lg">₹{getSubtotal()}</span>
                </div>
              </div>

              {/* Payment Option Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Payment Option</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentType === 'full' ? 'border-emerald-600 bg-emerald-50 text-slate-900 font-semibold' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold block">100% Full Payment</span>
                    <span className="text-sm font-extrabold text-emerald-600 mt-1 block">₹{getSubtotal()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('half')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentType === 'half' ? 'border-emerald-600 bg-emerald-50 text-slate-900 font-semibold' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold block">50% Advance Payment</span>
                    <span className="text-sm font-extrabold text-emerald-600 mt-1 block">₹{Math.ceil(getSubtotal() / 2)}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Pay balance at facility</span>
                  </button>
                </div>
              </div>

              {/* SINGLE POLICY CHECKBOX AT CHECKOUT */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptAllPolicies}
                    onChange={(e) => setAcceptAllPolicies(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500"
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
                      className="text-emerald-700 font-semibold underline hover:text-emerald-800 cursor-pointer inline p-0 bg-transparent border-none text-xs"
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
                      className="text-emerald-700 font-semibold underline hover:text-emerald-800 cursor-pointer inline p-0 bg-transparent border-none text-xs"
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
                      className="text-emerald-700 font-semibold underline hover:text-emerald-800 cursor-pointer inline p-0 bg-transparent border-none text-xs"
                    >
                      Refund Policy
                    </button>
                    .
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button onClick={() => setStage(4)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900 font-medium">
                  ← Back to Options
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={isLocking || !acceptAllPolicies}
                  className="px-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
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
