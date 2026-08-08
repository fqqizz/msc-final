'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Shield,
  Layers
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  // Manual Walk-In Booking Modal State
  const [showModal, setShowModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
  const [startHour, setStartHour] = useState(17)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      const { data: vList } = await supabase.from('venues').select('*')
      if (vList) {
        setVenues(vList)
        if (vList.length > 0) setSelectedVenueId(vList[0].id)
      }

      const { data: bList } = await supabase
        .from('bookings')
        .select('*, venues(name), user_profiles(full_name, phone)')
        .order('start_time', { ascending: false })

      if (bList) setBookings(bList)
    } catch (err) {
      console.error('Error fetching admin bookings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!customerName || !selectedVenueId || !bookingDate) {
      setModalError('Please fill in customer name, venue, and date.')
      return
    }

    setIsSubmitting(true)

    try {
      const startTime = new Date(`${bookingDate}T${startHour.toString().padStart(2, '0')}:00:00Z`).toISOString()
      const endTime = new Date(`${bookingDate}T${(startHour + 1).toString().padStart(2, '0')}:00:00Z`).toISOString()

      // Call database lock or direct insert for manual walk-in
      const { data: lockId, error: lockErr } = await supabase.rpc('create_slot_lock', {
        p_venue_id: selectedVenueId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_ttl_minutes: 60
      })

      if (lockErr) {
        setModalError(lockErr.message || 'Slot conflict or venue unavailable at selected time.')
        setIsSubmitting(false)
        return
      }

      // Generate booking number
      const { data: bNum } = await supabase.rpc('generate_booking_number')
      const bookingNumber = bNum || `MSC-${Date.now().toString().slice(-6)}`

      const { error: insertErr } = await supabase
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          customer_id: '00000000-0000-0000-0000-000000000000',
          venue_id: selectedVenueId,
          start_time: startTime,
          end_time: endTime,
          duration_hours: 1,
          booking_status: 'confirmed',
          payment_status: 'paid',
          booking_source: 'walk_in',
          base_amount: 1200,
          extra_charges: 0,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 1200,
          amount_paid: 1200,
          notes: `Walk-in customer: ${customerName} (${customerPhone || 'N/A'})`
        })

      if (insertErr) {
        setModalError(insertErr.message)
        setIsSubmitting(false)
        return
      }

      setShowModal(false)
      fetchBookings()
    } catch (err: any) {
      setModalError(err.message || 'Failed to create manual booking.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.booking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Bookings & Slot Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View, schedule, and create walk-in or manual facility bookings
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Record Walk-In / Phone Booking
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Booking ID, customer or venue..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 size={32} className="animate-spin mx-auto text-emerald-400 mb-2" />
            Loading booking records...
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Venue</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white">#{b.booking_number}</td>
                    <td className="p-4 text-emerald-400 font-semibold">{b.venues?.name || 'Football Turf'}</td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{b.user_profiles?.full_name || b.notes || 'Walk-in Customer'}</p>
                      <p className="text-[10px] text-slate-500">{b.user_profiles?.phone || ''}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-white">{format(new Date(b.start_time), 'MMM d, yyyy')}</p>
                      <p className="text-[10px] text-slate-400">
                        {format(new Date(b.start_time), 'h:mm a')} - {format(new Date(b.end_time), 'h:mm a')}
                      </p>
                    </td>
                    <td className="p-4 font-bold text-white">₹{b.total_amount}</td>
                    <td className="p-4 capitalize text-slate-400">{b.booking_source || 'online'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        b.booking_status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        b.booking_status === 'confirmed' ? 'bg-sky-500/20 text-sky-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {b.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Calendar size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No matching bookings found.</p>
          </div>
        )}
      </div>

      {/* Manual Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold font-display text-white mb-1">
              Record Walk-In / Phone Booking
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Directly reserve a slot in the complex schedule for facility walk-in guests.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateManualBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Team Name / Player"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 99060 00000"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Select Venue *
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Start Hour *
                  </label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    {Array.from({ length: 17 }).map((_, i) => {
                      const h = 6 + i
                      return (
                        <option key={h} value={h}>
                          {h}:00 {h >= 12 ? 'PM' : 'AM'}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  {isSubmitting ? 'Reserving...' : 'Confirm Manual Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
