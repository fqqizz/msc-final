'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [oauthNotice, setOauthNotice] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        router.push(redirectUrl)
        router.refresh()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialAuth = (provider: 'google' | 'facebook' | 'apple') => {
    setOauthNotice(`${provider.toUpperCase()} authentication is currently awaiting production API provider credentials in Supabase. Please log in using Email & Password.`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-8 bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-emerald-500/20 rounded-2xl sm:px-10"
    >
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {oauthNotice && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{oauthNotice}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Email Address
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
              placeholder="player@maqboolsports.in"
              className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Forgot password?
            </Link>
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
              className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30"
            />
            <span className="text-xs text-slate-300">Remember this device</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Authenticating...
            </>
          ) : (
            'Sign In to MSC'
          )}
        </button>
      </form>

      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-3 text-slate-500 font-medium">Or continue with</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleSocialAuth('google')}
          className="w-full flex items-center justify-center py-2.5 px-3 border border-slate-700/80 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 text-xs font-medium text-slate-300 hover:text-white transition-all"
        >
          Google
        </button>
        <button
          type="button"
          onClick={() => handleSocialAuth('facebook')}
          className="w-full flex items-center justify-center py-2.5 px-3 border border-slate-700/80 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 text-xs font-medium text-slate-300 hover:text-white transition-all"
        >
          Facebook
        </button>
        <button
          type="button"
          onClick={() => handleSocialAuth('apple')}
          className="w-full flex items-center justify-center py-2.5 px-3 border border-slate-700/80 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 text-xs font-medium text-slate-300 hover:text-white transition-all"
        >
          Apple
        </button>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400">
        Don't have an MSC account?{' '}
        <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
          Create Player Account
        </Link>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/90 hover:text-white transition-all duration-200"
        >
          <ArrowLeft size={16} />
          Back to MSC
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-16 h-16 mb-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
              alt="Maqbool Sports Complex"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight font-display text-white">
            Welcome to MSC OS
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your player profile, booking history & leaderboard stats
          </p>
        </div>

        <Suspense fallback={
          <div className="mt-8 p-12 text-center text-slate-400">
            <Loader2 size={32} className="animate-spin mx-auto text-emerald-400 mb-2" />
            Loading authentication...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
