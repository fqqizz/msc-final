'use client'

import { useRef, useState, useEffect, memo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
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
  )
}
