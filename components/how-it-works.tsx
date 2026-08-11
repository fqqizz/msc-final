'use client'

import { motion } from 'framer-motion'
import { Globe, Calendar, CreditCard } from 'lucide-react'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Select Facility & Date',
    description: 'Explore Football Turf, Cricket Net 1 or Net 2, and pick your preferred play date on the live calendar.'
  },
  {
    number: '02',
    icon: Calendar,
    title: 'Choose Starting Time',
    description: 'Pick available 1-hour slots from 6:00 AM to 11:00 PM with optional automated bowling machine training.'
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'Instant Confirmation',
    description: 'Pay securely in full or 50% online advance to lock your slot. Receive instant WhatsApp and SMS confirmation.'
  },
]

export default function HowItWorks() {
  const { isMobile } = useMobilePerformance()

  return (
    <section className="py-20 sm:py-28 bg-[#040d07] relative overflow-hidden text-white border-t border-emerald-500/10">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[120px] transform-gpu" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14 sm:mb-16"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Simple 3-Step Flow
          </span>
          <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl md:text-6xl text-white tracking-wide uppercase leading-tight">
            SIMPLIFYING THE <span className="text-[#2BA84A]">BOOKING PROCESS</span>
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Three streamlined steps to get your team onto the pitch without waiting or double-booking conflicts.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              whileHover={
                isMobile
                  ? {}
                  : {
                      y: -6,
                      scale: 1.015,
                      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                    }
              }
              whileTap={isMobile ? { scale: 0.98 } : { scale: 0.99 }}
              className="relative transform-gpu will-change-transform"
            >
              {/* Connector line on desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[65%] w-[calc(100%-30%)] h-px bg-gradient-to-r from-emerald-500/40 via-emerald-500/20 to-transparent z-0" />
              )}
              
              <div className="relative z-10 text-center bg-[#0d2217]/90 border border-emerald-500/20 hover:border-emerald-400/50 rounded-3xl p-7 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/30 transition-all duration-300 h-full flex flex-col items-center justify-start">
                {/* Number & Icon badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600/90 text-white mb-6 relative shadow-lg shadow-emerald-950/60 border border-emerald-400/30">
                  <step.icon size={26} className="text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#040d07] border border-emerald-500/40 text-emerald-400 text-xs font-mono font-extrabold flex items-center justify-center shadow-md">
                    {step.number}
                  </span>
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5 tracking-tight">{step.title}</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
