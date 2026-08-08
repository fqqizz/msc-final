'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Users, CreditCard, ChevronLeft, ChevronRight, Check, ArrowLeft, Info, Loader2, AlertCircle, ShieldCheck, Wrench } from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfToday } from 'date-fns'
import { TwoColorHeading } from '@/components/ui/two-color-heading'

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

  // Booking Flow State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [venues, setVenues] = useState<VenueRecord[]>([])
  const [selectedVenue, setSelectedVenue] = useState<VenueRecord | null>(null)
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([])
  const [selectedSlots, setSelectedSlots] = useState<SlotItem[]>([])
  
  // Add-ons & Pricing
  const [addBowlingMachine, setAddBowlingMachine] = useState<boolean>(false)
  const [bowlingRate, setBowlingRate] = useState<number>(299)
  const [paymentType, setPaymentType] = useState<'full' | 'half'>('full')

  // Customer Details
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptCancellation, setAcceptCancellation] = useState(false)
  const [acceptRefundPolicy, setAcceptRefundPolicy] = useState(false)

  // Status & Lock
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 1: Date & Venue, 2: Slots, 3: Add-ons & Details, 4: Checkout
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

  // 1. Fetch Venues & Base Rates from Supabase
  useEffect(() => {
    async function loadVenues() {
      try {
        setIsLoadingVenues(true)
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true })

        if (data && data.length > 0) {
          setVenues(data)
          setSelectedVenue(data[0])
        }

        // Fetch Bowling Machine resource cost
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
      if (!selectedVenue) return

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

        const now = new Date()
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
        const currentHour = now.getHours()

        const baseHourlyRate = selectedVenue.sport_type === 'football' ? 999 : 299
        const computed: SlotItem[] = []

        // Operating hours: 6 AM (06:00) to 11 PM (23:00)
        for (let hour = 6; hour <= 22; hour++) {
          const startTime = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00Z`)
          const endTime = new Date(`${dateStr}T${(hour + 1).toString().padStart(2, '0')}:00:00Z`)

          // Past hours check
          const isPast = isToday && hour <= currentHour

          // Booked check
          const isBooked = existingBookings?.some((b) => {
            const bStart = new Date(b.start_time).getHours()
            return bStart === hour
          }) || false

          // Locked check
          const isLocked = activeLocks?.some((l) => {
            const lStart = new Date(l.start_time).getHours()
            return lStart === hour
          }) || false

          // DISAPPEARANCE RULE: ONLY ADD SLOTS THAT ARE GENUINELY AVAILABLE
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

  // Custom Light Calendar Generation
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

      // 3. Create confirmed booking record in Supabase
      const firstSlot = selectedSlots[0]
      const lastSlot = selectedSlots[selectedSlots.length - 1]

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

      // Redirect to booking receipt confirmation page
      router.push(`/booking/success/${newBooking.id}`)
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while locking your slot.')
    } finally {
      setIsLocking(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col pt-20">
      <Navigation />

      <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <TwoColorHeading
            primaryText="BOOK YOUR"
            accentText="SESSION"
            tag="h1"
            className="text-3xl sm:text-4xl text-center"
          />
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Baramulla's premier sports complex — Calendar date selection, real slot availability & guest checkout
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 max-w-3xl mx-auto p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* CALENDAR FIRST SECTION */}
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Step 1</span>
              <h2 className="text-lg font-bold font-display text-slate-900">Select Date</h2>
            </div>

            {/* Month Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-slate-800 w-32 text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Next Month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Custom MSC Light Calendar Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 py-2">
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {daysInMonth.map((day) => {
                const isPast = isBefore(day, today)
                const isSelected = isSameDay(day, selectedDate)

                return (
                  <button
                    key={day.toISOString()}
                    disabled={isPast}
                    onClick={() => {
                      setSelectedDate(day)
                      setStep(2)
                    }}
                    className={`h-11 sm:h-12 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                        : isPast
                        ? 'text-slate-300 cursor-not-allowed bg-slate-50/50'
                        : 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100'
                    }`}
                  >
                    <span>{format(day, 'd')}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* STEP 2: VENUES SELECTION */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-slate-900">
              Selected Date: <span className="text-emerald-600">{format(selectedDate, 'EEEE, MMM d, yyyy')}</span>
            </h3>
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
                  onClick={() => setSelectedVenue(v)}
                  className={`bg-white border rounded-3xl overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="relative h-44 w-full bg-slate-100">
                    <Image src={imageSrc} alt={v.name} fill className="object-cover" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-lg text-[10px] font-bold text-slate-900 uppercase">
                      {v.sport_type}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4 className="text-base font-bold font-display text-slate-900">{v.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{v.short_description || v.description}</p>
                    
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Starting From</span>
                        <span className="text-base font-extrabold text-emerald-600">₹{basePrice} <span className="text-xs text-slate-500 font-normal">/ hr</span></span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedVenue(v)
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* STEP 3: REAL AVAILABLE SLOTS */}
        {selectedVenue && (
          <div className="max-w-4xl mx-auto mt-10 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Step 3</span>
                <h3 className="text-lg font-bold font-display text-slate-900">
                  Available Slots for {selectedVenue.name}
                </h3>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {availableSlots.length} available hour(s)
              </span>
            </div>

            {isLoadingSlots ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 size={28} className="animate-spin mx-auto text-emerald-600 mb-2" />
                Querying database slot availability...
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlots.some((s) => s.hour === slot.hour)
                  return (
                    <button
                      key={slot.hour}
                      onClick={() => handleSlotToggle(slot)}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                          : 'border-slate-200 bg-white hover:border-emerald-300 text-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold block">{slot.label}</span>
                      <span className={`text-xs mt-0.5 block ${isSelected ? 'text-emerald-100' : 'text-emerald-600 font-extrabold'}`}>
                        ₹{slot.price}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                <CalendarIcon className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-xs text-slate-500">No available slots for this date. All hours are booked or passed.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: ADD-ONS & CHECKOUT FORM */}
        {selectedSlots.length > 0 && (
          <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Add-ons */}
              {selectedVenue?.sport_type === 'cricket' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Wrench size={18} className="text-sky-600" />
                    <h4 className="text-base font-bold text-slate-900">Automated Bowling Machine</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Automated speed & swing bowling machine access during your reserved slot(s).
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-sky-600">+₹{bowlingRate} / hour</span>
                    <button
                      onClick={() => setAddBowlingMachine(!addBowlingMachine)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        addBowlingMachine
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {addBowlingMachine ? '✓ Added' : '+ Add Equipment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Customer Info Form */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <h4 className="text-base font-bold text-slate-900">Your Details</h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Player Name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 99060 00000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="info@maqboolsports.in"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Policies Checkboxes */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs text-slate-600">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I accept the <strong>Terms & Conditions</strong> of Maqbool Sports Complex.</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptCancellation}
                      onChange={(e) => setAcceptCancellation(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I accept the <strong>Cancellation Policy</strong> (Refundable more than 5 hrs prior to session start).</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptRefundPolicy}
                      onChange={(e) => setAcceptRefundPolicy(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I accept the <strong>Refund Policy</strong>.</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="md:col-span-1">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sticky top-24 space-y-4 shadow-sm">
                <h4 className="text-base font-bold font-display text-slate-900 pb-3 border-b border-slate-100">
                  Session Summary
                </h4>

                {selectedVenue && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Facility</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedVenue.name}</p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date</span>
                  <p className="font-semibold text-slate-700 text-xs">{format(selectedDate, 'MMM d, yyyy')}</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reserved Duration</span>
                  <p className="font-bold text-emerald-600 text-xs">{selectedSlots.length} Hour(s) ({selectedSlots.map((s) => s.label).join(', ')})</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Total Payable</span>
                  <span className="text-2xl font-extrabold text-emerald-600 font-display">₹{getSubtotal()}</span>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={isLocking || !acceptTerms || !acceptCancellation || !acceptRefundPolicy}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLocking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Locking 5-min slot...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} /> Pay ₹{getPayableNow()} & Confirm Slot
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
