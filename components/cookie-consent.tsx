'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X, Check, Settings } from 'lucide-react'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false) // OFF by default

  useEffect(() => {
    const consent = localStorage.getItem('msc_cookie_consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem(
      'msc_cookie_consent',
      JSON.stringify({ essential: true, analytics: true, marketing: true, timestamp: new Date().toISOString() })
    )
    setShowBanner(false)
    setShowModal(false)
  }

  const handleEssentialOnly = () => {
    localStorage.setItem(
      'msc_cookie_consent',
      JSON.stringify({ essential: true, analytics: false, marketing: false, timestamp: new Date().toISOString() })
    )
    setShowBanner(false)
    setShowModal(false)
  }

  const handleSaveCustom = () => {
    localStorage.setItem(
      'msc_cookie_consent',
      JSON.stringify({ essential: true, analytics, marketing, timestamp: new Date().toISOString() })
    )
    setShowBanner(false)
    setShowModal(false)
  }

  if (!showBanner && !showModal) return null

  return (
    <>
      {/* Minimal Sticky Cookie Banner */}
      {showBanner && !showModal && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-4 bg-slate-900/95 border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-xl text-white text-xs space-y-3">
          <div className="flex items-start gap-3">
            <Cookie size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cookie Preferences</p>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                MSC uses essential cookies to ensure secure booking and session operations.{' '}
                <Link href="/privacy-policy" className="text-emerald-400 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAcceptAll}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              Accept All
            </button>
            <button
              onClick={handleEssentialOnly}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
            >
              Essential Only
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="p-2 text-slate-400 hover:text-white"
              title="Manage Preferences"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detailed Preferences Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-display">Manage Cookie Preferences</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Essential Cookies</p>
                  <p className="text-[10px] text-slate-400">Required for authentication, slot locks & payments.</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded uppercase">
                  Always Active
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Analytics Cookies</p>
                  <p className="text-[10px] text-slate-400">Helps us optimize facility performance and loading times.</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Marketing Cookies</p>
                  <p className="text-[10px] text-slate-400">Used for personalized tournament & promo code notifications.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleSaveCustom}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
