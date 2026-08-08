'use client'

import { useEffect, useState } from 'react'
import { CreditCard, AlertCircle, RefreshCw, CheckCircle2, DollarSign, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [refunds, setRefunds] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'payments' | 'failures' | 'refunds'>('payments')
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadFinancials() {
      try {
        setIsLoading(true)
        const { data: pData } = await supabase.from('payments').select('*, bookings(booking_number)').order('created_at', { ascending: false })
        if (pData) setPayments(pData)

        const { data: aData } = await supabase.from('payment_attempts').select('*').order('attempted_at', { ascending: false })
        if (aData) setAttempts(aData)

        const { data: rData } = await supabase.from('refunds').select('*').order('created_at', { ascending: false })
        if (rData) setRefunds(rData)
      } catch (err) {
        console.error('Error loading payments:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadFinancials()
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          Payments, Failures & Refund Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Razorpay transaction history, failed payment attempts & customer refund processing
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'payments' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Confirmed Transactions ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('failures')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'failures' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Payment Failures ({attempts.filter(a => a.status === 'failed').length})
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'refunds' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Refund Requests ({refunds.length})
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 size={32} className="animate-spin mx-auto text-emerald-400 mb-2" />
            Loading financial ledger...
          </div>
        ) : activeTab === 'payments' ? (
          payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Payment ID</th>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Gateway / Method</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-semibold text-white">{p.razorpay_payment_id || p.id.slice(0, 8)}</td>
                      <td className="p-4 font-bold text-emerald-400">#{p.bookings?.booking_number || 'N/A'}</td>
                      <td className="p-4 uppercase">{p.gateway} ({p.payment_method || 'UPI'})</td>
                      <td className="p-4 font-bold text-white">₹{p.amount}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy @ h:mm a') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <CreditCard size={36} className="mx-auto text-slate-600 mb-2" />
              <p className="text-xs">No confirmed payment transactions on record.</p>
            </div>
          )
        ) : activeTab === 'failures' ? (
          <div className="py-12 text-center text-slate-400">
            <AlertCircle size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No payment failures logged today.</p>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-xs">No pending or processed refunds.</p>
          </div>
        )}
      </div>
    </div>
  )
}
