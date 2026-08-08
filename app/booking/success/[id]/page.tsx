'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Download, ArrowLeft, Calendar, Clock, MapPin, CreditCard, Loader2 } from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function BookingSuccessPage() {
  const params = useParams()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId) return

      try {
        setIsLoading(true)
        const { data } = await supabase
          .from('bookings')
          .select('*, venues(name, address)')
          .eq('id', bookingId)
          .maybeSingle()

        if (data) setBooking(data)
      } catch (err) {
        console.error('Error fetching booking details:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBooking()
  }, [bookingId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pt-24 relative overflow-hidden">
      <Navigation />

      {/* Background Decorative Blurs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full my-auto text-center relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl"
        >
          {/* Hero Icon */}
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-xl">
            <CheckCircle2 size={44} />
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
            YOU'RE BOOKED.
          </h1>
          <p className="text-lg sm:text-xl font-medium text-emerald-400 mt-2 font-display">
            See you at Maqbool Sports Complex.
          </p>

          {booking ? (
            <div className="mt-8 text-left bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Booking Reference</span>
                <span className="font-extrabold text-white text-sm font-mono">#{booking.booking_number}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 uppercase block font-semibold text-[10px]">Facility</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{booking.venues?.name || 'Football Turf'}</span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase block font-semibold text-[10px]">Date</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">
                    {format(new Date(booking.start_time), 'EEEE, MMM d, yyyy')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase block font-semibold text-[10px]">Time Window</span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block">
                    {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 uppercase block font-semibold text-[10px]">Amount Paid</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">₹{booking.amount_paid || booking.total_amount}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Location</span>
                <span className="text-slate-300 font-medium">Sector 4, Baramulla, J&K</span>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-xs text-slate-400">
              Your booking details have been registered and verified by MSC OS.
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/api/receipts/download?booking_id=${bookingId}`}
              target="_blank"
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center justify-center gap-2"
            >
              <Download size={16} /> Download Official PDF Receipt
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all inline-flex items-center justify-center gap-2"
            >
              View in Player Dashboard
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
