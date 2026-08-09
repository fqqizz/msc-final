'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Shield,
  CreditCard,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Loader2,
  AlertTriangle,
  Activity,
  Layers,
  ArrowLeft,
  Bell,
  Sliders
} from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'

const adminNavSections = [
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Overview', href: '/admin', icon: LayoutDashboard },
      { name: 'Bookings & Schedule', href: '/admin/bookings', icon: Calendar },
      { name: 'Pricing Overrides', href: '/admin/pricing', icon: DollarSign },
      { name: 'Venues & Operating Hours', href: '/admin/venues', icon: Layers },
      { name: 'Customers & Players', href: '/admin/customers', icon: Users },
      { name: 'Payments & Refunds', href: '/admin/payments', icon: CreditCard },
    ]
  },
  {
    title: 'INSIGHTS',
    items: [
      { name: 'Analytics & Heatmap', href: '/admin/analytics', icon: TrendingUp },
      { name: 'Leaderboard Ranking', href: '/leaderboard', icon: Sliders },
    ]
  },
  {
    title: 'COMMUNICATION',
    items: [
      { name: 'Alert Center', href: '/admin/notifications', icon: Bell },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Audit & Activity Logs', href: '/admin/audit', icon: Activity },
    ]
  }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, role, isLoading, logout } = useAuth()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // 1. If we are on /admin/login, render children immediately
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // 2. Automatic direct redirect to /admin/login for unauthenticated users on protected admin routes
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/admin/login') {
      window.location.replace('/admin/login')
    }
  }, [user, isLoading, pathname])

  // 3. Browser Notification Permission Request for Authenticated Admin Users
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && user && (role === 'owner' || role === 'super_admin' || role === 'reception')) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }
  }, [user, role])

  // 4. Real-time Browser Notifications for Operational Events
  useEffect(() => {
    if (!user || (role !== 'owner' && role !== 'super_admin' && role !== 'reception')) return

    const channel = supabase
      .channel('admin-global-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        const newLog = payload.new as any
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const action = newLog.action || 'MSC OS Event'
          const details = newLog.details?.reason || newLog.details?.venue_name || newLog.action
          try {
            new Notification(`MSC OS Alert — ${action.replace(/_/g, ' ')}`, {
              body: `${details}`,
              icon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png',
            })
          } catch (e) {
            // Notification failed gracefully
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, role])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  // Authenticated normal customer -> Access Restricted Screen
  const isAuthorized = role === 'super_admin' || role === 'owner' || role === 'reception'
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4">
        <div className="text-center max-w-md bg-white border border-red-200 p-8 rounded-3xl shadow-xl">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={44} />
          <h2 className="text-xl font-bold text-red-700">Access Restricted</h2>
          <p className="text-slate-600 mt-2 text-xs leading-relaxed">
            Your account role (<span className="capitalize font-bold text-slate-900">{role || 'Customer'}</span>) does not have owner administration permissions for MSC OS.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all shadow-sm"
            >
              Return to Customer Dashboard
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-900 underline mt-1"
            >
              Back to MSC Main Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleAdminSignOut = async () => {
    await logout()
    window.location.replace('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      {/* Sidebar Desktop - Clean Light Theme */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0 shadow-xs">
        {/* Admin Header / Logo */}
        <div className="p-5 border-b border-slate-200/80 flex items-center gap-3">
          <div className="relative w-9 h-9 overflow-hidden shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
              alt="MSC"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
              MSC OS
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Management Suite
            </p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {adminNavSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {sec.title}
              </p>
              {sec.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && <ChevronRight size={14} className="text-white/80" />}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* User Badge & Sign Out */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                {user.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {profile?.full_name || 'Eihab Naseer'}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold capitalize truncate">
                  {role === 'owner' ? 'Complex Owner' : role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 text-center py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 transition-all shadow-2xs"
            >
              Public Site
            </Link>
            <button
              onClick={handleAdminSignOut}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all"
              title="Sign Out of MSC OS"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-white h-full z-10 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="relative w-7 h-7">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                    alt="MSC"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-extrabold text-sm text-slate-900">MSC OS</span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {adminNavSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {sec.title}
                  </p>
                  {sec.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={16} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={handleAdminSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 font-semibold text-xs rounded-xl hover:bg-red-100 transition-colors"
              >
                <LogOut size={16} />
                Sign Out of MSC OS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Mobile */}
        <header className="lg:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <span className="font-extrabold text-sm text-slate-900">MSC OS</span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-emerald-700 px-3 py-1 bg-emerald-50 rounded-lg"
          >
            Public Site &rarr;
          </Link>
        </header>

        {/* Content Body with Spacing & Breathing Room */}
        <main className="flex-1 overflow-y-auto bg-slate-50/80 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {children}
        </main>
      </div>
    </div>
  )
}
