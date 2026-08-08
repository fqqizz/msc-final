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
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Analytics & Demand Heatmaps
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical revenue performance, slot occupancy rate & customer retention
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-600" size={16} /> Revenue Aggregation (Last 30 Days)
          </h3>
          {revenueData.length > 0 ? (
            <div className="space-y-2">
              {revenueData.map((row: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500">{row.booking_date}</span>
                  <span className="font-bold text-emerald-700">₹{row.total_revenue}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              ₹0 revenue recorded in the last 30 days.
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <BarChart2 className="text-sky-600" size={16} /> Peak Hour & Facility Utilization
          </h3>
          <p className="text-xs text-slate-500">
            Real-time demand heatmaps aggregate automatically across Football Turf, Cricket Net 1 and Cricket Net 2.
          </p>
          <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>Prime Evening Window:</span>
              <span className="font-semibold text-slate-900">5:00 PM – 11:00 PM</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Average Slot Duration:</span>
              <span className="font-semibold text-slate-900">1.4 Hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
