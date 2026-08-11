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
• Payment Information: Billing details required for booking or purchasing services (processed securely via authorized payment gateways).
• Usage Data: Information about your interactions with our website and booking system.
• Security Monitoring: CCTV footage within our premises for safety and security purposes.`
  },
  {
    icon: UserCheck,
    title: '2. How We Use Your Information',
    content: `Your information may be used for:

• Processing turf/ground bookings and managing slot schedules.
• Communicating updates, booking confirmations, and schedules.
• Ensuring security and safety within the sports complex.
• Improving our facilities, services, and website experience.
• Complying with legal and regulatory requirements.`
  },
  {
    icon: Bell,
    title: '3. Sharing of Information',
    content: `We do not sell or rent your personal information. However, we may share your data:

• With trusted service providers for payment processing and automated SMS/WhatsApp booking delivery.
• With law enforcement or authorities, if required by law.
• Internally, to improve services and enhance your experience.`
  },
  {
    icon: Lock,
    title: '4. Data Protection & Security',
    content: `We implement strict measures to protect your personal information, including:

• Secure 256-bit encrypted payment gateways for transactions.
• Limited access to sensitive data by authorized management staff only.
• 24/7 CCTV monitoring for the physical safety of all visitors.`
  },
  {
    icon: Cookie,
    title: '5. Cookies & Tracking',
    content: `Our website may use cookies to maintain your login session and enhance your browsing experience. You may disable cookies through your browser settings, but some features may not function properly.`
  },
  {
    icon: Shield,
    title: '6. Your Rights',
    content: `You have the right to:

• Access and update your personal information.
• Request deletion of your personal account data (subject to legal and financial compliance).
• Opt-out of non-essential promotional communications.`
  },
  {
    icon: RefreshCw,
    title: '7. Changes to This Policy',
    content: `Maqbool Sports Complex reserves the right to update this Privacy Policy at any time. Changes will be posted on our website with the updated date.`
  }
]

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#061009] text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-[#040d07] overflow-hidden border-b border-emerald-500/10 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-6 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Legal Documentation
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            PRIVACY <span className="text-[#2BA84A]">POLICY</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            At Maqbool Sports Complex, we respect your privacy and are committed to protecting the personal information you share with us.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#0e2419]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/30"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400">
                    <section.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-3">{section.title}</h2>
                    <div className="text-slate-300 text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                      {section.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-10 bg-[#040d07] border border-emerald-500/20 rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Mail size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">8. Contact Us</h3>
            <p className="text-slate-300 text-xs sm:text-sm mb-4">
              If you have any questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="space-y-1 text-slate-200 text-xs sm:text-sm">
              <p className="font-bold text-white">Maqbool Sports Complex</p>
              <p>Sangri Colony, Baramulla, Jammu and Kashmir, 193101</p>
              <p>Phone: +91 9682558775 | Email: info@maqboolsports.in</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
