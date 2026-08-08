'use client'

import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'
import { Shield, Eye, Lock, Bell, Cookie, UserCheck, RefreshCw, Mail } from 'lucide-react'

const sections = [
  {
    icon: Eye,
    title: '1. Information We Collect',
    content: `We may collect the following types of information:

• Personal Information: Name, phone number, email address, age, and other details provided during registration, bookings, or membership.
• Payment Information: Billing details required for booking or purchasing services.
• Usage Data: Information about your interactions with our website, booking system, or mobile application.
• Security Monitoring: CCTV footage within our premises for safety and security purposes.`
  },
  {
    icon: UserCheck,
    title: '2. How We Use Your Information',
    content: `Your information may be used for:

• Processing turf/ground bookings and managing memberships.
• Communicating updates, schedules, and special offers.
• Ensuring security and safety within the sports complex.
• Improving our facilities, services, and website experience.
• Complying with legal and regulatory requirements.`
  },
  {
    icon: Bell,
    title: '3. Sharing of Information',
    content: `We do not sell or rent your personal information. However, we may share your data:

• With trusted service providers for payment processing or IT support.
• With law enforcement or authorities, if required by law.
• Internally, to improve services and enhance your experience.`
  },
  {
    icon: Lock,
    title: '4. Data Protection & Security',
    content: `We implement strict measures to protect your personal information, including:

• Secure payment gateways for transactions.
• Limited access to sensitive data by authorized staff only.
• CCTV monitoring for the safety of all visitors.`
  },
  {
    icon: Cookie,
    title: '5. Cookies & Website Tracking',
    content: `Our website may use cookies to enhance your browsing experience and analyze visitor traffic. You may disable cookies through your browser settings, but some features may not function properly.`
  },
  {
    icon: Shield,
    title: '6. Your Rights',
    content: `You have the right to:

• Access and update your personal information.
• Request deletion of your personal data (subject to legal requirements).
• Opt-out of promotional communications.`
  },
  {
    icon: RefreshCw,
    title: '7. Changes to This Policy',
    content: `Maqbool Sports Complex reserves the right to update this Privacy Policy at any time. Changes will be posted on our website with the updated date.`
  }
]

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto leading-relaxed">
              At Maqbool Sports Complex, we respect your privacy and are committed to protecting the personal information you share with us.
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
              If you have any questions or concerns about this Privacy Policy, please contact us:
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
