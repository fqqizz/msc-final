'use client'

import { useState } from 'react'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play } from 'lucide-react'

const images = [
  {
    src: '/images/facilities/turf-1.webp',
    alt: 'Night match under floodlights at MSC Turf',
    category: 'matches'
  },
  {
    src: '/images/facilities/turf-2.webp',
    alt: '10,000+ sq. ft. synthetic turf arena overview',
    category: 'facility'
  },
  {
    src: '/images/facilities/cricket-net-1-1.webp',
    alt: 'Cricket Net 1 professional turf pitch',
    category: 'facility'
  },
  {
    src: '/images/facilities/cricket-net-2-1.webp',
    alt: 'Cricket Net 2 training enclosure',
    category: 'facility'
  },
  {
    src: '/images/facilities/bowling-machine-1.webp',
    alt: 'Speed & swing automated bowling machine setup',
    category: 'facility'
  },
  {
    src: '/images/facilities/turf-3.webp',
    alt: 'Scenic mountain landscape turf view',
    category: 'facility'
  },
  {
    src: '/images/facilities/cricket-net-1-2.webp',
    alt: 'Batting crease and heavy-duty safety netting',
    category: 'facility'
  },
  {
    src: '/images/facilities/cricket-net-2-2.webp',
    alt: 'Cricket Net 2 pitch and bowler run-up',
    category: 'facility'
  },
  {
    src: '/images/facilities/turf-4.webp',
    alt: 'Evening training session on artificial grass',
    category: 'matches'
  },
]

const videos = [
  {
    src: '/videos/msc-hero.mp4',
    thumbnail: '/images/facilities/turf-1.webp',
    title: 'Match Day & Arena Cinematic Tour'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-5-08jxiUsvLXQoXpwyclfGOZPc6dWfP9.mp4',
    thumbnail: '/images/facilities/turf-2.webp',
    title: 'Match Day at MSC'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-151-w98Mi9ESSOejKPO4Dk6V8scjnpApbH.mp4',
    thumbnail: '/images/facilities/turf-3.webp',
    title: 'Night Football under Lights'
  },
]

const categories = ['all', 'facility', 'matches']

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredImages = activeCategory === 'all' 
    ? images 
    : images.filter(img => img.category === activeCategory)

  return (
    <main className="min-h-screen bg-[#061009] text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-[#040d07] overflow-hidden border-b border-emerald-500/10 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] transform-gpu" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-6 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Media Gallery
          </span>
          <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-white tracking-wide uppercase leading-tight">
            MOMENTS FROM THE <span className="text-[#2BA84A]">FIELD</span>
          </h1>
          <p className="mt-5 text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Explore our world-class facilities, training setups, and real match action in Baramulla.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 bg-[#061009]/95 sticky top-20 z-30 border-b border-emerald-500/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  activeCategory === category
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                    : 'bg-[#0d2217] border border-emerald-500/20 text-slate-300 hover:text-white hover:border-emerald-400/40'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Image Grid */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.src + index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer bg-[#040d07] border border-emerald-500/20 hover:border-emerald-400/50 shadow-xl shadow-black/40 transition-all duration-300"
                onClick={() => setSelectedImage(image.src)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040d07]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <p className="text-white text-xs sm:text-sm font-semibold">{image.alt}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Highlights */}
      <section className="py-20 bg-[#040d07] border-t border-emerald-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full mb-4 shadow-sm">
              Cinematic Reel
            </span>
            <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl text-white uppercase tracking-wide">
              VIDEO <span className="text-[#2BA84A]">HIGHLIGHTS</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative aspect-video rounded-3xl overflow-hidden cursor-pointer bg-[#061009] border border-emerald-500/20 hover:border-emerald-400/50 shadow-xl shadow-black/40"
                onClick={() => setSelectedVideo(video.src)}
              >
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600/90 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 group-hover:scale-110 transition-transform">
                    <Play size={24} className="fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white font-bold text-sm drop-shadow-md">
                  {video.title}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modals */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <div className="relative w-full max-w-5xl aspect-[4/3] max-h-[85vh] rounded-2xl overflow-hidden">
              <Image src={selectedImage} alt="Gallery view" fill className="object-contain" />
            </div>
          </motion.div>
        )}

        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-6 right-6 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
              <video src={selectedVideo} controls autoPlay className="w-full h-full rounded-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
