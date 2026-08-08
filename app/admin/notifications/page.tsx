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
      const { data, error } = await supabase
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

    // Realtime Subscription to audit_logs / operational events
    const channel = supabase
      .channel('admin-alerts-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
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
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = notifications.filter((n) => {
    const sev = n.details.severity || 'INFO'
    if (filterSeverity === 'ALL') return true
    return sev === filterSeverity
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={24} className="text-emerald-400" />
            <h1 className="text-2xl font-bold font-display text-white">MSC OS Alert Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time operational notifications, payment events & facility security alerts
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold rounded-xl text-slate-300 transition-all flex items-center gap-2"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh Alerts
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterSeverity === sev
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {sev === 'ALL' ? 'All Alerts' : sev}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading real-time operational alerts...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((item) => {
            const severity = item.details.severity || 'INFO'
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  severity === 'CRITICAL'
                    ? 'bg-red-950/30 border-red-500/40 text-red-200'
                    : severity === 'WARNING'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-950/80 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    {severity === 'CRITICAL' ? (
                      <AlertCircle className="text-red-400" size={20} />
                    ) : severity === 'WARNING' ? (
                      <AlertTriangle className="text-amber-400" size={20} />
                    ) : (
                      <Info className="text-emerald-400" size={20} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.action.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {item.details.title || item.details.reason || `Action executed on ${item.entity_type}`}
                      {item.details.booking_number ? ` (#${item.details.booking_number})` : ''}
                    </p>

                    <span className="text-[10px] text-slate-500 mt-2 block">
                      {format(new Date(item.created_at), 'MMM d, yyyy · h:mm:ss a')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No notification alerts recorded for the selected filter.
          </div>
        )}
      </div>
    </div>
  )
}
