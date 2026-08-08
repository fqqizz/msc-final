'use client'

import { useEffect, useState } from 'react'
import { FileText, Save, CheckCircle2, Loader2, Image as ImageIcon, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminCMSPage() {
  const [settings, setSettings] = useState<any>({
    site_name: 'Maqbool Sports Complex',
    tagline: 'Kashmir Premier Sports Facility',
    contact_email: 'info@maqboolsports.in',
    contact_phone: '+91 9906000000',
    address: 'Sector 4, Baramulla, Jammu & Kashmir 190001'
  })
  const [faqs, setFaqs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadCMS() {
      try {
        setIsLoading(true)
        const { data: sData } = await supabase.from('cms_website_settings').select('*').maybeSingle()
        if (sData) setSettings(sData)

        const { data: fData } = await supabase.from('cms_faqs').select('*').order('display_order')
        if (fData) setFaqs(fData)
      } catch (err) {
        console.error('Error loading CMS:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCMS()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus(null)

    try {
      const { error } = await supabase
        .from('cms_website_settings')
        .upsert({
          ...settings,
          contact_email: 'info@maqboolsports.in' // Strictly enforce official email
        })

      if (error) {
        setSaveStatus(`Failed to save: ${error.message}`)
      } else {
        setSaveStatus('Website CMS settings saved successfully.')
      }
    } catch (err: any) {
      setSaveStatus(err.message)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Website CMS & Content Editor
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Edit public contact details, official support email, address, and live FAQs
        </p>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-emerald-600" size={16} /> Public Contact Info
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Site Title</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Support Email (Official)</label>
            <input
              type="email"
              value="info@maqboolsports.in"
              readOnly
              className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Facility Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Save size={14} /> Save CMS Settings
          </button>
        </form>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="text-sky-600" size={16} /> Frequently Asked Questions
          </h3>

          <div className="space-y-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-900">{faq.question}</span>
                <p className="text-slate-500">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
