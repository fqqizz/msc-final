'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldAlert, FileText, RefreshCw, CheckCircle2, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { POLICIES, PolicyDocument } from '@/data/policies'

export type PolicyType = 'cancellation' | 'refund' | 'terms'

// Custom event to trigger policy modal from anywhere in the app without page reload
export function openPolicyModal(type: PolicyType) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-msc-policy-modal', { detail: { type } }))
  }
}

export default function PolicyModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeType, setActiveType] = useState<PolicyType>('cancellation')

  const handleOpen = useCallback((e: Event) => {
    const customEvent = e as CustomEvent<{ type: PolicyType }>
    if (customEvent.detail?.type && POLICIES[customEvent.detail.type]) {
      setActiveType(customEvent.detail.type)
      setIsOpen(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('open-msc-policy-modal', handleOpen)

    // Also attach to any clickable links with data-policy attribute
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-policy]')
      if (target) {
        const policyType = target.getAttribute('data-policy') as PolicyType
        if (policyType && POLICIES[policyType]) {
          e.preventDefault()
          setActiveType(policyType)
          setIsOpen(true)
        }
      }
    }

    document.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('open-msc-policy-modal', handleOpen)
      document.removeEventListener('click', handleClick)
    }
  }, [handleOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const policy: PolicyDocument = POLICIES[activeType] || POLICIES.cancellation

  const getDedicatedUrl = (type: PolicyType) => {
    switch (type) {
      case 'cancellation':
        return '/cancellation-policy'
      case 'refund':
        return '/refund-policy'
      case 'terms':
        return '/terms-conditions'
      default:
        return '/cancellation-policy'
    }
  }

  const getPolicyIcon = (type: PolicyType) => {
    switch (type) {
      case 'cancellation':
        return <ShieldAlert className="text-emerald-700" size={22} />
      case 'refund':
        return <RefreshCw className="text-emerald-700" size={22} />
      case 'terms':
        return <FileText className="text-emerald-700" size={22} />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with click-outside-to-close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
            className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10 text-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  {getPolicyIcon(activeType)}
                </div>
                <div>
                  <h3 id="policy-modal-title" className="text-lg font-bold text-slate-900 leading-tight">
                    {policy.title}
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                    Maqbool Sports Complex
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Summary Pill / Alert */}
            <div className="px-6 py-3 bg-emerald-50/60 border-b border-emerald-100/60 flex items-start gap-2.5 text-xs text-emerald-950">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-emerald-900">{policy.summary.highlight}: </strong>
                <span>{policy.summary.description}</span>
              </div>
            </div>

            {/* Scrollable Policy Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-xs text-slate-700 leading-relaxed">
              {policy.sections.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">{section.title}</h4>
                  {Array.isArray(section.content) ? (
                    <ul className="space-y-1.5 pl-3 list-disc marker:text-emerald-500">
                      {section.content.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="whitespace-pre-line">{section.content}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer with Close Button */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 text-xs">
              <span className="text-slate-400 font-medium">
                Maqbool Sports Complex
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Understood & Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
