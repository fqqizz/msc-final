import { Metadata } from 'next'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Sun, Shield, Users, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Facilities | Maqbool Sports Complex',
  description: 'Explore our premium sports facilities including 10,000+ sq. ft. synthetic turf, professional cricket nets, and floodlit playing areas in Baramulla, Kashmir.',
}

const facilities = [
  {
    id: 'football-turf',
    name: 'Football/Cricket Turf',
    description: '10,000+ sq. ft. premium synthetic turf perfect for football matches and box cricket. Features high-quality artificial grass that provides excellent ball roll and player comfort.',
    price: '₹899/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-9yWOKvvBNNBK6xIquOyQsdI5jRibpr.webp',
    features: [
      '10,000+ sq. ft. playing area',
      'Professional-grade synthetic turf',
      'Floodlights for night games',
      'Customizable formats (5-a-side, 7-a-side)',
      'Suitable for football and box cricket',
      'Scenic mountain backdrop'
    ],
  },
  {
    id: 'cricket-net-1',
    name: 'Cricket Net 1',
    description: 'Professional practice net designed for batting and bowling practice. Features high-quality netting and adequate space for effective training sessions.',
    price: '₹299/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
    features: [
      'Professional-grade netting',
      'Quality bowling area',
      'Individual practice sessions',
      'Well-maintained pitch',
      'Adequate lighting',
      'Safe enclosed space'
    ],
  },
  {
    id: 'cricket-net-2',
    name: 'Cricket Net 2',
    description: 'Second professional practice net ideal for team sessions and group training. Perfect for simultaneous batting and bowling practice.',
    price: '₹299/hour',
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
    features: [
      'Team practice sessions',
      'Group training capability',
      'Quality setup',
      'Simultaneous use option',
      'Professional environment',
      'Dedicated practice space'
    ],
  },
]

const highlights = [
  {
    icon: Sun,
    title: 'Floodlights',
    description: 'Play under professional floodlights for evening and night matches'
  },
  {
    icon: Shield,
    title: 'CCTV Surveillance',
    description: '24/7 CCTV monitoring for safety and security of all players'
  },
  {
    icon: Users,
    title: 'Sports Academy',
    description: 'Upcoming on-site Sports Academy for kids with certified coaches'
  },
  {
    icon: Zap,
    title: 'Tournament Ready',
    description: 'Facilities suitable for hosting local and regional tournaments'
  },
]

export default function FacilitiesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#050505] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/categoryww-11-5SQXOQi5VinDcWf4sCttNRzzVlb0gC.png"
            alt="MSC Facilities"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/80 to-[#050505]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-[#2BA84A]/20 border border-[#2BA84A]/30 text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            Our Facilities
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight">
            WORLD-CLASS
            <br />
            <span className="text-[#2BA84A]">SPORTS FACILITIES</span>
          </h1>
          <p className="mt-6 text-white/70 text-lg max-w-2xl mx-auto">
            Premium turfs and grounds designed for cricket and football, offering top-class facilities and dynamic environments for an unmatched playing experience.
          </p>
        </div>
      </section>

      {/* Facilities List */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-24">
            {facilities.map((facility, index) => (
              <div
                key={facility.id}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Image */}
                <div className={`relative ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                    <Image
                      src={facility.image}
                      alt={facility.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Price badge */}
                  <div className="absolute -bottom-4 -right-4 px-6 py-3 bg-[#2BA84A] text-white font-bold text-lg rounded-xl shadow-lg">
                    {facility.price}
                  </div>
                </div>

                {/* Content */}
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] mb-4">
                    {facility.name}
                  </h2>
                  <p className="text-[#0A0A0C]/60 text-lg mb-6">
                    {facility.description}
                  </p>
                  
                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {facility.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#E8F5EC] flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-[#2BA84A]" />
                        </div>
                        <span className="text-[#0A0A0C]/70">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/book-now"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0C] text-white font-semibold rounded-xl hover:bg-[#2BA84A] transition-colors"
                  >
                    Book Now
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 bg-[#F8FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight">
              Additional Highlights
            </h2>
            <p className="mt-4 text-[#0A0A0C]/60 max-w-xl mx-auto">
              Beyond our turfs, we offer premium amenities for the complete sports experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="bg-white p-6 rounded-2xl border border-[#0A0A0C]/5"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center mb-4">
                  <highlight.icon className="text-[#2BA84A]" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-[#0A0A0C] mb-2">{highlight.title}</h3>
                <p className="text-[#0A0A0C]/60 text-sm">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight mb-6">
            Ready to Play?
          </h2>
          <p className="text-[#0A0A0C]/60 text-lg mb-8 max-w-2xl mx-auto">
            Book your slot today and experience the best sports facilities in Baramulla.
          </p>
          <Link
            href="/book-now"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-colors text-lg"
          >
            Book Your Slot
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
