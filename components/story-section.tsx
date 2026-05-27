'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { Users, Clock, Zap, Shield } from 'lucide-react'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

const features = [
  {
    icon: Users,
    title: 'Pro-Grade Turf',
    description: '10,000+ sq. ft. FIFA-standard synthetic turf for professional play.',
  },
  {
    icon: Zap,
    title: 'Stadium Lighting',
    description: 'Professional floodlights for dramatic night matches.',
  },
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: 'Open from early morning to late night for your convenience.',
  },
  {
    icon: Shield,
    title: 'Safety First',
    description: 'Premium netting and protective barriers all around.',
  },
]

const GPU_ACCELERATED = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const,
} as const

export default function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoError, setVideoError] = useState(false)
  const { isMobile, performanceMode } = useMobilePerformance()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  })

  // Scroll transforms
  const scrollY1 = useTransform(scrollYProgress, [0, 1], [100, -100])
  const scrollY2 = useTransform(scrollYProgress, [0, 1], [50, -50])
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  // Conditionally bypass scroll transforms on mobile for massive rendering/FPS improvements
  const y1 = performanceMode ? 0 : scrollY1
  const y2 = performanceMode ? 0 : scrollY2
  const opacity = performanceMode ? 1 : scrollOpacity

  return (
    <section 
      ref={containerRef} 
      className="relative py-24 sm:py-32 bg-[#050505] overflow-hidden" 
      id="facilities"
      style={GPU_ACCELERATED}
    >
      {/* Background video - completely disabled on mobile/performance mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={GPU_ACCELERATED}>
        {!performanceMode && !videoError ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            style={GPU_ACCELERATED}
          >
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-151-fYjIPrnKbDdamuTeVODRfv9CWEkm0R.mp4" type="video/mp4" />
          </video>
        ) : (
          /* High-quality static image placeholder for mobile (opacity 20% matches original look) */
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-ZqzcvzltRL7HSNeJ3IYVgSVuOd6b5R.webp"
            alt="MSC Night Turf Background"
            fill
            className="object-cover opacity-20 filter blur-[2px]"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/80 to-[#050505]" />
      </div>
      
      {/* Background ambient glow - simplified on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={GPU_ACCELERATED}>
        <div className={`absolute top-1/4 right-0 rounded-full bg-[#2BA84A]/5 blur-[100px] transform-gpu
          ${isMobile ? 'w-[250px] h-[250px]' : 'w-[500px] h-[500px]'}`} />
        {!isMobile && (
          <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-[#7DD3FC]/5 rounded-full blur-[150px] transform-gpu" />
        )}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          style={{ opacity }}
          className="text-center mb-16 sm:mb-20 transform-gpu"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-[#2BA84A]/10 border border-[#2BA84A]/20 rounded-full text-[#2BA84A] text-sm font-medium mb-6"
          >
            Built For Athletes
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight"
          >
            PLAY UNDER THE LIGHTS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-white/60 max-w-2xl mx-auto"
          >
            Professional-grade football turf and cricket nets engineered for performance, training, and competition.
          </motion.p>
        </motion.div>

        {/* Image grid with parallax - bypassed on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 sm:mb-20">
          {/* Large image */}
          <motion.div 
            style={{ y: y1 }}
            className="relative aspect-[4/3] rounded-3xl overflow-hidden transform-gpu"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-ZqzcvzltRL7HSNeJ3IYVgSVuOd6b5R.webp"
              alt="Night football match at MSC"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-white">NIGHT MATCHES</h3>
              <p className="text-white/60 mt-2 text-sm sm:text-base">Friday night football under stadium lights</p>
            </div>
          </motion.div>

          {/* Smaller images */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              style={{ y: y2 }}
              className="relative aspect-square rounded-2xl overflow-hidden transform-gpu"
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/contact-fsgvfbe8149b7d7aaf60a37248cac104cff70-nopehSpkqvMqC7oJJY6RAFFztOHa5x.png"
                alt="MSC football turf daytime"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/60 to-transparent pointer-events-none" />
            </motion.div>
            <motion.div 
              style={{ y: y1 }}
              className="relative aspect-square rounded-2xl overflow-hidden transform-gpu"
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp"
                alt="Players on MSC turf"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/60 to-transparent pointer-events-none" />
            </motion.div>
            <motion.div 
              style={{ y: y2 }}
              className="relative aspect-square rounded-2xl overflow-hidden col-span-2 transform-gpu"
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/categoryww-11-5SQXOQi5VinDcWf4sCttNRzzVlb0gC.png"
                alt="MSC panoramic view"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/60 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-white/80 text-xs sm:text-sm">Surrounded by Kashmir&apos;s majestic mountains</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features grid - lighter visual classes (reduced shadows) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: (prefersReducedMotion || isMobile) ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: isMobile ? 0.05 : index * 0.1, duration: 0.4 }}
              className="bg-emerald-950/20 sm:glass border border-emerald-500/10 p-6 rounded-2xl group hover:border-[#2BA84A]/30 transition-all transform-gpu"
              style={GPU_ACCELERATED}
            >
              <div className="w-12 h-12 rounded-xl bg-[#2BA84A]/10 flex items-center justify-center mb-4 group-hover:bg-[#2BA84A]/20 transition-colors">
                <feature.icon className="w-6 h-6 text-[#2BA84A]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
