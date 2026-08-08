'use client'

import { useRef, useState, useEffect, memo } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const VIDEO_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0525%282%29-pUzzUSjX4PhlTrZBiXyQf40jenLSbJ.mp4'
const POSTER_IMAGE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp'

const GPU_ACCELERATED = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
} as const

// Easing curve: smooth cinematic deceleration
const CINEMATIC_EASE = [0.22, 1, 0.36, 1] as const

// Authoritative MSC Intro Animation
const IntroAnimation = memo(function IntroAnimation() {
  const [phase, setPhase] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setIsCompleted(true)
      }, 400)
      return () => clearTimeout(timer)
    }

    // Deterministic ~2.2s cinematic timeline:
    // 0.05s: Logo arrives smoothly
    // 0.40s: "LET THE GAME" glides up in pure White
    // 0.85s: "BEGIN" glides up in MSC Green (#2BA84A)
    // 1.85s: Final composition settles with generous negative space
    // 2.10s: Smooth fade-out exit transition
    // 2.45s: Complete & cleanly unmount from DOM
    const t1 = setTimeout(() => setPhase(1), 50)
    const t2 = setTimeout(() => setPhase(2), 400)
    const t3 = setTimeout(() => setPhase(3), 850)
    const t4 = setTimeout(() => setPhase(4), 2100)
    const t5 = setTimeout(() => {
      setIsCompleted(true)
    }, 2450)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, []) // Empty deps: mounts once per page load and never restarts on parent re-renders

  if (isCompleted) return null

  return (
    <AnimatePresence mode="wait">
      {phase < 4 && (
        <motion.div
          key="msc-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#030303] text-white select-none pointer-events-none transform-gpu overflow-hidden"
          style={{ willChange: 'opacity' }}
        >
          {/* Ambient emerald backlight pulse */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: phase >= 1 ? 0.22 : 0,
                scale: phase >= 1 ? 1 : 0.8,
              }}
              transition={{ duration: 0.9, ease: CINEMATIC_EASE }}
              className="w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] rounded-full bg-[#2BA84A]/30 blur-[90px] sm:blur-[140px] transform-gpu"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto">
            {/* 1. MSC Logo */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 12 }}
              animate={{
                scale: phase >= 1 ? 1 : 0.88,
                opacity: phase >= 1 ? 1 : 0,
                y: phase >= 1 ? 0 : 12,
              }}
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
                  initial={{ y: 22, opacity: 0 }}
                  animate={{
                    y: phase >= 2 ? 0 : 22,
                    opacity: phase >= 2 ? 1 : 0,
                  }}
                  transition={{ duration: 0.55, ease: CINEMATIC_EASE }}
                  className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-[0.16em] sm:tracking-[0.2em] uppercase leading-tight"
                >
                  LET THE GAME
                </motion.h2>
              </div>

              {/* Line 2: BEGIN */}
              <div className="overflow-hidden">
                <motion.h2
                  initial={{ y: 22, opacity: 0 }}
                  animate={{
                    y: phase >= 3 ? 0 : 22,
                    opacity: phase >= 3 ? 1 : 0,
                  }}
                  transition={{ duration: 0.55, ease: CINEMATIC_EASE }}
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
})

// Highly optimized background video that prepares & plays immediately underneath the intro
const VideoBackground = memo(function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Attempt to start playing immediately on mount
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback, poster remains cleanly visible
      })
    }
  }, [])

  if (hasError) {
    return (
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a1a0f] via-[#030303] to-[#0a0f1a]"
        style={GPU_ACCELERATED}
      />
    )
  }

  return (
    <>
      {/* 1. Instant Poster underlay - immediate first visual frame with zero delay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a1a0f] via-[#030303] to-[#0a0f1a] overflow-hidden"
        style={{ ...GPU_ACCELERATED, zIndex: 0 }}
      >
        <Image
          src={POSTER_IMAGE}
          alt="MSC Stadium Turf Poster"
          fill
          priority
          className="object-cover opacity-45 filter blur-[0.5px]"
          sizes="100vw"
        />
      </div>

      {/* 2. Video element mounts immediately, preloads and plays smoothly underneath the intro */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        poster={POSTER_IMAGE}
        onError={() => setHasError(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ ...GPU_ACCELERATED, zIndex: 1 }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
    </>
  )
})

const HeroContent = memo(function HeroContent() {
  return (
    <div 
      className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 transform-gpu"
      style={GPU_ACCELERATED}
    >
      {/* Hero Title using original Anton display font styling */}
      <div className="text-center transform-gpu">
        <h1 className="font-[family-name:var(--font-anton)] text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white leading-[0.9]">
          MAQBOOL
        </h1>
        <h2 className="font-[family-name:var(--font-anton)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-[#2BA84A] leading-[0.9] mt-1 sm:mt-2">
          SPORTS COMPLEX
        </h2>
      </div>

      <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-white/80 font-light tracking-wide text-center max-w-xl px-4 transform-gpu">
        Community-centric premier sports hub offering facilities for football, cricket, and more.
      </p>

      <p className="mt-3 text-sm sm:text-base text-white/50 max-w-md text-center transform-gpu">
        Baramulla&apos;s first elite 10,000+ sq. ft. synthetic turf facility
      </p>

      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 transform-gpu">
        <Link
          href="/book-now"
          className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/30 text-center"
        >
          Book Your Slot
        </Link>
        <Link
          href="/facilities"
          className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/15 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
        >
          <Play size={16} className="fill-current" />
          Explore Arena
        </Link>
      </div>
    </div>
  )
})

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const scrollOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0])
  const scrollY = useTransform(scrollYProgress, [0, 0.35], [0, -50])
  const scrollScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.97])

  return (
    <>
      <IntroAnimation />
      <section 
        ref={containerRef}
        className="relative min-h-[105vh] bg-[#050505]"
        style={GPU_ACCELERATED}
      >
        <div 
          className="sticky top-0 h-screen overflow-hidden transform-gpu"
          style={GPU_ACCELERATED}
        >
          <div className="absolute inset-0" style={GPU_ACCELERATED}>
            <VideoBackground />
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/40 to-[#050505]"
              style={{ ...GPU_ACCELERATED, zIndex: 2 }}
            />
          </div>

          <motion.div 
            className="absolute inset-0 transform-gpu"
            style={{ 
              ...GPU_ACCELERATED,
              opacity: scrollOpacity, 
              y: scrollY, 
              scale: scrollScale,
            }}
          >
            <HeroContent />
          </motion.div>
        </div>
      </section>
    </>
  )
}
