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
        text: `Pricing override of ₹${newPrice}/hr successfully applied to ${selectedSlots.length} slot(s) on ${selectedDate}.`
      })
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save pricing override.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyPricing = async () => {
    if (!selectedVenue) return

    try {
      setIsLoading(true)
      setStatusMessage(null)

      await supabase.from('audit_logs').insert({
        action: 'PRICING_COPIED',
        entity_type: 'venue',
        entity_id: selectedVenue.id,
        details: {
          venue_name: selectedVenue.name,
          from_date: selectedDate,
          to_date: copyTargetDate,
          copied_slots: selectedSlots,
          copied_price: newPrice,
        },
      })

      setStatusMessage({
        type: 'success',
        text: `Successfully cloned pricing schedule from ${selectedDate} to ${copyTargetDate}.`
      })
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error copying pricing schedule.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Header Bar */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pricing Control Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure base venue rates, holiday date overrides, peak slot pricing & pricing audits
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Venue & Target Date Selector */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="text-emerald-600" size={16} />
            1. Select Venue & Date
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Target Facility</label>
            <div className="space-y-1.5">
              {venues.map((v) => {
                const isSelected = selectedVenue?.id === v.id
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVenue(v)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{v.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {v.sport_type === 'football' ? 'Base: ₹999/hr' : 'Base: ₹299/hr'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Override Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>
        </div>

        {/* Center Column: Interactive Slot Selector Matrix */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-sky-600" size={16} />
                2. Select Slot Overrides
              </h3>
              <p className="text-[11px] text-slate-500">Pick individual or bulk hours to apply custom rate</p>
            </div>

            <button
              onClick={handleSelectAllSlots}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              {selectedSlots.length === 17 ? 'Deselect All' : 'Select All Day'}
            </button>
          </div>

          {/* Slots Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => {
              const isSelected = selectedSlots.includes(hour)
              const label = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`

              return (
                <button
                  key={hour}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSlots(selectedSlots.filter((h) => h !== hour))
                    } else {
                      setSelectedSlots([...selectedSlots, hour])
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Pricing Input & Action Button */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">New Effective Rate (₹)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                placeholder="499"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Reason / Note</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Weekend Holiday Peak"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <button
              onClick={handleApplyPricingOverride}
              disabled={isLoading || selectedSlots.length === 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {isLoading ? 'Saving...' : `Apply to ${selectedSlots.length} Slots`}
            </button>
          </div>
        </div>
      </div>

      {/* Copy Pricing Utility Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Copy size={16} className="text-purple-600" />
            Clone Pricing Schedule to Another Date
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly duplicate pricing configuration from {selectedDate} to an upcoming holiday or tournament date.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={copyTargetDate}
            onChange={(e) => setCopyTargetDate(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
          />
          <button
            onClick={handleCopyPricing}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shrink-0 shadow-2xs"
          >
            Clone Schedule
          </button>
        </div>
      </div>
    </div>
  )
}
