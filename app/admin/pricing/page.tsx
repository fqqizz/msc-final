'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  CheckCircle2,
  Plus,
  Wrench,
  TrendingUp,
  History,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Venue = {
  id: string
  name: string
  sport_type: string
  base_price?: number
}

type BaseRateHistory = {
  id: string
  venue_id: string | null
  resource_id: string | null
  base_price: number
  effective_from: string
  reason: string
  created_at: string
  venues?: { name: string }
  resources?: { name: string }
}

export default function AdminPricingPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [overridePrice, setOverridePrice] = useState<number>(399)
  const [overrideReason, setOverrideReason] = useState<string>('Peak Demand Override')

  // Date Range Override State
  const [rangeStartDate, setRangeStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [rangeEndDate, setRangeEndDate] = useState<string>(format(new Date(Date.now() + 5 * 86400000), 'yyyy-MM-dd'))
  const [rangePrice, setRangePrice] = useState<number>(1199)
  const [rangeReason, setRangeReason] = useState<string>('Tournament Week Pricing')

  // Change Base Price From Now On Modal State
  const [showBasePriceModal, setShowBasePriceModal] = useState(false)
  const [basePriceTargetType, setBasePriceTargetType] = useState<'venue' | 'bowling_machine'>('venue')
  const [basePriceVenueId, setBasePriceVenueId] = useState<string>('')
  const [newBasePrice, setNewBasePrice] = useState<number>(399)
  const [effectiveFromDateTime, setEffectiveFromDateTime] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  )
  const [basePriceReason, setBasePriceReason] = useState<string>('Standard Rate Adjustment')

  // Copy pricing feature
  const [copyTargetDate, setCopyTargetDate] = useState<string>(format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'))

  // Active Overrides & Real Base Rates List
  const [activeOverrides, setActiveOverrides] = useState<any[]>([])
  const [baseRatesHistory, setBaseRatesHistory] = useState<BaseRateHistory[]>([])
  const [bowlingMachineResource, setBowlingMachineResource] = useState<any>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  const loadAllPricingData = async () => {
    try {
      setIsLoading(true)

      // 1. Fetch Venues (excluding any obsolete "Bowling Nets")
      const { data: vList } = await supabase
        .from('venues')
        .select('id, name, sport_type')
        .eq('status', 'active')
        .neq('slug', 'bowling-nets')
        .order('display_order', { ascending: true })

      if (vList && vList.length > 0) {
        setVenues(vList)
        if (!selectedVenue) setSelectedVenue(vList[0])
        if (!basePriceVenueId) setBasePriceVenueId(vList[0].id)
      }

      // 2. Fetch Shared Bowling Machine Resource
      const { data: bmData } = await supabase
        .from('resources')
        .select('*')
        .eq('code', 'BM-CRICKET-01')
        .maybeSingle()

      if (bmData) {
        setBowlingMachineResource(bmData)
      }

      // 3. Fetch Real Active Overrides from pricing_rules
      const { data: rules } = await supabase
        .from('pricing_rules')
        .select('*, venues(name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (rules) setActiveOverrides(rules)

      // 4. Fetch Real Base Price History
      const { data: bHistory } = await supabase
        .from('venue_base_rates')
        .select('*, venues(name), resources(name)')
        .order('effective_from', { ascending: false })

      if (bHistory) setBaseRatesHistory(bHistory)
    } catch (e) {
      console.error('Error loading authoritative pricing data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllPricingData()
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

  // 1. Apply Dynamic Slot / Date Override
  const handleApplySlotOverride = async () => {
    if (!selectedVenue || selectedSlots.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select a facility and at least one time slot.' })
      return
    }

    try {
      setIsSubmitting(true)
      setStatusMessage(null)

      const minHour = Math.min(...selectedSlots)
      const maxHour = Math.max(...selectedSlots) + 1

      const startTimeStr = `${minHour.toString().padStart(2, '0')}:00:00`
      const endTimeStr = `${maxHour.toString().padStart(2, '0')}:00:00`

      const { error: ruleErr } = await supabase.from('pricing_rules').insert({
        venue_id: selectedVenue.id,
        name: `${selectedVenue.name} (${overrideReason})`,
        start_date: selectedDate,
        end_date: selectedDate,
        start_time: startTimeStr,
        end_time: endTimeStr,
        hourly_rate: overridePrice,
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
          new_price: overridePrice,
          reason: overrideReason,
          severity: 'INFO',
        },
      })

      setStatusMessage({
        type: 'success',
        text: `Pricing override of ₹${overridePrice}/hr successfully applied to ${selectedSlots.length} slot(s) for ${selectedDate}.`
      })

      loadAllPricingData()
      setSelectedSlots([])
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save pricing override.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. Apply Multi-Day Date Range Override
  const handleApplyRangeOverride = async () => {
    if (!selectedVenue || !rangeStartDate || !rangeEndDate) {
      setStatusMessage({ type: 'error', text: 'Please select a facility and valid date range.' })
      return
    }

    try {
      setIsSubmitting(true)
      setStatusMessage(null)

      const { error: ruleErr } = await supabase.from('pricing_rules').insert({
        venue_id: selectedVenue.id,
        name: `${selectedVenue.name} Date Range (${rangeReason})`,
        start_date: rangeStartDate,
        end_date: rangeEndDate,
        start_time: '06:00:00',
        end_time: '23:00:00',
        hourly_rate: rangePrice,
        priority: 5,
        is_peak_hour: true,
      })

      if (ruleErr) throw ruleErr

      await supabase.from('audit_logs').insert({
        action: 'DATE_RANGE_PRICING_APPLIED',
        entity_type: 'pricing_rule',
        entity_id: selectedVenue.id,
        details: {
          venue_name: selectedVenue.name,
          start_date: rangeStartDate,
          end_date: rangeEndDate,
          new_price: rangePrice,
          reason: rangeReason,
          severity: 'INFO',
        },
      })

      setStatusMessage({
        type: 'success',
        text: `Date range override of ₹${rangePrice}/hr applied for ${selectedVenue.name} from ${rangeStartDate} to ${rangeEndDate}.`
      })

      loadAllPricingData()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save date range override.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Change Base Price From Effective Date / Time
  const handleChangeBasePrice = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setStatusMessage(null)

      const targetVenueId = basePriceTargetType === 'venue' ? basePriceVenueId : null
      const targetResourceId = basePriceTargetType === 'bowling_machine' ? bowlingMachineResource?.id : null

      const { data: rpcRes, error: rpcErr } = await supabase.rpc('change_base_price', {
        p_venue_id: targetVenueId,
        p_resource_id: targetResourceId,
        p_new_base_price: newBasePrice,
        p_effective_from: new Date(effectiveFromDateTime).toISOString(),
        p_reason: basePriceReason,
      })

      if (rpcErr || (rpcRes && !rpcRes.success)) {
        // Direct table fallback
        await supabase.from('venue_base_rates').insert({
          venue_id: targetVenueId,
          resource_id: targetResourceId,
          base_price: newBasePrice,
          effective_from: new Date(effectiveFromDateTime).toISOString(),
          reason: basePriceReason,
        })
      }

      setShowBasePriceModal(false)
      setStatusMessage({
        type: 'success',
        text: `Authoritative Base Price changed to ₹${newBasePrice}/hr, effective from ${format(new Date(effectiveFromDateTime), 'dd MMM yyyy, hh:mm a')}. Existing confirmed bookings remain completely immutable.`
      })

      loadAllPricingData()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to change base price.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. Copy Pricing from Selected Date to Target Date
  const handleCopyPricing = async () => {
    if (!selectedVenue) return

    try {
      setIsSubmitting(true)
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

      loadAllPricingData()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to copy pricing.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 5. Reset Override to Base Price
  const handleResetOverride = async (ruleId: string) => {
    if (!confirm('Are you sure you want to reset this pricing override back to the applicable base rate?')) return

    try {
      setIsSubmitting(true)
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
        text: 'Pricing override reset successfully. Facility will now use applicable base rate.'
      })

      loadAllPricingData()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset pricing.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto text-slate-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Authoritative Pricing Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Manage base facility pricing, future effective-date changes, peak-hour slot rates, and tournament pricing
          </p>
        </div>

        <button
          onClick={() => setShowBasePriceModal(true)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
        >
          <TrendingUp size={16} /> Change Base Price From Date
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION A: CURRENT BASE PRICING SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cricket Net 1</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">NET 1</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">₹299 <span className="text-xs text-slate-500 font-normal">/ hour</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Pro synthetic cricket batting net</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cricket Net 2</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">NET 2</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">₹299 <span className="text-xs text-slate-500 font-normal">/ hour</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Pro cricket practice net</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Football Turf</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">MAIN TURF</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2">₹999 <span className="text-xs text-slate-500 font-normal">/ hour</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">10,000+ sq. ft. FIFA-grade synthetic turf</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bowling Machine</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">ADD-ON</span>
          </div>
          <p className="text-2xl font-extrabold text-purple-700 mt-2">₹299 <span className="text-xs text-slate-500 font-normal">/ hour</span></p>
          <span className="text-[11px] text-slate-500 mt-1 block">Variable speed & swing automated feeder</span>
        </div>
      </div>

      {/* SECTION B & C: DYNAMIC OVERRIDE CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Venue & Target Date Selector */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-6">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-emerald-600" />
            1. Select Facility & Target Date
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Sports Facility</label>
            <div className="space-y-2">
              {venues.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenue(v)}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${
                    selectedVenue?.id === v.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs ring-1 ring-emerald-400'
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
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Target Override Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-bold"
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
            <p className="font-bold text-slate-900">Active Pricing Precedence:</p>
            <ol className="list-decimal pl-4 text-slate-600 text-[11px] space-y-1">
              <li><strong>Slot Override</strong> (Priority 10)</li>
              <li><strong>Date Override</strong> (Priority 5)</li>
              <li><strong>Base Rate History</strong> (Active on slot date)</li>
              <li><strong>Baseline Rate</strong> (₹999 Turf / ₹299 Nets)</li>
            </ol>
          </div>
        </div>

        {/* Middle Column: Slot Selector & Override Amount */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-emerald-600" />
              2. Select Hourly Slots & Apply Override Rate
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
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(Number(e.target.value))}
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
              onClick={handleApplySlotOverride}
              disabled={isSubmitting || selectedSlots.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Apply Slot Override
            </button>
          </div>
        </div>
      </div>

      {/* SECTION D: DATE RANGE OVERRIDE TOOL */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
        <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <CalendarIcon size={18} className="text-emerald-600" />
          Date Range Override (Multi-Day Tournaments / Holidays)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
            <input
              type="date"
              value={rangeStartDate}
              onChange={(e) => setRangeStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date</label>
            <input
              type="date"
              value={rangeEndDate}
              onChange={(e) => setRangeEndDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rate / Hour (₹)</label>
            <input
              type="number"
              value={rangePrice}
              onChange={(e) => setRangePrice(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyRangeOverride}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : 'Apply Range Override'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION E: ACTIVE OVERRIDES TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-slate-900">Active Pricing Overrides</h2>
            <p className="text-xs text-slate-500 mt-0.5">Custom date and slot overrides active in Supabase</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
            {activeOverrides.length} Active Rules
          </span>
        </div>

        {activeOverrides.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Facility & Rule</th>
                  <th className="px-5 py-3.5">Dates Active</th>
                  <th className="px-5 py-3.5">Time Window</th>
                  <th className="px-5 py-3.5">Override Rate</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activeOverrides.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block">{rule.venues?.name || 'MSC Venue'}</span>
                      <span className="text-[10px] text-slate-400">{rule.name}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {rule.start_date ? `${rule.start_date} ${rule.end_date && rule.end_date !== rule.start_date ? `to ${rule.end_date}` : ''}` : 'All Dates'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {rule.start_time} – {rule.end_time}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700 text-sm">
                      ₹{rule.hourly_rate}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleResetOverride(rule.id)}
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

      {/* SECTION F: BASE PRICING HISTORY (REAL DATABASE RECORDS ONLY) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <History size={18} className="text-emerald-600" />
            Base Price History & Effective Rates Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Authoritative history of base rates and effective start dates</p>
        </div>

        {baseRatesHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Target Facility / Resource</th>
                  <th className="px-5 py-3.5">Base Rate</th>
                  <th className="px-5 py-3.5">Effective From</th>
                  <th className="px-5 py-3.5">Reason / Notes</th>
                  <th className="px-5 py-3.5">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {baseRatesHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {item.venues?.name || item.resources?.name || 'MSC Baseline'}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-emerald-700 text-sm">
                      ₹{item.base_price}/hr
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {format(new Date(item.effective_from), 'dd MMM yyyy, hh:mm a')}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {item.reason || 'Base Rate Adjustment'}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      {format(new Date(item.created_at), 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No base rate changes recorded yet. Initial baseline is active across all facilities.
          </div>
        )}
      </div>

      {/* CHANGE BASE PRICE MODAL ("CHANGE FROM NOW ON") */}
      {showBasePriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Change Base Price</h3>
                  <p className="text-xs text-slate-500">Effective from selected date/time forward</p>
                </div>
              </div>
              <button onClick={() => setShowBasePriceModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangeBasePrice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBasePriceTargetType('venue')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      basePriceTargetType === 'venue' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Sports Facility
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasePriceTargetType('bowling_machine')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      basePriceTargetType === 'bowling_machine' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Bowling Machine Add-On
                  </button>
                </div>
              </div>

              {basePriceTargetType === 'venue' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Select Facility</label>
                  <select
                    value={basePriceVenueId}
                    onChange={(e) => setBasePriceVenueId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.sport_type})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">New Base Price (₹/hr)</label>
                  <input
                    type="number"
                    required
                    value={newBasePrice}
                    onChange={(e) => setNewBasePrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Effective From Date/Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={effectiveFromDateTime}
                    onChange={(e) => setEffectiveFromDateTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Reason / Note</label>
                <input
                  type="text"
                  required
                  value={basePriceReason}
                  onChange={(e) => setBasePriceReason(e.target.value)}
                  placeholder="e.g. Summer rate increase, New season pricing"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                <strong>Price Immutability Guaranteed:</strong> All existing confirmed bookings will strictly preserve their original paid amount and will NEVER be recalculated.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBasePriceModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Save Base Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
