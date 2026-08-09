'use client'

import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'
import { RefreshCw, CheckCircle2, Clock, Mail, ShieldCheck } from 'lucide-react'
import { refundPolicy } from '@/data/policies'
import Link from 'next/link'

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
              Official Policy
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#0A0A0C] tracking-tight">
              {refundPolicy.title}
            </h1>
            <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto leading-relaxed">
              {refundPolicy.subtitle}
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
            className="bg-gradient-to-r from-[#2BA84A]/10 to-[#146B3A]/10 border border-[#2BA84A]/20 rounded-3xl p-6 sm:p-8 mb-12"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2BA84A] text-white flex items-center justify-center shrink-0">
                <RefreshCw size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0A0A0C] mb-2">
                  {refundPolicy.summary.highlight}
                </h2>
                <p className="text-[#0A0A0C]/70 text-sm leading-relaxed">
                  {refundPolicy.summary.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#2BA84A]/20">
              <div className="text-center p-4 bg-white rounded-2xl border border-[#2BA84A]/10 shadow-2xs">
                <p className="text-2xl font-bold text-[#2BA84A]">&gt; 5h</p>
                <p className="text-xs text-[#0A0A0C]/60 mt-1">Eligible Cancellation Window</p>
              </div>
              <div className="text-center p-4 bg-white rounded-2xl border border-[#2BA84A]/10 shadow-2xs">
                <p className="text-2xl font-bold text-[#2BA84A]">5-7</p>
                <p className="text-xs text-[#0A0A0C]/60 mt-1">Working Days to Process</p>
              </div>
              <div className="text-center p-4 bg-white rounded-2xl border border-[#2BA84A]/10 shadow-2xs">
                <p className="text-2xl font-bold text-[#2BA84A]">100%</p>
                <p className="text-xs text-[#0A0A0C]/60 mt-1">Direct Source Mode Return</p>
              </div>
            </div>
          </motion.div>

          {/* Sections List */}
          <div className="space-y-8">
            {refundPolicy.sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#F8FAFB] rounded-2xl p-6 sm:p-8 border border-slate-100"
              >
                <h3 className="text-lg font-bold text-[#0A0A0C] mb-4 flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-[#2BA84A]" />
                  {section.title}
                </h3>
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2.5 text-[#0A0A0C]/70 text-sm leading-relaxed list-disc pl-5 marker:text-[#2BA84A]">
                    {section.content.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#0A0A0C]/70 text-sm leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Need Assistance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-slate-900 text-white rounded-3xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div>
              <h3 className="text-xl font-bold">Have questions regarding a refund?</h3>
              <p className="text-sm text-slate-300 mt-1">
                Reach out to our accounts desk at info@maqboolsports.in with your Booking Reference number.
              </p>
            </div>
            <Link
              href="/contact"
              className="px-6 py-3 bg-[#2BA84A] hover:bg-[#146B3A] text-white font-semibold text-xs rounded-xl transition-all shrink-0 inline-flex items-center gap-2"
            >
              <Mail size={16} /> Contact Accounts
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
