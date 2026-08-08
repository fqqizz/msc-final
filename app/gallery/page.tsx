'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import Navigation from '@/components/navigation'
import Footer from '@/components/footer'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play } from 'lucide-react'

const images = [
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-9yWOKvvBNNBK6xIquOyQsdI5jRibpr.webp',
    alt: 'Night match at MSC',
    category: 'matches'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/contact-fsgvfbe8149b7d7aaf60a37248cac104cff70-nopehSpkqvMqC7oJJY6RAFFztOHa5x.png',
    alt: 'MSC Turf Overview',
    category: 'facility'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp',
    alt: 'Players on turf',
    category: 'matches'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%281%29-cTfRT8gpqovQtI1n8tjmfmQjPApiM5.webp',
    alt: 'Turf installation',
    category: 'facility'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/slider-63-8ZRY8fIdPrLsfKen4dce4zLwO9bLAz.png',
    alt: 'View through net',
    category: 'facility'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/categoryww-11-5SQXOQi5VinDcWf4sCttNRzzVlb0gC.png',
    alt: 'Wide turf view',
    category: 'facility'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/page1-abaabcfaf969a251f4be6e6a07a4bf9f-c9bzGg4YvT0qLkYYpQgk98G8M46NPD.png',
    alt: 'Facility collage',
    category: 'facility'
  },
]

const videos = [
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-5-08jxiUsvLXQoXpwyclfGOZPc6dWfP9.mp4',
    thumbnail: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed-BtTMVUoxdbTwOFbHQOpW9cgbrN0bWX.webp',
    title: 'Match Day at MSC'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-151-w98Mi9ESSOejKPO4Dk6V8scjnpApbH.mp4',
    thumbnail: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/unnamed%20%282%29-9yWOKvvBNNBK6xIquOyQsdI5jRibpr.webp',
    title: 'Night Football'
  },
  {
    src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Video-627-O0kafdXukxbEpiMjpg2FYJuT9PE5GQ.mp4',
    thumbnail: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/categoryww-11-5SQXOQi5VinDcWf4sCttNRzzVlb0gC.png',
    title: 'Turf Overview'
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
    <main className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#F8FAFB] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 bg-[#E8F5EC] text-[#2BA84A] text-sm font-medium rounded-full mb-6">
            Gallery
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#0A0A0C] tracking-tight">
            Moments from the
            <span className="text-[#2BA84A]"> Field</span>
          </h1>
          <p className="mt-6 text-[#0A0A0C]/60 text-lg max-w-2xl mx-auto">
            Explore our world-class facilities and see the action happening at Maqbool Sports Complex.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white sticky top-20 z-30 border-b border-[#0A0A0C]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  activeCategory === category
                    ? 'bg-[#2BA84A] text-white'
                    : 'bg-[#F8FAFB] text-[#0A0A0C]/60 hover:text-[#0A0A0C]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Images Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0A0A0C] mb-8">Photos</h2>
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.src}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`relative group cursor-pointer rounded-2xl overflow-hidden ${
                    index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''
                  }`}
                  onClick={() => setSelectedImage(image.src)}
                >
                  <div className={`relative ${index === 0 ? 'aspect-square' : 'aspect-[4/3]'}`}>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-16 bg-[#F8FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0A0A0C] mb-8">Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.src}
                className="relative group cursor-pointer rounded-2xl overflow-hidden"
                onClick={() => setSelectedVideo(video.src)}
              >
                <div className="relative aspect-video">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play size={28} className="text-white ml-1" />
                    </div>
                  </div>
                </div>
                <p className="mt-3 font-medium text-[#0A0A0C]">{video.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Lightbox */}
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
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt="Gallery image"
                width={1200}
                height={800}
                className="w-full h-auto object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Lightbox */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
              onClick={() => setSelectedVideo(null)}
            >
              <X size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
