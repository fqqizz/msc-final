'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react'

const quickLinks = [
  { name: 'Home', href: '/' },
  { name: 'Book Now', href: '/book-now' },
  { name: 'Our Facilities', href: '/facilities' },
  { name: 'Our Features', href: '/features' },
  { name: 'About Us', href: '/about' },
  { name: 'Gallery', href: '/gallery' },
]

const supportLinks = [
  { name: 'Contact Us', href: '/contact' },
  { name: 'FAQs', href: '/faqs' },
  { name: 'Testimonials', href: '/testimonials' },
]

const legalLinks = [
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Terms & Conditions', href: '/terms-conditions', policy: 'terms' },
  { name: 'Cancellation Policy', href: '/cancellation-policy', policy: 'cancellation' },
  { name: 'Refund Policy', href: '/refund-policy', policy: 'refund' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative">
      {/* Final CTA Section - Refined Premium MSC Athletic Direction */}
      <div className="relative py-20 sm:py-28 md:py-32 overflow-hidden bg-[#06120b] border-t border-emerald-500/10">
        {/* Soft Ambient Radial Atmosphere */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[350px] sm:h-[450px] bg-emerald-500/10 rounded-full blur-[120px] transform-gpu" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(43,168,74,0.06)_0%,rgba(6,18,11,0.95)_75%)]" />
        </div>
        
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-1 sm:space-y-2"
          >
            <h2 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-wide uppercase leading-[0.95] drop-shadow-sm">
              THE GAME
            </h2>
            <h2 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#2BA84A] tracking-wide uppercase leading-[0.95] drop-shadow-[0_0_35px_rgba(43,168,74,0.25)]">
              STARTS HERE
            </h2>
          </motion.div>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-emerald-100/70 font-medium tracking-wide max-w-md mx-auto"
          >
            Maqbool Sports Complex
          </motion.p>

          {/* Refined CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto px-2"
          >
            {/* Primary CTA: Book Your Slot */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/book-now"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 sm:py-3.5 bg-[#2BA84A] hover:bg-[#23903e] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/60 hover:shadow-emerald-500/25 transition-all duration-200"
              >
                <span>Book Your Slot</span>
                <span className="text-xs">&rarr;</span>
              </Link>
            </motion.div>

            {/* Secondary CTA: Explore Facilities */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/facilities"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 sm:py-3.5 bg-[#0e2419]/80 hover:bg-[#133324] border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-100 hover:text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md backdrop-blur-md transition-all duration-200"
              >
                <span>Explore Facilities</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer content - Light */}
      <div className="bg-[#F8FAFB] border-t border-[#0A0A0C]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Logo and description */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 overflow-hidden">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                    alt="MSC Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="text-[#0A0A0C] font-bold text-lg block">Maqbool Sports Complex</span>
                  <p className="text-[#0A0A0C]/50 text-sm">Premier Sports Hub</p>
                </div>
              </Link>
              <p className="text-[#0A0A0C]/60 text-sm max-w-sm leading-relaxed">
                Nestled amidst the scenic landscapes of Baramulla, our 10,000+ sq. ft. multi-sport turf is more than just a playing field - it&apos;s a space built out of love for the game.
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3 mt-6">
                <a
                  href="https://www.instagram.com/msc_baramulla"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white border border-[#0A0A0C]/10 flex items-center justify-center text-[#0A0A0C]/60 hover:text-[#2BA84A] hover:border-[#2BA84A]/30 transition-all"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61579371065902"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white border border-[#0A0A0C]/10 flex items-center justify-center text-[#0A0A0C]/60 hover:text-[#2BA84A] hover:border-[#2BA84A]/30 transition-all"
                >
                  <Facebook size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[#0A0A0C] font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3">
                {quickLinks.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-[#0A0A0C]/60 text-sm hover:text-[#2BA84A] transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-[#0A0A0C] font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                {supportLinks.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-[#0A0A0C]/60 text-sm hover:text-[#2BA84A] transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-[#0A0A0C] font-semibold mb-4 mt-6">Legal</h4>
              <ul className="space-y-3">
                {legalLinks.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      data-policy={item.policy}
                      className="text-[#0A0A0C]/60 text-sm hover:text-[#2BA84A] transition-colors cursor-pointer"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[#0A0A0C] font-semibold mb-4">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#2BA84A] mt-0.5 flex-shrink-0" />
                  <span className="text-[#0A0A0C]/60 text-sm">
                    Sangri Colony, Baramulla,<br />
                    Jammu and Kashmir, 193101
                  </span>
                </li>
                <li>
                  <a href="tel:+919682558775" className="flex items-center gap-3 text-[#0A0A0C]/60 text-sm hover:text-[#2BA84A] transition-colors">
                    <Phone size={18} className="text-[#2BA84A]" />
                    +91 9682558775
                  </a>
                </li>
                <li>
                  <a href="mailto:info@maqboolsports.in" className="flex items-center gap-3 text-[#0A0A0C]/60 text-sm hover:text-[#2BA84A] transition-colors">
                    <Mail size={18} className="text-[#2BA84A]" />
                    info@maqboolsports.in
                  </a>
                </li>
                <li className="pt-2">
                  <span className="inline-block px-3 py-1.5 bg-[#2BA84A]/10 text-[#2BA84A] text-sm font-medium rounded-lg">
                    Open: 6 AM - 11 PM
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-[#0A0A0C]/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#0A0A0C]/50 text-sm">
              &copy; {currentYear} Maqbool Sports Complex. All rights reserved.
            </p>
            <p className="text-[#0A0A0C]/40 text-sm">
              Built by{' '}
              <a 
                href="https://www.instagram.com/upsurge.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#2BA84A] hover:underline font-medium"
              >
                UpSurge
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
