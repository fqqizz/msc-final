'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    setIsLoading(true)

    try {
      // 1. SignUp with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
          }
        }
      })

      if (error) {
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        setSuccessMessage('Account created successfully! Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1500)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.')
      setIsLoading(false)
    }
  }

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
            Create Player Profile
          </h2>
          <p className="mt-2 text-xs text-emerald-100/70 max-w-xs mx-auto">
            Join Kashmir's premier sports complex operating system
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
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

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-start gap-3 text-emerald-200 text-xs shadow-md">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#00A86B]" />
              <span>{successMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Player Name"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-all text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
                Phone Number (Required for Booking WhatsApp Updates) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99060 00000"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-all text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
                Email Address *
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
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
                Password *
              </label>
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

            <div>
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#091b12] border border-emerald-500/25 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] transition-all text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#00A86B] hover:bg-[#007A52] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#00A86B]/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create MSC Account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors underline">
              Sign In Here
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
