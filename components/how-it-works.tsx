'use client'

import { motion } from 'framer-motion'
import { Globe, Calendar, CreditCard } from 'lucide-react'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Select Facility & Date',
    description:
      'Explore Football Turf, Cricket Net 1 or Net 2, and pick your preferred play date on the live calendar.',
  },
  {
    number: '02',
    icon: Calendar,
    title: 'Choose Starting Time',
    description:
      'Pick available 1-hour slots from 6:00 AM to 11:00 PM with optional automated bowling machine training.',
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'Instant Confirmation',
    description:
      'Pay securely in full or 50% online advance to lock your slot. Receive instant WhatsApp and SMS confirmation.',
  },
]

export default function HowItWorks() {
  const { isMobile } = useMobilePerformance()

  return (
    <section className="py-20 sm:py-28 bg-[#06140d] relative overflow-hidden text-white border-t border-emerald-500/10">
      {/* Subtle atmospheric ambient depth */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[350px] bg-[#00A86B]/8 rounded-full blur-[140px] transform-gpu" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,168,107,0.04)_0%,rgba(6,20,13,0.96)_75%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14 sm:mb-16"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#005C43]/70 border border-emerald-500/25 text-emerald-300 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
            Simple 3-Step Flow
          </span>
          <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl md:text-6xl text-white tracking-wide uppercase leading-tight">
            SIMPLIFYING THE <span className="text-[#00A86B]">BOOKING PROCESS</span>
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed font-normal">
            Three streamlined steps to get your team onto the pitch without waiting or double-booking conflicts.
          </p>
        </motion.div>

        {/* Process Cards (Tactile Glassmorphism + Soft Physical Claymorphism Depth) */}
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
                      scale: 1.012,
                      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                    }
              }
              whileTap={isMobile ? { scale: 0.98 } : { scale: 0.99 }}
              className="group relative transform-gpu will-change-transform h-full"
            >
              {/* Subtle connective accent on desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-[68%] w-[calc(100%-36%)] h-px bg-gradient-to-r from-[#00A86B]/35 via-[#00A86B]/15 to-transparent z-0 pointer-events-none" />
              )}

              {/* Physical Glass/Clay Floating Card Surface */}
              <div
                className="relative z-10 text-center rounded-3xl p-7 sm:p-9 transition-all duration-300 h-full flex flex-col items-center justify-start"
                style={{
                  background:
                    'linear-gradient(150deg, rgba(14, 36, 25, 0.85) 0%, rgba(6, 25, 18, 0.90) 55%, rgba(16, 20, 18, 0.95) 100%)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  border: '1px solid rgba(0, 168, 107, 0.18)',
                  boxShadow:
                    '0 20px 45px -15px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(221, 245, 234, 0.10)',
                }}
              >
                {/* Floating Icon Surface with Emerald Depth & Integrated Step Badge */}
                <div className="relative mb-7">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #00A86B 0%, #005C43 100%)',
                      boxShadow:
                        '0 10px 25px rgba(0, 168, 107, 0.30), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
                      border: '1px solid rgba(221, 245, 234, 0.25)',
                    }}
                  >
                    <step.icon size={26} className="text-white drop-shadow-xs" />
                  </div>

                  {/* Integrated Floating Step Indicator */}
                  <div
                    className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full text-emerald-300 text-[11px] font-mono font-extrabold tracking-wider"
                    style={{
                      background: 'linear-gradient(145deg, #06251D 0%, #101412 100%)',
                      border: '1px solid rgba(0, 168, 107, 0.30)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(221, 245, 234, 0.12)',
                    }}
                  >
                    {step.number}
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5 tracking-tight group-hover:text-emerald-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto font-normal">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
