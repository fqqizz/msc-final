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
  FileText,
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
      { name: 'Website CMS', href: '/admin/cms', icon: FileText },
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

  // 1. If we are on /admin/login, render children immediately (No layout interception, no blocking)
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // 2. Automatic redirect to /admin/login for unauthenticated users on protected admin routes
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/admin/login') {
      router.replace('/admin/login')
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  // 3. Unauthenticated on a protected admin route -> Render minimal redirect loader
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    )
  }

  // 4. Authenticated normal customer -> Access Restricted Screen
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
    router.replace('/admin/login')
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
            <span className="font-bold text-sm text-slate-900 tracking-wide block">
              MSC OS
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block">
              Owner Access Portal
            </span>
          </div>
        </div>

        {/* Grouped Navigation Sections */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {adminNavSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {sec.title}
              </span>
              <div className="space-y-0.5 pt-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-4 border-emerald-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Back to Public Site & User Info */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ArrowLeft size={13} /> Back to Public Site
          </Link>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-slate-900 truncate">
                {profile?.full_name || (role === 'owner' ? 'Eihab Naseer' : 'Admin User')}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold uppercase">{role}</span>
            </div>
            <button
              onClick={handleAdminSignOut}
              className="text-slate-400 hover:text-red-600 p-1 transition-colors"
              title="Sign Out of MSC OS"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100"
            >
              {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="font-bold text-xs text-slate-900">
              MSC OS ADMIN
            </span>
          </div>

          <Link href="/" className="text-xs text-emerald-700 font-semibold">
            Public Site →
          </Link>
        </header>

        {/* Mobile Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative flex-1 max-w-xs w-full bg-white border-r border-slate-200 p-4 flex flex-col h-full z-10">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">MSC OS Admin</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 space-y-3 overflow-y-auto">
                {adminNavSections.map((sec) => (
                  <div key={sec.title} className="space-y-1">
                    <span className="px-2 text-[10px] font-bold text-slate-400 uppercase">{sec.title}</span>
                    {sec.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                            isActive ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Icon size={16} />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content - Clean Light Theme */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 text-slate-900">
          {children}
        </main>
      </div>
    </div>
  )
}
