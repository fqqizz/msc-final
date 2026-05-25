'use client'

import { motion } from 'framer-motion'
import { Globe, Calendar, CreditCard } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Visit Our Website',
    description: "Secure your spot today – visit our website to book your slot in just a few clicks!"
  },
  {
    number: '02',
    icon: Calendar,
    title: 'Book Your Slot',
    description: 'Book date and slot according to your need. Choose your preferred sport, time, and duration.'
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'Complete Booking',
    description: 'Confirm your booking and make payment. Get instant confirmation on WhatsApp.'
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A0A0C] tracking-tight">
            Simplifying the Booking Process
          </h2>
          <p className="mt-4 text-[#0A0A0C]/60 max-w-xl mx-auto text-lg">
            Three simple steps to get you on the field.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-[#2BA84A]/30 to-[#2BA84A]/5" />
              )}
              
              <div className="text-center">
                {/* Number badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2BA84A] text-white mb-6 relative">
                  <step.icon size={28} />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#0A0A0C] text-white text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-[#0A0A0C] mb-3">{step.title}</h3>
                <p className="text-[#0A0A0C]/60 max-w-xs mx-auto">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
