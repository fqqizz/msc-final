'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Users, Zap, Loader2 } from 'lucide-react'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

interface Venue {
  id: string
  name: string
  slug: string
  sport_type: string
  short_description: string
  max_capacity: number
  surface_type: string | null
  amenities: string[]
  display_order: number
  primary_image: string | null
}

// Fallback images if DB doesn't have them yet
const FALLBACK_IMAGES: Record<string, string> = {
  'football-turf':  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-9yWOKvvBNNBK6xIquOyQsdI5jRibpr.webp',
  'cricket-net-1':  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
  'cricket-net-2':  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
}

const SPORT_BADGE: Record<string, string> = {
  football: '⚽ Football',
  cricket:  '🏏 Cricket',
  bowling:  '🎳 Bowling',
}

// Static price labels per slug (pricing comes from pricing_rules in DB, shown on book page)
const PRICE_LABELS: Record<string, string> = {
  'football-turf': '₹800',
  'cricket-net-1': '₹300',
  'cricket-net-2': '₹300',
}

export default function FeaturedVenues() {
  const { isMobile } = useMobilePerformance()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/venues')
      .then(r => r.json())
      .then(json => setVenues(json.venues ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cardHover = isMobile
    ? {}
    : { y: -8, scale: 1.02, boxShadow: '0 22px 45px rgba(10,10,12,0.16)' }

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            Featured Venues
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0A0C] tracking-tight">
            Premium Sports Turfs & Grounds
          </h2>
          <p className="mt-4 text-[#0A0A0C]/60 max-w-2xl mx-auto text-lg">
            Top-class facilities designed for cricket and football, offering a dynamic environment for an unmatched playing experience.
          </p>
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#2BA84A]" />
          </div>
        )}

        {/* Venue cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue, index) => {
              const img = venue.primary_image ?? FALLBACK_IMAGES[venue.slug] ?? ''
              const priceFrom = PRICE_LABELS[venue.slug] ?? '₹299'
              const isPopular = venue.slug === 'football-turf'

              return (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={cardHover}
                  whileTap={isMobile ? { scale: 0.98 } : { scale: 0.99 }}
                  className="group relative transform-gpu will-change-transform"
                >
                  <div className="card-premium rounded-2xl overflow-hidden h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={img}
                        alt={venue.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {isPopular && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-[#2BA84A] text-white text-xs font-semibold rounded-full shadow">
                          Popular
                        </div>
                      )}
                      {SPORT_BADGE[venue.sport_type] && (
                        <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                          {SPORT_BADGE[venue.sport_type]}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-bold text-[#0A0A0C] mb-2">{venue.name}</h3>
                      <p className="text-[#0A0A0C]/60 text-sm mb-4 flex-1">{venue.short_description}</p>

                      {/* Feature chips */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {venue.amenities?.slice(0, 3).map(a => (
                          <span key={a} className="px-2 py-1 bg-[#F8FAFB] text-[#0A0A0C]/70 text-xs rounded-md">
                            {a}
                          </span>
                        ))}
                        {venue.surface_type && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-[#F8FAFB] text-[#0A0A0C]/70 text-xs rounded-md">
                            <Zap size={10} /> {venue.surface_type}
                          </span>
                        )}
                      </div>

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#0A0A0C]/5">
                        <div>
                          <span className="text-2xl font-bold text-[#2BA84A]">{priceFrom}</span>
                          <span className="text-[#0A0A0C]/50 text-sm">/hour</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-black/40">
                            <Users size={12} /> {venue.max_capacity}
                          </span>
                          <Link
                            href="/book-now"
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#0A0A0C] text-white text-sm font-medium rounded-lg hover:bg-[#2BA84A] transition-colors"
                          >
                            Book Now
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/facilities"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#0A0A0C]/10 text-[#0A0A0C] font-medium rounded-xl hover:bg-[#F8FAFB] transition-colors"
          >
            View All Facilities
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
