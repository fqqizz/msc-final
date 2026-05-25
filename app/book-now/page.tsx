'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Users, CreditCard, ChevronLeft, ChevronRight, Check, ArrowLeft, Info, Loader2 } from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Link from 'next/link'
import Image from 'next/image'

type Venue = 'cricket-net-1' | 'cricket-net-2' | 'football-turf'
type TimeSlot = {
  time: string
  available: boolean
  price: number
}

const venues = {
  'cricket-net-1': {
    name: 'Cricket Net 1',
    price: 299,
    description: 'Professional practice net for batting and bowling',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
  },
  'cricket-net-2': {
    name: 'Cricket Net 2',
    price: 299,
    description: 'Second professional practice net ideal for team sessions',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
  },
  'football-turf': {
    name: 'Football/Cricket Turf',
    price: 899,
    description: '10,000+ sq. ft. premium synthetic turf',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-9yWOKvvBNNBK6xIquOyQsdI5jRibpr.webp',
  },
}

const formatTimeSlot = (hour: number): string => {
  const startHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  const endHour = (hour + 1) > 12 ? (hour + 1) - 12 : hour + 1 === 0 ? 12 : hour + 1
  const startPeriod = hour >= 12 ? 'PM' : 'AM'
  const endPeriod = (hour + 1) >= 12 ? 'PM' : 'AM'
  return `${startHour} ${startPeriod} - ${endHour} ${endPeriod}`
}

const generateSlots = (venue: Venue): TimeSlot[] => {
  const basePrice = venues[venue].price
  const slots: TimeSlot[] = []
  for (let hour = 6; hour <= 22; hour++) {
    const isPeakHour = hour >= 17 && hour <= 21
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6
    const available = Math.random() > 0.3
    slots.push({
      time: formatTimeSlot(hour),
      available,
      price: isPeakHour && isWeekend ? Math.round(basePrice * 1.2) : basePrice
    })
  }
  return slots
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

const getMonthName = (month: number) => {
  return new Date(2024, month).toLocaleDateString('en-US', { month: 'long' })
}

export default function BookNowPage() {
  const [venue, setVenue] = useState<Venue>('football-turf')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [step, setStep] = useState(1)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentType, setPaymentType] = useState<'full' | 'half'>('full')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  })

  const today = new Date()
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const slots = generateSlots(venue)

  const handleSlotClick = (time: string) => {
    if (selectedSlots.includes(time)) {
      setSelectedSlots(selectedSlots.filter(s => s !== time))
    } else {
      setSelectedSlots([...selectedSlots, time])
    }
  }

  const getTotalPrice = () => {
    return selectedSlots.reduce((total, time) => {
      const slot = slots.find(s => s.time === time)
      return total + (slot?.price || 0)
    }, 0)
  }

  const getPayableAmount = () => {
    const total = getTotalPrice()
    return paymentType === 'half' ? Math.ceil(total / 2) : total
  }

  const handleBooking = () => {
    setIsProcessing(true)
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setShowConfirmation(true)
    }, 1500)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    setSelectedDate(null)
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  }

  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-12 bg-white border-b border-[#0A0A0C]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#0A0A0C]/60 hover:text-[#0A0A0C] transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0A0C] tracking-tight">
            Book Your Slot
          </h1>
          <p className="mt-4 text-[#0A0A0C]/60 text-lg max-w-2xl">
            Select your preferred venue, date, and time. Simple, fast booking experience.
          </p>
        </div>
      </section>

      {/* Booking Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Booking Area */}
            <div className="lg:col-span-2">
              <div className="card-premium rounded-2xl border border-[#0A0A0C]/5 overflow-hidden">
                {/* Step Indicators */}
                <div className="px-6 pt-6 pb-4 border-b border-[#0A0A0C]/5 bg-[#F8FAFB]">
                  <div className="flex items-center justify-between max-w-md mx-auto">
                    {[
                      { num: 1, label: 'Venue' },
                      { num: 2, label: 'Date' },
                      { num: 3, label: 'Time' },
                      { num: 4, label: 'Details' },
                    ].map((s, i) => (
                      <div key={s.num} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            step > s.num 
                              ? 'bg-[#2BA84A] text-white' 
                              : step === s.num 
                                ? 'bg-[#2BA84A] text-white ring-4 ring-[#2BA84A]/20' 
                                : 'bg-[#0A0A0C]/10 text-[#0A0A0C]/40'
                          }`}>
                            {step > s.num ? <Check size={14} /> : s.num}
                          </div>
                          <span className={`text-xs mt-1 ${step >= s.num ? 'text-[#0A0A0C]' : 'text-[#0A0A0C]/40'}`}>
                            {s.label}
                          </span>
                        </div>
                        {i < 3 && (
                          <div className={`w-8 sm:w-12 h-0.5 mx-1 transition-all ${step > s.num ? 'bg-[#2BA84A]' : 'bg-[#0A0A0C]/10'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-[#F1F5F9]">
                  <motion.div 
                    className="h-full bg-[#2BA84A]"
                    initial={{ width: '25%' }}
                    animate={{ width: `${step * 25}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="p-6 sm:p-8">
                  <AnimatePresence mode="wait">
                    {/* Step 1: Venue Selection */}
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <span className="w-8 h-8 rounded-full bg-[#2BA84A] text-white flex items-center justify-center text-sm font-bold">1</span>
                          <h3 className="text-xl font-semibold text-[#0A0A0C]">Choose Your Venue</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {(Object.keys(venues) as Venue[]).map((v) => (
                            <button
                              key={v}
                              onClick={() => setVenue(v)}
                              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                venue === v 
                                  ? 'border-[#2BA84A] bg-[#E8F5EC]' 
                                  : 'border-[#0A0A0C]/10 hover:border-[#0A0A0C]/20'
                              }`}
                            >
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={venues[v].image}
                                  alt={venues[v].name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-[#0A0A0C]">{venues[v].name}</h4>
                                <p className="text-[#0A0A0C]/60 text-sm">{venues[v].description}</p>
                                <p className="text-[#2BA84A] font-semibold mt-1">₹{venues[v].price}/hour</p>
                              </div>
                              {venue === v && (
                                <div className="w-6 h-6 rounded-full bg-[#2BA84A] flex items-center justify-center">
                                  <Check size={14} className="text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setStep(2)}
                          className="mt-8 w-full sm:w-auto px-8 py-3 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-all"
                        >
                          Continue
                        </button>
                      </motion.div>
                    )}

                    {/* Step 2: Date Selection */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <span className="w-8 h-8 rounded-full bg-[#2BA84A] text-white flex items-center justify-center text-sm font-bold">2</span>
                          <h3 className="text-xl font-semibold text-[#0A0A0C]">Select Date</h3>
                        </div>

                        <div className="bg-[#F8FAFB] rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-colors">
                              <ChevronLeft size={20} className="text-[#0A0A0C]/70" />
                            </button>
                            <h4 className="text-[#0A0A0C] font-semibold">
                              {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
                            </h4>
                            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-colors">
                              <ChevronRight size={20} className="text-[#0A0A0C]/70" />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                              <div key={day} className="text-center text-xs text-[#0A0A0C]/40 py-2 font-medium">{day}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                              <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const day = i + 1
                              const disabled = isDateDisabled(day)
                              return (
                                <button
                                  key={day}
                                  onClick={() => !disabled && setSelectedDate(day)}
                                  disabled={disabled}
                                  className={`py-3 rounded-lg text-sm transition-all font-medium ${
                                    selectedDate === day
                                      ? 'bg-[#2BA84A] text-white'
                                      : disabled
                                      ? 'text-[#0A0A0C]/20 cursor-not-allowed'
                                      : 'text-[#0A0A0C]/70 hover:bg-white'
                                  }`}
                                >
                                  {day}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                          <button
                            onClick={() => setStep(1)}
                            className="px-6 py-3 border border-[#0A0A0C]/10 text-[#0A0A0C]/70 font-medium rounded-xl hover:bg-[#F8FAFB] transition-all"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => selectedDate && setStep(3)}
                            disabled={!selectedDate}
                            className="px-8 py-3 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Continue
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Time Slot Selection */}
                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <span className="w-8 h-8 rounded-full bg-[#2BA84A] text-white flex items-center justify-center text-sm font-bold">3</span>
                          <h3 className="text-xl font-semibold text-[#0A0A0C]">Select Time Slots</h3>
                        </div>

                        <p className="text-[#0A0A0C]/60 text-sm mb-4 flex items-center gap-2">
                          <Clock size={16} />
                          Available slots for {selectedDate} {getMonthName(currentDate.getMonth())}
                        </p>

                        {/* Legend */}
                        <div className="flex gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-[#E8F5EC] border border-[#2BA84A]/30" />
                            <span className="text-[#0A0A0C]/60">Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
                            <span className="text-[#0A0A0C]/60">Booked</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-[#2BA84A]" />
                            <span className="text-[#0A0A0C]/60">Selected</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {slots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => slot.available && handleSlotClick(slot.time)}
                              disabled={!slot.available}
                              className={`p-3 rounded-xl text-sm transition-all ${
                                selectedSlots.includes(slot.time)
                                  ? 'bg-[#2BA84A] text-white font-semibold'
                                  : slot.available
                                  ? 'bg-[#E8F5EC] text-[#0A0A0C]/70 hover:bg-[#d4edda] border border-[#2BA84A]/20'
                                  : 'bg-red-50 text-red-400/70 cursor-not-allowed line-through border border-red-200'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-4 mt-8">
                          <button
                            onClick={() => setStep(2)}
                            className="px-6 py-3 border border-[#0A0A0C]/10 text-[#0A0A0C]/70 font-medium rounded-xl hover:bg-[#F8FAFB] transition-all"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => selectedSlots.length > 0 && setStep(4)}
                            disabled={selectedSlots.length === 0}
                            className="px-8 py-3 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Continue
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: User Details & Confirmation */}
                    {step === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <span className="w-8 h-8 rounded-full bg-[#2BA84A] text-white flex items-center justify-center text-sm font-bold">4</span>
                          <h3 className="text-xl font-semibold text-[#0A0A0C]">Your Details</h3>
                        </div>

                        <div className="space-y-4 mb-8">
                          <div>
                            <label className="block text-sm font-medium text-[#0A0A0C] mb-2">Full Name</label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none transition-all"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#0A0A0C] mb-2">Phone Number</label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none transition-all"
                              placeholder="+91 XXXXX XXXXX"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#0A0A0C] mb-2">Email (Optional)</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none transition-all"
                              placeholder="your@email.com"
                            />
                          </div>
                        </div>

                        {/* Payment info */}
                        <div className="bg-[#E0F2FE] rounded-xl p-4 mb-6 flex items-start gap-3">
                          <Info size={20} className="text-[#0EA5E9] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[#0A0A0C] font-medium text-sm">Half Payment Option Available</p>
                            <p className="text-[#0A0A0C]/60 text-sm">Pay 50% now and the remaining amount at the venue.</p>
                          </div>
                        </div>

                        {/* Payment Type Selection */}
                        <div className="mb-8">
                          <label className="block text-sm font-medium text-[#0A0A0C] mb-3">Select Payment Option</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setPaymentType('full')}
                              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                paymentType === 'full'
                                  ? 'border-[#2BA84A] bg-[#E8F5EC]'
                                  : 'border-[#0A0A0C]/10 hover:border-[#0A0A0C]/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-[#0A0A0C]">Full Payment</span>
                                {paymentType === 'full' && (
                                  <div className="w-5 h-5 rounded-full bg-[#2BA84A] flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                  </div>
                                )}
                              </div>
                              <p className="text-2xl font-bold text-[#2BA84A]">₹{getTotalPrice().toLocaleString()}</p>
                              <p className="text-[#0A0A0C]/50 text-xs mt-1">Pay complete amount now</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentType('half')}
                              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                paymentType === 'half'
                                  ? 'border-[#2BA84A] bg-[#E8F5EC]'
                                  : 'border-[#0A0A0C]/10 hover:border-[#0A0A0C]/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-[#0A0A0C]">Half Payment</span>
                                {paymentType === 'half' && (
                                  <div className="w-5 h-5 rounded-full bg-[#2BA84A] flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                  </div>
                                )}
                              </div>
                              <p className="text-2xl font-bold text-[#2BA84A]">₹{Math.ceil(getTotalPrice() / 2).toLocaleString()}</p>
                              <p className="text-[#0A0A0C]/50 text-xs mt-1">Pay ₹{Math.floor(getTotalPrice() / 2).toLocaleString()} at venue</p>
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button
                            onClick={() => setStep(3)}
                            className="px-6 py-3 border border-[#0A0A0C]/10 text-[#0A0A0C]/70 font-medium rounded-xl hover:bg-[#F8FAFB] transition-all"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleBooking}
                            disabled={!formData.name || !formData.phone || isProcessing}
                            className="flex-1 px-8 py-3 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard size={18} />
                                {paymentType === 'half' ? 'Pay 50% Now' : 'Confirm & Pay'} - ₹{getPayableAmount().toLocaleString()}
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Booking Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-[#0A0A0C]/5 p-6 sticky top-28">
                <h4 className="text-lg font-semibold text-[#0A0A0C] mb-4">Booking Summary</h4>
                
                {/* Venue */}
                <div className="flex items-center gap-3 pb-4 border-b border-[#0A0A0C]/5">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={venues[venue].image}
                      alt={venues[venue].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-[#0A0A0C]">{venues[venue].name}</p>
                    <p className="text-[#2BA84A] text-sm font-medium">₹{venues[venue].price}/hour</p>
                  </div>
                </div>

                {/* Date */}
                <div className="py-4 border-b border-[#0A0A0C]/5">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-[#0A0A0C]/40" />
                    <div>
                      <p className="text-[#0A0A0C]/60 text-sm">Date</p>
                      <p className="text-[#0A0A0C] font-medium">
                        {selectedDate 
                          ? `${selectedDate} ${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`
                          : 'Not selected'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="py-4 border-b border-[#0A0A0C]/5">
                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-[#0A0A0C]/40 mt-0.5" />
                    <div>
                      <p className="text-[#0A0A0C]/60 text-sm">Time Slots</p>
                      {selectedSlots.length > 0 ? (
                        <p className="text-[#0A0A0C] font-medium">{selectedSlots.sort().join(', ')}</p>
                      ) : (
                        <p className="text-[#0A0A0C]/40">Not selected</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#0A0A0C]/60">Total Amount</span>
                    <span className="text-2xl font-bold text-[#2BA84A]">₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                  {selectedSlots.length > 0 && (
                    <p className="text-[#0A0A0C]/40 text-sm mt-1">
                      {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} x ₹{venues[venue].price}
                    </p>
                  )}
                  {paymentType === 'half' && selectedSlots.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#0A0A0C]/5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#0A0A0C]/60">Pay Now (50%)</span>
                        <span className="text-[#2BA84A] font-semibold">₹{Math.ceil(getTotalPrice() / 2).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-[#0A0A0C]/60">Pay at Venue</span>
                        <span className="text-[#0A0A0C] font-medium">₹{Math.floor(getTotalPrice() / 2).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-[#E8F5EC] flex items-center justify-center mx-auto mb-6">
                <Check size={32} className="text-[#2BA84A]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0A0A0C] mb-2">Booking Confirmed!</h3>
              <p className="text-[#0A0A0C]/60 mb-6">
                Your slot has been reserved. You&apos;ll receive a confirmation on WhatsApp shortly.
              </p>
              <div className="bg-[#F8FAFB] rounded-xl p-4 mb-6 text-left">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-[#0A0A0C]/60">Venue:</span>
                  <span className="text-[#0A0A0C] font-medium">{venues[venue].name}</span>
                  <span className="text-[#0A0A0C]/60">Date:</span>
                  <span className="text-[#0A0A0C] font-medium">{selectedDate} {getMonthName(currentDate.getMonth())}</span>
                  <span className="text-[#0A0A0C]/60">Time:</span>
                  <span className="text-[#0A0A0C] font-medium">{selectedSlots.sort().join(', ')}</span>
                  <span className="text-[#0A0A0C]/60">Total Amount:</span>
                  <span className="text-[#0A0A0C] font-medium">₹{getTotalPrice().toLocaleString()}</span>
                  <span className="text-[#0A0A0C]/60">Paid Now:</span>
                  <span className="text-[#2BA84A] font-bold">₹{getPayableAmount().toLocaleString()}</span>
                  {paymentType === 'half' && (
                    <>
                      <span className="text-[#0A0A0C]/60">Due at Venue:</span>
                      <span className="text-orange-600 font-medium">₹{Math.floor(getTotalPrice() / 2).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
              <Link
                href="/"
                className="w-full inline-block px-8 py-3 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-all"
              >
                Back to Home
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
