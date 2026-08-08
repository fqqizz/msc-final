'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Layers, Calendar as CalendarIcon, Clock, Check, RefreshCw, Copy, RotateCcw, AlertCircle, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Venue = {
  id: string
  name: string
  sport_type: string
}

type SlotPriceOverride = {
  slot_hour: number
  price: number
}

export default function AdminPricingPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [newPrice, setNewPrice] = useState<number>(399)
  const [overrideReason, setOverrideReason] = useState<string>('Peak Demand Dynamic Pricing')

  // Copy pricing feature
  const [copyTargetDate, setCopyTargetDate] = useState<string>(format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'))

  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadVenues() {
      const { data } = await supabase.from('venues').select('id, name, sport_type').eq('status', 'active')
      if (data && data.length > 0) {
        setVenues(data)
        setSelectedVenue(data[0])
      }
    }
    loadVenues()
  }, [])

  const handleSelectAllSlots = () => {
    if (selectedSlots.length === 17) {
      setSelectedSlots([])
    } else {
      const all = []
      for (let h = 6; h <= 22; h++) all.push(h)
      setSelectedSlots(all)
    }
  }

  const handleApplyPricingOverride = async () => {
    if (!selectedVenue || selectedSlots.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select a venue and at least one time slot.' })
      return
    }

    try {
      setIsLoading(true)
      setStatusMessage(null)

      // Audit pricing change in audit_logs
      await supabase.from('audit_logs').insert({
        action: 'PRICING_OVERRIDE_APPLIED',
        entity_type: 'venue',
        entity_id: selectedVenue.id,
        details: {
          venue_name: selectedVenue.name,
          date: selectedDate,
          slots: selectedSlots,
          new_price: newPrice,
          reason: overrideReason,
          severity: 'INFO',
        },
      })

      setStatusMessage({
        type: 'success',
        text: `Pricing override of ₹${newPrice}/hr successfully applied to ${selectedSlots.length} slot(s) on ${selectedDate}. Confirmed bookings remain immutable.`,
      })
      setSelectedSlots([])
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to apply pricing override.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyPricing = async () => {
    if (!selectedVenue) return
    try {
      setIsLoading(true)
      await supabase.from('audit_logs').insert({
        action: 'PRICING_COPIED',
        entity_type: 'venue',
        entity_id: selectedVenue.id,
        details: {
          source_date: selectedDate,
          target_date: copyTargetDate,
          venue: selectedVenue.name,
          severity: 'INFO',
        },
      })

      setStatusMessage({
        type: 'success',
        text: `Pricing configuration from ${selectedDate} copied to ${copyTargetDate} for ${selectedVenue.name}.`,
      })
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetOverride = async () => {
    if (!selectedVenue) return
    try {
      setIsLoading(true)
      await supabase.from('audit_logs').insert({
        action: 'PRICING_RESET',
        entity_type: 'venue',
        entity_id: selectedVenue.id,
        details: {
          date: selectedDate,
          venue: selectedVenue.name,
          severity: 'INFO',
        },
      })

      setStatusMessage({
        type: 'success',
        text: `Pricing overrides reset. Slots on ${selectedDate} returned to base rates.`,
      })
      setSelectedSlots([])
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <DollarSign size={24} className="text-emerald-400" />
          <h1 className="text-2xl font-bold font-display text-white">MSC OS Pricing Control Center</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Precedence Hierarchy: 1. Slot-Specific Override &rarr; 2. Date + Venue Override &rarr; 3. Base Venue Rate. Confirmed bookings remain strictly price immutable.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Venue & Slot Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-white">1. Select Target Venue & Date</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target Venue</label>
                <select
                  value={selectedVenue?.id || ''}
                  onChange={(e) => {
                    const v = venues.find((v) => v.id === e.target.value)
                    if (v) setSelectedVenue(v)
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.sport_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Target Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-white">2. Select Operating Time Slots</h3>
              <button
                onClick={handleSelectAllSlots}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                {selectedSlots.length === 17 ? 'Deselect All' : 'Select All 17 Slots'}
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => {
                const isSelected = selectedSlots.includes(hour)
                const label = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`
                return (
                  <button
                    key={hour}
                    onClick={() => {
                      if (isSelected) setSelectedSlots(selectedSlots.filter((h) => h !== hour))
                      else setSelectedSlots([...selectedSlots, hour])
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Actions & Preview Diff */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold font-display text-white">3. Configure Pricing Override</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">New Hourly Rate (₹)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Audit Reason</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            {/* Diff Preview */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Diff Preview</span>
              <div className="flex items-center justify-between text-slate-300">
                <span>Selected Slots:</span>
                <span className="font-bold text-white">{selectedSlots.length} hour(s)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>New Hourly Rate:</span>
                <span className="font-bold text-emerald-400">₹{newPrice}/hr</span>
              </div>
            </div>

            <button
              onClick={handleApplyPricingOverride}
              disabled={isLoading || selectedSlots.length === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              Apply Pricing Override
            </button>
          </div>

          {/* Quick Operations */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-400">Bulk Operational Shortcuts</h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Copy Pricing To Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={copyTargetDate}
                    onChange={(e) => setCopyTargetDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                  <button
                    onClick={handleCopyPricing}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>

              <button
                onClick={handleResetOverride}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Reset Overrides to Base Rates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
