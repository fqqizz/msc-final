'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

// Authentic cinematic deceleration curve
const CINEMATIC_EASE = [0.22, 1, 0.36, 1] as const

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true)
  // Stage 1: Full MSC Logo (0.0s - 1.8s)
  // Stage 2: "LET THE GAME BEGIN" (1.9s - 3.7s)
  // Stage 3: Smooth exit to homepage (3.7s - 4.1s)
  const [stage, setStage] = useState<1 | 2 | 3>(1)

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      const timer = setTimeout(() => setIsVisible(false), 400)
      return () => clearTimeout(timer)
    }

    // Deliberate ~3.8s cinematic timeline:
    // 0.0s - 1.8s: Stage 1 - Full MSC Logo enters, holds, and breathes
    // 1.85s: Transition to Stage 2 - "LET THE GAME BEGIN"
    // 3.65s: Transition to Stage 3 - Smooth exit fade
    // 4.05s: Cleanly unmount from DOM
    const tStage2 = setTimeout(() => setStage(2), 1850)
    const tStage3 = setTimeout(() => setStage(3), 3650)
    const tComplete = setTimeout(() => setIsVisible(false), 4100)

    return () => {
      clearTimeout(tStage2)
      clearTimeout(tStage3)
      clearTimeout(tComplete)
    }
  }, []) // Empty deps: mounts cleanly once per page load

  if (!isVisible) return null

  return (
    <AnimatePresence mode="wait">
      {stage < 3 && (
        <motion.div
          key="msc-intro-cinematic-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#030303] text-white select-none pointer-events-none transform-gpu overflow-hidden"
          style={{ willChange: 'opacity' }}
        >
          {/* Subtle ambient emerald backlight glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.22, scale: 1 }}
              transition={{ duration: 1.2, ease: CINEMATIC_EASE }}
              className="w-[300px] h-[300px] sm:w-[460px] sm:h-[460px] rounded-full bg-[#2BA84A]/30 blur-[100px] sm:blur-[150px] transform-gpu"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {stage === 1 ? (
                /* ========================================================================= */
                /* STAGE 1: FULL MSC LOGO (Complete emblem, shield & text without clipping)  */
                /* ========================================================================= */
                <motion.div
                  key="msc-stage-full-logo"
                  initial={{ opacity: 0, scale: 0.88, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.65, ease: CINEMATIC_EASE }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mx-auto">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png"
                      alt="Maqbool Sports Complex Full Logo"
                      fill
                      sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
                      className="object-contain drop-shadow-[0_10px_25px_rgba(43,168,74,0.25)]"
                      priority
                    />
                  </div>
                </motion.div>
              ) : (
                /* ========================================================================= */
                /* STAGE 2: "LET THE GAME BEGIN" (Exact authentic two-line typography)       */
                /* ========================================================================= */
                <motion.div
                  key="msc-stage-typography"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.5, ease: CINEMATIC_EASE }}
                  className="flex flex-col items-center justify-center text-center overflow-hidden space-y-1 sm:space-y-2"
                >
                  {/* Line 1: LET THE GAME (Pure Crisp White in Anton Font) */}
                  <div className="overflow-hidden">
                    <motion.h2
                      initial={{ y: 28, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
                      className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-[0.16em] sm:tracking-[0.22em] uppercase leading-tight"
                    >
                      LET THE GAME
                    </motion.h2>
                  </div>

                  {/* Line 2: BEGIN (Authentic MSC Green in Anton Font) */}
                  <div className="overflow-hidden">
                    <motion.h2
                      initial={{ y: 28, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.28, ease: CINEMATIC_EASE }}
                      className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#2BA84A] tracking-[0.16em] sm:tracking-[0.22em] uppercase leading-tight"
                    >
                      BEGIN
                    </motion.h2>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
