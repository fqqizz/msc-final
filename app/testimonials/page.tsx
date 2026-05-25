'use client'

import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Arshad Zargar',
    role: 'Local Guide',
    reviews: '22 reviews',
    photos: '69 photos',
    rating: 5,
    text: 'Maqbool Sports Complex in Baramulla is an excellent destination for football enthusiasts. The ground is well-maintained, spacious, and provides a safe and vibrant atmosphere for players. It\'s a great place for practice sessions and friendly matches or tournaments. With a few more amenities, it could become one of the best football facilities in the area.',
    date: '9 months ago'
  },
  {
    name: 'Junaid Rashid',
    role: 'Football Enthusiast',
    reviews: '10 Reviews',
    photos: '9 photos',
    rating: 4.5,
    text: 'Really a great experience Playing Here at Maqbool Sports Complex Baramulla. Especially the Environment over here is totally the best you could see anywhere',
    date: '13 days ago'
  },
  {
    name: 'Danish Mir',
    role: 'Local Guide',
    reviews: '15 reviews',
    photos: '42 photos',
    rating: 5,
    text: 'Best turf facility in Baramulla! The synthetic grass is of excellent quality and the floodlights make evening games possible. Booking is hassle-free and the staff is very cooperative. Highly recommended for anyone looking to play football or cricket.',
    date: '6 months ago'
  },
  {
    name: 'Aaqib Lone',
    role: 'Football Enthusiast',
    reviews: '8 reviews',
    photos: '23 photos',
    rating: 5,
    text: 'Finally a proper sports facility in our area! The mountain views while playing are absolutely stunning. I come here every weekend with my friends for football. The turf quality is on par with any city facility.',
    date: '4 months ago'
  },
  {
    name: 'Faizan Bhat',
    role: 'Cricket Player',
    reviews: '12 reviews',
    photos: '31 photos',
    rating: 4,
    text: 'Great cricket nets for practice sessions. The surface is well-maintained and perfect for both batting and bowling practice. The pricing is reasonable and the location amidst mountains adds to the experience.',
    date: '5 months ago'
  },
  {
    name: 'Umer Rather',
    role: 'Sports Coach',
    reviews: '18 reviews',
    photos: '55 photos',
    rating: 5,
    text: 'As a coach, I appreciate the professional setup at MSC. The turf quality is excellent for training young athletes. The management is supportive and the facility is well-maintained. Looking forward to the upcoming sports academy!',
    date: '3 months ago'
  },
  {
    name: 'Waseem Shah',
    role: 'Local Guide',
    reviews: '25 reviews',
    photos: '78 photos',
    rating: 5,
    text: 'This place has transformed the sports scene in Baramulla. Clean facilities, proper maintenance, and a professional environment. The night games under floodlights are an amazing experience. Must visit for all sports lovers!',
    date: '7 months ago'
  },
]

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#F8FAFB] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            Testimonials
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#0A0A0C] tracking-tight">
            What Our
            <span className="text-[#2BA84A]"> Players Say</span>
          </h1>
          <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto">
            Glowing testimonials from passionate local cricket and football players, showcasing our exceptional turf and ground booking services.
          </p>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-12 overflow-hidden bg-[#F8FAFB]">
        <div className="relative">
          {/* Row 1 - Left to Right */}
          <div className="flex gap-6 mb-6 animate-marquee">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <TestimonialCard key={`row1-${index}`} testimonial={testimonial} />
            ))}
          </div>
          
          {/* Row 2 - Right to Left */}
          <div className="flex gap-6 animate-marquee-reverse">
            {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((testimonial, index) => (
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
            {testimonials.map((testimonial, index) => (
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
