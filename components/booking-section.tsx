'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Users, CreditCard, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'

type Sport = 'football' | 'cricket'
type TimeSlot = {
  time: string
  available: boolean
  price: number
}

const generateSlots = (sport: Sport): TimeSlot[] => {
  const basePrice = sport === 'football' ? 899 : 299
  const slots: TimeSlot[] = []
  for (let hour = 6; hour <= 22; hour++) {
    const isPeakHour = hour >= 17 && hour <= 21
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6
    const available = Math.random() > 0.3
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
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

export default function BookingSection() {
  const [sport, setSport] = useState<Sport>('football')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [step, setStep] = useState(1)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [videoError, setVideoError] = useState(false)

  const today = new Date()
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const slots = generateSlots(sport)

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

  const handleBooking = () => {
    setShowConfirmation(true)
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
    <section className="relative py-32 bg-[#050505]" id="booking">
      {/* Background video */}
      <div className="absolute inset-0 overflow-hidden">
        {!videoError && (
          <video
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          >
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-506-AlV7uN64aNtx5MJMgbpQwZIrxqmkc9.mp4" type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/90 to-[#050505]" />
      </div>
      
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#2BA84A]/10 to-transparent blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-[#2BA84A]/10 border border-[#2BA84A]/20 rounded-full text-[#2BA84A] text-sm font-medium mb-6">
            Book Your Slot
          </span>
          <h2 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            RESERVE YOUR GAME
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Simple, fast booking. Select your sport, pick a date and time, and get ready to play.
          </p>
        </motion.div>

        {/* Booking card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-3xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="h-1 bg-white/5">
            <motion.div 
              className="h-full bg-[#2BA84A]"
              initial={{ width: '33%' }}
              animate={{ width: `${step * 33}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {/* Step 1: Sport Selection */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#2BA84A] text-[#050505] flex items-center justify-center text-sm font-bold">1</span>
                    Choose Your Sport
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {(['football', 'cricket'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSport(s)}
                        className={`relative p-6 rounded-2xl border-2 transition-all ${
                          sport === s 
                            ? 'border-[#2BA84A] bg-[#2BA84A]/10' 
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-left">
                          <h4 className="text-lg font-semibold text-white capitalize">{s} Turf</h4>
                          <p className="text-white/50 text-sm mt-1">
                            {s === 'football' ? '₹899/hour • Full pitch' : '₹299/hour • Cricket nets'}
                          </p>
                        </div>
                        {sport === s && (
                          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#2BA84A] flex items-center justify-center">
                            <Check size={14} className="text-[#050505]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-8 py-3 bg-[#2BA84A] text-[#050505] font-semibold rounded-xl btn-glow hover:bg-[#34c759] transition-all"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {/* Step 2: Date & Time Selection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#2BA84A] text-[#050505] flex items-center justify-center text-sm font-bold">2</span>
                    Select Date & Time
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Calendar */}
                    <div className="bg-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <ChevronLeft size={20} className="text-white/70" />
                        </button>
                        <h4 className="text-white font-medium">
                          {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
                        </h4>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <ChevronRight size={20} className="text-white/70" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <div key={day} className="text-center text-xs text-white/40 py-2">{day}</div>
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
                              className={`py-2 rounded-lg text-sm transition-all ${
                                selectedDate === day
                                  ? 'bg-[#2BA84A] text-[#050505] font-semibold'
                                  : disabled
                                  ? 'text-white/20 cursor-not-allowed'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div>
                      <h4 className="text-white/70 text-sm mb-4 flex items-center gap-2">
                        <Clock size={16} />
                        Available Slots {selectedDate && `- ${selectedDate} ${getMonthName(currentDate.getMonth())}`}
                      </h4>
                      {selectedDate ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                          {slots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => slot.available && handleSlotClick(slot.time)}
                              disabled={!slot.available}
                              className={`p-3 rounded-xl text-sm transition-all ${
                                selectedSlots.includes(slot.time)
                                  ? 'bg-[#2BA84A] text-[#050505] font-semibold'
                                  : slot.available
                                  ? 'bg-white/5 text-white/70 hover:bg-white/10'
                                  : 'bg-red-500/10 text-red-400/50 cursor-not-allowed line-through'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[200px] text-white/40 border border-dashed border-white/10 rounded-2xl">
                          <Calendar size={24} className="mr-2" />
                          Select a date to view slots
                        </div>
                      )}
                      {selectedSlots.length > 0 && (
                        <div className="mt-4 p-4 bg-[#2BA84A]/10 rounded-xl">
                          <p className="text-white/70 text-sm">
                            {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                          </p>
                          <p className="text-[#2BA84A] font-semibold">
                            Total: ₹{getTotalPrice().toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/5 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => selectedDate && selectedSlots.length > 0 && setStep(3)}
                      disabled={!selectedDate || selectedSlots.length === 0}
                      className="px-8 py-3 bg-[#2BA84A] text-[#050505] font-semibold rounded-xl btn-glow hover:bg-[#34c759] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#2BA84A] text-[#050505] flex items-center justify-center text-sm font-bold">3</span>
                    Confirm Booking
                  </h3>

                  <div className="bg-white/5 rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center">
                          <Users size={20} className="text-[#2BA84A]" />
                        </div>
                        <div>
                          <p className="text-white/50 text-sm">Sport</p>
                          <p className="text-white font-medium capitalize">{sport} Turf</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center">
                          <Calendar size={20} className="text-[#2BA84A]" />
                        </div>
                        <div>
                          <p className="text-white/50 text-sm">Date</p>
                          <p className="text-white font-medium">
                            {selectedDate} {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center">
                          <Clock size={20} className="text-[#2BA84A]" />
                        </div>
                        <div>
                          <p className="text-white/50 text-sm">Time Slots</p>
                          <p className="text-white font-medium">{selectedSlots.sort().join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/20 flex items-center justify-center">
                          <CreditCard size={20} className="text-[#2BA84A]" />
                        </div>
                        <div>
                          <p className="text-white/50 text-sm">Total Amount</p>
                          <p className="text-[#2BA84A] font-semibold text-xl">₹{getTotalPrice().toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-3 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/5 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleBooking}
                      className="flex-1 sm:flex-none px-8 py-3 bg-[#2BA84A] text-[#050505] font-semibold rounded-xl btn-glow hover:bg-[#34c759] transition-all"
                    >
                      Confirm & Pay
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Football Turf</h4>
              <span className="px-3 py-1 bg-[#2BA84A]/20 text-[#2BA84A] text-sm rounded-full">Popular</span>
            </div>
            <p className="text-3xl font-bold text-white mb-2">₹899<span className="text-base font-normal text-white/50">/hour</span></p>
            <p className="text-white/50 text-sm">Full-size professional football pitch with floodlights</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-2xl"
          >
            <h4 className="text-lg font-semibold text-white mb-4">Cricket Nets</h4>
            <p className="text-3xl font-bold text-white mb-2">₹299<span className="text-base font-normal text-white/50">/hour</span></p>
            <p className="text-white/50 text-sm">Professional practice nets for batting and bowling</p>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0A0A0C] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#2BA84A]/20 flex items-center justify-center mx-auto mb-6">
                <Check size={32} className="text-[#2BA84A]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h3>
              <p className="text-white/60 mb-6">
                Your slot has been reserved. You&apos;ll receive a confirmation on WhatsApp shortly.
              </p>
              <button
                onClick={() => {
                  setShowConfirmation(false)
                  setStep(1)
                  setSelectedSlots([])
                  setSelectedDate(null)
                }}
                className="w-full px-6 py-3 bg-[#2BA84A] text-[#050505] font-semibold rounded-xl btn-glow"
              >
                Done
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
