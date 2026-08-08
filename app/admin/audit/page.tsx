'use client'

import { useEffect, useState } from 'react'
import { Activity, Shield, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadAudit() {
      try {
        setIsLoading(true)
        const { data } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100)

        if (data) setLogs(data)
      } catch (err) {
        console.error('Audit log error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAudit()
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          System Audit & Domain Event Logs
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable audit trail of RBAC changes, pricing updates, and booking transactions
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Loader2 size={28} className="animate-spin mx-auto text-emerald-600 mb-2" />
            Loading audit records...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500">
                      {format(new Date(log.timestamp), 'MMM d @ h:mm:ss a')}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{log.action_type || log.action}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {log.entity_type || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{log.details?.reason || log.details?.message || log.details || 'Action completed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-xs text-slate-500">
            <Activity className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="font-semibold text-slate-700">Audit log stream active.</p>
            <p className="text-slate-400 mt-0.5">Administrative changes will be recorded here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
