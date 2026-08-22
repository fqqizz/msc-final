import { Metadata } from 'next'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Target, Heart, Users, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Maqbool Sports Complex',
  description: 'Learn about Maqbool Sports Complex - Baramulla\'s first dedicated sports facility, built to inspire, train, and unite the community through sports.',
}

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'To provide world-class sports facilities that inspire athletes of all ages and skill levels to pursue their passion for sports.'
  },
  {
    icon: Heart,
    title: 'Our Vision',
    description: 'To become the premier sports destination in Kashmir, nurturing talent and fostering a culture of sports excellence in the community.'
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'Built by the community, for the community. We believe in making quality sports accessible to everyone in Baramulla.'
  },
  {
    icon: MapPin,
    title: 'Rooted in Kashmir',
    description: 'Proudly located amidst the scenic mountain landscapes of Baramulla, bringing international-standard facilities to the valley.'
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#061009] text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#040d07] overflow-hidden border-b border-emerald-500/10">
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/images/facilities/turf-1.webp"
            alt="MSC About"
            fill
            priority
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040d07]/60 via-[#040d07]/90 to-[#061009]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-6 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            About Us
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            OUR <span className="text-[#2BA84A]">STORY</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            More than just a playing field - a purpose-built athletic sanctuary crafted out of love for the game.
          </p>
        </div>
      </section>

      {/* Main Story */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 block">
                The MSC Vision
              </span>
              <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-wide mb-6 leading-tight">
                START YOUR JOURNEY WITH <span className="text-[#2BA84A]">MAQBOOL SPORTS COMPLEX</span>
              </h2>
              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                <p>
                  Nestled amidst the scenic landscapes of Baramulla, our 10,000+ sq. ft. multi-sport turf is more than just a playing field - it&apos;s a space built out of love for the game.
                </p>
                <p>
                  Designed to inspire, train, and unite, the turf offers a dedicated area for football and cricket, with plans to add more sports facilities in the near future.
                </p>
                <p>
                  Whether you&apos;re here to train, play, get fit, or simply have fun, we&apos;ve created a welcoming environment for all ages and skill levels.
                </p>
                <p>
                  This is the first facility of its kind in the area, crafted to global standards and surrounded by breathtaking mountain views. Come experience the joy of sport, right here in the heart of Baramulla!
                </p>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book-now"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#2BA84A] hover:bg-[#23903e] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/60 transition-all duration-200"
                >
                  <span>Book Your Slot</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/facilities"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0e2419]/80 hover:bg-[#133324] border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-100 hover:text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md backdrop-blur-md transition-all duration-200"
                >
                  View Facilities
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-emerald-500/20 bg-[#040d07]">
                <Image
                  src="/images/facilities/turf-2.webp"
                  alt="MSC Turf"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Stats overlay */}
              <div className="absolute -bottom-5 -left-5 bg-[#0e2419]/95 border border-emerald-500/30 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#2BA84A]">10,000+</div>
                <p className="text-slate-300 text-xs sm:text-sm mt-0.5">sq. ft. of FIFA-grade Turf</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-24 bg-[#040d07] border-t border-emerald-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm">
              Core Principles
            </span>
            <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl text-white uppercase tracking-wide">
              WHAT <span className="text-[#2BA84A]">DRIVES US</span>
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Our core values that guide everything we do for Kashmir&apos;s sporting community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-[#0e2419]/90 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-xl shadow-lg shadow-black/30 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-4 text-emerald-400">
                  <value.icon size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">{value.title}</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Preview */}
      <section className="py-20 sm:py-24 bg-[#061009] border-t border-emerald-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm">
                Facility Location
              </span>
              <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-wide mb-4">
                VISIT US IN THE HEART OF <span className="text-[#2BA84A]">BARAMULLA</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
                Located in Sangri Colony, our facility is easily accessible, featuring secure parking and breathtaking panoramic mountain views.
              </p>
              <address className="not-italic text-slate-200 text-sm mb-8 space-y-1 bg-[#0e2419]/80 border border-emerald-500/20 p-5 rounded-2xl">
                <strong className="text-white block font-bold">Maqbool Sports Complex</strong>
                <span>Sangri Colony, Baramulla</span><br />
                <span>Jammu and Kashmir, 193101</span>
              </address>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#2BA84A] hover:bg-[#23903e] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/60 transition-all duration-200"
              >
                Get Directions
                <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-emerald-500/20 bg-[#040d07]">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/contact-fsgvfbe8149b7d7aaf60a37248cac104cff70-nopehSpkqvMqC7oJJY6RAFFztOHa5x.png"
                alt="MSC Location"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
