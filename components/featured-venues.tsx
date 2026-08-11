'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clock, Users, Zap, Check } from 'lucide-react'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'
import { createClient } from '@/lib/supabase/client'

type VenueDisplay = {
  id: string
  name: string
  description: string
  price: number
  unit: string
  image: string
  features: string[]
  popular?: boolean
}

const DEFAULT_VENUES: VenueDisplay[] = [
  {
    id: 'cricket-net-1',
    name: 'Cricket Net 1',
    description: 'Professional practice net with high-quality netting for solo batting and bowling drills.',
    price: 299,
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
    features: ['Professional nets', 'Quality pitch', 'Solo practice'],
  },
  {
    id: 'cricket-net-2',
    name: 'Cricket Net 2',
    description: 'Pro cricket net with optional automated speed-variable bowling machine hookup.',
    price: 299,
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
    features: ['Bowling machine port', 'Group training', 'Quality setup'],
  },
  {
    id: 'football-turf',
    name: 'Football/Cricket Turf',
    description: '10,000+ sq. ft. premium FIFA-grade synthetic turf for football and box cricket with floodlights.',
    price: 999,
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp',
    features: ['10,000+ sq. ft.', 'Floodlights', 'Multi-sport'],
    popular: true,
  },
]

export default function FeaturedVenues() {
  const { isMobile } = useMobilePerformance()
  const [venues, setVenues] = useState<VenueDisplay[]>(DEFAULT_VENUES)
  const supabase = createClient()

  // Fetch authoritative live base prices from Supabase
  useEffect(() => {
    async function loadLiveVenuePrices() {
      try {
        const { data: dbVenues } = await supabase
          .from('venues')
          .select('slug, base_price, sport_type')
          .eq('status', 'active')
          .neq('slug', 'bowling-nets')

        if (dbVenues && dbVenues.length > 0) {
          setVenues((prev) =>
            prev.map((v) => {
              const matched = dbVenues.find((dbV) => dbV.slug === v.id)
              if (matched && matched.base_price) {
                return { ...v, price: Number(matched.base_price) }
              }
              return v
            })
          )
        }
      } catch (err) {
        console.error('Error fetching live venue prices for featured section:', err)
      }
    }

    loadLiveVenuePrices()
  }, [])

  const cardHover = isMobile
    ? {}
    : {
        y: -6,
        scale: 1.015,
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
      }

  return (
    <section className="py-20 sm:py-28 bg-[#061009] relative overflow-hidden text-white border-t border-emerald-500/10">
      {/* Soft Ambient Radial Atmosphere */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] sm:w-[800px] h-[350px] sm:h-[450px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(43,168,74,0.06)_0%,rgba(6,16,9,0.95)_75%)]" />
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
            Featured Venues
          </span>
          <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl md:text-6xl text-white tracking-wide uppercase leading-tight">
            PREMIUM SPORTS <span className="text-[#2BA84A]">TURFS & GROUNDS</span>
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            FIFA-grade synthetic turf and professional cricket nets with floodlights, nestled amidst the scenic mountain landscapes of Baramulla.
          </p>
        </motion.div>

        {/* Venue cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {venues.map((venue, index) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              whileHover={cardHover}
              whileTap={isMobile ? { scale: 0.98 } : { scale: 0.99 }}
              className="group relative transform-gpu will-change-transform"
            >
              <div className="bg-[#0e2419]/90 border border-emerald-500/20 hover:border-emerald-400/50 rounded-3xl overflow-hidden h-full flex flex-col backdrop-blur-xl shadow-2xl shadow-black/40 transition-all duration-300">
                {/* Image */}
                <div className="relative h-56 w-full overflow-hidden bg-[#040d07]">
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {venue.popular && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-[#2BA84A] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-emerald-950/60">
                      Popular
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e2419] via-transparent to-transparent opacity-60" />
                </div>

                {/* Content */}
                <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-emerald-300 transition-colors">
                      {venue.name}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2">
                      {venue.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {venue.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2.5 py-1 bg-[#07170f] border border-emerald-500/15 text-emerald-300 text-[11px] font-medium rounded-lg"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Authoritative Live Price and CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-emerald-500/15 mt-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Authoritative Rate</span>
                      <span className="text-2xl font-extrabold text-emerald-400">
                        ₹{venue.price} <span className="text-xs text-slate-400 font-normal">{venue.unit}</span>
                      </span>
                    </div>
                    <Link
                      href={`/book-now?venue=${venue.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/50 hover:shadow-emerald-500/30 transition-all duration-200"
                    >
                      Book Now
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
