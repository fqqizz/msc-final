'use client'

import { useState } from 'react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const faqs = [
  {
    question: 'How can I book a turf slot?',
    answer: 'You can easily book any turf by selecting your preferred date and time on our website. Just choose the turf, check availability, and confirm your booking. You can also visit our facility or call us at +91 9682558775 to make a booking.'
  },
  {
    question: 'What is the duration of each booking slot?',
    answer: 'Each booking slot is for 1 hour, but you can book multiple slots if you need more time. Simply select consecutive time slots during the booking process.'
  },
  {
    question: 'Are the turfs available for both individual and team bookings?',
    answer: 'Yes! Whether you\'re practicing solo, with a coach, or booking for a team session or match, all three turfs can be reserved accordingly. We welcome individuals, groups, and institutions.'
  },
  {
    question: 'Can we play matches on the turfs?',
    answer: 'Yes! You can definitely play matches on our turfs. The Football/Cricket Turf is ideal for friendly matches and team games, while Cricket Net 1 and Cricket Net 2 are perfect for practice sessions and smaller group play.'
  },
  {
    question: 'What are the pricing details?',
    answer: 'Our pricing is as follows:\n• Cricket Net 1 & 2: ₹299/hour\n• Football/Cricket Turf: ₹899/hour\n\nPeak hour pricing may vary slightly on weekends and holidays.'
  },
  {
    question: 'Are there any coaching or training sessions available?',
    answer: 'Currently, we provide turf rentals only. However, we are planning to launch a Sports Academy with certified coaches soon - stay tuned for updates!'
  },
  {
    question: 'Is there parking available near the turfs?',
    answer: 'Yes, parking is available at or near all turf locations for your convenience. The parking area is spacious enough to accommodate vehicles for team events.'
  },
  {
    question: 'What are the operating hours?',
    answer: 'Maqbool Sports Complex is open from 6 AM to 11 PM daily. This includes availability for early morning practice sessions and night games under floodlights.'
  },
  {
    question: 'Can I cancel or reschedule my booking?',
    answer: 'Yes, cancellations made at least 24 hours before the booking time are eligible for a full refund or rescheduling. Cancellations within 24 hours of the booking are non-refundable but may be rescheduled subject to availability. Please refer to our Refund Policy for more details.'
  },
  {
    question: 'Is the facility safe for children?',
    answer: 'Yes, our facility is safe, inclusive, and family-friendly. We have CCTV surveillance for safety and monitoring. Children under 12 must be accompanied by an adult at all times.'
  },
  {
    question: 'What should I wear while playing?',
    answer: 'Players must wear appropriate sportswear and footwear while using the grounds/turfs. We recommend football boots for the turf and proper cricket gear for the nets.'
  },
  {
    question: 'Can we host tournaments at MSC?',
    answer: 'Yes! Our facility is equipped to host local and regional tournaments. Contact us for special event bookings and tournament packages.'
  },
]

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#F8FAFB] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            FAQs
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#0A0A0C] tracking-tight">
            Frequently Asked
            <span className="text-[#2BA84A]"> Questions</span>
          </h1>
          <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto">
            Some questions about Turfs & Grounds - find answers to common queries about booking, facilities, and more.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border border-[#0A0A0C]/10 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-[#F8FAFB] transition-colors"
                >
                  <span className="font-semibold text-[#0A0A0C] pr-4">{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-[#0A0A0C]/40 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-6 text-[#0A0A0C]/60 whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-24 bg-[#F8FAFB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="mx-auto mb-6 text-[#2BA84A]" size={48} />
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight mb-4">
            Still Have Questions?
          </h2>
          <p className="text-[#0A0A0C]/60 text-lg mb-8 max-w-xl mx-auto">
            Can&apos;t find the answer you&apos;re looking for? Please reach out to our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-colors"
            >
              Contact Us
            </Link>
            <a
              href="tel:+919682558775"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#0A0A0C]/10 text-[#0A0A0C] font-semibold rounded-xl hover:bg-white transition-colors"
            >
              Call +91 9682558775
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
