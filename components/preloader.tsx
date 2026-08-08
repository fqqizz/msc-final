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
    // 1. Durations calibrated for cinematic feel
    const durationMultiplier = performanceMode ? 0.6 : 0.85
    
    const tPhase1 = Math.round(180 * durationMultiplier) // Logo entrance
    const tPhase2 = Math.round(650 * durationMultiplier) // "LET THE GAME BEGIN" entrance
    const tPhase3 = Math.round(1350 * durationMultiplier) // Emerald ambient glow pulse
    const tHide = Math.round(2300 * durationMultiplier) // Cinematic exit to website

    // 2. Smooth progress counter
    const intervalTime = performanceMode ? 25 : 35
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        const increment = Math.max(1, (100 - prev) * (performanceMode ? 0.12 : 0.08))
        return Math.min(prev + increment, 100)
      })
    }, intervalTime)

    // 3. Phase timers
    const phaseTimers = [
      setTimeout(() => setPhase(1), tPhase1),
      setTimeout(() => setPhase(2), tPhase2),
      setTimeout(() => setPhase(3), tPhase3),
    ]

    // 4. Clean exit
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
          transition={{ duration: performanceMode ? 0.35 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030303] text-white select-none pointer-events-none transform-gpu"
        >
          {/* Ambient emerald backlight glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ 
                opacity: phase >= 1 ? 0.18 : 0,
                scale: phase >= 1 ? 1 : 0.6
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2BA84A]/30 transform-gpu
                ${isMobile ? 'w-[280px] h-[280px] blur-[70px]' : 'w-[520px] h-[520px] blur-[150px]'}`}
            />
          </div>

          {/* 1. Hero MSC Emblem Logo */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, y: 15 }}
            animate={{ 
              scale: phase >= 1 ? 1 : 0.75, 
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 15
            }}
            transition={{ 
              duration: 0.6, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="relative z-10"
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                alt="MSC Logo"
                fill
                className="object-contain"
                priority
              />
              {/* Subtle pulsing emerald ring */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: phase >= 3 ? [0.2, 0.45, 0.2] : 0 
                }}
                transition={{ 
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute inset-0 blur-2xl bg-[#2BA84A]/40 rounded-full scale-110"
              />
            </div>
          </motion.div>

          {/* 2. Original Iconic Slogan: "LET THE GAME BEGIN" */}
          <div className="mt-7 text-center relative z-10 overflow-hidden">
            <motion.div
              initial={{ y: 20, opacity: 0, letterSpacing: '0.15em' }}
              animate={{ 
                y: phase >= 2 ? 0 : 20, 
                opacity: phase >= 2 ? 1 : 0,
                letterSpacing: phase >= 2 ? (isMobile ? '0.28em' : '0.42em') : '0.15em'
              }}
              transition={{ 
                duration: 0.65, 
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <h2 className="font-[family-name:var(--font-anton)] text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-[0.35em] drop-shadow-md">
                LET THE GAME BEGIN
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ 
                opacity: phase >= 2 ? 0.6 : 0,
                y: phase >= 2 ? 0 : 8
              }}
              transition={{ 
                duration: 0.5, 
                delay: 0.1,
                ease: 'easeOut'
              }}
            >
              <p className="text-[10px] sm:text-xs text-emerald-400 font-semibold tracking-[0.25em] mt-1.5 uppercase">
                Maqbool Sports Complex
              </p>
            </motion.div>
          </div>

          {/* 3. Sleek Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: phase >= 2 ? 1 : 0,
              y: phase >= 2 ? 0 : 10
            }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-8 w-44 sm:w-52 relative z-10"
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
              animate={{ opacity: phase >= 2 ? 0.4 : 0 }}
              className="text-white/40 text-[9px] text-center mt-2.5 tracking-[0.3em] font-mono"
            >
              {Math.min(Math.round(progress), 100)}%
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
