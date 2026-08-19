'use client'

import { useRef, useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ChevronDown, Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

// High-performance MSC media assets
const VIDEO_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0525%282%29-pUzzUSjX4PhlTrZBiXyQf40jenLSbJ.mp4'
const LOGO_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png'
const POSTER_IMAGE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp'

// GPU-accelerated styles
const GPU_ACCELERATED = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
} as const

// Easing curve: smooth cinematic deceleration
const CINEMATIC_EASE = [0.16, 1, 0.3, 1] as const

// Authoritative Original MSC Intro Animation with soft radial glow, cinematic pacing (~2.7s) and balanced mobile layout
const IntroAnimation = memo(function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(1)
  const prefersReducedMotion = useReducedMotion()

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  useEffect(() => {
    // Precise ~2.0s total cinematic duration
    // 0.0s - 0.65s: Stage 1 — Full MSC Logo centered and breathing
    // 0.65s: Stage 2 — "LET THE GAME" (White)
    // 0.90s: Stage 3 — "BEGIN" (MSC Green)
    // 1.35s: Stage 4 — Full lockup holds in cinematic harmony
    // 1.65s: Smooth exit fade into the homepage
    // 2.00s: Complete & unmount
    const t2 = setTimeout(() => setPhase(2), 650)
    const t3 = setTimeout(() => setPhase(3), 900)
    const t4 = setTimeout(() => setPhase(4), 1350)
    const tDone = setTimeout(() => {
      onCompleteRef.current?.()
    }, 2000)

    return () => {
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(tDone)
    }
  }, [])

  return (
    <motion.div
      key="msc-intro-fullscreen-overlay"
      className="fixed inset-0 z-[99999] bg-[#030303] flex items-center justify-center transform-gpu overflow-hidden select-none pointer-events-none px-4 sm:px-6"
      style={GPU_ACCELERATED}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Subtle ambient vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
          opacity: 0.9,
          ...GPU_ACCELERATED,
        }}
      />

      {/* Pure Soft Radial Emerald Atmospheric Glow (No rectangular boundary, natural smooth falloff) */}
      <motion.div
        initial={{ opacity: 0.12, scale: 0.9 }}
        animate={{ 
          opacity: phase >= 2 ? 0.22 : 0.12,
          scale: phase >= 2 ? 1.05 : 0.95,
        }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[520px] sm:h-[520px] rounded-full bg-emerald-500/25 blur-[70px] sm:blur-[110px] transform-gpu pointer-events-none"
        style={GPU_ACCELERATED}
      />

      {/* Main logo and typography container */}
      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto text-center transform-gpu w-full" style={GPU_ACCELERATED}>
        {/* STAGE 1: Full MSC Logo (Properly centered, balanced for mobile & desktop) */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0.3, y: 8 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
          }}
          transition={{ duration: 0.55, ease: CINEMATIC_EASE }}
          className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-4 sm:mb-6 transform-gpu"
        >
          <Image
            src={LOGO_URL}
            alt="Maqbool Sports Complex Full Logo"
            fill
            className="object-contain drop-shadow-[0_12px_30px_rgba(43,168,74,0.3)]"
            priority
            sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
          />
        </motion.div>
        
        {/* STAGE 2: Original Typography — Anton font with natural athletic spacing */}
        <div className="text-center overflow-hidden space-y-0.5 sm:space-y-1 w-full">
          {/* Line 1: LET THE GAME */}
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{
                y: phase >= 2 ? 0 : 32,
                opacity: phase >= 2 ? 1 : 0,
              }}
              transition={{ duration: 0.45, ease: CINEMATIC_EASE }}
              className="transform-gpu drop-shadow-[0_0_20px_rgba(43,168,74,0.3)]"
            >
              <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-normal sm:tracking-wide uppercase leading-tight whitespace-nowrap">
                LET THE GAME
              </h2>
            </motion.div>
          </div>

          {/* Line 2: BEGIN */}
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{
                y: phase >= 3 ? 0 : 32,
                opacity: phase >= 3 ? 1 : 0,
              }}
              transition={{ duration: 0.45, ease: CINEMATIC_EASE }}
              className="transform-gpu"
            >
              <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#2BA84A] tracking-normal sm:tracking-wide uppercase leading-tight">
                BEGIN
              </h2>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

// Cinematic-paced video background — 0.82x playback rate for a subtle slow-motion feel
const VideoBackground = memo(function VideoBackground({ 
  onReady 
}: { 
  onReady: () => void 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoadedData = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.82
      videoRef.current.defaultPlaybackRate = 0.82
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
    const video = videoRef.current
    if (!video) return

    video.playbackRate = 0.82
    video.defaultPlaybackRate = 0.82

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.then(() => {
        setIsPlaying(true)
      }).catch(() => {
        // Fallback to poster cleanly
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
      {/* Static image poster background underneath - immediate visual underlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#0a1a0f] via-[#030303] to-[#0a0f1a] overflow-hidden"
        style={{ ...GPU_ACCELERATED, zIndex: 0 }}
      >
        <Image
          src={POSTER_IMAGE}
          alt="MSC Stadium Turf Poster"
          fill
          priority
          className="object-cover opacity-35 filter blur-[1px]"
          sizes="100vw"
        />
      </div>
      
      {/* Video with GPU-accelerated fade - natural speed (1.0x) */}
      <div 
        className="absolute inset-0 transform-gpu transition-opacity duration-1000 ease-out"
        style={{ 
          ...GPU_ACCELERATED,
          opacity: isPlaying ? 1 : 0,
          zIndex: 1,
        }}
      >
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
          onLoadedData={handleLoadedData}
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            ...GPU_ACCELERATED,
            willChange: 'transform',
          }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      </div>
    </>
  )
})

// Memoized hero content with responsive motion settings
const HeroContent = memo(function HeroContent({ isVisible }: { isVisible: boolean }) {
  const { prefersReducedMotion, isMobile } = useMobilePerformance()
  
  const fadeUpVariants = {
    hidden: { opacity: 0, y: (prefersReducedMotion || isMobile) ? 0 : 20 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.1 : (isMobile ? 0.4 : 0.6),
        delay: prefersReducedMotion ? 0 : (isMobile ? delay * 0.5 : delay),
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  }

  return (
    <div 
      className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 transform-gpu"
      style={GPU_ACCELERATED}
    >
      {/* Main heading */}
      <motion.div
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={fadeUpVariants}
        custom={0.1}
        className="text-center transform-gpu"
      >
        <h1 className="font-[family-name:var(--font-anton)] text-6xl sm:text-7xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight text-white leading-[0.9]">
          MAQBOOL
        </h1>
        <h2 className="font-[family-name:var(--font-anton)] text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-[#2BA84A] leading-[0.9] mt-1 sm:mt-2">
          SPORTS COMPLEX
        </h2>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={fadeUpVariants}
        custom={0.2}
        className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-white/80 font-light tracking-wide text-center max-w-xl px-4 transform-gpu"
      >
        Community-centric premier sports hub offering facilities for football, cricket, and more.
      </motion.p>

      {/* Supporting text */}
      <motion.p
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={fadeUpVariants}
        custom={0.25}
        className="mt-3 text-sm sm:text-base text-white/50 max-w-md text-center transform-gpu"
      >
        Baramulla&apos;s first elite 10,000+ sq. ft. synthetic turf facility
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={fadeUpVariants}
        custom={0.3}
        className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 transform-gpu"
      >
        <Link
          href="/book-now"
          className="clay-button-green px-7 sm:px-9 py-3.5 sm:py-4 text-white font-bold text-sm sm:text-base rounded-xl text-center"
        >
          Book Your Slot
        </Link>
        <Link
          href="/facilities"
          className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 md:bg-white/5 md:backdrop-blur-md border border-white/15 hover:border-white/30 text-white font-medium text-sm sm:text-base rounded-xl hover:bg-white/15 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/40 active:scale-[0.98]"
        >
          <Play size={16} className="fill-current text-[#2BA84A]" />
          Explore Arena
        </Link>
      </motion.div>
    </div>
  )
})

// Memoized scroll indicator
const ScrollIndicator = memo(function ScrollIndicator({ isVisible }: { isVisible: boolean }) {
  const { prefersReducedMotion } = useMobilePerformance()
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 0.6 : 0 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      className="absolute bottom-6 sm:bottom-8 left-1/2 z-20 transform-gpu"
      style={{ 
        ...GPU_ACCELERATED,
        transform: 'translateX(-50%) translateZ(0)',
      }}
    >
      <motion.div
        animate={prefersReducedMotion ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center gap-1.5 text-white/50"
      >
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium">Scroll</span>
        <ChevronDown size={18} strokeWidth={1.5} />
      </motion.div>
    </motion.div>
  )
})

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showIntro, setShowIntro] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const { isMobile, performanceMode } = useMobilePerformance()
  
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

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false)
  }, [])

  const handleVideoReady = useCallback(() => {
    setVideoReady(true)
  }, [])

  const contentVisible = !showIntro

  return (
    <>
      {/* Authoritative Intro Animation — mounts immediately on page visit */}
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroAnimation onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      <section 
        ref={containerRef}
        className="relative min-h-[110vh] bg-[#030303]"
        style={GPU_ACCELERATED}
      >
        <div 
          className="sticky top-0 h-screen overflow-hidden transform-gpu"
          style={GPU_ACCELERATED}
        >
          {/* Video background layer */}
          <div className="absolute inset-0" style={GPU_ACCELERATED}>
            <VideoBackground onReady={handleVideoReady} />
            
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#030303]/60 via-[#030303]/40 to-[#030303]"
              style={{ ...GPU_ACCELERATED, zIndex: 2 }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-r from-[#030303]/30 via-transparent to-[#030303]/30"
              style={{ ...GPU_ACCELERATED, zIndex: 2 }}
            />
          </div>
          
          {/* Ambient glow */}
          {!isMobile && (
            <div 
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ ...GPU_ACCELERATED, zIndex: 3 }}
            >
              <div 
                className="absolute top-1/4 left-1/2 w-[500px] h-[350px] bg-[#2BA84A]/5 rounded-full blur-[80px]"
                style={{ 
                  ...GPU_ACCELERATED,
                  transform: 'translateX(-50%) translateZ(0)',
                }}
              />
            </div>
          )}

          {/* Scrollable content wrapper */}
          <motion.div 
            className="absolute inset-0 transform-gpu"
            style={{ 
              ...GPU_ACCELERATED,
              opacity, 
              y, 
              scale,
            }}
          >
            <HeroContent isVisible={contentVisible} />
          </motion.div>

          <ScrollIndicator isVisible={contentVisible} />
        </div>
      </section>
    </>
  )
}
