'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { useMobilePerformance } from '@/hooks/use-mobile-performance'

const galleryImages = [
  {
    src: '/images/facilities/turf-1.webp',
    alt: 'Night floodlit turf at MSC',
    span: 'col-span-2 row-span-2',
  },
  {
    src: '/images/facilities/cricket-net-1-1.webp',
    alt: 'Cricket Net 1 pitch and run-up',
    span: 'col-span-1 row-span-1',
  },
  {
    src: '/images/facilities/cricket-net-2-1.webp',
    alt: 'Cricket Net 2 practice enclosure',
    span: 'col-span-1 row-span-1',
  },
  {
    src: '/images/facilities/turf-2.webp',
    alt: '10,000+ sq. ft. synthetic turf field',
    span: 'col-span-1 row-span-2',
  },
  {
    src: '/images/facilities/bowling-machine-1.webp',
    alt: 'Automated bowling machine training',
    span: 'col-span-1 row-span-1',
  },
  {
    src: '/images/facilities/turf-3.webp',
    alt: 'Panoramic stadium turf view',
    span: 'col-span-2 row-span-1',
  },
  {
    src: '/images/facilities/cricket-net-1-2.webp',
    alt: 'Cricket practice netting and pitch',
    span: 'col-span-2 row-span-2',
  },
]

const GPU_ACCELERATED = {
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const,
} as const

export default function GallerySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const { isMobile, performanceMode } = useMobilePerformance()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  })

  // Scroll transforms
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])

  // Conditionally bypass scroll opacity computations on mobile
  const opacity = performanceMode ? 1 : scrollOpacity

  return (
    <section ref={containerRef} className="relative py-24 sm:py-32 bg-[#050505] overflow-hidden" id="gallery" style={GPU_ACCELERATED}>
      {/* Background effects - simplified on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={GPU_ACCELERATED}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#7DD3FC]/5 rounded-full blur-[100px] transform-gpu
          ${isMobile ? 'w-[400px] h-[400px]' : 'w-[800px] h-[800px] blur-[200px]'}`}
          style={{ transform: 'translate(-50%, -50%) translateZ(0)' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          style={{ opacity }}
          className="text-center mb-16 transform-gpu"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-[#7DD3FC]/10 border border-[#7DD3FC]/20 rounded-full text-[#7DD3FC] text-sm font-medium mb-6"
          >
            Gallery
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight"
          >
            THE ARENA
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-white/60 max-w-2xl mx-auto"
          >
            Experience the beauty of Kashmir&apos;s first premium sports facility through our lens.
          </motion.p>
        </motion.div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[150px] sm:auto-rows-[200px]">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: isMobile ? 0 : 30, scale: isMobile ? 1 : 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: isMobile ? 0.04 : index * 0.08, duration: 0.4 }}
              className={`relative rounded-2xl overflow-hidden group cursor-pointer transform-gpu ${image.span}`}
              style={GPU_ACCELERATED}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-2xl transition-all duration-300 pointer-events-none" />
              
              {/* Hover overlay - always visible or simplified on mobile */}
              <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 pointer-events-none">
                <p className="text-white text-xs sm:text-sm font-medium">{image.alt}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Video section - optimized to prevent automatic load/play on mobile */}
        <motion.div
          initial={{ opacity: 0, y: isMobile ? 0 : 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 relative rounded-3xl overflow-hidden transform-gpu"
          style={GPU_ACCELERATED}
        >
          <div className="aspect-video bg-[#0A0A0C] relative flex items-center justify-center">
            {/* Show video if active, or if desktop (autoplays on desktop only) */}
            {isPlayingVideo || !performanceMode ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                controls={isPlayingVideo}
                className="w-full h-full object-cover"
                style={GPU_ACCELERATED}
              >
                <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-5-dMfdMKhfO7MaNR3XjmlPu1ByhV186V.mp4" type="video/mp4" />
              </video>
            ) : (
              /* Premium static thumbnail placeholder with a Play overlay on mobile */
              <div 
                className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center group"
                onClick={() => setIsPlayingVideo(true)}
              >
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-ZqzcvzltRL7HSNeJ3IYVgSVuOd6b5R.webp"
                  alt="MSC Turf Stadium Video Thumbnail"
                  fill
                  className="object-cover opacity-60 transition-transform duration-500 group-hover:scale-102"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                
                {/* Hardware-accelerated play button */}
                <div 
                  className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#2BA84A] text-white flex items-center justify-center shadow-lg shadow-[#2BA84A]/30 group-hover:scale-110 active:scale-95 transition-all duration-300 transform-gpu"
                  style={GPU_ACCELERATED}
                >
                  <Play size={28} className="fill-current ml-1" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent pointer-events-none" />
          </div>
          
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 pointer-events-none">
            <p className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white">
              LIVE THE GAME
            </p>
            <p className="text-white/60 mt-1 sm:mt-2 text-xs sm:text-sm">Experience the energy of MSC</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
