'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isResetMode, setIsResetMode] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/admin'

  const supabase = createClient()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email || !password) {
      setErrorMessage('Please enter your owner / staff credentials.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMessage(error.message === 'Invalid login credentials' ? 'Incorrect email or password. Please try again.' : error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Fetch profile to verify owner/staff role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

        const userRole = profile?.role || 'customer'
        if (userRole === 'customer') {
          setErrorMessage('Your account does not have access to MSC OS.')
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        window.location.href = redirectUrl || '/admin'
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'We couldn’t sign you in right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email) {
      setErrorMessage('Please enter your administrator email address.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password?redirect=/admin`
      })

      if (error) {
        setErrorMessage(error.message)
      } else {
        setSuccessMessage('Password reset link sent. Please check your email inbox.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to send password recovery email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-8 bg-white py-8 px-6 shadow-xl border border-slate-200/80 rounded-2xl sm:px-10 text-slate-900"
    >
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {isResetMode ? (
        <form className="space-y-4" onSubmit={handleForgotPassword}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Owner / Staff Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@maqboolsports.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending Recovery Link...
              </>
            ) : (
              'Send Password Reset Link'
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsResetMode(false)
                setErrorMessage(null)
                setSuccessMessage(null)
              }}
              className="text-xs text-slate-600 hover:text-slate-900 underline"
            >
              Back to Owner Sign In
            </button>
          </div>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleAdminLogin}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Owner / Staff Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@maqboolsports.in"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(true)
                  setErrorMessage(null)
                  setSuccessMessage(null)
                }}
                className="text-xs text-emerald-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Authenticating MSC OS...
              </>
            ) : (
              'Sign In to MSC OS'
            )}
          </button>
        </form>
      )}

      <div className="mt-8 text-center pt-4 border-t border-slate-100">
        <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
          &larr; Return to Public MSC Website
        </Link>
      </div>
    </motion.div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 shadow-sm transition-all"
        >
          <ArrowLeft size={16} />
          Back to MSC
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-3 text-emerald-800 shadow-sm">
            <Shield size={28} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            MSC OS
          </h2>
          <p className="mt-1 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Owner Access Portal
          </p>
        </div>

        <Suspense fallback={
          <div className="mt-8 p-12 text-center text-slate-400">
            <Loader2 size={32} className="animate-spin mx-auto text-emerald-600 mb-2" />
            Loading secure portal...
          </div>
        }>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
