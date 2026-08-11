'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Sun, Shield, Users, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'
import { createClient } from '@/lib/supabase/client'

const INITIAL_FACILITIES = [
  {
    id: 'football-turf',
    name: 'Football / Cricket Turf',
    description:
      '10,000+ sq. ft. premium synthetic turf perfect for football matches and box cricket. Features high-quality artificial grass providing exceptional ball roll, player cushioning, and floodlights for evening games.',
    price: 999,
    unit: '/hour',
    image:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp',
    features: [
      '10,000+ sq. ft. playing area',
      'FIFA-grade synthetic turf',
      'Professional floodlights for night matches',
      'Customizable formats (5v5, 7v7, box cricket)',
      'Scenic mountain backdrop of Baramulla',
      'Continuous maintenance & perimeter netting',
    ],
  },
  {
    id: 'cricket-net-1',
    name: 'Cricket Practice Net 1',
    description:
      'Professional cricket net designed for intensive batting and bowling practice. Features heavy-duty safety netting, consistent pitch bounce, and adequate run-up space.',
    price: 299,
    unit: '/hour',
    image:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
    features: [
      'Professional-grade heavy netting',
      'True bounce synthetic pitch',
      'Dedicated bowler run-up space',
      'Individual & coach practice sessions',
      'Night practice under floodlights',
      'Full protective enclosure',
    ],
  },
  {
    id: 'cricket-net-2',
    name: 'Cricket Practice Net 2',
    description:
      'Second professional cricket net ideal for team practice, group drills, and automated bowling machine sessions with pace, swing, and spin controls.',
    price: 299,
    unit: '/hour',
    image:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
    features: [
      'Automated bowling machine hookup',
      'Team practice & group training',
      'Pace, swing, and spin simulation',
      'Simultaneous batting & bowling',
      'High-impact safety enclosure',
      'Stumps and equipment provided',
    ],
  },
]

const highlights = [
  {
    icon: Sun,
    title: 'Professional Floodlights',
    description: 'High-lumen LED floodlights across all pitches for night games until 11:00 PM',
  },
  {
    icon: Shield,
    title: '24/7 CCTV Surveillance',
    description: 'Continuous CCTV monitoring ensuring security for players, families, and equipment',
  },
  {
    icon: Users,
    title: 'Youth Sports Academy',
    description: 'Upcoming coaching programs for youth athletes with certified sports instructors',
  },
  {
    icon: Zap,
    title: 'Tournament Ready',
    description: 'Full facility configuration ready for school, corporate, and regional tournaments',
  },
]

export default function FacilitiesClient() {
  const { isMobile } = useMobilePerformance()
  const [facilitiesList, setFacilitiesList] = useState(INITIAL_FACILITIES)
  const supabase = createClient()

  // Fetch authoritative live base prices from Supabase
  useEffect(() => {
    async function loadPrices() {
      try {
        const { data: dbVenues } = await supabase
          .from('venues')
          .select('slug, base_price')
          .eq('status', 'active')
          .neq('slug', 'bowling-nets')

        if (dbVenues && dbVenues.length > 0) {
          setFacilitiesList((prev) =>
            prev.map((f) => {
              const match = dbVenues.find((v) => v.slug === f.id)
              if (match && match.base_price) {
                return { ...f, price: Number(match.base_price) }
              }
              return f
            })
          )
        }
      } catch (err) {
        console.error('Error fetching facility prices:', err)
      }
    }
    loadPrices()
  }, [])

  return (
    <main className="min-h-screen bg-[#061009] text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#040d07] overflow-hidden border-b border-emerald-500/10">
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/categoryww-11-5SQXOQi5VinDcWf4sCttNRzzVlb0gC.png"
            alt="MSC Facilities"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040d07]/60 via-[#040d07]/90 to-[#061009]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10"
        >
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-6 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Our Facilities
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            WORLD-CLASS <span className="text-[#2BA84A]">SPORTS FACILITIES</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Premium synthetic turf and professional cricket nets engineered for exceptional athletic performance in Baramulla.
          </p>
        </motion.div>
      </section>

      {/* Facilities List */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16 sm:space-y-24">
            {facilitiesList.map((facility, index) => (
              <motion.div
                key={facility.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[#0e2419]/90 border border-emerald-500/20 hover:border-emerald-400/50 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/40 transition-all duration-300"
              >
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}>
                  {/* Image */}
                  <div className={`relative ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <div className="relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shadow-black/40 bg-[#040d07]">
                      <Image
                        src={facility.image}
                        alt={facility.name}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                    {/* Live Authoritative Price Badge */}
                    <div className="absolute -bottom-3 -right-3 px-5 py-2.5 bg-[#2BA84A] text-white font-extrabold text-base sm:text-lg rounded-xl shadow-xl shadow-emerald-950/60 border border-emerald-300/30">
                      ₹{facility.price}{facility.unit}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                    <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl md:text-4xl text-white uppercase tracking-wide mb-3">
                      {facility.name}
                    </h2>
                    <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
                      {facility.description}
                    </p>

                    {/* Features */}
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                      {facility.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <Check size={12} className="text-emerald-400" />
                          </div>
                          <span className="text-slate-200 text-xs sm:text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/book-now?venue=${facility.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all duration-200"
                    >
                      <span>Book Your Session</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 sm:py-24 bg-[#040d07] border-t border-emerald-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm">
              Standard Amenities
            </span>
            <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl text-white uppercase tracking-wide">
              ADDITIONAL <span className="text-[#2BA84A]">HIGHLIGHTS</span>
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Premium facility amenities engineered for an unmatched sporting experience in Kashmir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="bg-[#0e2419]/90 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-xl shadow-lg shadow-black/30 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-4 text-emerald-400">
                  <highlight.icon size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">{highlight.title}</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
