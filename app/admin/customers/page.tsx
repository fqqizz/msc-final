'use client'

import { useEffect, useState } from 'react'
import { Users, Search, Trophy, Clock, CreditCard, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadCustomers() {
      try {
        setIsLoading(true)
        const { data } = await supabase
          .from('customers')
          .select('*, user_profiles(full_name, email, phone, avatar_url, role)')
          .order('total_spend', { ascending: false })

        if (data) setCustomers(data)
      } catch (err) {
        console.error('Error loading customers:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  const filtered = customers.filter((c) => {
    const p = c.user_profiles || {}
    return (
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          Customer & Player Identities
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Registered complex players, verified hours played & spending tiers
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name, email or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 size={32} className="animate-spin mx-auto text-emerald-400 mb-2" />
            Loading customer records...
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Player Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Hours Played</th>
                  <th className="p-4">Total Bookings</th>
                  <th className="p-4">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white">
                      {c.user_profiles?.full_name || 'MSC Player'}
                    </td>
                    <td className="p-4">
                      <p className="text-white">{c.user_profiles?.email || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400">{c.user_profiles?.phone || ''}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {c.tier || 'new'}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-emerald-400">{c.hours_played || 0} hrs</td>
                    <td className="p-4 font-semibold text-white">{c.total_bookings || 0}</td>
                    <td className="p-4 font-bold text-white">₹{c.total_spend || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Users size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No registered customer records found yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
