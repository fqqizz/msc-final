'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Activity,
  BarChart2,
  PieChart,
  Loader2,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AdminAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    confirmedBookingsCount: 0,
    activeReservationsCount: 0,
    cancelledBookingsCount: 0,
    venueBreakdown: [] as { name: string; revenue: number; bookings: number }[],
  })
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true)

        // 1. Fetch Revenue Report via RPC or Direct Aggregation
        const { data: rData } = await supabase.rpc('get_revenue_report', {
          p_start_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        })
        if (rData) setRevenueData(rData)

        // 2. Fetch Real Bookings Aggregates
        const { data: bookings } = await supabase
          .from('bookings')
          .select('total_amount, amount_paid, booking_status, venue_id, venues(name)')

        // 3. Fetch Active Reservations Count
        const { count: resCount } = await supabase
          .from('slot_reservations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        if (bookings) {
          const confirmed = bookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
          const cancelled = bookings.filter(b => b.booking_status === 'cancelled')
          const totalRev = confirmed.reduce((sum, b) => sum + Number(b.amount_paid || b.total_amount || 0), 0)

          // Group by venue
          const venueMap: Record<string, { name: string; revenue: number; bookings: number }> = {}
          confirmed.forEach(b => {
            const vName = (b.venues as any)?.name || 'MSC Venue'
            if (!venueMap[vName]) venueMap[vName] = { name: vName, revenue: 0, bookings: 0 }
            venueMap[vName].revenue += Number(b.amount_paid || b.total_amount || 0)
            venueMap[vName].bookings += 1
          })

          setMetrics({
            totalRevenue: totalRev,
            confirmedBookingsCount: confirmed.length,
            activeReservationsCount: resCount || 0,
            cancelledBookingsCount: cancelled.length,
            venueBreakdown: Object.values(venueMap),
          })
        }
      } catch (err) {
        console.error('Analytics load error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto text-slate-900">
      {/* Header with Breathing Room */}
      <div className="pb-2 border-b border-slate-200/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Financial & Operational Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
          Authoritative real-time revenue analytics, slot occupancy breakdown, and facility utilization
        </p>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-400 text-xs">
          <Loader2 size={32} className="animate-spin mx-auto text-emerald-600 mb-2" />
          Aggregating real-time database metrics...
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  ₹
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                ₹{metrics.totalRevenue.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block flex items-center gap-0.5">
                <ArrowUpRight size={13} /> Real confirmed booking payments
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed Bookings</span>
                <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                  <Calendar size={15} />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                {metrics.confirmedBookingsCount}
              </p>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                Total completed player sessions
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Reservations</span>
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  <Activity size={15} />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                {metrics.activeReservationsCount}
              </p>
              <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                Active operational blocks
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cancellations</span>
                <span className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                  ✕
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                {metrics.cancelledBookingsCount}
              </p>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                Refunded/cancelled bookings
              </span>
            </div>
          </div>

          {/* Revenue by Day & Facility Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Daily Revenue Feed */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={18} /> Daily Revenue History (Last 30 Days)
              </h3>
              {revenueData.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {revenueData.map((row: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-600 font-semibold">{row.booking_date}</span>
                      <span className="font-extrabold text-emerald-700 text-sm">₹{row.total_revenue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No revenue records found in this date window. New bookings will automatically generate analytics entries.
                </div>
              )}
            </div>

            {/* Facility Revenue Breakdown */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="text-emerald-600" size={18} /> Revenue by Sports Facility
              </h3>
              {metrics.venueBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {metrics.venueBreakdown.map((v, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-900">{v.name}</span>
                        <span className="text-emerald-700">₹{v.revenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Booked Sessions: {v.bookings}</span>
                        <span>{((v.revenue / (metrics.totalRevenue || 1)) * 100).toFixed(0)}% of gross</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Facility distribution will appear once confirmed bookings are made.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
