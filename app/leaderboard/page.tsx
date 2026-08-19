'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import { Trophy, Medal, Crown, Flame, Clock, Loader2, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type LeaderboardRow = {
  rank: number
  customer_id: string
  full_name: string
  hours_played: number
  total_bookings: number
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'all_time' | 'monthly' | 'weekly'>('all_time')
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.rpc('get_customer_leaderboard', {
          p_timeframe: timeframe,
          p_limit: 50,
        })

        if (!error && data && Array.isArray(data)) {
          const mapped: LeaderboardRow[] = data.map((item: any, index: number) => ({
            rank: index + 1,
            customer_id: item.customer_id,
            full_name: item.full_name || 'MSC Player',
            hours_played: Number(item.total_hours_played || item.hours_played || 0),
            total_bookings: Number(item.total_bookings_completed || item.total_bookings || 0),
          }))
          setLeaderboard(mapped)
        } else {
          // Fallback query if RPC isn't available
          const { data: bData } = await supabase
            .from('bookings')
            .select('customer_id, duration_hours, user_profiles(full_name)')
            .eq('booking_status', 'completed')

          if (bData && bData.length > 0) {
            const customerMap: Record<string, { name: string; hours: number; count: number }> = {}
            bData.forEach((b: any) => {
              const cId = b.customer_id
              const name = b.user_profiles?.full_name || 'MSC Player'
              const hrs = Number(b.duration_hours || 1)

              if (!customerMap[cId]) {
                customerMap[cId] = { name, hours: 0, count: 0 }
              }
              customerMap[cId].hours += hrs
              customerMap[cId].count += 1
            })

            const sorted = Object.entries(customerMap)
              .map(([cId, val], idx) => ({
                rank: idx + 1,
                customer_id: cId,
                full_name: val.name,
                hours_played: val.hours,
                total_bookings: val.count,
              }))
              .sort((a, b) => b.hours_played - a.hours_played)

            setLeaderboard(sorted.map((s, i) => ({ ...s, rank: i + 1 })))
          }
        }
      } catch (err) {
        console.error('Error fetching leaderboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [timeframe])

  const topFive = leaderboard.slice(0, 5)

  return (
    <div className="min-h-screen bg-[#06140D] text-white flex flex-col pt-24">
      <Navigation />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#005C43]/70 border border-emerald-500/25 text-emerald-300 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm backdrop-blur-md">
            <Trophy size={14} className="text-[#2BA84A]" />
            Verified Athlete Rankings
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl text-white uppercase tracking-wide">
            COMPLEX <span className="text-[#2BA84A]">LEADERBOARD</span>
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm font-normal">
            Ranked by verified facility hours played at Maqbool Sports Complex
          </p>

          {/* Timeframe Controls */}
          <div
            className="mt-6 inline-flex items-center gap-1 p-1 rounded-2xl shadow-lg"
            style={{
              background: 'linear-gradient(145deg, #06251D 0%, #101412 100%)',
              border: '1px solid rgba(0, 168, 107, 0.25)',
            }}
          >
            {(['all_time', 'monthly', 'weekly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  timeframe === t
                    ? 'clay-button-green text-white font-bold'
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
          <div
            className="mb-10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all"
            style={{
              background: 'linear-gradient(150deg, rgba(14, 36, 25, 0.85) 0%, rgba(6, 25, 18, 0.92) 55%, rgba(16, 20, 18, 0.96) 100%)',
              border: '1px solid rgba(0, 168, 107, 0.18)',
              boxShadow: '0 18px 45px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            }}
          >
            <h2 className="text-xs font-bold text-[#2BA84A] uppercase tracking-widest mb-6 text-center">
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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shadow-md shrink-0 ${
                      player.rank === 1
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-950'
                        : player.rank === 2
                        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950'
                        : player.rank === 3
                        ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                        : 'bg-[#040d07] border border-emerald-500/25 text-emerald-400'
                    }`}
                  >
                    {player.rank === 1 ? (
                      <Crown size={18} />
                    ) : player.rank === 2 ? (
                      <Medal size={18} />
                    ) : player.rank === 3 ? (
                      <Medal size={18} />
                    ) : (
                      `#${player.rank}`
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{player.full_name}</p>
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
        <div
          className="rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl"
          style={{
            background: 'linear-gradient(150deg, rgba(14, 36, 25, 0.85) 0%, rgba(6, 25, 18, 0.92) 55%, rgba(16, 20, 18, 0.96) 100%)',
            border: '1px solid rgba(0, 168, 107, 0.18)',
            boxShadow: '0 18px 45px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          }}
        >
          <div className="p-5 border-b border-emerald-500/15 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">All Competitors</h3>
            <span className="text-xs text-slate-400 font-medium">
              {leaderboard.length} Verified Athletes
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin text-[#2BA84A]" size={28} />
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
                        item.rank <= 3 ? 'text-[#2BA84A] font-extrabold' : 'text-slate-400'
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
                    <span className="text-sm font-extrabold text-[#2BA84A] font-mono">
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
