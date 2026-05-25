'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'

const galleryImages = [
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-ZqzcvzltRL7HSNeJ3IYVgSVuOd6b5R.webp',
    alt: 'Night match at MSC',
    span: 'col-span-2 row-span-2',
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/contact-fsgvfbe8149b7d7aaf60a37248cac104cff70-nopehSpkqvMqC7oJJY6RAFFztOHa5x.png',
    alt: 'Turf with mountain view',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
    alt: 'Safety netting detail',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp',
    alt: 'Active match',
    span: 'col-span-1 row-span-2',
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%281%29-cTfRT8gpqovQtI1n8tjmfmQjPApiM5.webp',
    alt: 'Turf installation',
    span: 'col-span-1 row-span-1',
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/categoryww-11-5SQXOQi5VinDcWf4sCttNRzzVlb0gC.png',
    alt: 'Panoramic view',
    span: 'col-span-2 row-span-1',
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
    alt: 'Multiple views collage',
    span: 'col-span-2 row-span-2',
  },
]

export default function GallerySection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])

  return (
    <section ref={containerRef} className="relative py-32 bg-[#050505]" id="gallery">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#7DD3FC]/5 rounded-full blur-[200px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          style={{ opacity }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-[#7DD3FC]/10 border border-[#7DD3FC]/20 rounded-full text-[#7DD3FC] text-sm font-medium mb-6"
          >
            Gallery
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight"
          >
            THE ARENA
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-white/60 max-w-2xl mx-auto"
          >
            Experience the beauty of Kashmir&apos;s first premium sports facility through our lens.
          </motion.p>
        </motion.div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`relative rounded-2xl overflow-hidden group cursor-pointer ${image.span}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-2xl transition-all duration-300" />
              
              {/* Hover overlay */}
              <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                <p className="text-white text-sm font-medium">{image.alt}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Video section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 relative rounded-3xl overflow-hidden"
        >
          <div className="aspect-video bg-[#0A0A0C]">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-5-dMfdMKhfO7MaNR3XjmlPu1ByhV186V.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent pointer-events-none" />
          </div>
          <div className="absolute bottom-8 left-8 right-8">
            <p className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl md:text-5xl text-white">
              LIVE THE GAME
            </p>
            <p className="text-white/60 mt-2">Experience the energy of MSC</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
