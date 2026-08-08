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
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-white/95 backdrop-blur-md border-b border-slate-200 ${
          scrolled ? 'py-2.5 shadow-sm' : 'py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo ONLY — No text beside the logo per directive */}
            <Link href="/" className="flex items-center group shrink-0" title="Maqbool Sports Complex">
              <div className="relative w-11 h-11 transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                  alt="Maqbool Sports Complex"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-all ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* CTAs & User Profile */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* BOOK NOW CTA — VISIBLE ON MOBILE & DESKTOP */}
              <Link
                href="/book-now"
                className="px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-xs rounded-xl transition-all shadow-sm shadow-emerald-600/20 active:scale-[0.98]"
              >
                Book Now
              </Link>

              {/* Logged Out Buttons */}
              {!user && !isLoading && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all"
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
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden relative">
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
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 py-1 text-slate-800"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {profile?.full_name || 'MSC Player'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <LayoutDashboard size={15} className="text-emerald-600" />
                            Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <UserIcon size={15} className="text-sky-600" />
                            Player Profile
                          </Link>
                          <Link
                            href="/dashboard?tab=bookings"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <CalendarCheck size={15} className="text-amber-600" />
                            My Bookings
                          </Link>
                          <Link
                            href="/leaderboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Trophy size={15} className="text-yellow-600" />
                            Leaderboard
                          </Link>

                          {isStaffOrOwner && (
                            <Link
                              href="/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-emerald-800 font-semibold bg-emerald-50 hover:bg-emerald-100 transition-colors border-t border-b border-emerald-100 my-1"
                            >
                              <Shield size={15} className="text-emerald-600" />
                              MSC OS Owner Access
                            </Link>
                          )}
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false)
                              logout()
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
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

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="relative w-9 h-9">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                      alt="MSC Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>

                <nav className="mt-6 space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          isActive ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 text-center font-semibold text-xs rounded-xl bg-slate-100 text-slate-800"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 text-center font-semibold text-xs rounded-xl bg-emerald-600 text-white"
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
                    className="w-full py-2.5 text-center font-semibold text-xs rounded-xl bg-red-50 text-red-600"
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
