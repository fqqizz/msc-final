import type { Metadata, Viewport } from 'next'
import { Inter, Anton } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Chatbot from '@/components/chatbot'
import Preloader from '@/components/preloader'
import ScrollProgress from '@/components/scroll-progress'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const anton = Anton({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-anton',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Maqbool Sports Complex | Premier Sports Hub in Baramulla, Kashmir',
  description: 'Community-centric premier sports hub in Baramulla offering 10,000+ sq. ft. synthetic turf for football, cricket, and more. Book your slot today at Kashmir\'s first dedicated turf facility.',
  keywords: 'football turf Baramulla, cricket nets Kashmir, sports complex Baramulla, turf booking Kashmir, MSC Baramulla, sports academy Kashmir',
  authors: [{ name: 'Maqbool Sports Complex' }],
  openGraph: {
    title: 'Maqbool Sports Complex | Premier Sports Hub in Kashmir',
    description: 'Community-centric premier sports hub offering facilities for football, cricket, and more.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Maqbool Sports Complex',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maqbool Sports Complex',
    description: 'Premier sports hub in Baramulla, Kashmir',
  },
  icons: {
    icon: [
      { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png' }
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#2BA84A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground overflow-x-hidden">
        <Preloader />
        <ScrollProgress />
        {children}
        <Chatbot />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
