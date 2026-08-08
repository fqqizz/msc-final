'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Home, ArrowLeft, Phone, Calendar } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#2BA84A]/10 to-emerald-500/5 blur-[200px] rounded-full" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-sky-500/10 blur-[150px] rounded-full" />
      </div>

      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="relative w-20 h-20 mx-auto">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
              alt="MSC Logo"
              fill
              className="object-contain opacity-40"
            />
          </div>
        </motion.div>

        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <h1 className="font-[family-name:var(--font-anton)] text-[120px] sm:text-[180px] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white/80 to-white/20 tracking-tight">
            404
          </h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-4"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Looks like this page went out of bounds!
          </h2>
          <p className="text-white/60 text-lg max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on the field.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2BA84A] text-white font-semibold rounded-xl btn-glow hover:bg-[#146B3A] transition-all text-lg"
          >
            <Home size={20} />
            Back to Home
          </Link>
          <Link
            href="/book-now"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all text-lg"
          >
            <Calendar size={20} />
            Book a Slot
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 pt-8 border-t border-white/10"
        >
          <p className="text-white/40 text-sm mb-4">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/facilities" className="text-white/60 hover:text-[#2BA84A] transition-colors">
              Facilities
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/about" className="text-white/60 hover:text-[#2BA84A] transition-colors">
              About Us
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/contact" className="text-white/60 hover:text-[#2BA84A] transition-colors">
              Contact
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/faqs" className="text-white/60 hover:text-[#2BA84A] transition-colors">
              FAQs
            </Link>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8"
        >
          <a 
            href="tel:+919682558775" 
            className="inline-flex items-center gap-2 text-white/40 hover:text-[#2BA84A] transition-colors text-sm"
          >
            <Phone size={14} />
            Need help? Call +91 9682558775
          </a>
        </motion.div>
      </div>
    </main>
  )
}
