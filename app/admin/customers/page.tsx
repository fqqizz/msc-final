'use client'

import { useEffect, useState } from 'react'
import { Users, Search, Trophy, Clock, CreditCard, Loader2, Phone, Mail, Calendar } from 'lucide-react'
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
        // Query user_profiles where role = 'customer' and join customer stats
        const { data } = await supabase
          .from('user_profiles')
          .select('*, customers(*)')
          .eq('role', 'customer')
          .order('created_at', { ascending: false })

        if (data) setCustomers(data)
      } catch (err) {
        console.error('Error loading customers:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  const filtered = customers.filter((p) => {
    return (
      (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Customer & Player Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Registered complex players, verified hours played, leaderboard tiers & lifetime spend
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name, email or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Loader2 size={28} className="animate-spin mx-auto text-emerald-600 mb-2" />
            Loading player records...
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Player Name</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Hours Played</th>
                  <th className="px-5 py-3.5">Bookings</th>
                  <th className="px-5 py-3.5">Total Spend</th>
                  <th className="px-5 py-3.5">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((p) => {
                  const cust = Array.isArray(p.customers) ? p.customers[0] : p.customers
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {p.full_name || 'MSC Player'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-slate-600">{p.email || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{p.phone || ''}</div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-700">
                        {cust?.hours_played || 0} hrs
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {cust?.total_bookings || 0}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        ₹{cust?.total_spend || 0}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {p.role}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-slate-500">
            <Users className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="font-semibold text-slate-700">No customers registered yet.</p>
            <p className="text-slate-400 mt-0.5">New player accounts will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}
