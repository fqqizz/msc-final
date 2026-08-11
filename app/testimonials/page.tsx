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
    text: 'Maqbool Sports Complex in Baramulla is an excellent destination for football enthusiasts. The ground is well-maintained, spacious, and provides a safe and vibrant atmosphere for players. It\'s a great place for practice sessions and friendly matches or tournaments.',
    date: 'Verified Athlete'
  },
  {
    name: 'Junaid Rashid',
    role: 'Football Enthusiast',
    reviews: '10 Reviews',
    photos: '9 photos',
    rating: 5,
    text: 'Really a great experience playing here at Maqbool Sports Complex Baramulla. Especially the mountain environment and turf quality is totally the best you could see anywhere in Kashmir.',
    date: 'Verified Player'
  },
  {
    name: 'Danish Mir',
    role: 'Local Guide',
    reviews: '15 reviews',
    photos: '42 photos',
    rating: 5,
    text: 'Best turf facility in Baramulla! The synthetic grass is of excellent quality and the floodlights make evening games possible. Booking is seamless and the staff is very cooperative. Highly recommended.',
    date: 'Verified Athlete'
  },
  {
    name: 'Aaqib Lone',
    role: 'Football Enthusiast',
    reviews: '8 reviews',
    photos: '23 photos',
    rating: 5,
    text: 'Finally a proper sports facility in our area! The mountain views while playing are absolutely stunning. I come here every weekend with my friends for football. The turf quality is on par with international standards.',
    date: 'Regular Booking'
  },
  {
    name: 'Faizan Bhat',
    role: 'Cricket Player',
    reviews: '12 reviews',
    photos: '31 photos',
    rating: 5,
    text: 'Great cricket nets for practice sessions. The surface is well-maintained and perfect for both batting and bowling practice with the bowling machine. Transparent pricing adds to the experience.',
    date: 'Cricket Member'
  },
  {
    name: 'Umer Rather',
    role: 'Sports Coach',
    reviews: '18 reviews',
    photos: '55 photos',
    rating: 5,
    text: 'As a coach, I appreciate the professional setup at MSC. The turf quality is excellent for training young athletes. The management is supportive and the facility is well-maintained.',
    date: 'Certified Coach'
  },
]

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-[#061009] text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#040d07] overflow-hidden border-b border-emerald-500/10 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-6 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Athlete Feedback
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            WHAT OUR <span className="text-[#2BA84A]">PLAYERS SAY</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Real reviews and testimonials from local athletes, teams, coaches, and sports lovers across Kashmir.
          </p>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.5 }}
                className="bg-[#0e2419]/90 border border-emerald-500/20 hover:border-emerald-400/50 p-7 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl shadow-black/30 flex flex-col justify-between transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-emerald-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-current" />
                      ))}
                    </div>
                    <Quote size={24} className="text-emerald-500/30" />
                  </div>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-emerald-500/15 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{t.name}</h3>
                    <p className="text-emerald-400/80 text-[11px] font-medium">{t.role}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-[#07170f] border border-emerald-500/15 px-2.5 py-1 rounded-full">
                    {t.date}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
