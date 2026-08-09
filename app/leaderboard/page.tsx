'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Loader2, Calendar } from 'lucide-react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [timeframe, setTimeframe] = useState<'all_time' | 'monthly' | 'weekly'>('all_time')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.rpc('get_customer_leaderboard', {
          p_timeframe: timeframe,
          p_limit: 50
        })

        if (data && Array.isArray(data)) {
          setLeaderboard(data)
        } else {
          // Fallback query from customers table strictly filtering role = 'customer'
          const { data: custData } = await supabase
            .from('user_profiles')
            .select('full_name, avatar_url, customers(*)')
            .eq('role', 'customer')
            .order('created_at', { ascending: false })
            .limit(50)

          if (custData) {
            const valid = custData
              .filter((u: any) => u.customers && (Array.isArray(u.customers) ? u.customers.length > 0 : true))
              .map((c: any, idx: number) => {
                const cust = Array.isArray(c.customers) ? c.customers[0] : c.customers
                return {
                  rank: idx + 1,
                  customer_id: c.id,
                  full_name: c.full_name || 'MSC Player',
                  avatar_url: c.avatar_url,
                  hours_played: cust?.hours_played || 0,
                  total_bookings: cust?.total_bookings || 0
                }
              })
            setLeaderboard(valid)
          }
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [timeframe])

  const topFive = leaderboard.slice(0, 5)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pt-24">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100/80 border border-emerald-200/80 rounded-full text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Trophy size={13} className="text-emerald-700" /> TOP ATHLETES
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Complex Leaderboard
          </h1>
          <p className="mt-2 text-slate-500 text-xs sm:text-sm">
            Ranked by verified facility hours played at Maqbool Sports Complex
          </p>

          {/* Timeframe Controls */}
          <div className="mt-5 inline-flex items-center gap-1 p-1 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
            {(['all_time', 'monthly', 'weekly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  timeframe === t
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Loader2 size={30} className="animate-spin mx-auto text-emerald-600 mb-2" />
            Calculating leaderboard rankings...
          </div>
        ) : topFive.length > 0 ? (
          /* MINIMAL TOP 5 LEADERBOARD LIST */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-7 max-w-xl mx-auto shadow-sm"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 px-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">RANK & ATHLETE</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">HOURS PLAYED</span>
            </div>

            <div className="space-y-2">
              {topFive.map((player, idx) => {
                const rankNum = (idx + 1).toString().padStart(2, '0')
                const isTop1 = idx === 0
                const isTop3 = idx < 3

                return (
                  <div
                    key={player.customer_id || idx}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isTop1
                        ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {/* Rank & Player Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={`font-mono text-xs font-extrabold w-6 ${
                        isTop1 ? 'text-emerald-700' : isTop3 ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {rankNum}
                      </span>

                      <div className="relative w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                        {player.avatar_url ? (
                          <Image src={player.avatar_url} alt={player.full_name} fill className="object-cover" />
                        ) : (
                          (player.full_name || 'P').charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                          {player.full_name}
                        </span>
                        {player.total_bookings > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            {player.total_bookings} session{player.total_bookings > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hours Played */}
                    <div className="text-right shrink-0 pl-3">
                      <span className="font-extrabold text-emerald-600 text-sm sm:text-base">
                        {player.hours_played || 0}h
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Subtle Book Slot CTA */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <Link
                href="/book-now"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-all"
              >
                Play & Climb Leaderboard &rarr;
              </Link>
            </div>
          </motion.div>
        ) : (
          /* EMPTY STATE */
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-3xl max-w-md mx-auto shadow-sm px-6">
            <Trophy size={36} className="mx-auto text-amber-500 mb-2" />
            <h3 className="text-base font-bold text-slate-900">Complex Leaderboard</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
              No players have completed a facility session yet.<br />
              Book a slot to claim the #1 rank!
            </p>
            <Link
              href="/book-now"
              className="inline-block mt-5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all uppercase tracking-wider"
            >
              BOOK A SLOT
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
