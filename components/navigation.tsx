'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User as UserIcon, LayoutDashboard, Shield, LogOut, Trophy, CalendarCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import PlayerAvatar from '@/components/ui/player-avatar'

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
  const dropdownRef = useRef<HTMLDivElement>(null)
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

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  // Close dropdown on route change
  useEffect(() => {
    setProfileDropdownOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])

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
      {/* FLOATING EMERALD GLASS NAVBAR (Elevated z-index to render cleanly above Hero, video, and cards) */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-300 px-4 sm:px-6 lg:px-8 ${
          scrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Main navbar bar (No overflow-hidden on outer wrapper to prevent clipping the floating dropdown) */}
          <div
            className="flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 relative"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 92, 67, 0.65) 0%, rgba(6, 37, 29, 0.85) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 168, 107, 0.22)',
              boxShadow: '0 10px 35px rgba(6, 37, 29, 0.45), inset 0 1px 0 rgba(221, 245, 234, 0.12)',
            }}
          >
            {/* Top highlight subtle gleam */}
            <div
              className="absolute top-0 left-6 right-6 h-px pointer-events-none rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0, 168, 107, 0.4) 30%, rgba(221, 245, 234, 0.25) 70%, transparent 100%)',
              }}
            />

            {/* Logo */}
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
                    <span
                      className={`absolute bottom-1.5 left-3.5 right-3.5 h-0.5 bg-[#2BA84A] rounded-full transition-transform duration-200 origin-left ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                )
              })}
            </div>

            {/* CTAs & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 relative z-10">
              {/* RESTORED SIGNATURE BLUE BOOK NOW CTA (Tactile Clay Depth) */}
              <Link
                href="/book-now"
                className="clay-button-blue px-4 py-2 sm:px-5 sm:py-2.5 text-white font-bold text-xs rounded-xl"
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
                    className="px-3.5 py-2 text-xs font-semibold text-[#DDF5EA] bg-[#007A52]/60 border border-[#00A86B]/30 hover:bg-[#005C43]/80 rounded-xl transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Logged In Single-Boundary Circular Profile Avatar (Requirement 1) */}
              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
                    aria-label="User Profile Menu"
                  >
                    <PlayerAvatar
                      name={profile?.full_name}
                      email={user.email}
                      avatarUrl={profile?.avatar_url || '/images/pfp.jpeg'}
                      size={36}
                    />
                  </button>

                  {/* PREMIUM DYNAMIC PROFILE DROPDOWN (Requirement 2 & 3) */}
                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-3 w-60 max-w-[calc(100vw-32px)] backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden z-[160] text-white py-2"
                        style={{
                          background: 'linear-gradient(145deg, rgba(6, 37, 29, 0.96) 0%, rgba(16, 20, 18, 0.97) 100%)',
                          border: '1px solid rgba(0, 168, 107, 0.20)',
                          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(221, 245, 234, 0.10)',
                        }}
                      >
                        {/* User Identity Header */}
                        <div className="px-4 py-3 border-b border-emerald-500/15 flex items-center gap-3">
                          <PlayerAvatar
                            name={profile?.full_name}
                            email={user.email}
                            avatarUrl={profile?.avatar_url || '/images/pfp.jpeg'}
                            size={38}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">
                              {profile?.full_name || 'MSC Player'}
                            </p>
                            <p className="text-[11px] text-emerald-300/70 truncate mt-0.5 font-medium">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <LayoutDashboard size={15} className="text-[#00A86B]" />
                            My Dashboard
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
                              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-300 font-semibold bg-[#005C43]/60 hover:bg-[#007A52]/60 transition-colors border-t border-b border-emerald-500/20 my-1"
                            >
                              <Shield size={15} className="text-emerald-400" />
                              MSC OS Owner Access
                            </Link>
                          )}
                        </div>

                        {/* Sign Out */}
                        <div className="pt-1 border-t border-emerald-500/15">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false)
                              logout()
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
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

              {/* Mobile Drawer Toggle */}
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
            className="fixed inset-0 z-[170] md:hidden"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/65 backdrop-blur-sm"
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
                background: 'linear-gradient(160deg, rgba(6, 37, 29, 0.95) 0%, rgba(0, 92, 67, 0.85) 60%, rgba(16, 20, 18, 0.98) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderLeft: '1px solid rgba(0, 168, 107, 0.25)',
                boxShadow: '-10px 0 45px rgba(0,0,0,0.55)',
              }}
            >
              {/* Top highlight strip */}
              <div
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(0, 168, 107, 0.35) 50%, transparent 100%)',
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
                        style={
                          isActive
                            ? {
                                background: 'rgba(0, 168, 107, 0.25)',
                                border: '1px solid rgba(0, 168, 107, 0.35)',
                              }
                            : {}
                        }
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
                        background: 'linear-gradient(135deg, #00A86B 0%, #007A52 100%)',
                        boxShadow: '0 4px 16px rgba(0, 168, 107, 0.35)',
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
