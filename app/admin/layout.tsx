'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'

const adminNavItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Alert Center', href: '/admin/notifications', icon: Shield },
  { name: 'Bookings & Schedule', href: '/admin/bookings', icon: Calendar },
  { name: 'Pricing Overrides', href: '/admin/pricing', icon: DollarSign },
  { name: 'Venues & Pricing', href: '/admin/venues', icon: Layers },
  { name: 'Customers & Players', href: '/admin/customers', icon: Users },
  { name: 'Payments & Refunds', href: '/admin/payments', icon: CreditCard },
  { name: 'Website CMS', href: '/admin/cms', icon: FileText },
  { name: 'Analytics & Heatmap', href: '/admin/analytics', icon: TrendingUp },
  { name: 'Audit & System Logs', href: '/admin/audit', icon: Activity },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, role, isLoading, logout } = useAuth()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Automatic redirect to /admin/login for unauthenticated users per Directive 4
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    )
  }

  // Guest -> Redirect to /admin/login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4">
        <div className="text-center max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <Shield className="mx-auto text-emerald-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold font-display">Redirecting to MSC OS Login...</h2>
          <p className="text-slate-400 mt-2 text-sm">Owner & staff credentials required.</p>
          <Link
            href="/admin/login"
            className="inline-block mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl text-sm transition-all"
          >
            Sign In to MSC OS
          </Link>
        </div>
      </div>
    )
  }

  // Non-staff / Non-owner -> Server-side RBAC Unauthorized Screen per Directive 6
  const isAuthorized = role === 'super_admin' || role === 'owner' || role === 'reception'
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4">
        <div className="text-center max-w-md bg-slate-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl">
          <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold font-display text-red-400">Access Restricted</h2>
          <p className="text-slate-300 mt-2 text-sm">
            Your account role (<span className="capitalize font-bold text-white">{role || 'Customer'}</span>) does not have owner administration permissions for MSC OS.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Return to Customer Dashboard
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:underline"
            >
              Back to MSC Main Website
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Admin Header / Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
              alt="MSC"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-white tracking-wider block">
              MSC OS ADMIN
            </span>
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest block">
              Production Build
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Back to Website & User Info */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> Back to Public Site
          </Link>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Admin User'}</p>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">{role}</span>
            </div>
            <button
              onClick={() => logout()}
              className="text-slate-400 hover:text-red-400 p-1 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800"
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-display font-bold text-sm tracking-wider text-white">
              MSC OS ADMIN
            </span>
          </div>

          <Link href="/" className="text-xs text-emerald-400 font-semibold">
            Public Site →
          </Link>
        </header>

        {/* Mobile Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/80" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative flex-1 max-w-xs w-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col h-full z-10">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <span className="font-display font-bold text-base text-white">MSC OS Admin</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto">
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}
