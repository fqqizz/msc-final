'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Users, TrendingUp, Clock, Search,
  ChevronDown, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, Eye, PhoneCall, Mail, Filter,
  LayoutDashboard, BookOpen, Banknote, Activity,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminBooking {
  id: string
  booking_number: string
  venue_name: string
  venue_slug: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  start_time: string
  end_time: string
  duration_hours: number
  booking_status: string
  payment_status: string
  total_amount: number
  amount_paid: number
  slot_labels: string[]
  created_at: string
}

interface Stats {
  today_bookings: number
  today_revenue: number
  this_month_bookings: number
  this_month_revenue: number
  pending_payments: number
  total_bookings: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtINR(n: number) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed:   { label: 'Confirmed',   color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={12} /> },
  completed:   { label: 'Completed',   color: 'bg-blue-100 text-blue-700',       icon: <CheckCircle2 size={12} /> },
  cancelled:   { label: 'Cancelled',   color: 'bg-red-100 text-red-700',         icon: <XCircle size={12} /> },
  no_show:     { label: 'No Show',     color: 'bg-orange-100 text-orange-700',   icon: <AlertCircle size={12} /> },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700',   icon: <Activity size={12} /> },
}

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  paid:             { label: 'Paid',         color: 'bg-emerald-100 text-emerald-700' },
  partially_paid:   { label: 'Partial',      color: 'bg-amber-100 text-amber-700' },
  unpaid:           { label: 'Unpaid',       color: 'bg-red-100 text-red-700' },
  refunded:         { label: 'Refunded',     color: 'bg-gray-100 text-gray-600' },
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings'>('overview')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFilter) params.set('date', dateFilter)

      const res = await fetch(`/api/admin/bookings?${params}`)
      const json = await res.json()
      setBookings(json.bookings ?? [])
      setStats(json.stats ?? null)
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, dateFilter])

  useEffect(() => { loadData() }, [loadData])

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      b.booking_number.toLowerCase().includes(q) ||
      b.customer_name.toLowerCase().includes(q) ||
      b.customer_phone.includes(q) ||
      (b.customer_email ?? '').toLowerCase().includes(q)
    )
  })

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#F8FAFB]">
      {/* Admin Nav */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                alt="MSC Logo" fill className="object-contain"
              />
            </div>
            <div>
              <p className="text-xs text-black/40 leading-none">Admin Panel</p>
              <p className="font-bold text-[#0A0A0C] text-sm leading-tight">Maqbool Sports Complex</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 rounded-lg hover:bg-[#F1F5F9] text-black/50 hover:text-black transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/"
              className="text-sm text-black/50 hover:text-black transition-colors"
            >
              View Site
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Nav */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 border border-black/5 w-fit">
          {([
            { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
            { key: 'bookings', label: 'Bookings', icon: <BookOpen size={15} /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#2BA84A] text-white shadow-sm'
                  : 'text-black/50 hover:text-black hover:bg-black/5'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Today's Bookings",
                  value: stats ? stats.today_bookings : '—',
                  sub: 'Confirmed today',
                  icon: <Calendar size={20} />,
                  color: 'text-blue-600 bg-blue-50',
                },
                {
                  label: "Today's Revenue",
                  value: stats ? fmtINR(stats.today_revenue) : '—',
                  sub: 'Amount collected',
                  icon: <Banknote size={20} />,
                  color: 'text-emerald-600 bg-emerald-50',
                },
                {
                  label: 'This Month',
                  value: stats ? stats.this_month_bookings : '—',
                  sub: `${stats ? fmtINR(stats.this_month_revenue) : '—'} revenue`,
                  icon: <TrendingUp size={20} />,
                  color: 'text-purple-600 bg-purple-50',
                },
                {
                  label: 'Pending Payments',
                  value: stats ? stats.pending_payments : '—',
                  sub: 'Balance due',
                  icon: <Clock size={20} />,
                  color: 'text-orange-600 bg-orange-50',
                },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-2xl border border-black/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${card.color}`}>
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#0A0A0C]">{loading ? '...' : card.value}</p>
                  <p className="text-xs text-black/50 mt-1 font-medium">{card.label}</p>
                  <p className="text-xs text-black/30 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent bookings */}
            <div className="bg-white rounded-2xl border border-black/5">
              <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
                <h2 className="font-bold text-[#0A0A0C]">Recent Bookings</h2>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-sm text-[#2BA84A] hover:underline"
                >
                  View all
                </button>
              </div>
              <BookingTable bookings={filtered.slice(0, 10)} loading={loading} />
            </div>
          </motion.div>
        )}

        {/* ── Bookings Tab ── */}
        {activeTab === 'bookings' && (
          <motion.div
            key="bookings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-black/5 p-4 mb-6 flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, phone, ref..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-black/10 bg-[#F8FAFB] focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/30 focus:border-[#2BA84A] transition-all"
                />
              </div>

              {/* Status filter */}
              <div className="relative">
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 text-sm rounded-xl border border-black/10 bg-[#F8FAFB] focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/30 appearance-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
              </div>

              {/* Date filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="px-4 py-2.5 text-sm rounded-xl border border-black/10 bg-[#F8FAFB] focus:outline-none focus:ring-2 focus:ring-[#2BA84A]/30 focus:border-[#2BA84A] transition-all"
              />
            </div>

            <div className="bg-white rounded-2xl border border-black/5">
              <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
                <h2 className="font-bold text-[#0A0A0C]">
                  All Bookings
                  <span className="ml-2 text-sm font-normal text-black/40">({filtered.length})</span>
                </h2>
              </div>
              <BookingTable bookings={filtered} loading={loading} />
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}

// ─── BookingTable Component ────────────────────────────────────────────────────

function BookingTable({ bookings, loading }: { bookings: AdminBooking[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <RefreshCw size={20} className="animate-spin text-[#2BA84A]" />
        <span className="text-sm text-black/50">Loading bookings...</span>
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen size={32} className="mx-auto mb-3 text-black/20" />
        <p className="text-black/40 text-sm">No bookings found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5 bg-[#F8FAFB]">
            {['Reference', 'Customer', 'Venue', 'Date & Time', 'Slots', 'Amount', 'Status', 'Payment'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-black/40 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => {
            const statusCfg = STATUS_CONFIG[b.booking_status] ?? { label: b.booking_status, color: 'bg-gray-100 text-gray-600', icon: null }
            const paymentCfg = PAYMENT_CONFIG[b.payment_status] ?? { label: b.payment_status, color: 'bg-gray-100 text-gray-600' }
            return (
              <tr
                key={b.id}
                className={`border-b border-black/5 hover:bg-[#F8FAFB] transition-colors ${
                  i % 2 === 0 ? '' : 'bg-[#FAFBFC]'
                }`}
              >
                {/* Reference */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-xs font-bold text-[#0A0A0C]">{b.booking_number}</span>
                  <p className="text-[10px] text-black/30 mt-0.5">{fmtDate(b.created_at)}</p>
                </td>

                {/* Customer */}
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#0A0A0C] whitespace-nowrap">{b.customer_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a href={`tel:${b.customer_phone}`} className="flex items-center gap-1 text-[10px] text-black/40 hover:text-[#2BA84A] transition-colors">
                      <PhoneCall size={10} /> {b.customer_phone}
                    </a>
                    {b.customer_email && (
                      <a href={`mailto:${b.customer_email}`} className="flex items-center gap-1 text-[10px] text-black/40 hover:text-[#2BA84A] transition-colors">
                        <Mail size={10} /> email
                      </a>
                    )}
                  </div>
                </td>

                {/* Venue */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-medium text-[#0A0A0C]">{b.venue_name}</span>
                </td>

                {/* Date & Time */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-xs font-medium text-[#0A0A0C]">{fmtDate(b.start_time)}</p>
                  <p className="text-[10px] text-black/40">{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</p>
                </td>

                {/* Slots */}
                <td className="px-4 py-3 max-w-[180px]">
                  <p className="text-xs text-black/60 line-clamp-2">{b.slot_labels?.join(', ') ?? `${b.duration_hours}h`}</p>
                </td>

                {/* Amount */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="font-bold text-[#0A0A0C] text-xs">{fmtINR(b.total_amount)}</p>
                  {b.amount_paid < b.total_amount && (
                    <p className="text-[10px] text-orange-500">Paid: {fmtINR(b.amount_paid)}</p>
                  )}
                </td>

                {/* Booking Status */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${statusCfg.color}`}>
                    {statusCfg.icon}
                    {statusCfg.label}
                  </span>
                </td>

                {/* Payment Status */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${paymentCfg.color}`}>
                    {paymentCfg.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
