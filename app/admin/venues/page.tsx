'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, DollarSign, Clock, Wrench, Shield, Save, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [pricingRules, setPricingRules] = useState<any[]>([])
  const [bowlingRate, setBowlingRate] = useState<number>(299)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const supabase = createClient()

  const loadVenuesAndPricing = async () => {
    try {
      setIsLoading(true)
      const { data: vData } = await supabase.from('venues').select('*').order('display_order')
      if (vData) setVenues(vData)

      const { data: pData } = await supabase.from('pricing_rules').select('*')
      if (pData) setPricingRules(pData)

      const { data: rData } = await supabase.from('resources').select('*').eq('code', 'BM-CRICKET-01').maybeSingle()
      if (rData && rData.hourly_extra_cost) {
        setBowlingRate(Number(rData.hourly_extra_cost))
      }
    } catch (err) {
      console.error('Error loading venue admin settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVenuesAndPricing()
  }, [])

  const handleToggleVenueStatus = async (venueId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'maintenance' : 'active'
    setSaveStatus(null)

    try {
      const { error } = await supabase
        .from('venues')
        .update({ status: nextStatus })
        .eq('id', venueId)

      if (error) {
        setSaveStatus(`Failed to update status: ${error.message}`)
      } else {
        setSaveStatus(`Venue status updated to ${nextStatus}.`)
        loadVenuesAndPricing()
      }
    } catch (err: any) {
      setSaveStatus(err.message)
    }
  }

  const handleSaveBowlingRate = async () => {
    setSaveStatus(null)
    try {
      const { error } = await supabase
        .from('resources')
        .update({ hourly_extra_cost: bowlingRate })
        .eq('code', 'BM-CRICKET-01')

      if (error) {
        setSaveStatus(`Failed: ${error.message}`)
      } else {
        setSaveStatus('Bowling Machine pricing updated successfully.')
      }
    } catch (err: any) {
      setSaveStatus(err.message)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          Venues & Dynamic Pricing Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage facility availability, peak hour surcharges, and bowling machine pricing
        </p>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <div key={venue.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {venue.sport_type}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  venue.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {venue.status}
                </span>
              </div>

              <h3 className="text-xl font-bold font-display text-white">{venue.name}</h3>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{venue.description}</p>
              <p className="text-xs text-slate-500 mt-2">Capacity: Max {venue.max_capacity} players</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Operating Status</span>
              <button
                onClick={() => handleToggleVenueStatus(venue.id, venue.status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  venue.status === 'active'
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {venue.status === 'active' ? 'Set Maintenance' : 'Activate Venue'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bowling Machine Admin Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <h3 className="text-lg font-bold font-display text-white flex items-center gap-2 mb-2">
          <Wrench className="text-sky-400" size={20} /> Shared Automated Bowling Machine Configuration
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          MSC operates ONE shared speed-variable bowling machine available across Cricket Net 1 and Net 2. Updating this rate locks future bookings automatically.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 max-w-md">
          <div className="relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
            <input
              type="number"
              value={bowlingRate}
              onChange={(e) => setBowlingRate(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSaveBowlingRate}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all shrink-0"
          >
            Save Machine Rate
          </button>
        </div>
      </div>
    </div>
  )
}
