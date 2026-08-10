'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User as UserIcon, LayoutDashboard, Shield, LogOut, Trophy, CalendarCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Facilities', href: '/facilities' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Leaderboard', href: '/leaderboard' },
  { name: 'Contact', href: '/contact' },
  { name: 'FAQ', href: '/faqs' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile, role, logout, isLoading } = useAuth()

  const isStaffOrOwner = role === 'super_admin' || role === 'owner' || role === 'reception'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Body scroll lock on mobile drawer open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <>
      {/* FLOATING EMERALD GLASS NAVBAR */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8 ${
          scrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Premium emerald glass panel — lighter, more translucent, natural emerald */}
          <div
            className="flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(16,78,42,0.52) 0%, rgba(10,55,28,0.60) 100%)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(52,211,153,0.18)',
              boxShadow: '0 8px 32px rgba(10,50,24,0.28), inset 0 1px 0 rgba(110,231,183,0.10)',
            }}
          >
            {/* Glass highlight reflection strip — top-left diagonal gleam */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(110,231,183,0.22) 30%, rgba(110,231,183,0.10) 70%, transparent 100%)',
              }}
            />

            {/* Logo ONLY — No text beside the logo */}
            <Link href="/" className="flex items-center group shrink-0 relative z-10" title="Maqbool Sports Complex">
              <div className="relative w-10 h-10 overflow-hidden transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                  alt="Maqbool Sports Complex Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1 relative z-10">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3.5 py-2 text-xs font-medium transition-all duration-200 relative group rounded-xl ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/85 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.name}
                    <span className={`absolute bottom-1.5 left-3.5 right-3.5 h-0.5 bg-emerald-400 rounded-full transition-transform duration-200 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`} />
                  </Link>
                )
              })}
            </div>

            {/* CTAs & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 relative z-10">
              {/* BOOK NOW CTA */}
              <Link
                href="/book-now"
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-xs rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/30 hover:shadow-sky-400/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Book Now
              </Link>

              {/* Logged Out Controls */}
              {!user && !isLoading && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-200 bg-emerald-800/50 border border-emerald-400/25 hover:bg-emerald-700/50 rounded-xl transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Logged In Avatar Dropdown */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors border border-emerald-400/25"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs overflow-hidden relative">
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
                      ) : (
                        (profile?.full_name || user.email || 'P').charAt(0).toUpperCase()
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden z-50 text-white py-2"
                        style={{
                          background: 'linear-gradient(135deg, rgba(10,40,22,0.97) 0%, rgba(7,30,16,0.98) 100%)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,211,153,0.12)',
                        }}
                      >
                        <div className="px-4 py-3 border-b border-emerald-500/15">
                          <p className="text-xs font-semibold text-white truncate">
                            {profile?.full_name || 'MSC Player'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <LayoutDashboard size={15} className="text-emerald-400" />
                            Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <UserIcon size={15} className="text-sky-400" />
                            Player Profile
                          </Link>
                          <Link
                            href="/dashboard?tab=bookings"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <CalendarCheck size={15} className="text-amber-400" />
                            My Bookings
                          </Link>
                          <Link
                            href="/leaderboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Trophy size={15} className="text-yellow-400" />
                            Leaderboard
                          </Link>

                          {isStaffOrOwner && (
                            <Link
                              href="/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-300 font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 transition-colors border-t border-b border-emerald-500/20 my-1"
                            >
                              <Shield size={15} className="text-emerald-400" />
                              MSC OS Owner Access
                            </Link>
                          )}
                        </div>

                        <div className="pt-1 border-t border-emerald-500/15">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false)
                              logout()
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                          >
                            <LogOut size={15} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile Drawer Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white/90 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/10"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Premium Glass Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/55 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Floating Glass Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-0 bottom-0 w-[285px] flex flex-col justify-between p-6 overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, rgba(18,82,44,0.72) 0%, rgba(8,46,24,0.82) 60%, rgba(5,30,15,0.90) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderLeft: '1px solid rgba(52,211,153,0.18)',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.45), inset 1px 0 0 rgba(110,231,183,0.08)',
              }}
            >
              {/* Top highlight strip */}
              <div
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(110,231,183,0.18) 50%, transparent 100%)',
                }}
              />

              <div>
                <div className="flex items-center justify-between pb-4 border-b border-emerald-400/15">
                  <div className="relative w-9 h-9">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                      alt="MSC Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="mt-6 space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? 'text-white font-bold'
                            : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
                        }`}
                        style={isActive ? {
                          background: 'rgba(52,211,153,0.15)',
                          border: '1px solid rgba(52,211,153,0.22)',
                        } : {}}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-emerald-400/15 space-y-2">
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 text-center font-semibold text-xs rounded-xl text-white border border-emerald-400/20 hover:bg-white/10 transition-all"
                      style={{ background: 'rgba(255,255,255,0.07)' }}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 text-center font-semibold text-xs rounded-xl text-white shadow-md transition-all hover:opacity-90"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.85) 0%, rgba(16,144,64,0.90) 100%)',
                        boxShadow: '0 4px 16px rgba(34,197,94,0.25)',
                      }}
                    >
                      Register
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      logout()
                    }}
                    className="w-full py-2.5 text-center font-semibold text-xs rounded-xl text-red-300 hover:bg-red-500/20 transition-all border border-red-500/25"
                    style={{ background: 'rgba(239,68,68,0.10)' }}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
