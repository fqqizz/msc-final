'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

interface DBTestimonial {
  id: string
  customer_name: string
  designation: string | null
  rating: number
  quote: string
  avatar_url: string | null
  display_order: number
}

// Static Google review testimonials — shown as supplement to DB records
const staticTestimonials = [
  { name: 'Arshad Zargar',  role: 'Local Guide',        rating: 5,   text: 'Maqbool Sports Complex in Baramulla is an excellent destination for football enthusiasts. The ground is well-maintained, spacious, and provides a safe and vibrant atmosphere for players.', date: '9 months ago' },
  { name: 'Junaid Rashid',  role: 'Football Enthusiast', rating: 4.5, text: 'Really a great experience playing here at Maqbool Sports Complex Baramulla. Especially the environment over here is totally the best you could see anywhere.', date: '13 days ago' },
  { name: 'Danish Mir',     role: 'Local Guide',        rating: 5,   text: 'Best turf facility in Baramulla! The synthetic grass is of excellent quality and the floodlights make evening games possible. Booking is hassle-free and the staff is very cooperative.', date: '6 months ago' },
  { name: 'Aaqib Lone',     role: 'Football Enthusiast', rating: 5,   text: 'Finally a proper sports facility in our area! The mountain views while playing are absolutely stunning. I come here every weekend with my friends for football.', date: '4 months ago' },
  { name: 'Faizan Bhat',    role: 'Cricket Player',     rating: 4,   text: 'Great cricket nets for practice sessions. The surface is well-maintained and perfect for both batting and bowling practice. The pricing is reasonable.', date: '5 months ago' },
  { name: 'Umer Rather',    role: 'Sports Coach',       rating: 5,   text: 'As a coach, I appreciate the professional setup at MSC. The turf quality is excellent for training young athletes. The management is supportive and the facility is well-maintained.', date: '3 months ago' },
  { name: 'Waseem Shah',    role: 'Local Guide',        rating: 5,   text: 'This place has transformed the sports scene in Baramulla. Clean facilities, proper maintenance, and a professional environment. The night games under floodlights are an amazing experience.', date: '7 months ago' },
]

export default function TestimonialsPage() {
  const [dbTestimonials, setDbTestimonials] = useState<DBTestimonial[]>([])

  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(json => setDbTestimonials(json.testimonials ?? []))
      .catch(() => {})
  }, [])

  // Merge DB records with static ones (DB records shown first in static grid)
  const allStatic = [
    ...dbTestimonials.map(t => ({
      name: t.customer_name,
      role: t.designation ?? 'Verified Customer',
      rating: t.rating,
      text: t.quote,
      date: 'Verified',
    })),
    ...staticTestimonials,
  ]

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#F8FAFB] to-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            Testimonials
          </span>
          <motion.h1
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#0A0A0C] tracking-tight"
          >
            What Our
            <span className="text-[#2BA84A]"> Players Say</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto"
          >
            Glowing testimonials from passionate local cricket and football players, showcasing our exceptional turf and ground booking services.
          </motion.p>
        </motion.div>
      </section>

      {/* Marquee Section */}
      <section className="py-12 overflow-hidden bg-[#F8FAFB]">
        <div className="relative">
          {/* Row 1 - Left to Right */}
          <div className="flex gap-6 mb-6 animate-marquee">
            {[...allStatic, ...allStatic].map((testimonial, index) => (
              <TestimonialCard key={`row1-${index}`} testimonial={testimonial} />
            ))}
          </div>
          
          {/* Row 2 - Right to Left */}
          <div className="flex gap-6 animate-marquee-reverse">
            {[...allStatic.slice().reverse(), ...allStatic.slice().reverse()].map((testimonial, index) => (
              <TestimonialCard key={`row2-${index}`} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Static Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight">
              Our Clients Love Us
            </h2>
            <p className="mt-4 text-[#0A0A0C]/60 max-w-xl mx-auto">
              Read detailed reviews from players who have experienced MSC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allStatic.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl border border-[#0A0A0C]/5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#2BA84A] flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0A0A0C]">{testimonial.name}</h3>
                    <p className="text-[#0A0A0C]/50 text-sm">{testimonial.role}</p>
                    <p className="text-[#0A0A0C]/40 text-xs">{testimonial.reviews} · {testimonial.photos}</p>
                  </div>
                </div>
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < testimonial.rating ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[#0A0A0C]/20'}
                    />
                  ))}
                </div>

                <p className="text-[#0A0A0C]/70 text-sm leading-relaxed mb-4">
                  {testimonial.text}
                </p>

                <p className="text-[#0A0A0C]/40 text-xs">{testimonial.date}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#F8FAFB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Quote className="mx-auto mb-6 text-[#2BA84A]" size={48} />
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight mb-6">
            Join Our Community of Players
          </h2>
          <p className="text-[#0A0A0C]/60 text-lg mb-8 max-w-2xl mx-auto">
            Experience the best sports facility in Baramulla and become part of our growing sports community.
          </p>
          <a
            href="/book-now"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-colors text-lg"
          >
            Book Your Slot Today
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <div className="flex-shrink-0 w-[400px] bg-white p-6 rounded-2xl border border-[#0A0A0C]/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#2BA84A] flex items-center justify-center text-white font-bold">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <h4 className="font-semibold text-[#0A0A0C] text-sm">{testimonial.name}</h4>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < testimonial.rating ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[#0A0A0C]/20'}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-[#0A0A0C]/60 text-sm line-clamp-3">{testimonial.text}</p>
    </div>
  )
}
