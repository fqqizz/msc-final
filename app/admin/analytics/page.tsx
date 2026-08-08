'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, DollarSign, Calendar, Users, Activity, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true)
        const { data } = await supabase.rpc('get_revenue_report', {
          p_start_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        })
        if (data) setRevenueData(data)
      } catch (err) {
        console.error('Analytics RPC error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          Analytics & Occupancy Heatmaps
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Historical revenue performance, slot occupancy rate & customer retention
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-base font-bold font-display text-white flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-400" size={18} /> Revenue Aggregation
          </h3>
          {revenueData.length > 0 ? (
            <div className="space-y-2">
              {revenueData.map((row: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">{row.booking_date}</span>
                  <span className="font-bold text-emerald-400">₹{row.total_revenue}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No revenue records logged in the last 30 days.
            </div>
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-base font-bold font-display text-white flex items-center gap-2 mb-4">
            <BarChart2 className="text-sky-400" size={18} /> Peak Hours Heatmap
          </h3>
          <div className="py-12 text-center text-slate-400 text-xs">
            Materialized occupancy view refreshed daily at 00:00 UTC.
          </div>
        </div>
      </div>
    </div>
  )
}
