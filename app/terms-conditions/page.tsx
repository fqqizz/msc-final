'use client'

import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'
import { FileText, CreditCard, Users, Shield, Award, Lock, RefreshCw, Mail } from 'lucide-react'

const sections = [
  {
    icon: FileText,
    title: '1. General Use of Facilities',
    content: `• All visitors must comply with the rules and regulations of Maqbool Sports Complex.
• Management reserves the right to refuse entry or cancel bookings for misconduct, unsafe behavior, or violation of rules.
• Children under 12 must be accompanied by an adult at all times.`
  },
  {
    icon: CreditCard,
    title: '2. Booking & Payments',
    content: `• All bookings must be made in advance through our website, mobile app, or at the complex reception.
• Full payment is required to confirm a booking.
• Bookings are subject to availability and can be rescheduled based on our Refund & Cancellation Policy.`
  },
  {
    icon: Users,
    title: '3. Code of Conduct',
    content: `• Players must wear appropriate sportswear and footwear while using the grounds/turfs.
• Smoking, alcohol, and prohibited substances are strictly not allowed within the premises.
• Respect for other players, staff, and property is mandatory.`
  },
  {
    icon: Shield,
    title: '4. Safety & Liability',
    content: `• All players use the facilities at their own risk. Maqbool Sports Complex will not be liable for personal injury, loss, or damage to personal belongings.
• Users are responsible for their own safety and must follow staff instructions at all times.
• Any damage caused to property or equipment must be compensated by the responsible individual/team.`
  },
  {
    icon: Award,
    title: '5. Membership & Events',
    content: `• Membership benefits, validity, and terms will be clearly stated at the time of registration.
• Event/tournament participation is subject to additional rules and guidelines provided separately.`
  },
  {
    icon: Lock,
    title: '6. Privacy & Data Protection',
    content: `Personal information collected during booking or membership is handled according to our Privacy Policy.`
  },
  {
    icon: RefreshCw,
    title: '7. Changes to Terms',
    content: `Maqbool Sports Complex reserves the right to amend these Terms & Conditions at any time. Updates will be posted on our website and displayed at the facility.`
  }
]

export default function TermsConditionsPage() {
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
              Terms & Conditions
            </h1>
            <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto leading-relaxed">
              Welcome to Maqbool Sports Complex. By booking, visiting, or using our facilities, you agree to abide by the following Terms & Conditions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h3 className="text-2xl font-bold text-white mb-4">8. Contact Us</h3>
            <p className="text-white/70 mb-6">
              For any questions or clarifications regarding these Terms & Conditions, please contact:
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
