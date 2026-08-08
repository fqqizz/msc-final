'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Shield, Trophy, Clock, Calendar, CreditCard, Star, ArrowRight, Loader2, Award, Zap, Activity } from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user, profile, customer, role, isLoading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [mostPlayedVenue, setMostPlayedVenue] = useState<string>('Football Turf')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchProfileStats() {
      if (!user) return

      try {
        setIsLoading(true)

        // 1. Fetch user bookings
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*, venues(name)')
          .eq('customer_id', user.id)
          .order('start_time', { ascending: false })

        if (bookingData) {
          setBookings(bookingData)

          // Calculate most played venue
          const venueCounts: Record<string, number> = {}
          bookingData.forEach((b: any) => {
            const name = b.venues?.name || 'Football Turf'
            venueCounts[name] = (venueCounts[name] || 0) + 1
          })
          let topVenue = 'Football Turf'
          let maxCount = 0
          Object.entries(venueCounts).forEach(([vName, count]) => {
            if (count > maxCount) {
              maxCount = count
              topVenue = vName
            }
          })
          setMostPlayedVenue(topVenue)
        }

        // 2. Fetch Leaderboard Rank using RPC or query
        const { data: lbData } = await supabase
          .rpc('get_customer_leaderboard', { p_timeframe: 'all_time', p_limit: 100 })

        if (lbData && Array.isArray(lbData)) {
          const userIdx = lbData.findIndex((item: any) => item.customer_id === user.id)
          if (userIdx !== -1) {
            setRank(userIdx + 1)
          }
        }
      } catch (err) {
        console.error('Error fetching profile stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchProfileStats()
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
          <p className="text-slate-400 mt-2 text-sm">Please sign in to view your MSC Player Profile.</p>
          <Link
            href="/login?redirect=/profile"
            className="inline-block mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl text-sm transition-all"
          >
            Sign In Now
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const upcomingBooking = bookings.find((b) => new Date(b.start_time) > new Date() && b.booking_status === 'confirmed')
  const completedBookings = bookings.filter((b) => b.booking_status === 'completed')

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pt-24">
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Profile Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-600 border-2 border-emerald-400/50 flex items-center justify-center font-display text-4xl text-white font-bold shadow-xl overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
              ) : (
                (profile?.full_name || user.email || 'P').charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  {profile?.full_name || 'MSC Player'}
                </h1>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase rounded-full tracking-wider">
                  {customer?.tier || 'Pro Player'}
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {user.email} • MSC Member since {profile?.created_at ? format(new Date(profile.created_at), 'MMM yyyy') : '2026'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Shield size={14} className="text-emerald-400" />
                  <span>Role: {role || 'Customer'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Trophy size={14} className="text-yellow-400" />
                  <span>Rank: {rank ? `#${rank}` : 'Unranked'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Zap size={14} className="text-sky-400" />
                  <span>Fav Venue: {mostPlayedVenue}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/30 transition-all inline-flex items-center gap-2"
              >
                Dashboard <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 mb-1">
              <Clock size={18} />
              <span className="text-xs font-semibold text-slate-400 uppercase">Hours Played</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display">{customer?.hours_played || completedBookings.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Verified facility turf time</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sky-400 mb-1">
              <Calendar size={18} />
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Bookings</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display">{customer?.total_bookings || bookings.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed & completed sessions</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-400 mb-1">
              <Award size={18} />
              <span className="text-xs font-semibold text-slate-400 uppercase">Completed</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display">{completedBookings.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Finished match hours</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-purple-400 mb-1">
              <CreditCard size={18} />
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Spend</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-display">₹{customer?.total_spend || 0}</p>
            <p className="text-[11px] text-slate-500 mt-1">Invested in sports</p>
          </div>
        </div>

        {/* Two Column Layout: Upcoming & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Upcoming Session */}
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2 mb-4">
              <Calendar className="text-emerald-400" size={18} />
              Upcoming Session
            </h3>

            {upcomingBooking ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded uppercase">
                  Confirmed #{upcomingBooking.booking_number}
                </span>
                <p className="text-base font-bold text-white mt-1">
                  {upcomingBooking.venues?.name || 'Football Turf'}
                </p>
                <p className="text-xs text-slate-300">
                  {format(new Date(upcomingBooking.start_time), 'EEEE, MMM d, yyyy')}
                </p>
                <p className="text-xs text-emerald-400 font-semibold">
                  {format(new Date(upcomingBooking.start_time), 'h:mm a')} - {format(new Date(upcomingBooking.end_time), 'h:mm a')}
                </p>
                <div className="pt-2 flex justify-between items-center border-t border-emerald-500/20 text-xs">
                  <span className="text-slate-400">Total: ₹{upcomingBooking.total_amount}</span>
                  <Link href={`/dashboard?booking=${upcomingBooking.id}`} className="text-emerald-300 hover:underline">
                    View Ticket →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                <Calendar className="mx-auto text-slate-600 mb-2" size={32} />
                <p className="text-xs text-slate-400">No active upcoming session scheduled.</p>
                <Link
                  href="/book-now"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all"
                >
                  Book Next Slot
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2 mb-4">
              <Activity className="text-sky-400" size={18} />
              Recent Player Activity
            </h3>

            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-white">
                        {b.venues?.name || 'Football Turf'} • #{b.booking_number}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        {format(new Date(b.start_time), 'MMM d, yyyy @ h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.booking_status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        b.booking_status === 'confirmed' ? 'bg-sky-500/20 text-sky-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {b.booking_status}
                      </span>
                      <p className="text-slate-300 font-semibold mt-1">₹{b.total_amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                <Activity className="mx-auto text-slate-600 mb-2" size={32} />
                <p className="text-xs text-slate-400">No recent player activity recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
