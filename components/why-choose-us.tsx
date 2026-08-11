'use client'

import { motion } from 'framer-motion'
import { CheckCircle, MapPin, Clock, Shield, Users, Trophy, Sparkles, Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

const reasons = [
  {
    icon: Trophy,
    title: "First of its Kind",
    description: "One of Baramulla's first dedicated FIFA-grade turf facilities"
  },
  {
    icon: Users,
    title: "For Everyone",
    description: "Ideal for casual friend matches, team leagues & academy training"
  },
  {
    icon: Sparkles,
    title: "Expert Coaching",
    description: "Upcoming sports academy with certified cricket & football coaches"
  },
  {
    icon: Shield,
    title: "Safe & Monitored",
    description: "Safe, inclusive environment with 24/7 CCTV surveillance"
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Open 6:00 AM to 11:00 PM with professional LED floodlights"
  },
  {
    icon: MapPin,
    title: "Scenic Location",
    description: "Nestled in Sangri Colony against breathtaking mountain vistas"
  },
  {
    icon: Heart,
    title: "Community Focused",
    description: "Built for local athletes, grassroots players, and youth sport"
  },
  {
    icon: CheckCircle,
    title: "Authoritative Pricing",
    description: "Transparent, reliable pricing starting at ₹299/hr with zero hidden fees"
  },
]

export default function WhyChooseUs() {
  const { isMobile } = useMobilePerformance()

  return (
    <section className="py-20 sm:py-28 bg-[#061009] relative overflow-hidden text-white border-t border-emerald-500/10">
      {/* Ambient Radial Atmosphere */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
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
            Why Choose Us
          </span>
          <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl md:text-6xl text-white tracking-wide uppercase leading-tight">
            BUILT FOR PLAYERS <span className="text-[#2BA84A]">& COMMUNITY</span>
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Experience world-class sports infrastructure designed to elevate local athletic talent in the heart of Kashmir.
          </p>
        </motion.div>

        {/* Reasons grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={
                isMobile
                  ? {}
                  : {
                      y: -4,
                      scale: 1.01,
                      transition: { duration: 0.2 },
                    }
              }
              whileTap={isMobile ? { scale: 0.98 } : { scale: 0.99 }}
              className="bg-[#0e2419]/90 border border-emerald-500/20 hover:border-emerald-400/50 p-6 rounded-2xl backdrop-blur-xl shadow-lg shadow-black/30 transition-all duration-300 group flex flex-col justify-start"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-4 group-hover:bg-emerald-500/25 group-hover:border-emerald-400/40 transition-colors">
                <reason.icon className="text-emerald-400" size={22} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 tracking-tight group-hover:text-emerald-300 transition-colors">
                {reason.title}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12 sm:mt-14"
        >
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0e2419]/80 hover:bg-[#133324] border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-100 hover:text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md backdrop-blur-md transition-all duration-200"
          >
            Learn More About Us
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
