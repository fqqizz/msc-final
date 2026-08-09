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
      const { data: vData } = await supabase
        .from('venues')
        .select('*')
        .neq('slug', 'bowling-nets')
        .order('display_order')
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
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Header Bar */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Venues & Facility Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Operational control of turf fields, cricket nets, automated bowling machines & maintenance locks
        </p>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Venue #{venue.display_order}</span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  venue.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {venue.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-2">{venue.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{venue.description}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Rate:</span>
                <span className="font-bold text-emerald-700">
                  {venue.sport_type === 'football' ? '₹999/hour' : '₹299/hour'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dimensions:</span>
                <span className="font-medium text-slate-900">{venue.dimensions || 'Standard'}</span>
              </div>

              <button
                onClick={() => handleToggleVenueStatus(venue.id, venue.status)}
                className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                  venue.status === 'active'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xs'
                }`}
              >
                {venue.status === 'active' ? 'Mark for Maintenance' : 'Activate Venue'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Shared Resource Card: Bowling Machine */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400">Shared Resource Conflict Engine</span>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">Automated Bowling Machine (BM-CRICKET-01)</h4>
          <p className="text-xs text-slate-500 mt-1">
            Linked to Cricket Net 1 & Cricket Net 2. Database concurrency locks prevent simultaneous double-booking.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-500">₹</span>
            <input
              type="number"
              value={bowlingRate}
              onChange={(e) => setBowlingRate(Number(e.target.value))}
              className="w-16 bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
            />
            <span className="text-xs text-slate-500">/hr</span>
          </div>

          <button
            onClick={handleSaveBowlingRate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shrink-0 shadow-2xs"
          >
            Update Rate
          </button>
        </div>
      </div>
    </div>
  )
}
