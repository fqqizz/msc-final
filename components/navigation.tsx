'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User as UserIcon, LayoutDashboard, Shield, LogOut, Trophy, Settings, CalendarCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'
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
  const { isMobile, performanceMode } = useMobilePerformance()
  const { user, profile, role, logout, isLoading } = useAuth()

  const isStaffOrOwner = role === 'super_admin' || role === 'owner' || role === 'reception'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform-gpu ${
          scrolled ? 'py-2' : 'py-4'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className={`flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-300 border border-emerald-500/20 shadow-lg
              ${performanceMode 
                ? 'bg-emerald-900/90 shadow-emerald-900/20'
                : 'bg-emerald-900/70 backdrop-blur-xl shadow-emerald-900/20'
              }
            `}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center group shrink-0">
              <div className="relative w-11 h-11 overflow-hidden transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                  alt="Maqbool Sports Complex Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="ml-2.5 font-display font-extrabold text-lg tracking-wider text-white hidden xl:inline-block">
                MSC OS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 lg:px-4 py-2 text-sm font-medium transition-all duration-200 relative group rounded-lg ${
                      isActive 
                        ? 'text-white bg-white/10'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.name}
                    <span className={`absolute bottom-1.5 left-3 right-3 h-0.5 bg-emerald-400 rounded-full transition-transform duration-200 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`} />
                  </Link>
                )
              })}
            </div>

            {/* CTA & User Profile Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* BOOK NOW CTA — VISIBLE ON ALL SCREEN SIZES INCLUDING MOBILE */}
              <Link
                href="/book-now"
                className="flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/30 hover:shadow-sky-400/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Book Now
              </Link>

              {/* Logged Out Controls */}
              {!user && !isLoading && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-800/50 rounded-xl transition-all"
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
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-colors border border-emerald-500/30"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden relative">
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
                        className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden z-50 text-white py-2"
                      >
                        <div className="px-4 py-3 border-b border-slate-800">
                          <p className="text-xs font-semibold text-white truncate">
                            {profile?.full_name || 'MSC Player'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {user.email}
                          </p>
                          <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded uppercase">
                            {role || 'Customer'}
                          </span>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <LayoutDashboard size={16} className="text-emerald-400" />
                            Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <UserIcon size={16} className="text-sky-400" />
                            Player Profile
                          </Link>
                          <Link
                            href="/dashboard?tab=bookings"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <CalendarCheck size={16} className="text-amber-400" />
                            My Bookings
                          </Link>
                          <Link
                            href="/leaderboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Trophy size={16} className="text-yellow-400" />
                            Leaderboard
                          </Link>

                          {isStaffOrOwner && (
                            <Link
                              href="/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-300 font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 transition-colors border-t border-b border-emerald-500/20 my-1"
                            >
                              <Shield size={16} className="text-emerald-400" />
                              Owner Admin OS
                            </Link>
                          )}
                        </div>

                        <div className="pt-1 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false)
                              logout()
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white/90 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/10"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 md:hidden transform-gpu"
            style={{ willChange: 'opacity' }}
          >
            <div 
              className="absolute inset-0 bg-black/70"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`absolute right-0 top-0 bottom-0 w-[300px] shadow-2xl border-l border-emerald-500/20 transform-gpu
                ${performanceMode
                  ? 'bg-slate-950'
                  : 'bg-slate-950/95 backdrop-blur-xl'
                }
              `}
              style={{ willChange: 'transform' }}
            >
              <div className="flex flex-col pt-20 px-6 h-full overflow-y-auto">
                <div className="space-y-1 pb-4 border-b border-slate-800">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block py-3 text-base transition-colors duration-200 ${
                          isActive 
                            ? 'text-emerald-400 font-bold' 
                            : 'text-slate-200 hover:text-white'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </div>

                <div className="py-4 space-y-3">
                  {!user ? (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 px-4 bg-slate-900 border border-slate-700 text-center font-semibold text-sm rounded-xl text-white"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 px-4 bg-emerald-600 text-center font-semibold text-sm rounded-xl text-white"
                      >
                        Register
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-3 px-4 bg-emerald-950/60 border border-emerald-500/30 text-center font-semibold text-sm rounded-xl text-emerald-300"
                      >
                        Dashboard
                      </Link>
                      {isStaffOrOwner && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full py-3 px-4 bg-amber-950/60 border border-amber-500/30 text-center font-semibold text-sm rounded-xl text-amber-300"
                        >
                          Owner Admin OS
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false)
                          logout()
                        }}
                        className="w-full py-3 px-4 bg-red-500/10 border border-red-500/30 text-center font-semibold text-sm rounded-xl text-red-400"
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
