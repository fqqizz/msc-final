'use client'

import { useRef, useState, useEffect, useCallback, memo } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ChevronDown, Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

// New optimized video URL
const VIDEO_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0525%282%29-pUzzUSjX4PhlTrZBiXyQf40jenLSbJ.mp4'
const LOGO_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo78-jfpuDJgxyeQ2YTcXCbJ1AZG7dKQWzo.png'
const POSTER_IMAGE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp'

// GPU-accelerated styles
const GPU_ACCELERATED = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const,
  perspective: 1000,
} as const

// Memoized intro animation for performance
const IntroAnimation = memo(function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete()
      return
    }
    
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => onComplete(), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete, prefersReducedMotion])

  if (prefersReducedMotion) return null

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#030303] flex items-center justify-center transform-gpu"
      style={GPU_ACCELERATED}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Ambient glow - GPU accelerated */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 0.12 : 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full bg-[#2BA84A]/30 blur-[100px] transform-gpu"
        style={{ 
          ...GPU_ACCELERATED,
          transform: 'translate(-50%, -50%) translateZ(0)',
        }}
      />

      {/* Logo and text container */}
      <div className="relative z-10 flex flex-col items-center transform-gpu" style={GPU_ACCELERATED}>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: phase >= 1 ? 1 : 0.95, opacity: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-20 h-20 sm:w-24 sm:h-24 mb-5 transform-gpu"
        >
          <Image
            src={LOGO_URL}
            alt="MSC Logo"
            fill
            className="object-contain"
            priority
            sizes="96px"
          />
        </motion.div>
        
        {/* Text - staggered reveal */}
        <div className="text-center overflow-hidden">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: phase >= 2 ? 0 : 40, opacity: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="transform-gpu"
          >
            <span className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl md:text-4xl text-white tracking-wide">
              LET THE GAME
            </span>
          </motion.div>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: phase >= 2 ? 0 : 40, opacity: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="transform-gpu"
          >
            <span className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl md:text-4xl text-[#2BA84A] tracking-wide">
              BEGIN
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
})

// Memoized video background component with lazy load for mobile
const VideoBackground = memo(function VideoBackground({ 
  onReady 
}: { 
  onReady: () => void 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldSourceVideo, setShouldSourceVideo] = useState(false)
  const { isMobile, performanceMode } = useMobilePerformance()

  const handleCanPlayThrough = useCallback(() => {
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

  // Lazy load video source after mount to keep initial page paint completely free of media blocking
  useEffect(() => {
    const delay = isMobile ? 800 : 150
    const timer = setTimeout(() => {
      setShouldSourceVideo(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [isMobile])

  // Configure video playback
  useEffect(() => {
    if (!shouldSourceVideo) return
    const video = videoRef.current
    if (!video) return

    video.preload = isMobile ? 'metadata' : 'auto'
    video.load()
    
    const handleMetadata = () => {
      video.playbackRate = 0.75
    }
    
    video.addEventListener('loadedmetadata', handleMetadata)
    return () => video.removeEventListener('loadedmetadata', handleMetadata)
  }, [shouldSourceVideo, isMobile])

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
      {/* Static image poster background underneath - seamless visual layout */}
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
      
      {/* Video with GPU-accelerated fade */}
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
            poster={POSTER_IMAGE}
            onCanPlayThrough={handleCanPlayThrough}
            onError={() => setHasError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              ...GPU_ACCELERATED,
              willChange: 'transform',
            }}
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
        )}
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
      {/* Main heading - instant render, animate in */}
      <motion.div
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={fadeUpVariants}
        custom={0.1}
        className="text-center transform-gpu"
      >
        <h1 className="font-[family-name:var(--font-anton)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight text-white leading-[0.9]">
          MAQBOOL
        </h1>
        <h2 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-[#2BA84A] leading-[0.9] mt-1 sm:mt-2">
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

      {/* CTAs - optimized background styles for mobile (no blur filter) */}
      <motion.div
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        variants={fadeUpVariants}
        custom={0.3}
        className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 transform-gpu"
      >
        <Link
          href="/book-now"
          className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#2BA84A] text-white font-semibold rounded-lg hover:bg-[#239B40] transition-colors duration-200 text-center shadow-lg shadow-[#2BA84A]/20"
        >
          Book Your Slot
        </Link>
        <Link
          href="/facilities"
          className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 md:bg-white/5 md:backdrop-blur-sm border border-white/10 text-white font-medium rounded-lg hover:bg-white/15 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Play size={16} className="fill-current" />
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
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const { isMobile, performanceMode } = useMobilePerformance()
  
  // Ensure component is mounted before showing intro
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Optimized scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Scroll transforms
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0])
  const scrollY = useTransform(scrollYProgress, [0, 0.35], [0, -50])
  const scrollScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.97])

  // Conditionally apply transforms: on mobile bypass scroll computations entirely to boost scrolling FPS
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
      {/* Intro Animation - Conditionally rendered only when not in reduced motion */}
      {mounted && showIntro && !prefersReducedMotion && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}

      <section 
        ref={containerRef}
        className="relative min-h-[110vh] bg-[#030303]"
        style={GPU_ACCELERATED}
      >
        {/* Sticky container with GPU acceleration */}
        <div 
          className="sticky top-0 h-screen overflow-hidden transform-gpu"
          style={GPU_ACCELERATED}
        >
          {/* Video background layer */}
          <div className="absolute inset-0" style={GPU_ACCELERATED}>
            <VideoBackground onReady={handleVideoReady} />
            
            {/* Gradient overlays - static, GPU accelerated */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#030303]/60 via-[#030303]/40 to-[#030303]"
              style={{ ...GPU_ACCELERATED, zIndex: 2 }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-r from-[#030303]/30 via-transparent to-[#030303]/30"
              style={{ ...GPU_ACCELERATED, zIndex: 2 }}
            />
          </div>
          
          {/* Ambient glow - hidden or extremely simplified on mobile */}
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

          {/* Scrollable content wrapper with GPU transforms */}
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

          {/* Scroll indicator */}
          <ScrollIndicator isVisible={contentVisible} />
        </div>
      </section>
    </>
  )
}
