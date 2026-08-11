'use client'

import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'
import { ShieldAlert, Clock, CheckCircle2, AlertTriangle, HelpCircle, Mail } from 'lucide-react'
import { cancellationPolicy } from '@/data/policies'
import Link from 'next/link'

export default function CancellationPolicyPage() {
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
            Official Policy
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            CANCELLATION <span className="text-[#2BA84A]">POLICY</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {cancellationPolicy.subtitle}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Strict 5-Hour Rule Highlight Card */}
          <div className="bg-[#0e2419]/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 mb-10 backdrop-blur-xl shadow-xl shadow-black/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5">
                  {cancellationPolicy.summary.highlight}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {cancellationPolicy.summary.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-emerald-500/15">
              <div className="bg-[#07170f] border border-emerald-500/20 rounded-2xl p-4 text-center">
                <span className="text-2xl font-extrabold text-emerald-400 block">&gt; 5 Hours</span>
                <span className="text-[11px] text-slate-300 font-medium">Eligible Cancellation Window</span>
              </div>
              <div className="bg-[#1f0a0d] border border-red-500/30 rounded-2xl p-4 text-center">
                <span className="text-2xl font-extrabold text-red-400 block">&le; 5 Hours</span>
                <span className="text-[11px] text-red-200/80 font-medium">Strictly Non-Cancellable</span>
              </div>
              <div className="bg-[#07170f] border border-emerald-500/20 rounded-2xl p-4 text-center">
                <span className="text-2xl font-extrabold text-white block">90%</span>
                <span className="text-[11px] text-slate-300 font-medium">Refund (10% Processing Fee)</span>
              </div>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="space-y-6">
            {cancellationPolicy.sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                className="bg-[#0e2419]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/30"
              >
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  {section.title}
                </h3>
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2.5 text-slate-300 text-xs sm:text-sm leading-relaxed list-disc pl-5 marker:text-emerald-400">
                    {section.content.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-12 bg-[#040d07] border border-emerald-500/20 rounded-3xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Need to cancel or reschedule?</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Use your user booking dashboard or contact MSC support at least 5 hours prior to your slot.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shrink-0 transition-all"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
