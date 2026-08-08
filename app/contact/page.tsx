'use client'

import { useState } from 'react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook } from 'lucide-react'

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
    // Handle form submission
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#F8FAFB] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            Contact Us
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#0A0A0C] tracking-tight">
            Get in
            <span className="text-[#2BA84A]"> Touch</span>
          </h1>
          <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto">
            Have questions about our facilities or need help with your booking? We&apos;re here to assist you.
          </p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-[#0A0A0C] mb-8">Contact Information</h2>
              
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 p-4 bg-[#F8FAFB] rounded-xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-[#2BA84A]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0A0A0C] mb-1">Address</h3>
                    <p className="text-[#0A0A0C]/60">
                      Sangri Colony, Baramulla<br />
                      Jammu and Kashmir, 193101
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-4 p-4 bg-[#F8FAFB] rounded-xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center flex-shrink-0">
                    <Phone className="text-[#2BA84A]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0A0A0C] mb-1">Phone Number</h3>
                    <a href="tel:+919682558775" className="text-[#2BA84A] hover:underline">
                      +91 9682558775
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-4 p-4 bg-[#F8FAFB] rounded-xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center flex-shrink-0">
                    <Mail className="text-[#2BA84A]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0A0A0C] mb-1">Email Address</h3>
                    <a href="mailto:info@maqboolsportscomplex.com" className="text-[#2BA84A] hover:underline">
                      info@maqboolsportscomplex.com
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-4 p-4 bg-[#F8FAFB] rounded-xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#E8F5EC] flex items-center justify-center flex-shrink-0">
                    <Clock className="text-[#2BA84A]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0A0A0C] mb-1">Operating Hours</h3>
                    <p className="text-[#0A0A0C]/60">
                      Open Daily: 6:00 AM - 11:00 PM
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <h3 className="font-semibold text-[#0A0A0C] mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  <a
                    href="https://www.instagram.com/msc_baramulla"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-[#F8FAFB] flex items-center justify-center text-[#0A0A0C]/60 hover:bg-[#E8F5EC] hover:text-[#2BA84A] transition-all"
                  >
                    <Instagram size={22} />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61579371065902"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-[#F8FAFB] flex items-center justify-center text-[#0A0A0C]/60 hover:bg-[#E8F5EC] hover:text-[#2BA84A] transition-all"
                  >
                    <Facebook size={22} />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-[#0A0A0C] mb-8">Send us a Message</h2>
              
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#E8F5EC] p-8 rounded-2xl text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#2BA84A] flex items-center justify-center mx-auto mb-4">
                    <Send className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[#0A0A0C] mb-2">Message Sent!</h3>
                  <p className="text-[#0A0A0C]/60">
                    Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#0A0A0C] mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0A0A0C] mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none transition-all"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0C] mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0C] mb-2">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none transition-all"
                      placeholder="What is this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0A0A0C] mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#0A0A0C]/10 focus:border-[#2BA84A] focus:ring-1 focus:ring-[#2BA84A] outline-none transition-all resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-8 py-4 bg-[#2BA84A] text-white font-semibold rounded-xl hover:bg-[#146B3A] transition-colors flex items-center justify-center gap-2"
                  >
                    Send Message
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps */}
      <section className="py-24 bg-[#F8FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0A0A0C] tracking-tight">
              Find Us on the Map
            </h2>
            <p className="mt-4 text-[#0A0A0C]/60">
              Visit us at Sangri Colony, Baramulla - easily accessible with ample parking.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3299.5!2d74.3436!3d34.2086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38e1856e7a8d1b4b%3A0x1c8b5e8d5c8e8a5a!2sSangri%20Colony%2C%20Baramulla%2C%20Jammu%20and%20Kashmir%20193101!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            />
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://www.google.com/maps/search/Maqbool+Sports+Complex+Sangri+Colony+Baramulla"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0C] text-white font-semibold rounded-xl hover:bg-[#2BA84A] transition-colors"
            >
              <MapPin size={18} />
              Get Directions
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
