'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, ChevronLeft, ChevronRight, Check, ArrowLeft,
  Loader2, AlertCircle, MapPin, Users, Zap, Phone, Mail, User,
  CheckCircle2, Copy, Star,
} from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Link from 'next/link'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Venue {
  id: string
  name: string
  slug: string
  sport_type: string
  short_description: string
  max_capacity: number
  surface_type: string
  status: string
  primary_image?: string
}

interface SlotAvailability {
  hour: number
  label: string
  start_time: string
  end_time: string
  available: boolean
  price: number
  is_peak: boolean
}

interface BookingResult {
  id: string
  booking_number: string
  venue_name: string
  date: string
  slot_labels: string[]
  duration_hours: number
  total_amount: number
  amount_paid: number
  balance_due: number
  payment_status: string
  booking_status: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function fmtINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

const sportIcon: Record<string, string> = {
  football: '⚽',
  cricket: '🏏',
  bowling: '🎳',
  multi_purpose: '🏟️',
}

// ─── Fallback venue images ─────────────────────────────────────────────────────

const VENUE_IMAGES: Record<string, string> = {
  'football-turf': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-9yWOKvvBNNBK6xIquOyQsdI5jRibpr.webp',
  'cricket-net-1': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
  'cricket-net-2': 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BookNowPage() {
  // Step navigation
  const [step, setStep] = useState(1)

  // Venue data
  const [venues, setVenues] = useState<Venue[]>([])
  const [venuesLoading, setVenuesLoading] = useState(true)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)

  // Date selection
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Slot data
  const [slots, setSlots] = useState<SlotAvailability[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<SlotAvailability[]>([])

  // Form
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
  const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full')
  const [notes, setNotes] = useState('')

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  const [copied, setCopied] = useState(false)

  // ─── Load venues ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadVenues() {
      try {
        const res = await fetch('/api/venues')
        const json = await res.json()
        setVenues(json.venues ?? [])
        if (json.venues?.length) setSelectedVenue(json.venues[0])
      } catch {
        // fallback handled by empty state
      } finally {
        setVenuesLoading(false)
      }
    }
    loadVenues()
  }, [])

  // ─── Load slots when venue + date change ────────────────────────────────────

  const loadSlots = useCallback(async (venue: Venue, date: Date) => {
    setSlotsLoading(true)
    setSlotsError(null)
    setSelectedSlots([])
    const dateStr = date.toISOString().slice(0, 10)
    try {
      const res = await fetch(`/api/availability?venue_id=${venue.id}&date=${dateStr}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load slots')
      setSlots(json.slots ?? [])
    } catch (e: unknown) {
      setSlotsError(e instanceof Error ? e.message : 'Failed to load availability')
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedVenue && selectedDate) loadSlots(selectedVenue, selectedDate)
  }, [selectedVenue, selectedDate, loadSlots])

  // ─── Derived ────────────────────────────────────────────────────────────────

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalPrice = selectedSlots.reduce((s, sl) => s + sl.price, 0)
  const advancePrice = Math.ceil(totalPrice / 2)
  const payable = paymentType === 'full' ? totalPrice : advancePrice
  const balance = totalPrice - payable

  const isFormValid =
    formData.name.trim().length >= 2 &&
    formData.phone.trim().length >= 10

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSlotToggle = (slot: SlotAvailability) => {
    if (!slot.available) return
    setSelectedSlots(prev =>
      prev.find(s => s.hour === slot.hour)
        ? prev.filter(s => s.hour !== slot.hour)
        : [...prev, slot].sort((a, b) => a.hour - b.hour)
    )
  }

  const handleBook = async () => {
    if (!selectedVenue || !selectedDate || selectedSlots.length === 0 || !isFormValid) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: selectedVenue.id,
          date: selectedDate.toISOString().slice(0, 10),
          slots: selectedSlots.map(s => ({
            hour: s.hour,
            label: s.label,
            start_time: s.start_time,
            end_time: s.end_time,
            price: s.price,
          })),
          customer_name: formData.name.trim(),
          customer_phone: formData.phone.trim(),
          customer_email: formData.email.trim() || undefined,
          payment_type: paymentType,
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Booking failed')
      setBookingResult(json.booking)
      setStep(5)
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const copyRef = () => {
    if (!bookingResult) return
    navigator.clipboard.writeText(bookingResult.booking_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Calendar helpers ────────────────────────────────────────────────────────

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const isDateDisabled = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return d < today
  }

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getFullYear() === currentMonth.getFullYear() &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getDate() === day
    )
  }

  // ─── Confirmation screen ──────────────────────────────────────────────────────

  if (step === 5 && bookingResult) {
    return (
      <main className="min-h-screen bg-[#F8FAFB]">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl border border-black/5 shadow-xl overflow-hidden"
            >
              {/* Success header */}
              <div className="bg-gradient-to-br from-[#146B3A] to-[#2BA84A] px-8 py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 size={40} className="text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-white">Booking Confirmed!</h1>
                <p className="text-white/80 mt-2 text-sm">
                  {bookingResult.customer_email
                    ? `A confirmation has been sent to ${bookingResult.customer_email}`
                    : 'Your slot has been successfully reserved.'}
                </p>
              </div>

              {/* Booking ref */}
              <div className="bg-[#E8F5EC] px-8 py-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#146B3A] font-semibold uppercase tracking-wider">Booking Reference</p>
                  <p className="text-xl font-bold text-[#0A0A0C] mt-0.5 font-mono">{bookingResult.booking_number}</p>
                </div>
                <button
                  onClick={copyRef}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-medium text-[#2BA84A] border border-[#2BA84A]/20 hover:bg-[#2BA84A] hover:text-white transition-all duration-200"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Details */}
              <div className="px-8 py-6 space-y-3">
                {[
                  ['Venue', bookingResult.venue_name],
                  ['Date', new Date(bookingResult.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                  ['Time Slots', bookingResult.slot_labels.join(', ')],
                  ['Duration', `${bookingResult.duration_hours} hour${bookingResult.duration_hours > 1 ? 's' : ''}`],
                  ['Total Amount', fmtINR(bookingResult.total_amount)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-start py-2.5 border-b border-black/5 last:border-0">
                    <span className="text-sm text-black/50">{label}</span>
                    <span className="text-sm font-semibold text-[#0A0A0C] text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2.5 border-b border-black/5">
                  <span className="text-sm text-black/50">Amount Paid</span>
                  <span className="text-base font-bold text-[#2BA84A]">{fmtINR(bookingResult.amount_paid)}</span>
                </div>
                {bookingResult.balance_due > 0 && (
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-sm text-black/50">Balance Due at Venue</span>
                    <span className="text-base font-bold text-orange-500">{fmtINR(bookingResult.balance_due)}</span>
                  </div>
                )}
              </div>

              {/* Important note */}
              <div className="mx-8 mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-amber-800 mb-2">Important</p>
                <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
                  <li>Arrive 10 minutes before your slot</li>
                  <li>Quote your booking reference at the venue</li>
                  {bookingResult.balance_due > 0 && <li>Balance payment due at the venue before your slot starts</li>}
                  <li>For changes, contact us at least 24 hours in advance</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="flex-1 px-6 py-3 bg-[#F1F5F9] text-[#0A0A0C] font-semibold text-sm rounded-xl text-center hover:bg-[#E2E8F0] transition-colors"
                >
                  Back to Home
                </Link>
                <Link
                  href="/book-now"
                  onClick={() => { setStep(1); setBookingResult(null); setSelectedSlots([]) }}
                  className="flex-1 px-6 py-3 bg-[#2BA84A] text-white font-semibold text-sm rounded-xl text-center hover:bg-[#146B3A] transition-colors"
                >
                  Book Another Slot
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  // ─── Main booking flow ────────────────────────────────────────────────────────

  const steps = [
    { num: 1, label: 'Venue' },
    { num: 2, label: 'Date' },
    { num: 3, label: 'Time' },
    { num: 4, label: 'Details' },
  ]

  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <Navigation />

      {/* Page header */}
      <section className="pt-32 pb-10 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-black/50 hover:text-black transition-colors mb-6 text-sm">
            <ArrowLeft size={15} />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight">Book Your Slot</h1>
          <p className="mt-3 text-black/60 max-w-xl">Select venue, date, and time. Instant confirmation with email receipt.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left: main flow ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">

                {/* Step indicator */}
                <div className="px-6 pt-6 pb-4 bg-[#F8FAFB] border-b border-black/5">
                  <div className="flex items-center justify-between max-w-sm mx-auto">
                    {steps.map((s, i) => (
                      <div key={s.num} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => step > s.num && setStep(s.num)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step > s.num
                                ? 'bg-[#2BA84A] text-white cursor-pointer hover:bg-[#146B3A]'
                                : step === s.num
                                ? 'bg-[#2BA84A] text-white ring-4 ring-[#2BA84A]/20'
                                : 'bg-black/10 text-black/30 cursor-default'
                            }`}
                          >
                            {step > s.num ? <Check size={13} /> : s.num}
                          </button>
                          <span className={`text-[10px] mt-1 font-medium ${step >= s.num ? 'text-[#0A0A0C]' : 'text-black/30'}`}>
                            {s.label}
                          </span>
                        </div>
                        {i < 3 && (
                          <div className={`w-10 sm:w-14 h-0.5 mx-1 rounded-full transition-all ${step > s.num ? 'bg-[#2BA84A]' : 'bg-black/10'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-[#F1F5F9]">
                  <motion.div
                    className="h-full bg-[#2BA84A]"
                    animate={{ width: `${((step - 1) / 3) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>

                {/* Step content */}
                <div className="p-6 sm:p-8">
                  <AnimatePresence mode="wait">

                    {/* ── Step 1: Venue ── */}
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                        <h2 className="text-lg font-bold text-[#0A0A0C] mb-6">Select Venue</h2>
                        {venuesLoading ? (
                          <div className="flex items-center justify-center py-16">
                            <Loader2 size={28} className="animate-spin text-[#2BA84A]" />
                          </div>
                        ) : venues.length === 0 ? (
                          <div className="text-center py-12 text-black/50">
                            <AlertCircle size={32} className="mx-auto mb-3" />
                            <p>No venues available. Please check back soon.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {venues.map(v => {
                              const img = v.primary_image ?? VENUE_IMAGES[v.slug] ?? ''
                              const isSelected = selectedVenue?.id === v.id
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => setSelectedVenue(v)}
                                  className={`flex gap-4 text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
                                    isSelected
                                      ? 'border-[#2BA84A] bg-[#E8F5EC]'
                                      : 'border-black/5 bg-white hover:border-[#2BA84A]/40 hover:bg-[#F8FAFB]'
                                  }`}
                                >
                                  <div className="relative w-24 h-20 sm:w-32 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden">
                                    <Image src={img} alt={v.name} fill className="object-cover" sizes="128px" />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-[#2BA84A]/30 flex items-center justify-center">
                                        <Check size={20} className="text-white drop-shadow" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h3 className="font-bold text-[#0A0A0C] text-sm sm:text-base leading-tight">{v.name}</h3>
                                      <span className="text-lg flex-shrink-0">{sportIcon[v.sport_type] ?? '🏟️'}</span>
                                    </div>
                                    <p className="text-xs text-black/50 mt-1 line-clamp-2">{v.short_description}</p>
                                    <div className="flex flex-wrap gap-3 mt-3">
                                      {v.surface_type && (
                                        <span className="flex items-center gap-1 text-xs text-black/50">
                                          <Zap size={11} /> {v.surface_type}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1 text-xs text-black/50">
                                        <Users size={11} /> Max {v.max_capacity}
                                      </span>
                                      <span className={`flex items-center gap-1 text-xs font-medium ${v.status === 'active' ? 'text-[#2BA84A]' : 'text-orange-500'}`}>
                                        <Star size={11} /> {v.status === 'active' ? 'Available' : v.status}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {selectedVenue && (
                          <button
                            onClick={() => setStep(2)}
                            className="mt-6 w-full py-3.5 bg-[#2BA84A] hover:bg-[#146B3A] text-white font-semibold rounded-xl transition-colors duration-200"
                          >
                            Continue to Date Selection
                          </button>
                        )}
                      </motion.div>
                    )}

                    {/* ── Step 2: Date ── */}
                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                        <h2 className="text-lg font-bold text-[#0A0A0C] mb-6">Select Date</h2>

                        {/* Calendar */}
                        <div className="bg-[#F8FAFB] rounded-2xl p-5">
                          {/* Month nav */}
                          <div className="flex items-center justify-between mb-5">
                            <button
                              onClick={() => {
                                const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                                if (d >= new Date(today.getFullYear(), today.getMonth())) setCurrentMonth(d)
                              }}
                              className="p-2 rounded-xl hover:bg-white transition-colors"
                            >
                              <ChevronLeft size={18} className="text-black/50" />
                            </button>
                            <span className="font-semibold text-[#0A0A0C]">
                              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </span>
                            <button
                              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                              className="p-2 rounded-xl hover:bg-white transition-colors"
                            >
                              <ChevronRight size={18} className="text-black/50" />
                            </button>
                          </div>

                          {/* Day labels */}
                          <div className="grid grid-cols-7 mb-2">
                            {DAYS.map(d => (
                              <div key={d} className="text-center text-xs font-semibold text-black/40 py-1">{d}</div>
                            ))}
                          </div>

                          {/* Calendar grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const day = i + 1
                              const disabled = isDateDisabled(day)
                              const selected = isDateSelected(day)
                              const isToday =
                                today.getFullYear() === currentMonth.getFullYear() &&
                                today.getMonth() === currentMonth.getMonth() &&
                                today.getDate() === day
                              return (
                                <button
                                  key={day}
                                  disabled={disabled}
                                  onClick={() => {
                                    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
                                    setSelectedSlots([])
                                  }}
                                  className={`aspect-square text-sm rounded-xl font-medium transition-all duration-150 ${
                                    disabled
                                      ? 'text-black/20 cursor-not-allowed'
                                      : selected
                                      ? 'bg-[#2BA84A] text-white shadow-md shadow-[#2BA84A]/30'
                                      : isToday
                                      ? 'bg-white text-[#2BA84A] ring-2 ring-[#2BA84A] font-bold'
                                      : 'hover:bg-white text-[#0A0A0C] hover:shadow-sm'
                                  }`}
                                >
                                  {day}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors">
                            Back
                          </button>
                          <button
                            onClick={() => { if (selectedDate) setStep(3) }}
                            disabled={!selectedDate}
                            className="flex-1 py-3 bg-[#2BA84A] hover:bg-[#146B3A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200"
                          >
                            {selectedDate
                              ? `Continue – ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                              : 'Select a Date'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Step 3: Time Slots ── */}
                    {step === 3 && (
                      <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-lg font-bold text-[#0A0A0C]">Select Time Slots</h2>
                          {selectedDate && (
                            <span className="text-sm text-black/50">
                              {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>

                        {slotsLoading ? (
                          <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 size={28} className="animate-spin text-[#2BA84A]" />
                            <p className="text-sm text-black/50">Loading availability...</p>
                          </div>
                        ) : slotsError ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                            <AlertCircle size={28} className="text-red-400" />
                            <p className="text-sm text-red-600">{slotsError}</p>
                            <button
                              onClick={() => selectedVenue && selectedDate && loadSlots(selectedVenue, selectedDate)}
                              className="text-sm text-[#2BA84A] underline"
                            >
                              Try again
                            </button>
                          </div>
                        ) : slots.length === 0 ? (
                          <div className="text-center py-12 text-black/50">
                            <Clock size={32} className="mx-auto mb-3" />
                            <p>No slots available for this date.</p>
                          </div>
                        ) : (
                          <>
                            {/* Legend */}
                            <div className="flex flex-wrap gap-3 mb-4 text-xs">
                              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#2BA84A]" />Selected</span>
                              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-white border-2 border-[#2BA84A]" />Available</span>
                              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400" />Peak Hour</span>
                              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-black/10" />Booked</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {slots.map(slot => {
                                const isSelected = selectedSlots.some(s => s.hour === slot.hour)
                                return (
                                  <button
                                    key={slot.hour}
                                    onClick={() => handleSlotToggle(slot)}
                                    disabled={!slot.available}
                                    className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                                      !slot.available
                                        ? 'border-black/5 bg-black/5 cursor-not-allowed opacity-50'
                                        : isSelected
                                        ? 'border-[#2BA84A] bg-[#2BA84A] text-white shadow-md shadow-[#2BA84A]/20'
                                        : slot.is_peak
                                        ? 'border-orange-200 bg-orange-50 hover:border-orange-400 cursor-pointer'
                                        : 'border-black/5 bg-[#F8FAFB] hover:border-[#2BA84A]/50 cursor-pointer'
                                    }`}
                                  >
                                    <p className={`text-xs font-semibold leading-tight ${isSelected ? 'text-white' : 'text-[#0A0A0C]'}`}>
                                      {slot.label}
                                    </p>
                                    <p className={`text-sm font-bold mt-1 ${isSelected ? 'text-white' : slot.is_peak ? 'text-orange-600' : 'text-[#2BA84A]'}`}>
                                      {fmtINR(slot.price)}
                                    </p>
                                    {slot.is_peak && !isSelected && (
                                      <span className="text-[9px] text-orange-500 font-semibold uppercase tracking-wide">Peak</span>
                                    )}
                                    {!slot.available && (
                                      <span className="text-[9px] text-black/40 font-medium uppercase tracking-wide">Booked</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>

                            {selectedSlots.length > 0 && (
                              <div className="mt-4 p-4 bg-[#E8F5EC] rounded-xl">
                                <p className="text-sm font-semibold text-[#146B3A]">
                                  {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected — Total: {fmtINR(totalPrice)}
                                </p>
                                <p className="text-xs text-[#2BA84A] mt-0.5">
                                  {selectedSlots.map(s => s.label).join(', ')}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        <div className="flex gap-3 mt-6">
                          <button onClick={() => setStep(2)} className="px-5 py-3 rounded-xl border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors">
                            Back
                          </button>
                          <button
                            onClick={() => setStep(4)}
                            disabled={selectedSlots.length === 0}
                            className="flex-1 py-3 bg-[#2BA84A] hover:bg-[#146B3A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200"
                          >
                            {selectedSlots.length > 0 ? `Continue – ${fmtINR(totalPrice)}` : 'Select at least one slot'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Step 4: Details ── */}
                    {step === 4 && (
                      <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                        <h2 className="text-lg font-bold text-[#0A0A0C] mb-6">Your Details & Payment</h2>

                        <div className="space-y-4">
                          {/* Name */}
                          <div>
                            <label className="block text-sm font-semibold text-[#0A0A0C] mb-1.5">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                              <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                placeholder="Enter your full name"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 bg-[#F8FAFB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/30 focus:border-[#2BA84A] transition-all"
                              />
                            </div>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-semibold text-[#0A0A0C] mb-1.5">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                                placeholder="+91 XXXXX XXXXX"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 bg-[#F8FAFB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/30 focus:border-[#2BA84A] transition-all"
                              />
                            </div>
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-semibold text-[#0A0A0C] mb-1.5">
                              Email Address <span className="text-black/30 font-normal">(optional — for confirmation email)</span>
                            </label>
                            <div className="relative">
                              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                              <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                                placeholder="you@email.com"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 bg-[#F8FAFB] text-sm focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/30 focus:border-[#2BA84A] transition-all"
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-sm font-semibold text-[#0A0A0C] mb-1.5">
                              Special Requests <span className="text-black/30 font-normal">(optional)</span>
                            </label>
                            <textarea
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                              placeholder="E.g. need extra balls, birthday match..."
                              rows={2}
                              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F8FAFB] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/30 focus:border-[#2BA84A] transition-all"
                            />
                          </div>

                          {/* Payment type */}
                          <div>
                            <label className="block text-sm font-semibold text-[#0A0A0C] mb-3">Payment Option</label>
                            <div className="grid grid-cols-2 gap-3">
                              {([
                                { value: 'full' as const, label: 'Full Payment', sub: `Pay ${fmtINR(totalPrice)} now`, badge: null },
                                { value: 'advance' as const, label: 'Advance (50%)', sub: `Pay ${fmtINR(advancePrice)} now`, badge: `${fmtINR(totalPrice - advancePrice)} at venue` },
                              ]).map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => setPaymentType(opt.value)}
                                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                                    paymentType === opt.value
                                      ? 'border-[#2BA84A] bg-[#E8F5EC]'
                                      : 'border-black/5 bg-[#F8FAFB] hover:border-[#2BA84A]/30'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-[#0A0A0C]">{opt.label}</span>
                                    {paymentType === opt.value && <Check size={14} className="text-[#2BA84A]" />}
                                  </div>
                                  <p className="text-xs font-bold text-[#2BA84A]">{opt.sub}</p>
                                  {opt.badge && <p className="text-[10px] text-orange-500 mt-0.5">{opt.badge}</p>}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {submitError && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{submitError}</p>
                          </div>
                        )}

                        <div className="flex gap-3 mt-6">
                          <button onClick={() => setStep(3)} className="px-5 py-3 rounded-xl border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors">
                            Back
                          </button>
                          <button
                            onClick={handleBook}
                            disabled={!isFormValid || submitting}
                            className="flex-1 py-3 bg-[#2BA84A] hover:bg-[#146B3A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            {submitting ? (
                              <><Loader2 size={16} className="animate-spin" /> Confirming...</>
                            ) : (
                              <>Confirm Booking – {fmtINR(payable)}</>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* ── Right: Summary sidebar ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-4">

                {/* Selected venue card */}
                {selectedVenue && (
                  <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="relative h-36">
                      <Image
                        src={selectedVenue.primary_image ?? VENUE_IMAGES[selectedVenue.slug] ?? ''}
                        alt={selectedVenue.name}
                        fill
                        className="object-cover"
                        sizes="320px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="text-white font-bold text-sm">{selectedVenue.name}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2.5 text-sm">
                      <div className="flex items-center gap-2 text-black/60">
                        <MapPin size={14} /> <span>Maqbool Sports Complex, Baramulla</span>
                      </div>
                      {selectedDate && (
                        <div className="flex items-center gap-2 text-black/60">
                          <Calendar size={14} />
                          <span>{selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                      )}
                      {selectedSlots.length > 0 && (
                        <div className="flex items-start gap-2 text-black/60">
                          <Clock size={14} className="mt-0.5 flex-shrink-0" />
                          <span>{selectedSlots.map(s => s.label).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Price summary */}
                {selectedSlots.length > 0 && (
                  <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
                    <h3 className="font-bold text-[#0A0A0C] mb-4 text-sm">Price Summary</h3>
                    <div className="space-y-2">
                      {selectedSlots.map(s => (
                        <div key={s.hour} className="flex justify-between text-sm">
                          <span className="text-black/60">{s.label}</span>
                          <span className="font-medium">{fmtINR(s.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-black/5 mt-3 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-black/60">Total</span>
                        <span className="font-bold text-[#0A0A0C]">{fmtINR(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-black/60">Pay now ({paymentType === 'full' ? '100%' : '50%'})</span>
                        <span className="font-bold text-[#2BA84A]">{fmtINR(payable)}</span>
                      </div>
                      {balance > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-black/60">Balance at venue</span>
                          <span className="font-medium text-orange-500">{fmtINR(balance)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Venue hours note */}
                <div className="bg-[#E8F5EC] rounded-2xl p-4">
                  <p className="text-xs font-semibold text-[#146B3A] mb-1">Operating Hours</p>
                  <p className="text-xs text-[#2BA84A]">Open daily 6 AM – 11 PM</p>
                  <p className="text-xs text-[#2BA84A] mt-1">For inquiries: +91-XXX-XXX-XXXX</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
