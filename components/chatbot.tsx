'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Sparkles, Calendar, Clock, MapPin, Phone, IndianRupee, HelpCircle } from 'lucide-react'
import Link from 'next/link'

// MSC Knowledge Base
const MSC_KNOWLEDGE = {
  hours: {
    open: '6 AM',
    close: '11 PM',
    days: 'Open all 7 days'
  },
  location: {
    address: 'Sangri Colony, Baramulla, Jammu and Kashmir, 193101',
    landmark: 'Near Sangri Colony'
  },
  contact: {
    phone: '+91 9682558775',
    email: 'info@maqboolsportscomplex.com',
    social: '@msc_baramulla on Instagram'
  },
  pricing: {
    cricketNet: { name: 'Cricket Net', price: 299, unit: 'per hour' },
    footballTurf: { name: 'Football/Cricket Turf', price: 899, unit: 'per hour' },
    peakHours: 'Weekend evenings (5 PM - 9 PM) are our busiest times - book early!'
  },
  facilities: [
    'Premium synthetic turf (10,000+ sq. ft.)',
    '2 professional cricket nets',
    'Floodlights for night play',
    'Changing rooms',
    'Drinking water facility',
    'Free parking',
    'Seating area for spectators'
  ],
  booking: {
    process: 'Book online through our website or call us directly',
    advance: 'Advance booking recommended, especially for weekends',
    payment: 'Full payment or 50% advance (remaining at venue)'
  },
  refund: {
    policy: 'Cancellations 24+ hours before: 80% refund. 12-24 hours: 50% refund. Less than 12 hours: No refund.',
    rainPolicy: 'Full refund or rescheduling for rain cancellations'
  },
  tournaments: {
    info: 'We host cricket and football tournaments regularly',
    booking: 'Contact us for tournament bookings and corporate events'
  },
  coaching: {
    available: 'Coaching sessions available on request',
    sports: 'Cricket and football coaching by experienced coaches'
  }
}

// Slot availability simulation (in real app, this would fetch from database)
const getSlotAvailability = (time: string): { available: boolean; sport: string } => {
  const hour = parseInt(time.split(' ')[0])
  const isPM = time.toLowerCase().includes('pm')
  const actualHour = isPM && hour !== 12 ? hour + 12 : hour
  
  // Simulate some slots being booked
  const bookedSlots = [10, 11, 17, 18, 19]
  const available = !bookedSlots.includes(actualHour)
  
  return { available, sport: 'Football/Cricket Turf' }
}

// Pattern matching for user queries
const findAnswer = (query: string): string => {
  const q = query.toLowerCase()
  
  // Availability queries
  if (q.includes('available') || q.includes('slot') || q.includes('free')) {
    const timeMatch = q.match(/(\d{1,2})\s*(am|pm|AM|PM)?/)
    if (timeMatch) {
      const time = timeMatch[0]
      const { available } = getSlotAvailability(time)
      if (available) {
        return `Yes! The ${time} slot looks available today. Would you like to book it? You can book directly on our website or call us at ${MSC_KNOWLEDGE.contact.phone}.`
      } else {
        return `Sorry, the ${time} slot appears to be booked for today. I&apos;d recommend checking nearby times like an hour earlier or later. You can also call us at ${MSC_KNOWLEDGE.contact.phone} for real-time availability.`
      }
    }
    return `Our turf is generally available from ${MSC_KNOWLEDGE.hours.open} to ${MSC_KNOWLEDGE.hours.close}. For real-time slot availability, check the booking page or call us at ${MSC_KNOWLEDGE.contact.phone}. Peak hours (5-9 PM) tend to fill up fast!`
  }
  
  // Timing/hours queries
  if (q.includes('timing') || q.includes('hours') || q.includes('open') || q.includes('close') || q.includes('time')) {
    return `We're open from ${MSC_KNOWLEDGE.hours.open} to ${MSC_KNOWLEDGE.hours.close}, all 7 days a week! Early morning slots are perfect for a fresh game, and we have floodlights for evening sessions.`
  }
  
  // Pricing queries
  if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('charge') || q.includes('fee') || q.includes('how much')) {
    return `Here's our pricing:\n\n• Cricket Net: ₹${MSC_KNOWLEDGE.pricing.cricketNet.price}/hour\n• Football/Cricket Turf: ₹${MSC_KNOWLEDGE.pricing.footballTurf.price}/hour\n\n${MSC_KNOWLEDGE.pricing.peakHours} Great value for premium facilities!`
  }
  
  // Location queries
  if (q.includes('location') || q.includes('address') || q.includes('where') || q.includes('direction') || q.includes('reach')) {
    return `We're located at ${MSC_KNOWLEDGE.location.address}. Easy to find - look for the turf near Sangri Colony. Drop us a call at ${MSC_KNOWLEDGE.contact.phone} if you need directions!`
  }
  
  // Contact queries
  if (q.includes('contact') || q.includes('call') || q.includes('phone') || q.includes('number') || q.includes('reach')) {
    return `You can reach us at:\n\n📞 Phone: ${MSC_KNOWLEDGE.contact.phone}\n📧 Email: ${MSC_KNOWLEDGE.contact.email}\n📱 Instagram: ${MSC_KNOWLEDGE.contact.social}\n\nWe respond quickly!`
  }
  
  // Booking queries
  if (q.includes('book') || q.includes('reserve') || q.includes('booking')) {
    return `Booking is super easy! You can:\n\n1. Book online through our website (recommended)\n2. Call us at ${MSC_KNOWLEDGE.contact.phone}\n\nWe accept full payment or 50% advance (pay the rest at venue). ${MSC_KNOWLEDGE.booking.advance}.`
  }
  
  // Cricket net queries
  if (q.includes('cricket net') || q.includes('net') || q.includes('batting') || q.includes('bowling')) {
    return `We have 2 professional cricket nets perfect for batting and bowling practice! ₹${MSC_KNOWLEDGE.pricing.cricketNet.price}/hour per net. Great for individual practice or team sessions.`
  }
  
  // Football queries
  if (q.includes('football') || q.includes('soccer')) {
    return `Our premium 10,000+ sq. ft. synthetic turf is perfect for football! ₹${MSC_KNOWLEDGE.pricing.footballTurf.price}/hour. We have floodlights for evening games and regularly host football matches and mini tournaments.`
  }
  
  // Turf queries
  if (q.includes('turf') || q.includes('ground') || q.includes('field')) {
    return `Our main turf is 10,000+ sq. ft. of premium synthetic grass - perfect for both cricket and football! It's FIFA-quality, well-maintained, and has professional floodlights. ₹${MSC_KNOWLEDGE.pricing.footballTurf.price}/hour.`
  }
  
  // Facility queries
  if (q.includes('facility') || q.includes('facilities') || q.includes('amenities') || q.includes('what do you have')) {
    return `Here's what we offer:\n\n${MSC_KNOWLEDGE.facilities.map(f => `• ${f}`).join('\n')}\n\nEverything you need for a great game!`
  }
  
  // Parking queries
  if (q.includes('parking') || q.includes('park') || q.includes('vehicle')) {
    return `Yes, we have free parking available! Plenty of space for cars and two-wheelers. No need to worry about parking fees.`
  }
  
  // Refund queries
  if (q.includes('refund') || q.includes('cancel') || q.includes('cancellation')) {
    return `Our refund policy:\n\n• 24+ hours before: 80% refund\n• 12-24 hours before: 50% refund\n• Less than 12 hours: No refund\n\n${MSC_KNOWLEDGE.refund.rainPolicy}. We're fair and flexible!`
  }
  
  // Tournament queries
  if (q.includes('tournament') || q.includes('event') || q.includes('corporate') || q.includes('competition')) {
    return `We regularly host cricket and football tournaments! For tournament bookings and corporate events, please call us at ${MSC_KNOWLEDGE.contact.phone}. We can customize packages for your needs.`
  }
  
  // Coaching queries
  if (q.includes('coach') || q.includes('training') || q.includes('learn') || q.includes('teach')) {
    return `Yes! Coaching sessions are available on request for both cricket and football. We have experienced coaches who can help you improve your game. Contact us at ${MSC_KNOWLEDGE.contact.phone} for details.`
  }
  
  // Payment queries
  if (q.includes('payment') || q.includes('pay') || q.includes('upi') || q.includes('cash') || q.includes('card')) {
    return `We accept multiple payment methods:\n\n• Online payment (UPI, cards)\n• Cash at venue\n• 50% advance option (pay remaining at venue)\n\nPay however works best for you!`
  }
  
  // FAQ queries
  if (q.includes('faq') || q.includes('question') || q.includes('help')) {
    return `I can help you with info about:\n\n• Slot availability\n• Pricing\n• Booking process\n• Facilities\n• Location\n• Timings\n• Refund policy\n• Tournaments\n• Coaching\n\nJust ask away!`
  }
  
  // Greeting
  if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q === 'hii' || q === 'hiii') {
    return `Hey there! Welcome to MSC! 👋 I'm here to help you with booking info, pricing, availability, and more. What would you like to know?`
  }
  
  // Thanks
  if (q.includes('thank') || q.includes('thanks') || q.includes('thx')) {
    return `You're welcome! Feel free to ask if you have any other questions. See you on the turf! 🏏⚽`
  }
  
  // Default response
  return `I'm not 100% sure about that, but here's what might help:\n\n• For bookings: Visit our Book Now page\n• For queries: Call ${MSC_KNOWLEDGE.contact.phone}\n• Hours: ${MSC_KNOWLEDGE.hours.open} - ${MSC_KNOWLEDGE.hours.close}\n\nIs there something specific I can help with?`
}

type Message = {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

const quickActions = [
  { label: 'Book Turf', icon: Calendar, query: 'How do I book?' },
  { label: 'Available Slots', icon: Clock, query: 'What slots are available today?' },
  { label: 'Pricing', icon: IndianRupee, query: 'What are the prices?' },
  { label: 'Contact MSC', icon: Phone, query: 'How can I contact you?' },
  { label: 'Tournament Info', icon: Sparkles, query: 'Tell me about tournaments' },
  { label: 'FAQs', icon: HelpCircle, query: 'What questions can you answer?' },
]

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `Hey! Welcome to MSC! 🏟️ I'm your virtual assistant. Ask me anything about booking, pricing, availability, or facilities. How can I help you today?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = useCallback((text: string = input) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate thinking time
    setTimeout(() => {
      const response = findAnswer(text)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 800 + Math.random() * 400)
  }, [input])

  const handleQuickAction = (query: string) => {
    handleSend(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(43, 168, 74, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 30px rgba(43, 168, 74, 0.4), 0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
        whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(43, 168, 74, 0.5), 0 6px 25px rgba(0, 0, 0, 0.2)' }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full animate-pulse" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-48px)] sm:w-96 h-[600px] max-h-[calc(100vh-120px)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,251,0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(43, 168, 74, 0.15)',
              boxShadow: '0 0 60px rgba(43, 168, 74, 0.15), 0 25px 50px rgba(0, 0, 0, 0.15)'
            }}
          >
            {/* Header */}
            <div 
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(43, 168, 74, 0.95) 0%, rgba(16, 185, 129, 0.95) 100%)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">MSC AI</h3>
                  <p className="text-white/70 text-xs">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-[#2BA84A]' 
                        : 'bg-gradient-to-br from-[#2BA84A] to-emerald-500'
                    }`}>
                      {message.type === 'user' 
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-white" />
                      }
                    </div>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                      message.type === 'user'
                        ? 'bg-[#2BA84A] text-white rounded-tr-md'
                        : 'bg-white border border-[#0A0A0C]/5 text-[#0A0A0C] rounded-tl-md shadow-sm'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2BA84A] to-emerald-500 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-[#0A0A0C]/5 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#2BA84A]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#2BA84A]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#2BA84A]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex-shrink-0">
                <div className="flex flex-wrap gap-2">
                  {quickActions.slice(0, 4).map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.query)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F5EC] hover:bg-[#d4edda] text-[#2BA84A] text-xs font-medium transition-colors"
                    >
                      <action.icon className="w-3 h-3" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-[#0A0A0C]/5 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about slots, pricing, facilities..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none text-sm transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-[#2BA84A] hover:bg-[#146B3A] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#0A0A0C]/40">
                <span>Powered by</span>
                <a 
                  href="https://www.instagram.com/upsurge.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#2BA84A] hover:underline font-medium"
                >
                  UpSurge
                </a>
                <span>•</span>
                <Link href="/book-now" className="text-[#2BA84A] hover:underline">Book Now</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
