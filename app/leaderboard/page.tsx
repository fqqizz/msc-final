'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Clock, Calendar, Users, Loader2, ArrowLeft } from 'lucide-react'
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
          // Fallback query from customers table directly
          const { data: custData } = await supabase
            .from('customers')
            .select('*, user_profiles(full_name, avatar_url)')
            .order('hours_played', { ascending: false })
            .limit(50)

          if (custData) {
            setLeaderboard(
              custData.map((c, idx) => ({
                rank: idx + 1,
                customer_id: c.id,
                full_name: c.user_profiles?.full_name || 'MSC Player',
                avatar_url: c.user_profiles?.avatar_url,
                hours_played: c.hours_played || 0,
                total_bookings: c.total_bookings || 0
              }))
            )
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

  const topThree = leaderboard.slice(0, 3)
  const restList = leaderboard.slice(3)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pt-24">
      <Navigation />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Trophy size={14} className="inline mr-1.5 text-emerald-700" /> MSC Player Prestige
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Complex Leaderboard
          </h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Honoring Baramulla's top athletes ranked by verified facility hours played
          </p>

          {/* Timeframe Controls */}
          <div className="mt-6 inline-flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            {(['all_time', 'monthly', 'weekly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  timeframe === t
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-slate-500">
            <Loader2 size={36} className="animate-spin mx-auto text-emerald-600 mb-3" />
            Calculating leaderboard rankings...
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-12">
            {/* Top 3 Podium Highlights */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-end">
                {/* 2nd Place */}
                {topThree[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white border border-slate-200 rounded-3xl text-center relative overflow-hidden order-2 md:order-1 shadow-md"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center font-bold text-2xl text-slate-700 overflow-hidden relative">
                      {topThree[1].avatar_url ? (
                        <Image src={topThree[1].avatar_url} alt="Avatar" fill className="object-cover" />
                      ) : (
                        topThree[1].full_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                      #2 Silver
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{topThree[1].full_name}</h3>
                    <p className="text-xs text-emerald-700 font-bold mt-1">{topThree[1].hours_played || 0} Hours Played</p>
                  </motion.div>
                )}

                {/* 1st Place Champion Podium */}
                {topThree[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 rounded-3xl text-center relative overflow-hidden order-1 md:order-2 shadow-xl scale-105"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-amber-400 border-2 border-amber-300 mx-auto flex items-center justify-center font-extrabold text-3xl text-slate-950 overflow-hidden relative shadow-md">
                      {topThree[0].avatar_url ? (
                        <Image src={topThree[0].avatar_url} alt="Avatar" fill className="object-cover" />
                      ) : (
                        topThree[0].full_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="inline-block mt-3 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-full tracking-wider uppercase">
                      👑 Champion #1
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{topThree[0].full_name}</h3>
                    <p className="text-sm text-amber-800 font-extrabold mt-1">{topThree[0].hours_played || 0} Hours Played</p>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white border border-slate-200 rounded-3xl text-center relative overflow-hidden order-3 shadow-md"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 mx-auto flex items-center justify-center font-bold text-2xl text-orange-800 overflow-hidden relative">
                      {topThree[2].avatar_url ? (
                        <Image src={topThree[2].avatar_url} alt="Avatar" fill className="object-cover" />
                      ) : (
                        topThree[2].full_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="inline-block mt-3 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                      #3 Bronze
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{topThree[2].full_name}</h3>
                    <p className="text-xs text-emerald-700 font-bold mt-1">{topThree[2].hours_played || 0} Hours Played</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Complete Ranking List */}
            {restList.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl mx-auto shadow-xl">
                <div className="space-y-2">
                  {restList.map((player, idx) => (
                    <div
                      key={player.customer_id || idx}
                      className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 font-bold text-slate-400 text-sm">#{idx + 4}</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white overflow-hidden relative">
                          {player.avatar_url ? (
                            <Image src={player.avatar_url} alt="Avatar" fill className="object-cover" />
                          ) : (
                            player.full_name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold text-slate-900 text-sm">{player.full_name}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-emerald-700 text-sm block">
                          {player.hours_played || 0} hrs
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {player.total_bookings || 0} sessions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CENTERED EMPTY STATE FORMATTED IN EXACT 3 BALANCED LINES PER DIRECTIVE 29 */
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-3xl max-w-md mx-auto shadow-xl px-6">
            <Trophy size={44} className="mx-auto text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">Complex Leaderboard</h3>
            
            <p className="text-xs text-slate-600 mt-3 leading-relaxed max-w-xs mx-auto">
              No players have completed a facility session yet.<br />
              Book a slot and play to claim the #1 rank!
            </p>

            <Link
              href="/book-now"
              className="inline-block mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
            >
              BOOK NOW
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
