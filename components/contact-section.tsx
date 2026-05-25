'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook, MessageCircle } from 'lucide-react'

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
    setFormData({ name: '', email: '', phone: '', message: '' })
  }

  return (
    <section className="relative py-32 bg-[#050505]" id="contact">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-[#0A0A0C] to-transparent" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#2BA84A]/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-[#2BA84A]/10 border border-[#2BA84A]/20 rounded-full text-[#2BA84A] text-sm font-medium mb-6">
            Get In Touch
          </span>
          <h2 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            CONTACT US
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Have questions? Want to book for a tournament? We&apos;re here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Location image */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-8">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/contact-fsgvfbe8149b7d7aaf60a37248cac104cff70-nopehSpkqvMqC7oJJY6RAFFztOHa5x.png"
                alt="MSC Location"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-[#050505]/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 text-[#2BA84A] mb-2">
                  <MapPin size={18} />
                  <span className="font-medium">Location</span>
                </div>
                <p className="text-white text-lg">Baramulla, Kashmir</p>
                <p className="text-white/60 text-sm">Near [Landmark], Baramulla</p>
              </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass p-5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/10 flex items-center justify-center mb-3">
                  <Phone size={20} className="text-[#2BA84A]" />
                </div>
                <p className="text-white/50 text-sm">Phone</p>
                <p className="text-white font-medium">+91 XXXXX XXXXX</p>
              </div>
              <div className="glass p-5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/10 flex items-center justify-center mb-3">
                  <Mail size={20} className="text-[#2BA84A]" />
                </div>
                <p className="text-white/50 text-sm">Email</p>
                <p className="text-white font-medium">info@maqboolsports.com</p>
              </div>
              <div className="glass p-5 rounded-2xl sm:col-span-2">
                <div className="w-10 h-10 rounded-xl bg-[#2BA84A]/10 flex items-center justify-center mb-3">
                  <Clock size={20} className="text-[#2BA84A]" />
                </div>
                <p className="text-white/50 text-sm">Operating Hours</p>
                <p className="text-white font-medium">6:00 AM - 11:00 PM (All Days)</p>
              </div>
            </div>

            {/* Social links */}
            <div className="mt-8 flex items-center gap-4">
              <p className="text-white/50 text-sm">Follow us</p>
              <div className="flex gap-3">
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70 hover:bg-[#2BA84A]/20 hover:text-[#2BA84A] transition-all"
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70 hover:bg-[#2BA84A]/20 hover:text-[#2BA84A] transition-all"
                >
                  <Facebook size={20} />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70 hover:bg-[#25D366]/20 hover:text-[#25D366] transition-all"
                >
                  <MessageCircle size={20} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Send us a message</h3>
              
              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-white/60 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#2BA84A]/50 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-white/60 text-sm mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#2BA84A]/50 transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-white/60 text-sm mb-2">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#2BA84A]/50 transition-colors"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-white/60 text-sm mb-2">Message</label>
                  <textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#2BA84A]/50 transition-colors resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 px-6 py-4 bg-[#2BA84A] text-[#050505] font-semibold rounded-xl btn-glow hover:bg-[#34c759] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Sending...</span>
                ) : isSubmitted ? (
                  <>Message Sent!</>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
