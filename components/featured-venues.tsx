'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clock, Users, Zap } from 'lucide-react'

const venues = [
  {
    id: 'cricket-net-1',
    name: 'Cricket Net 1',
    description: 'Professional practice net with high-quality netting for batting and bowling.',
    price: '₹299',
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
    features: ['Professional nets', 'Quality setup', 'Solo practice'],
  },
  {
    id: 'cricket-net-2',
    name: 'Cricket Net 2',
    description: 'Second practice net ideal for team sessions and group training.',
    price: '₹299',
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
    features: ['Team sessions', 'Group training', 'Quality setup'],
  },
  {
    id: 'football-turf',
    name: 'Football/Cricket Turf',
    description: '10,000+ sq. ft. premium synthetic turf for football and box cricket.',
    price: '₹899',
    unit: '/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-9yWOKvvBNNBK6xIquOyQsdI5jRibpr.webp',
    features: ['10,000+ sq. ft.', 'Floodlights', 'Multi-sport'],
    popular: true,
  },
]

export default function FeaturedVenues() {
  return (
    <section className="py-24 bg-white">
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
            Premium sports turfs and grounds designed for cricket and football, offering top-class facilities and dynamic environments for an unmatched playing experience.
          </p>
        </motion.div>

        {/* Venue cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue, index) => (
            <motion.div
              key={venue.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="card-premium rounded-2xl overflow-hidden h-full flex flex-col">
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={venue.image}
                    alt={venue.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {venue.popular && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-[#2BA84A] text-white text-xs font-semibold rounded-full">
                      Popular
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-[#0A0A0C] mb-2">{venue.name}</h3>
                  <p className="text-[#0A0A0C]/60 text-sm mb-4">{venue.description}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {venue.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-[#F8FAFB] text-[#0A0A0C]/70 text-xs rounded-md"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Price and CTA - pushed to bottom */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#0A0A0C]/5 mt-auto">
                    <div>
                      <span className="text-2xl font-bold text-[#2BA84A]">{venue.price}</span>
                      <span className="text-[#0A0A0C]/50 text-sm">{venue.unit}</span>
                    </div>
                    <Link
                      href="/book-now"
                      className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0C] text-white text-sm font-medium rounded-lg hover:bg-[#2BA84A] transition-colors"
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
