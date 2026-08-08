'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LayoutDashboard, Calendar, Clock, CreditCard, Download, Trophy, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns'

export default function CustomerDashboardPage() {
  const { user, profile, customer, role, isLoading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'receipts'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  const supabase = createClient()

  // Live timer tick every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch bookings for logged-in user
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*, venues(name, slug)')
          .eq('customer_id', user.id)
          .order('start_time', { ascending: false })

        if (bookingData) {
          setBookings(bookingData)
        }

        // Fetch rank
        const { data: lbData } = await supabase
          .rpc('get_customer_leaderboard', { p_timeframe: 'all_time', p_limit: 100 })

        if (lbData && Array.isArray(lbData)) {
          const uIdx = lbData.findIndex((i: any) => i.customer_id === user.id)
          if (uIdx !== -1) {
            setRank(uIdx + 1)
          }
        }
      } catch (err) {
        console.error('Error loading customer dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    } else {
      setIsLoading(false)
    }
  }, [user])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4">
        <Navigation />
        <div className="text-center max-w-md my-auto">
          <User className="mx-auto text-slate-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold font-display">Authentication Required</h2>
          <p className="text-slate-400 mt-2 text-sm">Please sign in to access your MSC Customer Dashboard.</p>
          <Link
            href="/login?redirect=/dashboard"
            className="inline-block mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl text-sm transition-all"
          >
            Sign In Now
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  // Active / Live Booking Countdown Calculation
  const activeOrUpcoming = bookings.find((b) => {
    const start = new Date(b.start_time)
    const end = new Date(b.end_time)
    return (isAfter(end, now) && b.booking_status === 'confirmed')
  })

  const getLiveCountdownText = (b: any) => {
    if (!b) return null
    const start = new Date(b.start_time)
    const end = new Date(b.end_time)

    if (isBefore(now, start)) {
      return `Starts in ${formatDistanceToNow(start)}`
    } else if (isAfter(now, start) && isBefore(now, end)) {
      return `${formatDistanceToNow(end)} remaining`
    } else {
      return 'Completed'
    }
  }

  const completedCount = bookings.filter((b) => b.booking_status === 'completed').length

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pt-24">
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Customer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Welcome back, <span className="text-white font-semibold">{profile?.full_name || 'MSC Player'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/book-now"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/30 transition-all flex items-center gap-1.5"
            >
              <Calendar size={14} /> Book New Slot
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <User size={14} /> View Player Profile
            </Link>
          </div>
        </div>

        {/* Live Active Session Hero Card */}
        {activeOrUpcoming && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Session Countdown
                </span>
                <h3 className="text-xl font-bold font-display text-white">
                  {activeOrUpcoming.venues?.name || 'Football Turf'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Booking #{activeOrUpcoming.booking_number} • {format(new Date(activeOrUpcoming.start_time), 'EEEE, MMM d @ h:mm a')}
                </p>
              </div>

              <div className="bg-slate-950/80 px-6 py-3 border border-emerald-500/30 rounded-2xl text-center shrink-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Status</span>
                <span className="text-lg font-extrabold font-display text-emerald-400">
                  {getLiveCountdownText(activeOrUpcoming)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dashboard Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'bookings'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'receipts'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Receipts
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Hours Played</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-display text-emerald-400 mt-1">
                  {customer?.hours_played || completedCount} hrs
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total Bookings</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-display text-sky-400 mt-1">
                  {customer?.total_bookings || bookings.length}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Leaderboard Rank</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-display text-yellow-400 mt-1">
                  {rank ? `#${rank}` : 'Unranked'}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Total Spend</span>
                <p className="text-2xl sm:text-3xl font-extrabold font-display text-purple-400 mt-1">
                  ₹{customer?.total_spend || 0}
                </p>
              </div>
            </div>

            {/* Recent Bookings List Preview */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-display text-white">Recent Booking History</h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  View All ({bookings.length}) →
                </button>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-3 text-xs">
                      <div>
                        <span className="font-bold text-white text-sm">
                          {b.venues?.name || 'Football Turf'}
                        </span>
                        <span className="text-slate-400 ml-2">#{b.booking_number}</span>
                        <p className="text-slate-400 text-xs mt-1">
                          {format(new Date(b.start_time), 'EEEE, MMM d, yyyy @ h:mm a')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                          b.booking_status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                          b.booking_status === 'confirmed' ? 'bg-sky-500/20 text-sky-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {b.booking_status}
                        </span>
                        <span className="font-semibold text-white text-sm">₹{b.total_amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                  <Calendar className="mx-auto text-slate-600 mb-2" size={32} />
                  <p className="text-xs text-slate-400">No bookings created yet.</p>
                  <Link
                    href="/book-now"
                    className="inline-block mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all"
                  >
                    Book Your First Slot
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold font-display text-white mb-4">All Customer Bookings</h3>

            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <span className="text-sm font-extrabold text-white">
                          {b.venues?.name || 'Football Turf'}
                        </span>
                        <p className="text-xs text-slate-400 mt-0.5">Booking ID: {b.booking_number}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                          b.booking_status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          b.booking_status === 'confirmed' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {b.booking_status}
                        </span>
                        <span className="text-sm font-bold text-emerald-400">₹{b.total_amount}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Date & Time</span>
                        <p className="font-semibold text-white mt-0.5">
                          {format(new Date(b.start_time), 'EEE, MMM d, yyyy')}
                        </p>
                        <p className="text-slate-400">
                          {format(new Date(b.start_time), 'h:mm a')} - {format(new Date(b.end_time), 'h:mm a')}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Payment</span>
                        <p className="font-semibold text-white mt-0.5 capitalize">{b.payment_status}</p>
                        <p className="text-slate-400">Paid: ₹{b.amount_paid}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Duration</span>
                        <p className="font-semibold text-white mt-0.5">{b.duration_hours} Hour(s)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <Calendar className="mx-auto text-slate-600 mb-2" size={36} />
                <p className="text-xs text-slate-400">No bookings found on record.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECEIPTS */}
        {activeTab === 'receipts' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold font-display text-white mb-4">Official MSC Booking Receipts</h3>

            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-3 text-xs">
                    <div>
                      <p className="font-bold text-white text-sm">
                        Receipt for Booking #{b.booking_number}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {b.venues?.name || 'Football Turf'} • {format(new Date(b.start_time), 'MMM d, yyyy')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">₹{b.total_amount}</span>
                      <Link
                        href={`/api/receipts/download?booking_id=${b.id}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                      >
                        <Download size={14} /> Download Receipt
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <CreditCard className="mx-auto text-slate-600 mb-2" size={36} />
                <p className="text-xs text-slate-400">No receipts available.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
