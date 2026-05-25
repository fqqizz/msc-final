'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        // Smooth easing - faster at start, slower near end
        const increment = Math.max(1, (100 - prev) * 0.08)
        return Math.min(prev + increment, 100)
      })
    }, 50)

    // Phase transitions for refined animation
    const phaseTimers = [
      setTimeout(() => setPhase(1), 200),   // Logo fade in
      setTimeout(() => setPhase(2), 600),   // Text slide up
      setTimeout(() => setPhase(3), 1200),  // Glow pulse
    ]

    // Hide preloader
    const hideTimer = setTimeout(() => {
      setIsLoading(false)
    }, 2200)

    return () => {
      clearInterval(progressInterval)
      phaseTimers.forEach(clearTimeout)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030303]"
        >
          {/* Refined ambient background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Primary glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ 
                opacity: phase >= 1 ? 0.2 : 0,
                scale: phase >= 1 ? 1 : 0.6
              }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2BA84A]/30 rounded-full blur-[150px]"
            />
            {/* Secondary subtle glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: phase >= 3 ? 0.1 : 0
              }}
              transition={{ duration: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-400/20 rounded-full blur-[180px]"
            />
          </div>

          {/* Refined Logo Animation */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 10 }}
            animate={{ 
              scale: phase >= 1 ? 1 : 0.7, 
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 10
            }}
            transition={{ 
              duration: 0.8, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="relative z-10"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                alt="MSC Logo"
                fill
                className="object-contain"
                priority
              />
              {/* Refined glow effect */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: phase >= 3 ? [0.3, 0.5, 0.3] : 0 
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 blur-xl bg-[#2BA84A]/40 rounded-full scale-110"
              />
            </div>
          </motion.div>

          {/* Refined Text Animation */}
          <div className="mt-6 text-center relative z-10 overflow-hidden">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ 
                y: phase >= 2 ? 0 : 30, 
                opacity: phase >= 2 ? 1 : 0 
              }}
              transition={{ 
                duration: 0.6, 
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-white tracking-wider">
                MAQBOOL
              </h2>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ 
                y: phase >= 2 ? 0 : 20, 
                opacity: phase >= 2 ? 1 : 0 
              }}
              transition={{ 
                duration: 0.6, 
                delay: 0.1,
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: phase >= 2 ? 1 : 0,
              y: phase >= 2 ? 0 : 10
            }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 w-40 relative z-10"
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
