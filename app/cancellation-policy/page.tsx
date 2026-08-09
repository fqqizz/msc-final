'use client'

import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'
import { ShieldAlert, Clock, CheckCircle2, AlertTriangle, HelpCircle, Mail } from 'lucide-react'
import { cancellationPolicy } from '@/data/policies'
import Link from 'next/link'

export default function CancellationPolicyPage() {
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
              {cancellationPolicy.title}
            </h1>
            <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto leading-relaxed">
              {cancellationPolicy.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Strict 5-Hour Rule Highlight Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 mb-12 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {cancellationPolicy.summary.highlight}
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {cancellationPolicy.summary.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-emerald-200/60">
              <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-center">
                <span className="text-2xl font-extrabold text-emerald-600 block">&gt; 5 Hours</span>
                <span className="text-xs text-slate-500 font-medium">Eligible Cancellation Window</span>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-red-100 text-center">
                <span className="text-2xl font-extrabold text-red-500 block">&le; 5 Hours</span>
                <span className="text-xs text-slate-500 font-medium">Strictly Non-Cancellable</span>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-center">
                <span className="text-2xl font-extrabold text-slate-900 block">100%</span>
                <span className="text-xs text-slate-500 font-medium">Transparent Refund / Credit</span>
              </div>
            </div>
          </motion.div>

          {/* Policy Sections */}
          <div className="space-y-8">
            {cancellationPolicy.sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
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
              <h3 className="text-xl font-bold">Have an urgent booking query?</h3>
              <p className="text-sm text-slate-300 mt-1">
                Reach out directly to MSC management at info@maqboolsports.in or +91 9682558775.
              </p>
            </div>
            <Link
              href="/contact"
              className="px-6 py-3 bg-[#2BA84A] hover:bg-[#146B3A] text-white font-semibold text-xs rounded-xl transition-all shrink-0 inline-flex items-center gap-2"
            >
              <Mail size={16} /> Contact Support
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
