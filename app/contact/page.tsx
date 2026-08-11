'use client'

import { useState } from 'react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook, CheckCircle2, Navigation as NavIcon } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

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
            Direct Support
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            GET IN <span className="text-[#2BA84A]">TOUCH</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Have inquiries about bookings, tournament hosting, or sports academy programs? Connect directly with the MSC team.
          </p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-white uppercase tracking-wide">
                FACILITY <span className="text-[#2BA84A]">INFORMATION</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-[#0e2419]/90 border border-emerald-500/20 rounded-2xl backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Physical Address</h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      Sangri Colony, Baramulla<br />
                      Jammu and Kashmir, 193101
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-[#0e2419]/90 border border-emerald-500/20 rounded-2xl backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400">
                    <Phone size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Direct Phone & WhatsApp</h3>
                    <a href="tel:+919682558775" className="text-emerald-400 hover:underline text-xs sm:text-sm font-semibold">
                      +91 9682558775
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-[#0e2419]/90 border border-emerald-500/20 rounded-2xl backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Official Email</h3>
                    <a href="mailto:info@maqboolsports.in" className="text-emerald-400 hover:underline text-xs sm:text-sm font-semibold">
                      info@maqboolsports.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-[#0e2419]/90 border border-emerald-500/20 rounded-2xl backdrop-blur-xl">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 text-emerald-400">
                    <Clock size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">Operating Hours</h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      Daily: 6:00 AM – 11:00 PM (Floodlit matches)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-[#0e2419]/90 border border-emerald-500/20 p-7 sm:p-10 rounded-3xl backdrop-blur-xl shadow-2xl shadow-black/40">
              <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-white uppercase tracking-wide mb-6">
                SEND A <span className="text-[#2BA84A]">MESSAGE</span>
              </h2>

              {submitted ? (
                <div className="p-8 bg-[#040d07] border border-emerald-500/30 rounded-2xl text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-400/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Message Received!</h3>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-sm mx-auto">
                    Thank you for contacting MSC. Our management team will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#07170f] border border-emerald-500/25 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-[#07170f] border border-emerald-500/25 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                        placeholder="+91 9682558775"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#07170f] border border-emerald-500/25 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                      placeholder="player@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-[#07170f] border border-emerald-500/25 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors resize-none"
                      placeholder="How can we assist your sporting session?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 bg-[#2BA84A] hover:bg-[#23903e] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/60 transition-all duration-200"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps Embed Section - Restored and Fully Responsive */}
      <section className="py-16 sm:py-20 bg-[#040d07] border-t border-emerald-500/10 relative overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm">
              <NavIcon size={13} className="text-emerald-400" />
              Facility Location
            </span>
            <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl text-white uppercase tracking-wide">
              FIND US IN <span className="text-[#2BA84A]">BARAMULLA</span>
            </h2>
            <p className="mt-3 text-slate-300 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Located in Sangri Colony, Baramulla, Jammu and Kashmir. Get live navigation directly to Maqbool Sports Complex.
            </p>
          </div>

          {/* Map Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-[#0e2419]/90 border border-emerald-500/25 rounded-3xl p-2 sm:p-3 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="relative w-full h-[360px] sm:h-[460px] md:h-[520px] rounded-2xl overflow-hidden bg-[#07170f]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3300.1539279819517!2d74.3457421!3d34.1935433!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38e1a9000a200349%3A0x57dbed52c33fc717!2sMaqbool%20Sports%20Complex!5e0!3m2!1sen!2sin!4v1786459326134!5m2!1sen!2sin"
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Maqbool Sports Complex Google Maps"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
