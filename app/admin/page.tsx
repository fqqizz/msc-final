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
  ArrowRight,
  Bell
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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNotificationPrompt(true)
      }
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      setShowNotificationPrompt(false)
    }
  }

  const loadAdminMetrics = async () => {
    try {
      setIsLoading(true)

      // Try fetching RPC metrics
      const { data: rpcData } = await supabase.rpc('get_admin_dashboard_metrics')

      let currentTodayRevenue = 0
      let currentTodayBookings = 0
      let currentActiveBookings = 0
      let currentUpcomingBookings = 0
      let currentFailedPayments = 0
      let currentTotalCustomers = 0

      const { count: custCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
      currentTotalCustomers = custCount || 0

      const todayStr = new Date().toISOString().split('T')[0]
      const { data: todayBookingsData } = await supabase
        .from('bookings')
        .select('total_amount, amount_paid, booking_status')
        .gte('created_at', `${todayStr}T00:00:00Z`)

      if (todayBookingsData) {
        currentTodayBookings = todayBookingsData.length
        currentTodayRevenue = todayBookingsData
          .filter((b) => b.booking_status === 'confirmed' || b.booking_status === 'completed')
          .reduce((sum, b) => sum + (Number(b.amount_paid) || 0), 0)
      }

      const { count: upcomingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_status', 'confirmed')
        .gt('start_time', new Date().toISOString())
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

      {/* Browser Notification User Gesture Prompt per Directive 10 */}
      {showNotificationPrompt && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Enable MSC OS Alerts</span>
              <span className="text-slate-300 text-[11px]">Get notified when new bookings, payments or important operational events occur.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnableNotifications}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
            >
              Enable Notifications
            </button>
            <button
              onClick={() => setShowNotificationPrompt(false)}
              className="px-3 py-2 text-slate-400 hover:text-white text-xs font-medium"
            >
              Not Now
            </button>
          </div>
        </div>
      )}

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
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            ₹{metrics.todayRevenue}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Captured online & walk-in total</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Today's Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            {metrics.todayBookings}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">New reservations today</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Upcoming Slots</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            {metrics.upcomingBookings}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Confirmed future sessions</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Players</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-2">
            {metrics.totalCustomers}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Registered customer accounts</span>
        </div>
      </div>

      {/* Two Column Layout: Recent Bookings & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold font-display text-white">Recent Operations</h3>
            <Link href="/admin/bookings" className="text-xs text-emerald-400 hover:underline">
              View All Bookings →
            </Link>
          </div>

          {recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{b.venues?.name || 'Football Turf'}</span>
                      <span className="text-slate-400">#{b.booking_number}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Customer: {b.user_profiles?.full_name || 'Guest'} • {format(new Date(b.start_time), 'MMM d @ h:mm a')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      b.booking_status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {b.booking_status}
                    </span>
                    <span className="font-extrabold text-white text-sm">₹{b.total_amount}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              0 bookings recorded today.
            </div>
          )}
        </div>

        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold font-display text-white mb-4">Audit Activity Stream</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3 text-xs">
              {recentActivity.map((log) => (
                <div key={log.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold uppercase text-emerald-400">{log.action_type || 'SYSTEM'}</span>
                    <span>{format(new Date(log.timestamp), 'h:mm a')}</span>
                  </div>
                  <p className="text-slate-300 text-xs">{log.details}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              Audit log stream ready.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
