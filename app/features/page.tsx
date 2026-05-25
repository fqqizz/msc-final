import { Metadata } from 'next'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Link from 'next/link'
import { ArrowRight, Calendar, Mountain, Shield, GraduationCap, Layers, Trophy, Heart, Clock, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Features | Maqbool Sports Complex',
  description: 'Discover the premium features that make Maqbool Sports Complex the best sports facility in Baramulla - flexible scheduling, scenic environment, safety, and more.',
}

const features = [
  {
    icon: Calendar,
    title: 'Convenient & Flexible Scheduling',
    description: 'Book slots according to your convenience. Our flexible timing system allows individuals, groups, and institutions to find the perfect time for their games and practice sessions.',
    highlight: 'Open 6 AM - 11 PM'
  },
  {
    icon: Mountain,
    title: 'Scenic Outdoor Experience',
    description: 'Play amidst the breathtaking mountain views of Baramulla. Our facility is located in a serene, inspiring natural environment that enhances your sporting experience.',
    highlight: 'Mountain Views'
  },
  {
    icon: Shield,
    title: 'CCTV Surveillance',
    description: 'Your safety is our priority. Our facility is equipped with comprehensive CCTV surveillance for safety and monitoring, ensuring a secure environment for all players.',
    highlight: '24/7 Monitoring'
  },
  {
    icon: GraduationCap,
    title: 'Sports Academy',
    description: 'Coming soon - our on-site Sports Academy for kids with certified coaches. We are committed to nurturing young talent and developing the next generation of athletes.',
    highlight: 'Coming Soon'
  },
  {
    icon: Layers,
    title: 'Professional Turf',
    description: '10,000+ sq. ft. of premium synthetic turf suitable for football and box cricket. Our professional-grade surface ensures optimal performance and player comfort.',
    highlight: '10,000+ sq. ft.'
  },
  {
    icon: Trophy,
    title: 'Tournament Hosting',
    description: 'Our facility is equipped to host local and regional tournaments. From friendly matches to competitive leagues, we provide the perfect venue for sporting events.',
    highlight: 'Event Ready'
  },
  {
    icon: Heart,
    title: 'Safe Environment',
    description: 'A safe, inclusive, and family-friendly atmosphere where players of all ages and skill levels are welcome. We maintain high standards of cleanliness and safety.',
    highlight: 'Family Friendly'
  },
  {
    icon: Clock,
    title: 'Flexible Timings',
    description: 'Extended operating hours from 6 AM to 11 PM give you the flexibility to play at your preferred time, whether early morning practice or night matches under floodlights.',
    highlight: '6 AM - 11 PM'
  },
  {
    icon: CheckCircle,
    title: 'Community Focused',
    description: 'Built for players, coaches, and the community. We are dedicated to promoting sports culture and providing affordable access to quality sports facilities.',
    highlight: 'For Everyone'
  },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#F8FAFB] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            Our Features
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#0A0A0C] tracking-tight">
            Premium Features for
            <br />
            <span className="text-[#2BA84A]">Premium Players</span>
          </h1>
          <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto">
            Book premium turfs with ease - flexible timings, top facilities, and a seamless booking experience for cricket and football.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-white p-8 rounded-2xl border border-[#0A0A0C]/5 hover:border-[#2BA84A]/20 hover:shadow-xl hover:shadow-[#2BA84A]/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F5EC] flex items-center justify-center group-hover:bg-[#2BA84A] transition-colors">
                    <feature.icon className="text-[#2BA84A] group-hover:text-white transition-colors" size={28} />
                  </div>
                  <span className="px-3 py-1 bg-[#F8FAFB] text-[#0A0A0C]/60 text-xs font-medium rounded-full">
                    {feature.highlight}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0A0A0C] mb-3">{feature.title}</h3>
                <p className="text-[#0A0A0C]/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-[#F8FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
              Featured Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight">
              What We Offer
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl font-bold text-[#2BA84A] mb-2">10,000+</div>
              <p className="text-[#0A0A0C]/60">sq. ft. Synthetic Turf</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl font-bold text-[#2BA84A] mb-2">2</div>
              <p className="text-[#0A0A0C]/60">Professional Cricket Nets</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl font-bold text-[#2BA84A] mb-2">17+</div>
              <p className="text-[#0A0A0C]/60">Hours Daily Operation</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl font-bold text-[#2BA84A] mb-2">24/7</div>
              <p className="text-[#0A0A0C]/60">CCTV Surveillance</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0A0A0C] tracking-tight mb-6">
            Experience the Difference
          </h2>
          <p className="text-[#0A0A0C]/60 text-lg mb-8 max-w-2xl mx-auto">
            Join hundreds of players who have made MSC their home ground.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book-now"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-colors text-lg"
            >
              Book Your Slot
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/facilities"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#0A0A0C]/10 text-[#0A0A0C] font-semibold rounded-xl hover:bg-[#F8FAFB] transition-colors text-lg"
            >
              View Facilities
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
