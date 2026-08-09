'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  IndianRupee,
  HelpCircle,
  ShieldAlert,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'
import { processChatbotMessage, ChatbotResponse, ConversationContext } from '@/lib/chatbot-service'
import { openPolicyModal } from '@/components/policy-modal'

type Message = {
  id: string
  type: 'user' | 'bot'
  content: string
  actionLink?: ChatbotResponse['actionLink']
  suggestions?: string[]
  timestamp: Date
}

const quickPrompts = [
  { label: '🏏 Cricket', query: 'I want to play cricket' },
  { label: '⚽ Football', query: 'We want to play football' },
  { label: '📅 Availability', query: 'What slots are available today?' },
  { label: '💰 Pricing', query: 'What are the prices?' },
  { label: '📖 Booking Help', query: 'How do I book a slot?' },
  { label: '❌ Cancellation Policy', query: 'Can I cancel my booking?' },
  { label: '💳 Refund Policy', query: 'What is the refund policy?' },
  { label: '📍 Location', query: 'Where are you located?' },
]

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const { performanceMode } = useMobilePerformance()
  const [context, setContext] = useState<ConversationContext>({})
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content:
        "Hi! 👋 Welcome to Maqbool Sports Complex (MSC). I'm your customer assistant. Ask me about available slots, live bookings, pricing, cricket, football, facilities, or policies. How can I help you today?",
      suggestions: ['🏏 Cricket', '⚽ Football', '📅 Available Slots', '💰 Pricing'],
      timestamp: new Date(),
    },
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
  }, [messages, isTyping, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSend = useCallback(
    async (text: string = input) => {
      const cleanText = text.trim()
      if (!cleanText) return

      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: cleanText,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsTyping(true)

      try {
        // Call intelligent assistant with real-time Supabase integration
        const { response, updatedContext } = await processChatbotMessage(cleanText, context)
        setContext(updatedContext)

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.text,
          actionLink: response.actionLink,
          suggestions: response.suggestions,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, botMessage])
      } catch (err) {
        console.error('Chatbot error:', err)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content:
            "I ran into a temporary hiccup while checking live data. You can always check all available slots directly on our booking page, or reach out to us at +91 9682558775.",
          actionLink: { label: 'Go to Booking Page', href: '/book-now' },
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsTyping(false)
      }
    },
    [input, context]
  )

  const handleQuickAction = (query: string) => {
    handleSend(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleActionClick = (action: NonNullable<ChatbotResponse['actionLink']>) => {
    if (action.policy) {
      openPolicyModal(action.policy)
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform-gpu ${
          isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100'
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(43, 168, 74, 0.95) 0%, rgba(16, 185, 129, 0.95) 100%)',
          boxShadow: '0 0 30px rgba(43, 168, 74, 0.4), 0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open MSC Customer Assistant"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky-400 rounded-full border-2 border-[#050505] animate-pulse" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] h-[580px] max-h-[calc(100vh-80px)] rounded-3xl overflow-hidden shadow-2xl flex flex-col transform-gpu border border-slate-200 bg-white"
          >
            {/* Header */}
            <div className="px-4 py-3.5 flex items-center justify-between bg-slate-900 text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">MSC Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white/60 text-[10px] font-medium">Live Database Connected</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition-colors"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[88%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${
                        message.type === 'user'
                          ? 'bg-slate-900'
                          : 'bg-emerald-600 shadow-xs'
                      }`}
                    >
                      {message.type === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    <div className="space-y-2">
                      <div
                        className={`px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-2xs ${
                          message.type === 'user'
                            ? 'bg-emerald-600 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {message.content}
                      </div>

                      {/* Action Link / Button if applicable */}
                      {message.actionLink && (
                        <div>
                          {message.actionLink.policy ? (
                            <button
                              onClick={() => handleActionClick(message.actionLink!)}
                              data-policy={message.actionLink.policy}
                              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            >
                              {message.actionLink.label} <ArrowRight size={12} />
                            </button>
                          ) : (
                            <Link
                              href={message.actionLink.href}
                              onClick={() => setIsOpen(false)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                            >
                              {message.actionLink.label} <ArrowRight size={12} />
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Dynamic Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {message.suggestions.map((s, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(s)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                      <Bot size={14} />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-white border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Shortcuts */}
            {messages.length <= 2 && (
              <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200/60 overflow-x-auto flex gap-1.5 flex-shrink-0 no-scrollbar">
                {quickPrompts.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.query)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[11px] font-semibold transition-colors shrink-0 shadow-2xs"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about slots, cricket, football, pricing..."
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none text-xs text-slate-900 transition-all font-medium"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
                  aria-label="Send query"
                >
                  <Send size={15} />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-400 font-medium">
                <span>Maqbool Sports Complex</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPolicyModal('cancellation')}
                    className="hover:text-emerald-700 hover:underline"
                  >
                    Cancellation
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => openPolicyModal('refund')}
                    className="hover:text-emerald-700 hover:underline"
                  >
                    Refunds
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
