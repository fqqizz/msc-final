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
    description: 'Book slots according to your convenience. Our flexible timing system allows individuals, groups, and institutions to find the perfect time for games and practice sessions.',
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
    title: '24/7 CCTV Surveillance',
    description: 'Your safety is our priority. Our facility is equipped with comprehensive CCTV surveillance for safety and monitoring, ensuring a secure environment for all players.',
    highlight: 'Active Monitoring'
  },
  {
    icon: GraduationCap,
    title: 'Youth Sports Academy',
    description: 'Coming soon - our on-site Sports Academy for youth athletes with certified coaches. We are committed to developing the next generation of Kashmir sports talent.',
    highlight: 'Coming Soon'
  },
  {
    icon: Layers,
    title: 'FIFA-Grade Synthetic Turf',
    description: '10,000+ sq. ft. of premium synthetic turf suitable for football and box cricket. Our professional-grade surface ensures optimal ball response and joint cushioning.',
    highlight: '10,000+ sq. ft.'
  },
  {
    icon: Trophy,
    title: 'Tournament Hosting',
    description: 'Equipped to host school, corporate, and regional tournaments. From friendly weekend matches to competitive leagues, we provide the complete tournament venue.',
    highlight: 'Event Ready'
  },
  {
    icon: Heart,
    title: 'Safe & Inclusive Environment',
    description: 'A welcoming, inclusive, and family-friendly atmosphere where players of all ages and skill levels are encouraged. We maintain strict standards of cleanliness and safety.',
    highlight: 'Family Friendly'
  },
  {
    icon: Clock,
    title: 'Extended Operating Hours',
    description: 'Daily operating hours from 6:00 AM to 11:00 PM give you the flexibility to play at your preferred time, whether early morning practice or night matches under floodlights.',
    highlight: '6 AM - 11 PM'
  },
  {
    icon: CheckCircle,
    title: 'Community-Driven Access',
    description: 'Built for players, coaches, and the community. We are dedicated to promoting healthy athletic culture with transparent, affordable facility access.',
    highlight: 'Grassroots Sports'
  },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#061009] text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-[#040d07] overflow-hidden border-b border-emerald-500/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-6 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Our Features
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            PREMIUM FEATURES FOR <span className="text-[#2BA84A]">PREMIUM PLAYERS</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Flexible timings, professional floodlights, certified turf surfaces, and seamless booking for cricket and football in Baramulla.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-[#0e2419]/90 border border-emerald-500/20 hover:border-emerald-400/50 p-7 sm:p-8 rounded-3xl backdrop-blur-xl shadow-xl shadow-black/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
                      <feature.icon size={24} />
                    </div>
                    <span className="px-3 py-1 bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
                      {feature.highlight}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5 tracking-tight group-hover:text-emerald-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14 sm:mt-16">
            <Link
              href="/book-now"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#2BA84A] hover:bg-[#23903e] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/60 transition-all duration-200"
            >
              <span>Book Your Slot Now</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
