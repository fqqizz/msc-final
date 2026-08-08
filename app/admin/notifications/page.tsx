'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Filter, AlertTriangle, Info, AlertCircle, RefreshCw, Calendar, CreditCard, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type NotificationItem = {
  id: string
  action: string
  entity_type: string
  entity_id: string
  details: {
    title?: string
    message?: string
    booking_number?: string
    amount?: number
    severity?: 'INFO' | 'WARNING' | 'CRITICAL'
    reason?: string
  }
  created_at: string
  is_read?: boolean
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) {
        const formatted: NotificationItem[] = data.map((item) => ({
          id: item.id,
          action: item.action,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          details: item.details || {},
          created_at: item.created_at,
          is_read: false,
        }))
        setNotifications(formatted)
      }
    } catch (err) {
      console.error('Error fetching admin notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Realtime alerts channel
    const channel = supabase
      .channel('admin-realtime-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        const newItem: NotificationItem = {
          id: payload.new.id,
          action: payload.new.action,
          entity_type: payload.new.entity_type,
          entity_id: payload.new.entity_id,
          details: payload.new.details || {},
          created_at: payload.new.created_at,
          is_read: false,
        }
        setNotifications((prev) => [newItem, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = notifications.filter((n) => {
    if (filterSeverity === 'ALL') return true
    return n.details.severity === filterSeverity
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Admin Alert Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time operations stream, confirmed bookings, payment failures & price overrides
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw size={14} /> Refresh Feed
        </button>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
              filterSeverity === sev
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Notification Stream */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.action}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-slate-200 text-slate-700">
                      {item.entity_type}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{item.details?.message || item.details?.reason || 'Event recorded in MSC OS'}</p>
                </div>

                <span className="text-[11px] text-slate-400 shrink-0">
                  {format(new Date(item.created_at), 'MMM d @ h:mm a')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-slate-500">
            <Bell className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="font-semibold text-slate-700">No notifications in this filter.</p>
            <p className="text-slate-400 mt-0.5">Real-time alerts will trigger automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}
