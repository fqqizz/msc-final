'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Layers,
  Calendar as CalendarIcon,
  Clock,
  Check,
  RefreshCw,
  Copy,
  RotateCcw,
  AlertCircle,
  Shield,
  Loader2,
  Sliders,
  CheckCircle2
} from 'lucide-react'
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

  // Active pricing rules list
  const [activeRules, setActiveRules] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const loadPricingData = async () => {
    try {
      const { data: vList } = await supabase.from('venues').select('id, name, sport_type').eq('status', 'active')
      if (vList && vList.length > 0) {
        setVenues(vList)
        if (!selectedVenue) setSelectedVenue(vList[0])
      }

      const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*, venues(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (rules) setActiveRules(rules)
    } catch (e) {
      console.error('Error loading pricing rules:', e)
    }
  }

  useEffect(() => {
    loadPricingData()
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

  // 1. Apply Dynamic Pricing Override
  const handleApplyPricingOverride = async () => {
    if (!selectedVenue || selectedSlots.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select a venue and at least one time slot.' })
      return
    }

    try {
      setIsLoading(true)
      setStatusMessage(null)

      // Insert rule for each selected slot or combined range
      const minHour = Math.min(...selectedSlots)
      const maxHour = Math.max(...selectedSlots) + 1

      const startTimeStr = `${minHour.toString().padStart(2, '0')}:00:00`
      const endTimeStr = `${maxHour.toString().padStart(2, '0')}:00:00`

      const { error: ruleErr } = await supabase.from('pricing_rules').insert({
        venue_id: selectedVenue.id,
        name: `${selectedVenue.name} Override (${overrideReason})`,
        start_date: selectedDate,
        end_date: selectedDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        hourly_rate: newPrice,
        priority: selectedSlots.length === 1 ? 10 : 5,
        is_peak_hour: true,
      })

      if (ruleErr) throw ruleErr

      // Audit pricing change in audit_logs
      await supabase.from('audit_logs').insert({
        action: 'PRICING_OVERRIDE_APPLIED',
        entity_type: 'pricing_rule',
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

      loadPricingData()
      setSelectedSlots([])
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save pricing override.' })
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Copy Pricing from Selected Date to Target Date
  const handleCopyPricing = async () => {
    if (!selectedVenue) return

    try {
      setIsLoading(true)
      setStatusMessage(null)

      const { data: existingForDate } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('venue_id', selectedVenue.id)
        .eq('start_date', selectedDate)
        .is('deleted_at', null)

      if (existingForDate && existingForDate.length > 0) {
        for (const rule of existingForDate) {
          await supabase.from('pricing_rules').insert({
            venue_id: selectedVenue.id,
            name: rule.name,
            start_date: copyTargetDate,
            end_date: copyTargetDate,
            start_time: rule.start_time,
            end_time: rule.end_time,
            hourly_rate: rule.hourly_rate,
            priority: rule.priority,
            is_peak_hour: rule.is_peak_hour,
          })
        }
      }

      await supabase.from('audit_logs').insert({
        action: 'PRICING_COPIED',
        entity_type: 'pricing_rule',
        entity_id: selectedVenue.id,
        details: {
          venue_name: selectedVenue.name,
          from_date: selectedDate,
          to_date: copyTargetDate,
          severity: 'INFO',
        },
      })

      setStatusMessage({
        type: 'success',
        text: `Pricing structure from ${selectedDate} copied to ${copyTargetDate} successfully.`
      })

      loadPricingData()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to copy pricing.' })
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Reset Overrides to Base Price
  const handleResetOverrides = async (ruleId: string) => {
    if (!confirm('Are you sure you want to reset this pricing override back to base price?')) return

    try {
      setIsLoading(true)
      await supabase
        .from('pricing_rules')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', ruleId)

      await supabase.from('audit_logs').insert({
        action: 'PRICING_OVERRIDE_RESET',
        entity_type: 'pricing_rule',
        entity_id: ruleId,
        details: { severity: 'INFO', reason: 'Reset to base price by admin' }
      })

      setStatusMessage({
        type: 'success',
        text: 'Pricing override successfully reset to base price.'
      })

      loadPricingData()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset pricing.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header with Breathing Room */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dynamic Pricing & Rate Overrides
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Configure peak-hour rates, tournament pricing, weekend surcharges, and date-range overrides
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Pricing Matrix Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Venue & Date Selector */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-6">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-emerald-600" />
            1. Select Venue & Date
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Venue / Facility</label>
            <div className="space-y-2">
              {venues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenue(v)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                    selectedVenue?.id === v.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{v.name}</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">{v.sport_type}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Target Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold"
            />
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-emerald-900">Effective Pricing Precedence:</p>
            <ol className="list-decimal pl-4 text-slate-600 text-[11px] space-y-0.5">
              <li>Slot-specific override (Priority 10)</li>
              <li>Date + Venue override (Priority 5)</li>
              <li>Base venue price (₹999 Turf / ₹299 Nets)</li>
            </ol>
          </div>
        </div>

        {/* Middle Column: Slot Selector & Override Amount */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-emerald-600" />
              2. Select Slots & New Hourly Rate
            </h2>
            <button
              onClick={handleSelectAllSlots}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              {selectedSlots.length === 17 ? 'Deselect All' : 'Select All Hours (Full Day)'}
            </button>
          </div>

          {/* Slot Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {Array.from({ length: 17 }, (_, i) => i + 6).map((hour) => {
              const isSelected = selectedSlots.includes(hour)
              const startLabel = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`
              const endLabel = (hour + 1) > 12 ? `${(hour + 1) - 12} PM` : (hour + 1) === 12 ? '12 PM' : `${hour + 1} AM`

              return (
                <button
                  key={hour}
                  onClick={() => {
                    if (isSelected) setSelectedSlots(selectedSlots.filter(h => h !== hour))
                    else setSelectedSlots([...selectedSlots, hour])
                  }}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block font-bold">{startLabel}</span>
                  <span className="text-[10px] opacity-75">{endLabel}</span>
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">New Hourly Rate (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Override Reason</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Tournament, Weekend Peak, Festival"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              {selectedSlots.length} slot(s) selected for override
            </span>
            <button
              onClick={handleApplyPricingOverride}
              disabled={isLoading || selectedSlots.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Apply Pricing Override
            </button>
          </div>
        </div>
      </div>

      {/* Copy Pricing Tool */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <Copy size={18} className="text-emerald-600" />
          Quick Tool: Copy Schedule Pricing
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Date</label>
            <input
              type="date"
              value={selectedDate}
              readOnly
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold"
            />
          </div>
          <span className="text-slate-400 font-bold text-xs mt-4">→</span>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Date</label>
            <input
              type="date"
              value={copyTargetDate}
              onChange={(e) => setCopyTargetDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
            />
          </div>
          <button
            onClick={handleCopyPricing}
            disabled={isLoading}
            className="w-full sm:w-auto mt-4 sm:mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            Copy Pricing to Date
          </button>
        </div>
      </div>

      {/* Active Overrides Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-extrabold text-base text-slate-900">Active Pricing Rules & Overrides</h2>
          <p className="text-xs text-slate-500 mt-0.5">Currently active price overrides stored in Supabase</p>
        </div>

        {activeRules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Venue & Rule</th>
                  <th className="px-5 py-3.5">Dates Active</th>
                  <th className="px-5 py-3.5">Time Window</th>
                  <th className="px-5 py-3.5">Rate / Hour</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activeRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block">{rule.venues?.name || 'MSC Venue'}</span>
                      <span className="text-[10px] text-slate-400">{rule.name}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {rule.start_date ? `${rule.start_date} ${rule.end_date !== rule.start_date ? `to ${rule.end_date}` : ''}` : 'All Dates'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {rule.start_time} – {rule.end_time}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700 text-sm">
                      ₹{rule.hourly_rate}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleResetOverrides(rule.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <RotateCcw size={13} /> Reset to Base
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No custom pricing overrides active. Standard base rates are currently applied across all facilities.
          </div>
        )}
      </div>
    </div>
  )
}
