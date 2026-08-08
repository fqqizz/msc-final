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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          Website CMS & Content Control
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage homepage content, contact information, FAQs and promotional banners
        </p>
      </div>

      {saveStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Website Business Settings Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <h3 className="text-lg font-bold font-display text-white mb-4">
          Core Contact & Business Identity
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Site Title</label>
            <input
              type="text"
              value={settings.site_name}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Official Support Email</label>
              <input
                type="email"
                disabled
                value="info@maqboolsports.in"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Facility Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <Save size={16} /> Save CMS Settings
          </button>
        </form>
      </div>
    </div>
  )
}
