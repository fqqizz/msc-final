'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clock, Users, Zap, Check } from 'lucide-react'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'
import { createClient } from '@/lib/supabase/client'

type FacilityDisplay = {
  id: string
  name: string
  description: string
  price: number
  unit: string
  image: string
  features: string[]
  popular?: boolean
}

const DEFAULT_FACILITIES: FacilityDisplay[] = [
  {
    id: 'cricket-net-1',
    name: 'Cricket Net 1',
    description: 'Professional practice net with high-quality netting for solo batting and bowling drills.',
    price: 299,
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
    features: ['Professional pitch', 'Heavy-duty netting', 'Adequate run-up'],
  },
  {
    id: 'cricket-net-2',
    name: 'Cricket Net 2',
    description: 'Pro cricket net pitch with optional automated speed-variable bowling machine hookup.',
    price: 299,
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
    features: ['Bowling machine hookup', 'Pace & swing controls', 'Protective cage'],
  },
  {
    id: 'football-turf',
    name: 'Football Turf',
    description: '10,000+ sq. ft. premium FIFA-grade synthetic turf for football and box cricket with floodlights.',
    price: 999,
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp',
    features: ['10,000+ sq. ft. field', 'LED Floodlights', 'Shock-absorbing infill'],
    popular: true,
  },
]

export default function FeaturedVenues() {
  const { isMobile } = useMobilePerformance()
  const [facilities, setFacilities] = useState<FacilityDisplay[]>(DEFAULT_FACILITIES)
  const supabase = createClient()

  // Fetch authoritative live base prices from Supabase
  useEffect(() => {
    async function loadLiveFacilityPrices() {
      try {
        const { data: dbVenues } = await supabase
          .from('venues')
          .select('id, slug, base_price, sport_type')
          .eq('status', 'active')
          .neq('slug', 'bowling-nets')

        if (dbVenues && dbVenues.length > 0) {
          setFacilities((prev) =>
            prev.map((f) => {
              const matched = dbVenues.find((dbV) => dbV.slug === f.id || dbV.id === f.id)
              if (matched && matched.base_price) {
                return { ...f, price: Number(matched.base_price) }
              }
              return f
            })
          )
        }
      } catch (err) {
        console.error('Error fetching live facility prices for featured section:', err)
      }
    }

    loadLiveFacilityPrices()
  }, [])

  const cardHover = isMobile
    ? {}
    : {
        y: -6,
        scale: 1.015,
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
      }

  return (
    <section className="py-20 sm:py-28 bg-[#06140d] relative overflow-hidden text-white border-t border-emerald-500/10">
      {/* Soft Ambient Radial Atmosphere */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] sm:w-[800px] h-[350px] sm:h-[450px] bg-[#00A86B]/10 rounded-full blur-[130px] transform-gpu" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,168,107,0.06)_0%,rgba(6,20,13,0.95)_75%)]" />
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
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#005C43]/70 border border-emerald-500/25 text-emerald-300 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
            Featured Facilities
          </span>
          <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl md:text-6xl text-white tracking-wide uppercase leading-tight">
            PREMIUM SPORTS <span className="text-[#00A86B]">FACILITIES & TURFS</span>
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            FIFA-grade synthetic turf and professional cricket nets with floodlights, nestled amidst the scenic mountain landscapes of Baramulla.
          </p>
        </motion.div>

        {/* Facility cards (Clean presentation with NO physical text overlays on the image) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {facilities.map((facility, index) => (
            <motion.div
              key={facility.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              whileHover={cardHover}
              whileTap={isMobile ? { scale: 0.98 } : { scale: 0.99 }}
              className="group relative transform-gpu will-change-transform"
            >
              <div className="bg-[#0e2419]/90 border border-emerald-500/20 hover:border-[#00A86B]/60 rounded-3xl overflow-hidden h-full flex flex-col backdrop-blur-xl shadow-2xl shadow-black/40 transition-all duration-300">
                {/* Image — Clean with NO redundant sport text overlay badges */}
                <div className="relative h-56 w-full overflow-hidden bg-[#040d07]">
                  <Image
                    src={facility.image}
                    alt={facility.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {facility.popular && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-[#00A86B] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-[#06251D]/60">
                      Popular
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e2419] via-transparent to-transparent opacity-60" />
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-emerald-300 transition-colors">
                      {facility.name}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2">
                      {facility.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {facility.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2.5 py-1 bg-[#07170f] border border-emerald-500/15 text-emerald-300 text-[11px] font-medium rounded-lg"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Authoritative Live Price and CTA (Pre-selects facility into Date step) */}
                  <div className="flex items-center justify-between pt-4 border-t border-emerald-500/15 mt-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Rate</span>
                      <span className="text-2xl font-extrabold text-[#00A86B]">
                        ₹{facility.price} <span className="text-xs text-slate-400 font-normal">{facility.unit}</span>
                      </span>
                    </div>
                    <Link
                      href={`/book-now?facility=${facility.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#00A86B] hover:bg-[#007A52] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/50 transition-all duration-200"
                    >
                      Book Session
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12 sm:mt-14"
        >
          <Link
            href="/facilities"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0e2419]/80 hover:bg-[#133324] border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-100 hover:text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md backdrop-blur-md transition-all duration-200"
          >
            View All Facilities
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
