'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Layers,
  Download,
  RotateCcw,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  // Booking Details Modal State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Manual Walk-In Booking Modal State
  const [showModal, setShowModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
  const [startHour, setStartHour] = useState(17)
  const [manualAmount, setManualAmount] = useState(299)
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'cash' | 'upi'>('cash')
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
        .select('*, venues(name), user_profiles(full_name, phone, email)')
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

      // Call database lock to prevent simultaneous double booking
      const { data: lockSuccess, error: lockErr } = await supabase.rpc('create_slot_lock', {
        p_venue_id: selectedVenueId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_ttl_minutes: 60
      })

      if (lockErr || !lockSuccess) {
        setModalError(lockErr?.message || 'That slot was just booked or is unavailable.')
        setIsSubmitting(false)
        return
      }

      // Generate booking number
      const { data: bNum } = await supabase.rpc('generate_booking_number')
      const bookingNumber = bNum || `MSC-${Date.now().toString().slice(-6)}`

      const { error: insertErr } = await supabase.from('bookings').insert({
        booking_number: bookingNumber,
        customer_id: '00000000-0000-0000-0000-000000000000',
        venue_id: selectedVenueId,
        start_time: startTime,
        end_time: endTime,
        duration_hours: 1,
        booking_status: 'confirmed',
        payment_status: 'paid',
        booking_source: 'offline_reception',
        base_amount: manualAmount,
        extra_charges: 0,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: manualAmount,
        amount_paid: manualAmount,
        notes: `Walk-in Customer: ${customerName} (${customerPhone}) - Paid via ${manualPaymentMethod.toUpperCase()}`
      })

      if (insertErr) {
        setModalError(insertErr.message)
        setIsSubmitting(false)
        return
      }

      setShowModal(false)
      setCustomerName('')
      setCustomerPhone('')
      fetchBookings()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Cancel Booking
  const handleCancelBooking = async (bId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This will trigger the cancellation workflow.')) return

    try {
      setIsProcessingAction(true)
      setActionError(null)

      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bId, reason: 'Owner cancellation from MSC OS' })
      })

      const data = await response.json()
      if (!response.ok) {
        setActionError(data.error || 'Failed to cancel booking.')
        return
      }

      setSelectedBooking(null)
      fetchBookings()
    } catch (err: any) {
      setActionError(err.message || 'Error executing cancellation.')
    } finally {
      setIsProcessingAction(false)
    }
  }

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.booking_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.user_profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.notes || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && b.booking_status === statusFilter
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bookings & Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time schedule management, slot locks & customer session logs
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          <Plus size={16} /> New Walk-In Booking
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking ID, customer or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'confirmed', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table View */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Loader2 size={28} className="animate-spin mx-auto text-emerald-600 mb-2" />
            Loading booking records...
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Booking ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Venue</th>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-900">#{b.booking_number}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {b.user_profiles?.full_name || 'Walk-In Customer'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-700">{b.venues?.name || 'Football Turf'}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {format(new Date(b.start_time), 'MMM d, yyyy @ h:mm a')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">₹{b.total_amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.booking_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        b.booking_status === 'completed' ? 'bg-sky-100 text-sky-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {b.booking_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBooking(b)
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-slate-500">
            <Calendar className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="font-semibold text-slate-700">No bookings match your current filter.</p>
            <p className="text-slate-400 mt-0.5">New reservations will appear here automatically.</p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full text-xs text-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Booking Details</span>
                  <h3 className="text-base font-bold text-slate-900">#{selectedBooking.booking_number}</h3>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  {actionError}
                </div>
              )}

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-semibold text-slate-900">{selectedBooking.user_profiles?.full_name || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Venue</span>
                  <span className="font-semibold text-slate-900">{selectedBooking.venues?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Time</span>
                  <span className="font-semibold text-slate-900">{format(new Date(selectedBooking.start_time), 'EEEE, MMM d @ h:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-slate-900">{selectedBooking.duration_hours} hr(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Amount</span>
                  <span className="font-bold text-emerald-700">₹{selectedBooking.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status</span>
                  <span className="font-semibold capitalize text-slate-900">{selectedBooking.payment_status}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Link
                  href={`/api/receipts/download?booking_id=${selectedBooking.id}`}
                  target="_blank"
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-center flex items-center justify-center gap-1.5"
                >
                  <Download size={14} /> Download PDF
                </Link>

                {selectedBooking.booking_status === 'confirmed' && (
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={isProcessingAction}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-center disabled:opacity-50"
                  >
                    {isProcessingAction ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Walk-In Booking Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full text-xs text-slate-900 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Create Walk-In / Phone Booking</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateManualBooking} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Player Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Faizan Qureshi"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Player Phone</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 99060 00000"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Venue *</label>
                  <select
                    value={selectedVenueId}
                    onChange={(e) => {
                      setSelectedVenueId(e.target.value)
                      const v = venues.find((item) => item.id === e.target.value)
                      setManualAmount(v?.sport_type === 'football' ? 999 : 299)
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.sport_type === 'football' ? '₹999/hr' : '₹299/hr'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Start Hour *</label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    >
                      {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                        <option key={h} value={h}>
                          {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualPaymentMethod('cash')}
                      className={`py-2 rounded-xl border text-xs font-semibold ${
                        manualPaymentMethod === 'cash' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      Cash at Facility
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualPaymentMethod('upi')}
                      className={`py-2 rounded-xl border text-xs font-semibold ${
                        manualPaymentMethod === 'upi' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      UPI / QR Code
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
                  >
                    {isSubmitting ? 'Creating Booking...' : `Confirm Booking & Collect ₹${manualAmount}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
