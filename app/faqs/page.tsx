'use client'

import { useState } from 'react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const faqs = [
  {
    question: 'How can I book a turf or cricket net slot?',
    answer: 'You can easily book any turf or cricket net by choosing your preferred date, venue, and 1-hour time slot on our live booking calendar. You can pay securely in full or with a 50% online advance to lock your slot instantly.'
  },
  {
    question: 'What is the duration of each booking slot?',
    answer: 'Standard booking slots are for 1 hour. You can book multiple consecutive hours during the checkout process if you require longer training or match durations.'
  },
  {
    question: 'What are the authoritative facility prices?',
    answer: 'Our authoritative baseline prices are: Cricket Practice Net 1: ₹299/hr, Cricket Practice Net 2: ₹299/hr, and Football Turf: ₹999/hr. The automated bowling machine add-on is ₹299/hr. All prices are calculated authoritatively from our live database with zero hidden fees.'
  },
  {
    question: 'What are the complex operating hours?',
    answer: 'Maqbool Sports Complex is open daily from 6:00 AM to 11:00 PM, featuring high-lumen professional LED floodlights for early morning and evening sessions.'
  },
  {
    question: 'What is the cancellation and refund policy?',
    answer: 'Cancellation and rescheduling requests are accepted strictly MORE THAN 5 HOURS before the scheduled booking start time. Eligible cancellations receive a 90% refund (10% processing deduction) within 5-7 working days. Bookings within 5 hours or less are non-cancellable and non-refundable.'
  },
  {
    question: 'Is parking and CCTV surveillance available?',
    answer: 'Yes, secure on-site parking is available at the complex. The entire facility operates under 24/7 CCTV surveillance for athlete, visitor, and equipment safety.'
  },
]

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <main className="min-h-screen bg-[#061009] text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#040d07] overflow-hidden border-b border-emerald-500/10 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-6 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Knowledge & Rules
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            FREQUENTLY ASKED <span className="text-[#2BA84A]">QUESTIONS</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Essential information regarding facility bookings, pricing policies, complex guidelines, and operating rules.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#0e2419]/90 border border-emerald-500/20 rounded-2xl overflow-hidden backdrop-blur-xl transition-all"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-emerald-950/40 transition-colors"
                >
                  <span className="font-bold text-white text-sm sm:text-base pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`text-emerald-400 shrink-0 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    size={20}
                  />
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-6"
                    >
                      <div className="pt-2 border-t border-emerald-500/10 text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-14 sm:mt-16 bg-[#040d07] border border-emerald-500/20 p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-2">Still Have Questions?</h3>
            <p className="text-slate-300 text-xs sm:text-sm mb-6 max-w-md mx-auto">
              Our team is here to assist you daily from 6:00 AM to 11:00 PM.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
