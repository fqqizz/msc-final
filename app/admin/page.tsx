'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  TrendingUp,
  Activity,
  PlusCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Layers,
  ArrowRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>({
    todayRevenue: 0,
    todayBookings: 0,
    activeBookings: 0,
    upcomingBookings: 0,
    failedPayments: 0,
    totalCustomers: 0,
    occupancyRate: 0
  })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const supabase = createClient()

  const loadAdminMetrics = async () => {
    try {
      setIsLoading(true)

      // Try fetching RPC metrics
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_dashboard_metrics')

      let currentTodayRevenue = 0
      let currentTodayBookings = 0
      let currentActiveBookings = 0
      let currentUpcomingBookings = 0
      let currentFailedPayments = 0
      let currentTotalCustomers = 0

      // Direct Table Queries as fallback / complement
      const todayStr = new Date().toISOString().split('T')[0]

      const { count: custCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
      currentTotalCustomers = custCount || 0

      const { data: todayBookingList } = await supabase
        .from('bookings')
        .select('*, venues(name)')
        .gte('created_at', `${todayStr}T00:00:00Z`)
        .order('created_at', { ascending: false })

      if (todayBookingList) {
        currentTodayBookings = todayBookingList.length
        currentTodayRevenue = todayBookingList.reduce((acc, b) => acc + (b.total_amount || 0), 0)
      }

      const { count: upcomingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', new Date().toISOString())
        .eq('booking_status', 'confirmed')
      currentUpcomingBookings = upcomingCount || 0

      const { count: failedCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
      currentFailedPayments = failedCount || 0

      setMetrics({
        todayRevenue: rpcData?.today_revenue ?? currentTodayRevenue,
        todayBookings: rpcData?.today_bookings ?? currentTodayBookings,
        activeBookings: rpcData?.active_bookings ?? 0,
        upcomingBookings: rpcData?.upcoming_bookings ?? currentUpcomingBookings,
        failedPayments: rpcData?.failed_payments ?? currentFailedPayments,
        totalCustomers: rpcData?.total_customers ?? currentTotalCustomers,
        occupancyRate: rpcData?.occupancy_rate ?? 0
      })

      // Fetch Recent 5 Bookings
      const { data: recentList } = await supabase
        .from('bookings')
        .select('*, venues(name), user_profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentList) {
        setRecentBookings(recentList)
      }

      // Fetch Audit Logs / Activity
      const { data: auditList } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5)

      if (auditList) {
        setRecentActivity(auditList)
      }
    } catch (err) {
      console.error('Error fetching admin dashboard metrics:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadAdminMetrics()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadAdminMetrics()
  }

  const isEmptyData = metrics.todayBookings === 0 && metrics.totalCustomers === 0 && recentBookings.length === 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              MSC OS Executive Dashboard
            </h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase rounded border border-emerald-500/30">
              Live Backend Connected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time complex management, revenue metrics & facility operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link
            href="/admin/bookings?action=new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <PlusCircle size={16} /> New Walk-In Booking
          </Link>
        </div>
      </div>

      {/* Empty State Banner when 0 operational rows exist */}
      {isEmptyData && !isLoading && (
        <div className="p-6 bg-slate-900/90 border border-emerald-500/30 rounded-3xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider block">
              Facility Ready for Launch
            </span>
            <h3 className="text-lg font-bold font-display text-white mt-1">
              Your MSC dashboard is ready.
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Operational metrics will update in real-time as bookings, customer accounts, and payments are created.
            </p>
          </div>
          <Link
            href="/admin/bookings"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shrink-0"
          >
            Manage Slots & Bookings
          </Link>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Today's Revenue</span>
            <DollarSign className="text-emerald-400" size={18} />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            ₹{metrics.todayRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed payments today</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Today's Bookings</span>
            <Calendar className="text-sky-400" size={18} />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            {metrics.todayBookings}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Total slots reserved today</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Customers</span>
            <Users className="text-amber-400" size={18} />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            {metrics.totalCustomers}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Registered MSC players</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Failed Payments</span>
            <AlertCircle className="text-red-400" size={18} />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            {metrics.failedPayments}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Requires administrative audit</p>
        </div>
      </div>

      {/* Facility Operations Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Venues & Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <Layers className="text-emerald-400" size={18} /> Venue Status Overview
            </h3>
            <Link href="/admin/venues" className="text-xs text-emerald-400 hover:underline">
              Manage →
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">Football Turf</p>
                <p className="text-[11px] text-slate-400">7-a-side FIFA Synthetic</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded uppercase text-[10px]">
                Active
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">Cricket Net 1</p>
                <p className="text-[11px] text-slate-400">Pro Polyurethane Pitch</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded uppercase text-[10px]">
                Active
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">Cricket Net 2</p>
                <p className="text-[11px] text-slate-400">Bowling Machine Lane</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded uppercase text-[10px]">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Recent Admin Activity Log */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <Activity className="text-sky-400" size={18} /> Recent System Activity
            </h3>
            <Link href="/admin/audit" className="text-xs text-sky-400 hover:underline">
              View All Logs →
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white uppercase text-[10px] text-emerald-400 tracking-wider">
                      {log.action_type || 'SYSTEM'}
                    </span>
                    <p className="text-slate-300 font-medium">{log.description || 'Database event executed'}</p>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {log.timestamp ? format(new Date(log.timestamp), 'h:mm a') : 'Now'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Activity className="mx-auto text-slate-600 mb-2" size={32} />
              <p className="text-xs text-slate-400">No system events logged yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
