'use client'

import { useRef, useState, useEffect, useCallback, memo } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ChevronDown, Play } from 'lucide-react'
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

const VideoBackground = memo(function VideoBackground({ onReady }: { onReady: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [shouldSourceVideo, setShouldSourceVideo] = useState(false)
  const { isMobile } = useMobilePerformance()

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
  const { prefersReducedMotion, isMobile } = useMobilePerformance()

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
  )
}
