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
    description: 'Proudly located amidst the scenic landscapes of Baramulla, bringing international-standard facilities to the heart of Kashmir.'
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#050505] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp"
            alt="MSC About"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/80 to-[#050505]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-[#2BA84A]/20 border border-[#2BA84A]/30 text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            About Us
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight">
            OUR STORY
          </h1>
          <p className="mt-6 text-white/70 text-lg max-w-2xl mx-auto">
            More than just a playing field - a space built out of love for the game.
          </p>
        </div>
      </section>

      {/* Main Story */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight mb-6">
                Start Your Journey With
                <span className="text-[#2BA84A]"> Maqbool Sports Complex</span>
              </h2>
              <div className="space-y-4 text-[#0A0A0C]/70 leading-relaxed">
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
                  This is the first facility of its kind in the area and is crafted to global standards and surrounded by breathtaking mountain views. Come experience the joy of sport, right here in the heart of Baramulla!
                </p>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book-now"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-colors"
                >
                  Book Your Slot
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/facilities"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#0A0A0C]/10 text-[#0A0A0C] font-medium rounded-xl hover:bg-[#F8FAFB] transition-colors"
                >
                  View Facilities
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%281%29-cTfRT8gpqovQtI1n8tjmfmQjPApiM5.webp"
                  alt="MSC Turf"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Stats overlay */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl">
                <div className="text-4xl font-bold text-[#2BA84A]">10,000+</div>
                <p className="text-[#0A0A0C]/60 text-sm">sq. ft. of Premium Turf</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-[#F8FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight">
              What Drives Us
            </h2>
            <p className="mt-4 text-[#0A0A0C]/60 max-w-xl mx-auto">
              Our core values that guide everything we do at MSC.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white p-6 rounded-2xl border border-[#0A0A0C]/5"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center mb-4">
                  <value.icon className="text-[#2BA84A]" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-[#0A0A0C] mb-2">{value.title}</h3>
                <p className="text-[#0A0A0C]/60 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
              Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight">
              Built for Players, Coaches & Community
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "One of Baramulla's first dedicated turf facilities",
              "Ideal for both casual play and professional training",
              "Expert coaching and youth development programs",
              "Safe, inclusive, and family-friendly atmosphere",
              "Flexible booking hours for individuals, groups, and institutions",
              "Located in a serene, inspiring natural environment",
              "Affordable pricing without compromising on quality",
              "Community-focused approach to sports development"
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4">
                <div className="w-6 h-6 rounded-full bg-[#E8F5EC] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#2BA84A] text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-[#0A0A0C]/70">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Preview */}
      <section className="py-24 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-[#2BA84A]/20 border border-[#2BA84A]/30 text-[#2BA84A] text-sm font-medium rounded-full mb-6">
                Our Location
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">
                Visit Us in the Heart of Baramulla
              </h2>
              <p className="text-white/60 mb-6">
                Located in Sangri Colony, our facility is easily accessible and surrounded by the natural beauty of Kashmir.
              </p>
              <address className="not-italic text-white/80 mb-8">
                <strong>Maqbool Sports Complex</strong><br />
                Sangri Colony, Baramulla<br />
                Jammu and Kashmir, 193101
              </address>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-colors"
              >
                Get Directions
                <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="relative aspect-video rounded-2xl overflow-hidden">
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
