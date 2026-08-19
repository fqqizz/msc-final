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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#0e2419]/90 backdrop-blur-xl py-8 px-6 shadow-2xl border border-emerald-500/25 rounded-3xl sm:px-10 text-white"
    >
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs shadow-md">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
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
              placeholder="player@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-all text-xs"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
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
              className="w-full pl-10 pr-10 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-all text-xs"
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

        <div className="flex items-center justify-between py-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-emerald-500/30 bg-[#091b12] text-[#00A86B] focus:ring-[#00A86B]"
            />
            <span>Remember my session</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-[#00A86B] hover:bg-[#007A52] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#00A86B]/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In to MSC'
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-slate-400">
        Don't have an MSC account?{' '}
        <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors underline">
          Create Player Account
        </Link>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#061a12] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#00A86B]/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[#005C43]/10 blur-[130px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300/80 hover:text-white mb-8 transition-colors px-3.5 py-2 rounded-xl bg-white/5 border border-emerald-500/20 hover:bg-white/10"
        >
          <ArrowLeft size={16} /> Back to MSC Home
        </Link>

        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4 drop-shadow-[0_4px_16px_rgba(0,168,107,0.35)]">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
              alt="Maqbool Sports Complex Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Player Sign In
          </h2>
          <p className="mt-2 text-xs text-emerald-100/70 max-w-xs mx-auto">
            Sign in to access your player profile, booking history & leaderboard stats
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <Suspense fallback={
          <div className="p-12 text-center text-slate-400 bg-[#0e2419]/90 rounded-3xl border border-emerald-500/20">
            <Loader2 className="animate-spin mx-auto text-emerald-400 mb-2" size={24} />
            Loading Sign In...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
