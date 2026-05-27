'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)
  const { isMobile, performanceMode } = useMobilePerformance()

  useEffect(() => {
    // 1. Determine durations based on mobile/performance mode
    const durationMultiplier = performanceMode ? 0.55 : 0.75 // Faster on mobile (1.2s max), sleek on desktop (1.6s max)
    
    const tPhase1 = Math.round(200 * durationMultiplier)
    const tPhase2 = Math.round(600 * durationMultiplier)
    const tPhase3 = Math.round(1200 * durationMultiplier)
    const tHide = Math.round(2200 * durationMultiplier)

    // 2. Progress animation (faster on mobile for Snappiness)
    const intervalTime = performanceMode ? 25 : 40
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        // Smooth easing - faster at start, slower near end
        const increment = Math.max(1, (100 - prev) * (performanceMode ? 0.12 : 0.08))
        return Math.min(prev + increment, 100)
      })
    }, intervalTime)

    // 3. Phase transitions for refined animation
    const phaseTimers = [
      setTimeout(() => setPhase(1), tPhase1),   // Logo fade in
      setTimeout(() => setPhase(2), tPhase2),   // Text slide up
      setTimeout(() => setPhase(3), tPhase3),   // Glow pulse
    ]

    // 4. Hide preloader
    const hideTimer = setTimeout(() => {
      setIsLoading(false)
    }, tHide)

    return () => {
      clearInterval(progressInterval)
      phaseTimers.forEach(clearTimeout)
      clearTimeout(hideTimer)
    }
  }, [performanceMode])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: performanceMode ? 0.35 : 0.5, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030303] transform-gpu"
          style={{
            willChange: 'opacity',
            transform: 'translateZ(0)',
          }}
        >
          {/* Refined ambient background - simplified on mobile */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Primary glow - smaller and less blurred on mobile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ 
                opacity: phase >= 1 ? 0.15 : 0,
                scale: phase >= 1 ? 1 : 0.6
              }}
              transition={{ duration: performanceMode ? 0.8 : 1.2, ease: 'easeOut' }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2BA84A]/20 transform-gpu
                ${isMobile ? 'w-[280px] h-[280px] blur-[60px]' : 'w-[500px] h-[500px] blur-[150px]'}`}
              style={{ transform: 'translate(-50%, -50%) translateZ(0)' }}
            />
            {/* Secondary subtle glow - completely disabled on mobile/performance mode */}
            {!performanceMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: phase >= 3 ? 0.08 : 0
                }}
                transition={{ duration: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-400/10 rounded-full blur-[180px] transform-gpu"
                style={{ transform: 'translate(-50%, -50%) translateZ(0)' }}
              />
            )}
          </div>

          {/* Refined Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: performanceMode ? 0 : 10 }}
            animate={{ 
              scale: phase >= 1 ? 1 : 0.8, 
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : (performanceMode ? 0 : 10)
            }}
            transition={{ 
              duration: performanceMode ? 0.4 : 0.6, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="relative z-10 transform-gpu"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                alt="MSC Logo"
                fill
                className="object-contain"
                priority
              />
              {/* Refined glow effect - slower pulse on mobile or static */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: phase >= 3 ? [0.2, 0.4, 0.2] : 0 
                }}
                transition={{ 
                  duration: performanceMode ? 2.5 : 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 blur-xl bg-[#2BA84A]/30 rounded-full scale-110 transform-gpu"
              />
            </div>
          </motion.div>

          {/* Refined Text Animation */}
          <div className="mt-6 text-center relative z-10 overflow-hidden transform-gpu" style={{ willChange: 'transform' }}>
            <motion.div
              initial={{ y: performanceMode ? 15 : 25, opacity: 0 }}
              animate={{ 
                y: phase >= 2 ? 0 : (performanceMode ? 15 : 25), 
                opacity: phase >= 2 ? 1 : 0 
              }}
              transition={{ 
                duration: performanceMode ? 0.35 : 0.5, 
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-white tracking-wider">
                MAQBOOL
              </h2>
            </motion.div>
            <motion.div
              initial={{ y: performanceMode ? 10 : 15, opacity: 0 }}
              animate={{ 
                y: phase >= 2 ? 0 : (performanceMode ? 10 : 15), 
                opacity: phase >= 2 ? 1 : 0 
              }}
              transition={{ 
                duration: performanceMode ? 0.35 : 0.5, 
                delay: performanceMode ? 0.05 : 0.08,
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <p className="text-white/50 text-xs tracking-[0.25em] mt-1 font-light">
                SPORTS COMPLEX
              </p>
            </motion.div>
          </div>

          {/* Refined Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: performanceMode ? 5 : 10 }}
            animate={{ 
              opacity: phase >= 2 ? 1 : 0,
              y: phase >= 2 ? 0 : (performanceMode ? 5 : 10)
            }}
            transition={{ delay: performanceMode ? 0.15 : 0.25, duration: 0.4 }}
            className="mt-8 w-40 relative z-10 transform-gpu"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  background: 'linear-gradient(90deg, #2BA84A 0%, #10B981 100%)'
                }}
              />
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: phase >= 2 ? 1 : 0 }}
              className="text-white/30 text-[10px] text-center mt-3 tracking-[0.3em] font-light"
            >
              LOADING
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
