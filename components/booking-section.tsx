'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function BookingSection() {
  const [sport, setSport] = useState<'football' | 'cricket'>('football')

  return (
    <section className="relative py-28 bg-slate-950 overflow-hidden" id="booking">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Instant Slot Reservation
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            RESERVE YOUR GAME
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Experience Kashmir's first FIFA-grade synthetic turf & pro cricket net pitches with real-time slot availability.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/20 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase rounded">
                Football
              </span>
              <h3 className="text-2xl font-bold font-display text-white mt-3">Football Turf</h3>
              <p className="text-xs text-slate-400 mt-2">
                10,000+ sq. ft. 7-a-side professional synthetic turf field equipped with high-lux floodlights.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-400">₹999/hr</span>
              <Link
                href="/book-now?venue=football-turf"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center gap-1.5"
              >
                Book Turf <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase rounded">
                Cricket
              </span>
              <h3 className="text-2xl font-bold font-display text-white mt-3">Cricket Net 1</h3>
              <p className="text-xs text-slate-400 mt-2">
                Pro cricket net pitch with high-grade polyurethane turf and heavy-duty protective netting.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-lg font-bold text-sky-400">₹299/hr</span>
              <Link
                href="/book-now?venue=cricket-net-1"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/30 transition-all inline-flex items-center gap-1.5"
              >
                Book Net 1 <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase rounded">
                Cricket & Bowling
              </span>
              <h3 className="text-2xl font-bold font-display text-white mt-3">Cricket Net 2</h3>
              <p className="text-xs text-slate-400 mt-2">
                Pro cricket net pitch with optional automated speed-variable bowling machine access.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-lg font-bold text-amber-400">₹299/hr</span>
              <Link
                href="/book-now?venue=cricket-net-2"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/30 transition-all inline-flex items-center gap-1.5"
              >
                Book Net 2 <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Global CTA Banner */}
        <div className="text-center">
          <Link
            href="/book-now"
            className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02]"
          >
            Open Real-Time Booking Engine <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
