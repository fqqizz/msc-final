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
  X,
  BookmarkPlus,
  Lock,
  Unlock,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'bookings' | 'reservations' | 'cancelled'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Booking Details Modal State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [isProcessingAction, setIsProcessingAction] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Walk-In Booking Modal State (Multi-Facility Enabled per Requirement 8)
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([])
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
  const [startHour, setStartHour] = useState(17)
  const [manualAmountPerVenue, setManualAmountPerVenue] = useState<Record<string, number>>({})
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'cash' | 'upi'>('cash')

  // Owner Slot Reservation Modal State (Multi-Facility Enabled per Requirement 8)
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [reserveVenueIds, setReserveVenueIds] = useState<string[]>([])
  const [reserveDate, setReserveDate] = useState(new Date().toISOString().split('T')[0])
  const [reserveHour, setReserveHour] = useState(18)
  const [reserveReason, setReserveReason] = useState('Tournament / Complex Event')
  const [reserveCustomerName, setReserveCustomerName] = useState('')
  const [reserveCustomerPhone, setReserveCustomerPhone] = useState('')
  const [reserveNotes, setReserveNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchScheduleData = async () => {
    try {
      setIsLoading(true)
      const { data: vList } = await supabase
        .from('venues')
        .select('*')
        .neq('slug', 'bowling-nets')
        .order('display_order', { ascending: true })

      if (vList && vList.length > 0) {
        setVenues(vList)
        if (selectedVenueIds.length === 0) setSelectedVenueIds([vList[0].id])
        if (reserveVenueIds.length === 0) setReserveVenueIds([vList[0].id])
      }

      // 1. Fetch Bookings
      const { data: bList } = await supabase
        .from('bookings')
        .select('*, venues(name), user_profiles(full_name, phone, email)')
        .order('start_time', { ascending: false })

      if (bList) setBookings(bList)

      // 2. Fetch Active Slot Reservations
      const { data: rList } = await supabase
        .from('slot_reservations')
        .select('*, venues(name)')
        .order('start_time', { ascending: false })

      if (rList) setReservations(rList)
    } catch (err) {
      console.error('Error fetching admin bookings/reservations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduleData()

    // Real-time subscription for bookings and slot reservations
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchScheduleData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_reservations' }, () => fetchScheduleData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Toggle Facility in Walk-in
  const toggleWalkInVenue = (venueId: string) => {
    if (selectedVenueIds.includes(venueId)) {
      if (selectedVenueIds.length > 1) {
        setSelectedVenueIds(selectedVenueIds.filter((id) => id !== venueId))
      }
    } else {
      setSelectedVenueIds([...selectedVenueIds, venueId])
    }
  }

  // Toggle Facility in Reservation
  const toggleReserveVenue = (venueId: string) => {
    if (reserveVenueIds.includes(venueId)) {
      if (reserveVenueIds.length > 1) {
        setReserveVenueIds(reserveVenueIds.filter((id) => id !== venueId))
      }
    } else {
      setReserveVenueIds([...reserveVenueIds, venueId])
    }
  }

  // Handle Multi-Facility Slot Reservation
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (reserveVenueIds.length === 0 || !reserveDate) {
      setModalError('Please select at least one facility and a valid date.')
      return
    }

    setIsSubmitting(true)

    try {
      const startTime = new Date(`${reserveDate}T${reserveHour.toString().padStart(2, '0')}:00:00+05:30`).toISOString()
      const endTime = new Date(`${reserveDate}T${(reserveHour + 1).toString().padStart(2, '0')}:00:00+05:30`).toISOString()

      // Loop through all selected facilities and reserve
      for (const vId of reserveVenueIds) {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('reserve_owner_slot', {
          p_venue_id: vId,
          p_start_time: startTime,
          p_end_time: endTime,
          p_reason: reserveReason,
          p_customer_name: reserveCustomerName || null,
          p_customer_phone: reserveCustomerPhone || null,
          p_internal_notes: reserveNotes || null,
        })

        if (rpcErr || (rpcRes && !rpcRes.success)) {
          // Fallback direct insert
          const { error: insertErr } = await supabase.from('slot_reservations').insert({
            venue_id: vId,
            start_time: startTime,
            end_time: endTime,
            reason: reserveReason,
            customer_name: reserveCustomerName || null,
            customer_phone: reserveCustomerPhone || null,
            internal_notes: reserveNotes || null,
            status: 'active',
          })

          if (insertErr) {
            console.error('Reservation insert error:', insertErr)
          }
        }
      }

      setShowReserveModal(false)
      setReserveCustomerName('')
      setReserveCustomerPhone('')
      setReserveNotes('')
      fetchScheduleData()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred while reserving slots.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Multi-Facility Walk-In Booking
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!customerName || selectedVenueIds.length === 0 || !bookingDate) {
      setModalError('Please fill in customer name, select facility/facilities, and date.')
      return
    }

    setIsSubmitting(true)

    try {
      const startTime = new Date(`${bookingDate}T${startHour.toString().padStart(2, '0')}:00:00+05:30`).toISOString()
      const endTime = new Date(`${bookingDate}T${(startHour + 1).toString().padStart(2, '0')}:00:00+05:30`).toISOString()

      // Loop through all selected facilities and create bookings
      for (const vId of selectedVenueIds) {
        const vObj = venues.find((x) => x.id === vId)
        const vAmount = manualAmountPerVenue[vId] ?? (vObj?.sport_type === 'football' ? 999 : 299)

        const { data: bNum } = await supabase.rpc('generate_booking_number')
        const bookingNumber = bNum || `MSC-${Date.now().toString().slice(-6)}`

        const { error: insertErr } = await supabase.from('bookings').insert({
          booking_number: bookingNumber,
          customer_id: '00000000-0000-0000-0000-000000000000',
          venue_id: vId,
          start_time: startTime,
          end_time: endTime,
          duration_hours: 1,
          booking_status: 'confirmed',
          payment_status: 'paid',
          booking_source: 'offline_reception',
          base_amount: vAmount,
          extra_charges: 0,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: vAmount,
          amount_paid: vAmount,
          notes: `Walk-in Player: ${customerName} (${customerPhone || 'Desk'}) - Paid via ${manualPaymentMethod.toUpperCase()} for ${vObj?.name || 'Facility'}`,
        })

        if (insertErr) {
          console.error('Walk-in booking insert error for venue', vId, insertErr)
        }
      }

      setShowWalkInModal(false)
      setCustomerName('')
      setCustomerPhone('')
      fetchScheduleData()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Release Slot Reservation
  const handleReleaseReservation = async (resId: string) => {
    if (
      !confirm(
        'Are you sure you want to release this reservation? It will immediately become available in the public booking flow.'
      )
    )
      return

    try {
      setIsProcessingAction(true)
      setActionError(null)

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('release_owner_slot', {
        p_reservation_id: resId,
      })

      if (rpcErr || (rpcRes && !rpcRes.success)) {
        await supabase
          .from('slot_reservations')
          .update({ status: 'released', released_at: new Date().toISOString() })
          .eq('id', resId)
      }

      fetchScheduleData()
      setSelectedBooking(null)
    } catch (err: any) {
      setActionError(err.message || 'Failed to release reservation.')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Handle Cancel Booking
  const handleCancelBooking = async (bId: string) => {
    if (
      !confirm(
        'Are you sure you want to cancel this booking? This will trigger the cancellation engine.'
      )
    )
      return

    try {
      setIsProcessingAction(true)
      setActionError(null)

      await supabase
        .from('bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', bId)

      setSelectedBooking(null)
      fetchScheduleData()
    } catch (err: any) {
      setActionError(err.message || 'Error executing cancellation.')
    } finally {
      setIsProcessingAction(false)
    }
  }

  // Combined Schedule List
  const unifiedItems = [
    ...bookings.map((b) => ({ ...b, itemType: 'booking' })),
    ...reservations.map((r) => ({ ...r, itemType: 'reservation' })),
  ].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

  const filteredItems = unifiedItems.filter((item) => {
    const searchTarget = (
      (item.booking_number || '') +
      ' ' +
      (item.venues?.name || '') +
      ' ' +
      (item.customer_name || item.user_profiles?.full_name || item.notes || '') +
      ' ' +
      (item.reason || '')
    ).toLowerCase()

    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'bookings') return matchesSearch && item.itemType === 'booking' && item.booking_status !== 'cancelled'
    if (statusFilter === 'reservations') return matchesSearch && item.itemType === 'reservation' && item.status === 'active'
    if (statusFilter === 'cancelled') return matchesSearch && (item.booking_status === 'cancelled' || item.status === 'released')

    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Schedule & Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time facility schedule management, multi-facility block, and walk-in counter
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowReserveModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Lock size={15} /> Reserve / Block Slots
          </button>
          <button
            onClick={() => setShowWalkInModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus size={16} /> New Walk-In Booking
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Booking #, Player Name, Phone, or Facility..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({unifiedItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('bookings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'bookings'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Customer Bookings ({bookings.filter((b) => b.booking_status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setStatusFilter('reservations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'reservations'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Owner Blocked ({reservations.filter((r) => r.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'cancelled'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelled / Released
          </button>
        </div>
      </div>

      {/* Main Schedule Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400">
            <Loader2 className="animate-spin mx-auto text-emerald-600 mb-2" size={28} />
            Loading real-time schedule...
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Type & Reference</th>
                  <th className="px-6 py-3.5">Facility</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Player / Reason</th>
                  <th className="px-6 py-3.5">Amount / Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.map((item) => {
                  const isBooking = item.itemType === 'booking'
                  const startTime = new Date(item.start_time)
                  const endTime = new Date(item.end_time)

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        {isBooking ? (
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              #{item.booking_number}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                              {item.booking_source || 'Online Booking'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              <Lock size={11} /> Blocked Slot
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.reason}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">
                          {item.venues?.name || 'MSC Facility'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="block font-semibold text-slate-900">
                          {format(startTime, 'EEE, dd MMM yyyy')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {format(startTime, 'hh:mm a')} – {format(endTime, 'hh:mm a')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {isBooking ? (
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {item.user_profiles?.full_name || item.notes?.split('-')[0]?.replace('Walk-in Player:', '')?.trim() || 'Player'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.user_profiles?.phone || item.notes?.match(/\((.*?)\)/)?.[1] || 'Desk'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {item.customer_name || 'Complex Management'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.customer_phone || item.reason}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isBooking ? (
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              ₹{item.total_amount || item.base_amount}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mt-0.5 ${
                                item.booking_status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.booking_status === 'completed'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.booking_status}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.status === 'active'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.status === 'active' ? 'Locked / In Use' : 'Released'}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isBooking ? (
                          <button
                            onClick={() => setSelectedBooking(item)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-all inline-flex items-center gap-1"
                          >
                            <Eye size={13} /> View
                          </button>
                        ) : (
                          item.status === 'active' && (
                            <button
                              onClick={() => handleReleaseReservation(item.id)}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-lg transition-all inline-flex items-center gap-1"
                            >
                              <Unlock size={13} /> Release
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400">
            <Calendar className="mx-auto mb-2 text-slate-300" size={36} />
            <p className="text-xs">No bookings or reservations matching current filter.</p>
          </div>
        )}
      </div>

      {/* MULTI-FACILITY OWNER SLOT RESERVATION / BLOCK MODAL (Requirement 8) */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Block / Reserve Slots</h3>
                  <p className="text-xs text-slate-500">Select multiple facilities to block simultaneously</p>
                </div>
              </div>
              <button
                onClick={() => setShowReserveModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateReservation} className="space-y-4 text-xs">
              {/* Multi-Facility Selection Checkboxes */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">
                  Select Facility / Facilities *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {venues.map((v) => {
                    const isChecked = reserveVenueIds.includes(v.id)
                    return (
                      <label
                        key={v.id}
                        onClick={() => toggleReserveVenue(v.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border select-none ${
                          isChecked
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="truncate">{v.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={reserveDate}
                    onChange={(e) => setReserveDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Time Slot *</label>
                  <select
                    value={reserveHour}
                    onChange={(e) => setReserveHour(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => {
                      const start = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`
                      const end = (h + 1) > 12 ? `${(h + 1) - 12} PM` : (h + 1) === 12 ? '12 PM' : `${h + 1} AM`
                      return (
                        <option key={h} value={h}>
                          {start} – {end}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reason / Purpose *</label>
                <input
                  type="text"
                  required
                  value={reserveReason}
                  onChange={(e) => setReserveReason(e.target.value)}
                  placeholder="e.g. Regional Tournament / Private Match / Maintenance"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer / Team Name</label>
                  <input
                    type="text"
                    value={reserveCustomerName}
                    onChange={(e) => setReserveCustomerName(e.target.value)}
                    placeholder="Team or Organizer"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={reserveCustomerPhone}
                    onChange={(e) => setReserveCustomerPhone(e.target.value)}
                    placeholder="+91 99060 00000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Internal Note (Admin Only)</label>
                <textarea
                  rows={2}
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                  placeholder="Private internal operational note..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    `Block ${reserveVenueIds.length} ${reserveVenueIds.length === 1 ? 'Facility' : 'Facilities'}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-FACILITY WALK-IN BOOKING MODAL (Requirement 8) */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">New Walk-In Booking</h3>
                  <p className="text-xs text-slate-500">Record on-spot booking across one or multiple facilities</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateManualBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Player Name"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 99060 00000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Multi-Facility Selection Checkboxes */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1.5">
                  Select Facility / Facilities *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {venues.map((v) => {
                    const isChecked = selectedVenueIds.includes(v.id)
                    const vRate = v.sport_type === 'football' ? 999 : 299

                    return (
                      <label
                        key={v.id}
                        onClick={() => toggleWalkInVenue(v.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border select-none ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="truncate">{v.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold shrink-0">₹{vRate}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Time Slot *</label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => {
                      const start = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`
                      const end = (h + 1) > 12 ? `${(h + 1) - 12} PM` : (h + 1) === 12 ? '12 PM' : `${h + 1} AM`
                      return (
                        <option key={h} value={h}>
                          {start} – {end}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="cash">Cash on Desk</option>
                    <option value="upi">UPI / Scanner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Total Amount (₹)</label>
                  <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 font-extrabold text-sm">
                    ₹
                    {selectedVenueIds.reduce((sum, vId) => {
                      const v = venues.find((x) => x.id === vId)
                      return sum + (v?.sport_type === 'football' ? 999 : 299)
                    }, 0)}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    `Confirm ${selectedVenueIds.length} ${selectedVenueIds.length === 1 ? 'Booking' : 'Bookings'}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Booking Details
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">#{selectedBooking.booking_number}</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Facility:</span>
                <span className="font-bold text-slate-900">{selectedBooking.venues?.name || 'MSC Facility'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-slate-900">
                  {format(new Date(selectedBooking.start_time), 'dd MMMM yyyy')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-bold text-slate-900">
                  {format(new Date(selectedBooking.start_time), 'hh:mm a')} –{' '}
                  {format(new Date(selectedBooking.end_time), 'hh:mm a')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.user_profiles?.full_name ||
                    selectedBooking.notes ||
                    'MSC Customer'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Total Price:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  ₹{selectedBooking.total_amount || selectedBooking.base_amount}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href={`/api/receipts/download?booking_id=${selectedBooking.id}`}
                target="_blank"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl text-center flex items-center justify-center gap-1.5"
              >
                <Download size={16} /> Download Official PDF Receipt
              </Link>

              {selectedBooking.booking_status !== 'cancelled' && (
                <button
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  disabled={isProcessingAction}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  {isProcessingAction ? <Loader2 size={16} className="animate-spin" /> : 'Cancel Booking & Open Slot'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
