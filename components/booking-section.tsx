'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
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
    <section className="relative py-28 bg-[#06140D] overflow-hidden border-t border-emerald-500/10" id="booking">
      {/* Background Depth Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#00A86B]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-[#005C43]/70 border border-emerald-500/25 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-md">
            Instant Facility Reservation
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            RESERVE YOUR <span className="text-[#2BA84A]">SESSION</span>
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Experience Kashmir&apos;s first FIFA-grade synthetic turf & pro cricket net pitches with real-time slot availability.
          </p>
        </motion.div>

        {/* Feature Cards Grid (Tactile Clay Surfaces) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, scale: 1.012 }}
            whileTap={{ scale: 0.98 }}
            className="p-8 rounded-3xl flex flex-col justify-between transition-all duration-300"
            style={{
              background: 'linear-gradient(150deg, rgba(14, 36, 25, 0.85) 0%, rgba(6, 25, 18, 0.92) 55%, rgba(16, 20, 18, 0.96) 100%)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(0, 168, 107, 0.18)',
              boxShadow: '0 18px 45px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.35)',
            }}
          >
            <div>
              <h3 className="text-2xl font-bold font-display text-white">Football Turf</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                10,000+ sq. ft. 7-a-side professional synthetic turf field equipped with high-lux floodlights.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#2BA84A]">₹{turfPrice}/hr</span>
              <Link
                href="/book-now?facility=football-turf"
                className="clay-button-green px-4 py-2 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
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
            whileHover={{ y: -5, scale: 1.012 }}
            whileTap={{ scale: 0.98 }}
            className="p-8 rounded-3xl flex flex-col justify-between transition-all duration-300"
            style={{
              background: 'linear-gradient(150deg, rgba(14, 36, 25, 0.85) 0%, rgba(6, 25, 18, 0.92) 55%, rgba(16, 20, 18, 0.96) 100%)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(0, 168, 107, 0.18)',
              boxShadow: '0 18px 45px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.35)',
            }}
          >
            <div>
              <h3 className="text-2xl font-bold font-display text-white">Cricket Net 1</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Pro cricket net pitch with high-grade polyurethane turf and heavy-duty protective netting.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#2BA84A]">₹{net1Price}/hr</span>
              <Link
                href="/book-now?facility=cricket-net-1"
                className="clay-button-green px-4 py-2 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
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
            whileHover={{ y: -5, scale: 1.012 }}
            whileTap={{ scale: 0.98 }}
            className="p-8 rounded-3xl flex flex-col justify-between transition-all duration-300"
            style={{
              background: 'linear-gradient(150deg, rgba(14, 36, 25, 0.85) 0%, rgba(6, 25, 18, 0.92) 55%, rgba(16, 20, 18, 0.96) 100%)',
              backdropFilter: 'blur(18px)',
              border: '1px solid rgba(0, 168, 107, 0.18)',
              boxShadow: '0 18px 45px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.35)',
            }}
          >
            <div>
              <h3 className="text-2xl font-bold font-display text-white">Cricket Net 2</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Pro cricket net pitch with optional automated speed-variable bowling machine access.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <span className="text-lg font-extrabold text-[#2BA84A]">₹{net2Price}/hr</span>
              <Link
                href="/book-now?facility=cricket-net-2"
                className="clay-button-green px-4 py-2 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
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
            className="clay-button-green inline-flex items-center gap-3 px-8 py-4 text-white font-extrabold text-base rounded-2xl"
          >
            Choose Your Facility & Book <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
