'use client'

import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'
import { XCircle, CheckCircle, Ban, Clock, Mail } from 'lucide-react'

const sections = [
  {
    icon: XCircle,
    title: '1. Booking Cancellations',
    content: `• Cancellations made at least 24 hours before the booking time will be eligible for a full refund or rescheduling.
• Cancellations made within 24 hours of the booking are non-refundable but may be rescheduled subject to availability.
• No-shows (failure to arrive at the booked time) will not be eligible for any refund.`
  },
  {
    icon: CheckCircle,
    title: '2. Refund Eligibility',
    content: `Refunds will only be considered in the following cases:

• Double payment or incorrect transaction.
• Technical error in the booking system.
• Event/turf closure by Maqbool Sports Complex due to weather, maintenance, or other unavoidable reasons.`
  },
  {
    icon: Ban,
    title: '3. Non-Refundable Items',
    content: `• Registration fees for tournaments or leagues are non-refundable once paid, unless the event is cancelled by Maqbool Sports Complex.
• Membership fees are non-refundable after activation.`
  },
  {
    icon: Clock,
    title: '4. Refund Process',
    content: `• Eligible refunds will be processed within 7-10 working days through the original mode of payment.
• For online payments, bank/payment gateway charges (if any) are non-refundable.
• Rescheduling is subject to availability and must be used within 30 days of the original booking.`
  }
]

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#F8FAFB] to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
              Legal
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#0A0A0C] tracking-tight">
              Refund Policy
            </h1>
            <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto leading-relaxed">
              At Maqbool Sports Complex, we strive to provide the best experience to our players, teams, and visitors. This policy explains the terms under which refunds or cancellations will be accepted.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-[#2BA84A]/10 to-[#146B3A]/10 border border-[#2BA84A]/20 rounded-2xl p-6 sm:p-8 mb-12"
          >
            <h3 className="text-lg font-bold text-[#0A0A0C] mb-4">Quick Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-xl">
                <p className="text-2xl font-bold text-[#2BA84A]">24h+</p>
                <p className="text-sm text-[#0A0A0C]/60">Full refund window</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl">
                <p className="text-2xl font-bold text-[#2BA84A]">7-10</p>
                <p className="text-sm text-[#0A0A0C]/60">Days to process</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl">
                <p className="text-2xl font-bold text-[#2BA84A]">30</p>
                <p className="text-sm text-[#0A0A0C]/60">Days to reschedule</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#F8FAFB] rounded-2xl p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center flex-shrink-0">
                    <section.icon className="text-[#2BA84A]" size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#0A0A0C] mb-4">{section.title}</h2>
                    <div className="text-[#0A0A0C]/70 whitespace-pre-line leading-relaxed">
                      {section.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-[#0A0A0C] rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#2BA84A]/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="text-[#2BA84A]" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">5. Contact for Refunds & Cancellations</h3>
            <p className="text-white/70 mb-6">
              For all refund or cancellation requests, please contact:
            </p>
            <div className="space-y-2 text-white/80">
              <p>Maqbool Sports Complex</p>
              <p>Sangri Colony, Baramulla, Jammu and Kashmir, 193101</p>
              <p>Phone: +91 9682558775</p>
              <p>Email: info@maqboolsportscomplex.com</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
