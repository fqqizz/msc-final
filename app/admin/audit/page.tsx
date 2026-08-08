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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          System Audit & Domain Event Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Immutable audit trail of RBAC changes, pricing updates, and booking transactions
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 size={32} className="animate-spin mx-auto text-emerald-400 mb-2" />
            Loading audit records...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Table / Entity</th>
                  <th className="p-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-400">
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM d, yyyy @ HH:mm:ss') : 'N/A'}
                    </td>
                    <td className="p-4 uppercase font-bold text-emerald-400">{log.action_type}</td>
                    <td className="p-4 text-white font-semibold">{log.table_name || 'N/A'}</td>
                    <td className="p-4 text-slate-300">{log.description || 'System operation executed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400">
            <Activity size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No audit events recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
