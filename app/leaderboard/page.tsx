'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Loader2, Calendar, Award, Medal } from 'lucide-react'
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
          // Fallback query from user_profiles & customers
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
    <div className="min-h-screen bg-[#061009] text-white flex flex-col pt-24">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm backdrop-blur-md">
            <Trophy size={14} className="text-emerald-400" />
            Verified Athlete Rankings
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl text-white uppercase tracking-wide">
            COMPLEX <span className="text-[#2BA84A]">LEADERBOARD</span>
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm">
            Ranked by verified facility hours played at Maqbool Sports Complex
          </p>

          {/* Timeframe Controls */}
          <div className="mt-6 inline-flex items-center gap-1 p-1 bg-[#040d07] border border-emerald-500/25 rounded-2xl shadow-lg">
            {(['all_time', 'monthly', 'weekly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  timeframe === t
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Top 5 Hall of Fame */}
        {topFive.length > 0 && !isLoading && (
          <div className="mb-10 bg-[#0e2419]/90 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6 text-center">
              Top MSC Athletes ({timeframe.replace('_', ' ')})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topFive.map((player) => (
                <div
                  key={player.rank}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                    player.rank === 1
                      ? 'bg-emerald-950/60 border-emerald-400/40 shadow-lg shadow-emerald-950/40'
                      : 'bg-[#07170f] border-emerald-500/15'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                      player.rank === 1
                        ? 'bg-emerald-500 text-white shadow-md'
                        : player.rank === 2
                        ? 'bg-slate-700 text-slate-200'
                        : player.rank === 3
                        ? 'bg-amber-900/60 text-amber-300'
                        : 'bg-[#040d07] text-slate-400 border border-emerald-500/20'
                    }`}
                  >
                    #{player.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{player.full_name}</p>
                    <p className="text-xs text-emerald-400/80 font-medium">
                      {player.hours_played || 0} Hours Played
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {player.total_bookings || 0} slots
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Table */}
        <div className="bg-[#0e2419]/90 border border-emerald-500/20 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-black/40">
          <div className="p-5 border-b border-emerald-500/15 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">All Competitors</h3>
            <span className="text-xs text-slate-400 font-medium">
              {leaderboard.length} Verified Athletes
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin text-emerald-500" size={28} />
              <p className="text-xs font-medium tracking-wide">Loading real-time leaderboard statistics...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs sm:text-sm px-4">
              No athlete records found for this timeframe. Complete bookings at MSC to claim your rank!
            </div>
          ) : (
            <div className="divide-y divide-emerald-500/10">
              {leaderboard.map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-emerald-950/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={`w-7 text-center font-bold text-xs ${
                        item.rank <= 3 ? 'text-emerald-400 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      #{item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.full_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.total_bookings || 0} total bookings completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">
                      {item.hours_played || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">hrs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
