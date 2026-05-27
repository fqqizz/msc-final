'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Our Facilities', href: '/facilities' },
  { name: 'Our Features', href: '/features' },
  { name: 'About', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'FAQs', href: '/faqs' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isMobile, performanceMode } = useMobilePerformance()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform-gpu ${
          scrolled ? 'py-2' : 'py-4'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className={`flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-300 border border-emerald-500/20 shadow-lg
              ${performanceMode 
                ? 'bg-[#041a0e] shadow-[#041a0e]/20' // Solid optimized green background on mobile to prevent layout lag from backdrop filters
                : 'bg-emerald-900/70 backdrop-blur-xl shadow-emerald-900/20'
              }
            `}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="relative w-11 h-11 overflow-hidden transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                  alt="Maqbool Sports Complex Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 lg:px-4 py-2 text-sm font-medium transition-all duration-200 relative group rounded-lg ${
                      isActive 
                        ? 'text-white bg-white/10'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.name}
                    <span className={`absolute bottom-1.5 left-3 right-3 h-0.5 bg-emerald-400 rounded-full transition-transform duration-200 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`} />
                  </Link>
                )
              })}
            </div>

            {/* CTA Button */}
            <div className="flex items-center gap-3">
              <Link
                href="/book-now"
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/30 hover:shadow-sky-400/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Book Now
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white/90 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/10"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu - optimized animation timing and styles */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 md:hidden transform-gpu"
            style={{ willChange: 'opacity' }}
          >
            {/* Overlay without backdrop blur on mobile to avoid GPU composite redraws */}
            <div 
              className={`absolute inset-0 bg-black/60`}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`absolute right-0 top-0 bottom-0 w-[280px] shadow-2xl border-l border-emerald-500/20 transform-gpu
                ${performanceMode
                  ? 'bg-[#051c0f]' // Solid optimized green background on mobile drawer
                  : 'bg-emerald-900/95 backdrop-blur-xl'
                }
              `}
              style={{ willChange: 'transform' }}
            >
              <div className="flex flex-col pt-24 px-6 h-full overflow-y-auto">
                {/* Navigation items - rendered statically on mobile to avoid staggered animation stacking */}
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <div key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block py-4 text-lg border-b border-white/10 transition-colors duration-200 ${
                          isActive 
                            ? 'text-emerald-400 font-medium' 
                            : 'text-white/80 hover:text-white'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </div>
                  )
                })}
                <div>
                  <Link
                    href="/book-now"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-6 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-center rounded-xl block transition-all duration-200 shadow-lg shadow-sky-500/30"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
