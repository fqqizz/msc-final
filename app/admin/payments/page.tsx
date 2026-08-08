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
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Payments, Failures & Refund Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Razorpay transaction history, failed payment attempts & customer refund records
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'payments' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Confirmed Transactions ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('failures')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'failures' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Payment Failures ({attempts.filter(a => a.status === 'failed').length})
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'refunds' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Refunds ({refunds.length})
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Loader2 size={28} className="animate-spin mx-auto text-emerald-600 mb-2" />
            Loading transaction records...
          </div>
        ) : activeTab === 'payments' ? (
          payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Payment ID</th>
                    <th className="px-5 py-3.5">Razorpay Order</th>
                    <th className="px-5 py-3.5">Booking</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-900 font-bold">{p.razorpay_payment_id || p.id.slice(0, 12)}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{p.razorpay_order_id || 'N/A'}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">#{p.bookings?.booking_number || 'Walk-in'}</td>
                      <td className="px-5 py-3.5 font-bold text-emerald-700">₹{p.amount}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {format(new Date(p.created_at), 'MMM d, yyyy @ h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-slate-500">
              <CreditCard className="mx-auto text-slate-400 mb-2" size={32} />
              <p className="font-semibold text-slate-700">No payment records yet.</p>
            </div>
          )
        ) : (
          <div className="text-center py-16 text-xs text-slate-500">
            <CheckCircle2 className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="font-semibold text-slate-700">No entries in this view.</p>
          </div>
        )}
      </div>
    </div>
  )
}
