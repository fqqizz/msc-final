'use client'

import { useRef, useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

const VIDEO_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0525%282%29-pUzzUSjX4PhlTrZBiXyQf40jenLSbJ.mp4'
const POSTER_IMAGE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp'

const GPU_ACCELERATED = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
} as const

// Authoritative Original Intro Animation per Part 1
const IntroAnimation = memo(function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const { performanceMode, isMobile } = useMobilePerformance()

  useEffect(() => {
    const durationMultiplier = performanceMode ? 0.6 : 0.85
    
    // 1. Logo entrance (200ms)
    const t1 = setTimeout(() => setPhase(1), Math.round(200 * durationMultiplier))
    // 2. "LET THE GAME BEGIN" typography entrance (700ms)
    const t2 = setTimeout(() => setPhase(2), Math.round(750 * durationMultiplier))
    // 3. Smooth exit transition to reveal Hero website (1800ms)
    const t3 = setTimeout(() => {
      setPhase(3)
      onComplete()
    }, Math.round(1900 * durationMultiplier))
    const t4 = setTimeout(() => {
      setIsVisible(false)
    }, Math.round(2500 * durationMultiplier))

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [onComplete, performanceMode])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: performanceMode ? 0.35 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030303] text-white select-none pointer-events-none transform-gpu"
        >
          {/* Subtle ambient emerald glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: phase >= 1 ? 0.2 : 0, scale: phase >= 1 ? 1 : 0.8 }}
              transition={{ duration: 1 }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2BA84A]/30 transform-gpu
                ${isMobile ? 'w-[280px] h-[280px] blur-[70px]' : 'w-[480px] h-[480px] blur-[140px]'}`}
            />
          </div>

          {/* 1. MSC Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ 
              scale: phase >= 1 ? 1 : 0.8, 
              opacity: phase >= 1 ? 1 : 0,
              y: phase >= 1 ? 0 : 20
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: phase >= 2 ? [0.2, 0.45, 0.2] : 0 
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute inset-0 blur-2xl bg-[#2BA84A]/40 rounded-full scale-110"
              />
            </div>
          </motion.div>

          {/* 2. Original Typography: LET THE GAME (White) / BEGIN (MSC Green) in Anton font */}
          <div className="mt-8 text-center relative z-10 overflow-hidden">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ 
                y: phase >= 2 ? 0 : 30, 
                opacity: phase >= 2 ? 1 : 0 
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl text-white tracking-wide uppercase leading-tight">
                LET THE GAME
              </h2>
              <h2 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl text-[#2BA84A] tracking-wide uppercase leading-tight mt-1">
                BEGIN
              </h2>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

const VideoBackground = memo(function VideoBackground({ onReady }: { onReady: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldSourceVideo, setShouldSourceVideo] = useState(false)

  const handleLoadedData = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75
      videoRef.current.play().then(() => {
        setIsPlaying(true)
        onReady()
      }).catch(() => {
        setIsPlaying(true)
        onReady()
      })
    }
  }, [onReady])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldSourceVideo(true)
    }, 60)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!shouldSourceVideo) return
    const video = videoRef.current
    if (!video) return

    video.preload = 'auto'
    try {
      video.load()
    } catch {}

    const handleMetadata = () => {
      video.playbackRate = 0.75
    }

    video.addEventListener('loadedmetadata', handleMetadata)
    return () => video.removeEventListener('loadedmetadata', handleMetadata)
  }, [shouldSourceVideo])

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
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a1a0f] via-[#030303] to-[#0a0f1a] overflow-hidden"
        style={{ ...GPU_ACCELERATED, zIndex: 0 }}
      >
        <Image
          src={POSTER_IMAGE}
          alt="MSC Stadium Turf Poster"
          fill
          priority
          className="object-cover opacity-40 filter blur-[1px]"
          sizes="100vw"
        />
      </div>

      <div 
        className="absolute inset-0 transform-gpu transition-opacity duration-1000 ease-out"
        style={{ 
          ...GPU_ACCELERATED,
          opacity: isPlaying ? 1 : 0,
          zIndex: 1,
        }}
      >
        {shouldSourceVideo && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            controlsList="nodownload noplaybackrate noremoteplayback"
            poster={POSTER_IMAGE}
            onLoadedData={handleLoadedData}
            onError={() => setHasError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={GPU_ACCELERATED}
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
        )}
      </div>
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
  const [videoReady, setVideoReady] = useState(false)
  const [introFinished, setIntroFinished] = useState(false)
  const { performanceMode } = useMobilePerformance()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const scrollOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0])
  const scrollY = useTransform(scrollYProgress, [0, 0.35], [0, -50])
  const scrollScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.97])

  const opacity = performanceMode ? 1 : scrollOpacity
  const y = performanceMode ? 0 : scrollY
  const scale = performanceMode ? 1 : scrollScale

  return (
    <>
      <IntroAnimation onComplete={() => setIntroFinished(true)} />
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
            <VideoBackground onReady={() => setVideoReady(true)} />
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/40 to-[#050505]"
              style={{ ...GPU_ACCELERATED, zIndex: 2 }}
            />
          </div>

          <motion.div 
            className="absolute inset-0 transform-gpu"
            style={{ 
              ...GPU_ACCELERATED,
              opacity, 
              y, 
              scale,
            }}
          >
            <HeroContent />
          </motion.div>
        </div>
      </section>
    </>
  )
}
