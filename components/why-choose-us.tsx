'use client'

import { motion } from 'framer-motion'
import { CheckCircle, MapPin, Clock, Shield, Users, Trophy, Sparkles, Heart } from 'lucide-react'
import Link from 'next/link'

const reasons = [
  {
    icon: Trophy,
    title: "First of its Kind",
    description: "One of Baramulla's first dedicated turf facilities"
  },
  {
    icon: Users,
    title: "For Everyone",
    description: "Ideal for both casual play and professional training"
  },
  {
    icon: Sparkles,
    title: "Expert Coaching",
    description: "Expert coaching and youth development programs"
  },
  {
    icon: Shield,
    title: "Safe Environment",
    description: "Safe, inclusive, and family-friendly atmosphere"
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Flexible booking hours for individuals, groups, and institutions"
  },
  {
    icon: MapPin,
    title: "Scenic Location",
    description: "Located in a serene, inspiring natural environment"
  },
  {
    icon: Heart,
    title: "Community Focused",
    description: "Built for players, coaches, and the community"
  },
  {
    icon: CheckCircle,
    title: "Affordable",
    description: "Affordable pricing without compromising on quality"
  },
]

export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-[#F8FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0A0C] tracking-tight">
            Built for Players & Community
          </h2>
          <p className="mt-4 text-[#0A0A0C]/60 max-w-xl mx-auto text-lg">
            Experience world-class sports facilities right here in the heart of Kashmir.
          </p>
        </motion.div>

        {/* Reasons grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-2xl border border-[#0A0A0C]/5 hover:border-[#2BA84A]/20 hover:shadow-lg hover:shadow-[#2BA84A]/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center mb-4 group-hover:bg-[#2BA84A] transition-colors">
                <reason.icon className="text-[#2BA84A] group-hover:text-white transition-colors" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-[#0A0A0C] mb-2">{reason.title}</h3>
              <p className="text-[#0A0A0C]/60 text-sm">{reason.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-colors"
          >
            Learn More About Us
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
