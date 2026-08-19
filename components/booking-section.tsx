'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function BookingSection() {
  const [turfPrice, setTurfPrice] = useState(999)
  const [net1Price, setNet1Price] = useState(299)
  const [net2Price, setNet2Price] = useState(299)
  const supabase = createClient()

  useEffect(() => {
    async function loadPrices() {
      try {
        const { data } = await supabase
          .from('venues')
          .select('slug, base_price')
          .eq('status', 'active')

        if (data) {
          data.forEach((v) => {
            if (v.slug === 'football-turf' && v.base_price) setTurfPrice(Number(v.base_price))
            if (v.slug === 'cricket-net-1' && v.base_price) setNet1Price(Number(v.base_price))
            if (v.slug === 'cricket-net-2' && v.base_price) setNet2Price(Number(v.base_price))
          })
        }
      } catch (err) {
        console.error('Error fetching prices in booking section:', err)
      }
    }
    loadPrices()
  }, [])

  return (
    <section className="relative py-28 bg-[#06140d] overflow-hidden border-t border-emerald-500/10" id="booking">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#00A86B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-[#005C43]/70 border border-emerald-500/25 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4">
            Instant Facility Reservation
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            RESERVE YOUR SESSION
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Experience Kashmir's first FIFA-grade synthetic turf & pro cricket net pitches with real-time slot availability.
          </p>
        </motion.div>

        {/* Feature Cards Grid (Clean layout without redundant overlay tags) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-[#0e2419]/90 border border-emerald-500/20 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <h3 className="text-2xl font-bold font-display text-white">Football Turf</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                10,000+ sq. ft. 7-a-side professional synthetic turf field equipped with high-lux floodlights.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#00A86B]">₹{turfPrice}/hr</span>
              <Link
                href="/book-now?facility=football-turf"
                className="px-4 py-2 bg-[#00A86B] hover:bg-[#007A52] text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all inline-flex items-center gap-1.5"
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
            className="p-8 rounded-3xl bg-[#0e2419]/90 border border-emerald-500/20 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <h3 className="text-2xl font-bold font-display text-white">Cricket Net 1</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Pro cricket net pitch with high-grade polyurethane turf and heavy-duty protective netting.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#00A86B]">₹{net1Price}/hr</span>
              <Link
                href="/book-now?facility=cricket-net-1"
                className="px-4 py-2 bg-[#00A86B] hover:bg-[#007A52] text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all inline-flex items-center gap-1.5"
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
            className="p-8 rounded-3xl bg-[#0e2419]/90 border border-emerald-500/20 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <h3 className="text-2xl font-bold font-display text-white">Cricket Net 2</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Pro cricket net pitch with optional automated speed-variable bowling machine access.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#00A86B]">₹{net2Price}/hr</span>
              <Link
                href="/book-now?facility=cricket-net-2"
                className="px-4 py-2 bg-[#00A86B] hover:bg-[#007A52] text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all inline-flex items-center gap-1.5"
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
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#00A86B] hover:bg-[#007A52] text-white font-extrabold text-base rounded-2xl shadow-xl shadow-[#00A86B]/25 transition-all hover:scale-[1.02]"
          >
            Choose Your Facility & Book <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
