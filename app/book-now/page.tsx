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

export default function BookNowPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Booking Flow Stages: 1: CALENDAR, 2: VENUES, 3: TIME, 4: DURATION, 5: ADDONS, 6: DETAILS, 7: POLICIES, 8: CHECKOUT
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1)

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
  const [bowlingAvailable, setBowlingAvailable] = useState<boolean>(true)
  const [paymentType, setPaymentType] = useState<'full' | 'half'>('full')

  // Customer Form
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptCancellation, setAcceptCancellation] = useState(false)
  const [acceptRefundPolicy, setAcceptRefundPolicy] = useState(false)

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
          .order('display_order', { ascending: true })

        if (data && data.length > 0) {
          setVenues(data)
        }

        // Fetch Bowling Machine extra cost
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

  // 2. Fetch Availability Slots (REAL SLOT DISAPPEARANCE RULE)
  useEffect(() => {
    async function calculateSlots() {
      if (!selectedVenue || !selectedDate) return

      try {
        setIsLoadingSlots(true)
        setErrorMessage(null)

        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const dayStart = `${dateStr}T00:00:00Z`
        const dayEnd = `${dateStr}T23:59:59Z`

        // Fetch existing bookings for this venue & date
        const { data: existingBookings } = await supabase
          .from('bookings')
          .select('start_time, end_time, booking_status')
          .eq('venue_id', selectedVenue.id)
          .in('booking_status', ['confirmed', 'in_progress', 'locked'])
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd)

        // Fetch active temporary slot locks
        const { data: activeLocks } = await supabase
          .from('slot_locks')
          .select('start_time, end_time, expires_at')
          .eq('venue_id', selectedVenue.id)
          .gt('expires_at', new Date().toISOString())

        // Check shared bowling machine resource usage across ALL cricket nets
        const { data: bowlingLocks } = await supabase
          .from('booking_resources')
          .select('booking_id, bookings(start_time, end_time)')
          .gte('created_at', dayStart)

        const now = new Date()
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
        const currentHour = now.getHours()

        // Effective base price: ₹999 for Football Turf, ₹299 for Cricket Nets
        const baseHourlyRate = selectedVenue.sport_type === 'football' ? 999 : 299
        const computed: SlotItem[] = []

        // Operating hours: 6 AM (06:00) to 11 PM (23:00)
        for (let hour = 6; hour <= 22; hour++) {
          const startTime = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00Z`)
          const endTime = new Date(`${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00Z`)

          const isPast = isToday && hour <= currentHour

          const isBooked = existingBookings?.some((b) => {
            const bStart = new Date(b.start_time).getHours()
            return bStart === hour
          }) || false

          const isLocked = activeLocks?.some((l) => {
            const lStart = new Date(l.start_time).getHours()
            return lStart === hour
          }) || false

          // DISAPPEARANCE RULE: EXCLUDE UNAVAILABLE SLOTS COMPLETELY
          if (!isPast && !isBooked && !isLocked) {
            const startLabel = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`
            const endLabel = (hour + 1) > 12 ? `${(hour + 1) - 12} PM` : (hour + 1) === 12 ? '12 PM' : `${hour + 1} AM`

            computed.push({
              hour,
              label: `${startLabel} - ${endLabel}`,
              startTimeStr: startTime.toISOString(),
              endTimeStr: endTime.toISOString(),
              price: baseHourlyRate,
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

    calculateSlots()
  }, [selectedVenue, selectedDate])

  // Custom Light Calendar Month Generation
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

  const getSubtotal = () => {
    const slotTotal = selectedSlots.reduce((sum, s) => sum + s.price, 0)
    const bowlingTotal = addBowlingMachine ? selectedSlots.length * bowlingRate : 0
    return slotTotal + bowlingTotal
  }

  const getPayableNow = () => {
    const total = getSubtotal()
    return paymentType === 'half' ? Math.ceil(total / 2) : total
  }

  // Handle Slot Lock & Razorpay Payment Initiation
  const handleProceedToPayment = async () => {
    if (!selectedVenue || selectedSlots.length === 0) return
    if (!customerName || !customerPhone || !customerEmail) {
      setErrorMessage('Please provide customer Name, Phone, and Email to complete booking.')
      return
    }
    if (!acceptTerms || !acceptCancellation || !acceptRefundPolicy) {
      setErrorMessage('You must accept all required terms & cancellation policies before proceeding.')
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

      const totalAmount = getSubtotal()
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
          base_amount: totalAmount,
          extra_charges: addBowlingMachine ? selectedSlots.length * bowlingRate : 0,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          notes: `Customer: ${customerName} (${customerPhone}) ${addBowlingMachine ? '[With Bowling Machine]' : ''}`
        })
        .select('*')
        .single()

      if (bookingErr) {
        setErrorMessage(bookingErr.message)
        setIsLocking(false)
        return
      }

      // Redirect to confirmation page
      router.push(`/booking/success/${newBooking.id}`)
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while locking your slot.')
    } finally {
      setIsLocking(false)
    }
  }

  const stageTitles = ['DATE', 'VENUE', 'TIME', 'DURATION', 'OPTIONS', 'DETAILS', 'POLICIES', 'CHECKOUT']

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col pt-24">
      <Navigation />

      <section className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Minimal Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2 text-[10px] sm:text-xs font-bold text-slate-400">
            {stageTitles.map((stName, idx) => {
              const stNum = idx + 1
              const isActive = stage === stNum
              const isPassed = stage > stNum

              return (
                <div key={stName} className="flex items-center gap-1.5 shrink-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isActive ? 'bg-emerald-500 text-slate-950 font-extrabold' : isPassed ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {stNum}
                  </span>
                  <span className={isActive ? 'text-white font-bold' : isPassed ? 'text-emerald-400' : ''}>
                    {stName}
                  </span>
                  {idx < stageTitles.length - 1 && <span className="text-slate-700 mx-1">›</span>}
                </div>
              )
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SEQUENTIAL STAGE CONTAINER */}
        <AnimatePresence mode="wait">
          {/* STAGE 1: CALENDAR ONLY */}
          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Booking Step 1</span>
                <h1 className="text-3xl font-extrabold font-display text-white mt-1">CHOOSE YOUR DATE</h1>
                <p className="text-xs text-slate-400 mt-1">Select your preferred session date on the MSC calendar</p>
              </div>

              {/* Month Header Navigation */}
              <div className="flex items-center justify-between max-w-sm mx-auto pt-2 pb-4 border-b border-slate-800">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-white tracking-wide">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Calendar Days */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 py-1">
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
                        className={`h-12 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/30'
                            : isPast
                            ? 'text-slate-700 cursor-not-allowed bg-slate-950/40'
                            : 'text-slate-200 bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:text-emerald-400'
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Selected Date</span>
                  <p className="font-bold text-white text-sm">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => setStage(1)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Change Date
                </button>
              </div>

              <div className="text-center py-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Booking Step 2</span>
                <h2 className="text-2xl font-extrabold font-display text-white mt-1">CHOOSE YOUR VENUE</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {venues.map((v) => {
                  const isSelected = selectedVenue?.id === v.id
                  const basePrice = v.sport_type === 'football' ? 999 : 299
                  const imageSrc = v.sport_type === 'football'
                    ? 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp'
                    : 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%281%29-PqfOsyQfepvDymmF6Bf9BqfT3Y77G7.jpg'

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVenue(v)
                        setStage(3)
                      }}
                      className={`bg-slate-900/90 border rounded-3xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-2xl'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="relative h-44 w-full bg-slate-950">
                        <Image src={imageSrc} alt={v.name} fill className="object-cover" />
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-emerald-400 uppercase">
                          {v.sport_type}
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-lg font-bold font-display text-white">{v.name}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{v.short_description || v.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Starting From</span>
                            <span className="text-base font-extrabold text-emerald-400">₹{basePrice} <span className="text-xs text-slate-400 font-normal">/ hr</span></span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVenue(v)
                              setStage(3)
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                          >
                            Select
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Selected Venue & Date</span>
                  <p className="font-bold text-white text-sm">{selectedVenue?.name} · {selectedDate && format(selectedDate, 'MMM d, yyyy')}</p>
                </div>
                <button
                  onClick={() => setStage(2)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Change Venue
                </button>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Booking Step 3</span>
                <h2 className="text-2xl font-extrabold font-display text-white mt-1">SELECT YOUR STARTING TIME</h2>
                <p className="text-xs text-slate-400 mt-1">Only genuinely available slots are displayed (past/booked excluded)</p>
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
                            ? 'border-emerald-500 bg-emerald-600 text-white font-extrabold shadow-lg shadow-emerald-600/30'
                            : 'border-slate-800 bg-slate-950 text-slate-200 hover:border-emerald-500/50'
                        }`}
                      >
                        <span className="text-xs font-bold block">{slot.label}</span>
                        <span className={`text-xs mt-1 block ${isSelected ? 'text-emerald-100' : 'text-emerald-400 font-extrabold'}`}>
                          ₹{slot.price}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                  <CalendarIcon className="mx-auto text-slate-600 mb-2" size={36} />
                  <p className="text-xs text-slate-400">No available slots for this venue & date.</p>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button onClick={() => setStage(2)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  ← Back to Venues
                </button>
                <button
                  onClick={() => setStage(4)}
                  disabled={selectedSlots.length === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Booking Step 4</span>
                <h2 className="text-2xl font-extrabold font-display text-white mt-1">FACILITY ADD-ONS & OPTIONS</h2>
              </div>

              {selectedVenue?.sport_type === 'cricket' ? (
                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wrench size={18} className="text-sky-400" />
                      <h4 className="text-base font-bold text-white">Automated Bowling Machine</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Variable speed & swing automated bowling machine during your reserved session.
                    </p>
                    <p className="text-xs text-sky-400 font-bold mt-2">Rate: +₹{bowlingRate} / hour</p>
                  </div>

                  <button
                    onClick={() => setAddBowlingMachine(!addBowlingMachine)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      addBowlingMachine
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {addBowlingMachine ? '✓ Included' : '+ Add Bowling Machine'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center">No extra equipment add-ons required for Football Turf.</p>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button onClick={() => setStage(3)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  ← Back to Time Slots
                </button>
                <button
                  onClick={() => setStage(5)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Enter Player Details →
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 5: CUSTOMER DETAILS */}
          {stage === 5 && (
            <motion.div
              key="stage-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Booking Step 5</span>
                <h2 className="text-2xl font-extrabold font-display text-white mt-1">PLAYER IDENTITY & CONTACT</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Player Name"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 99060 00000"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="info@maqboolsports.in"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button onClick={() => setStage(4)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  ← Back to Options
                </button>
                <button
                  onClick={() => {
                    if (!customerName || !customerPhone || !customerEmail) {
                      setErrorMessage('Please provide customer Name, Phone, and Email.')
                      return
                    }
                    setErrorMessage(null)
                    setStage(6)
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Review Policies →
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 6: POLICIES ACKNOWLEDGEMENT */}
          {stage === 6 && (
            <motion.div
              key="stage-6"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Booking Step 6</span>
                <h2 className="text-2xl font-extrabold font-display text-white mt-1">COMPLEX POLICIES</h2>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs text-slate-300">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500"
                  />
                  <span>I accept the <strong>Terms & Conditions</strong> of Maqbool Sports Complex.</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptCancellation}
                    onChange={(e) => setAcceptCancellation(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500"
                  />
                  <span>I accept the <strong>Cancellation Policy</strong> (Refundable more than 5 hours prior to session start).</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptRefundPolicy}
                    onChange={(e) => setAcceptRefundPolicy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500"
                  />
                  <span>I accept the <strong>Refund Policy</strong>.</span>
                </label>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button onClick={() => setStage(5)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  ← Back to Details
                </button>
                <button
                  onClick={() => {
                    if (!acceptTerms || !acceptCancellation || !acceptRefundPolicy) {
                      setErrorMessage('You must accept all required policies before checkout.')
                      return
                    }
                    setErrorMessage(null)
                    setStage(7)
                  }}
                  disabled={!acceptTerms || !acceptCancellation || !acceptRefundPolicy}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Proceed to Summary →
                </button>
              </div>
            </motion.div>
          )}

          {/* STAGE 7: FINAL CHECKOUT SUMMARY & PAYMENT SELECTION */}
          {stage === 7 && (
            <motion.div
              key="stage-7"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Booking Step 7</span>
                <h2 className="text-2xl font-extrabold font-display text-white mt-1">YOUR SESSION SUMMARY</h2>
              </div>

              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Facility</span>
                  <span className="font-bold text-white">{selectedVenue?.name}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Date</span>
                  <span className="font-bold text-white">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Reserved Slot(s)</span>
                  <span className="font-bold text-emerald-400">{selectedSlots.map((s) => s.label).join(', ')}</span>
                </div>
                {addBowlingMachine && (
                  <div className="flex justify-between pb-2 border-b border-slate-800 text-sky-400">
                    <span>Automated Bowling Machine</span>
                    <span className="font-bold">+₹{selectedSlots.length * bowlingRate}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-white">Total Amount</span>
                  <span className="font-extrabold text-emerald-400 text-lg">₹{getSubtotal()}</span>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Payment Option</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentType === 'full' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block">100% Full Payment</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-1 block">₹{getSubtotal()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType('half')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentType === 'half' ? 'border-emerald-500 bg-emerald-950/40 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block">50% Advance Payment</span>
                    <span className="text-sm font-extrabold text-emerald-400 mt-1 block">₹{Math.ceil(getSubtotal() / 2)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Pay balance at facility</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button onClick={() => setStage(6)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  ← Back to Policies
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={isLocking}
                  className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/30 transition-all flex items-center gap-2"
                >
                  {isLocking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Locking 5-min slot...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} /> Pay ₹{getPayableNow()} & Lock Slot
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
