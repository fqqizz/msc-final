'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const CINEMATIC_EASE = [0.22, 1, 0.36, 1] as const

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      const timer = setTimeout(() => setIsVisible(false), 350)
      return () => clearTimeout(timer)
    }

    // Deterministic ~2.2s sequence:
    // 0ms: Logo visible immediately with smooth entrance
    // 350ms: Phase 1 -> "LET THE GAME" glides up in pure White
    // 750ms: Phase 2 -> "BEGIN" glides up in MSC Green (#2BA84A)
    // 1750ms: Phase 3 -> Composition holds
    // 2050ms: Phase 4 -> Exit fade
    // 2400ms: Complete and cleanly unmount from DOM
    const t1 = setTimeout(() => setPhase(1), 350)
    const t2 = setTimeout(() => setPhase(2), 750)
    const t3 = setTimeout(() => setPhase(3), 1750)
    const t4 = setTimeout(() => setPhase(4), 2050)
    const t5 = setTimeout(() => setIsVisible(false), 2400)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [])

  if (!isVisible) return null

  return (
    <AnimatePresence mode="wait">
      {phase < 4 && (
        <motion.div
          key="msc-global-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#030303] text-white select-none pointer-events-none transform-gpu overflow-hidden"
          style={{ willChange: 'opacity' }}
        >
          {/* Subtle ambient emerald glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.22, scale: 1 }}
              transition={{ duration: 0.9, ease: CINEMATIC_EASE }}
              className="w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] rounded-full bg-[#2BA84A]/30 blur-[90px] sm:blur-[140px] transform-gpu"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto">
            {/* 1. MSC Logo (Visible immediately on mount, scale & fade) */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: CINEMATIC_EASE }}
              className="relative mb-6 sm:mb-8"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                  alt="MSC Logo"
                  fill
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>

            {/* 2. Authentic Typography: "LET THE GAME" (White) & "BEGIN" (MSC Green) in Anton font */}
            <div className="overflow-hidden space-y-1 sm:space-y-1.5">
              {/* Line 1: LET THE GAME */}
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: 24, opacity: 0 }}
                  animate={{
                    y: phase >= 1 ? 0 : 24,
                    opacity: phase >= 1 ? 1 : 0,
                  }}
                  transition={{ duration: 0.5, ease: CINEMATIC_EASE }}
                  className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-[0.16em] sm:tracking-[0.2em] uppercase leading-tight"
                >
                  LET THE GAME
                </motion.h2>
              </div>

              {/* Line 2: BEGIN */}
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: 24, opacity: 0 }}
                  animate={{
                    y: phase >= 2 ? 0 : 24,
                    opacity: phase >= 2 ? 1 : 0,
                  }}
                  transition={{ duration: 0.5, ease: CINEMATIC_EASE }}
                  className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#2BA84A] tracking-[0.16em] sm:tracking-[0.2em] uppercase leading-tight"
                >
                  BEGIN
                </motion.h2>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
