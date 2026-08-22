'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface FacilityCarouselProps {
  images: string[]
  facilityName: string
  aspectRatioClass?: string
  priorityFirst?: boolean
  className?: string
  imageClassName?: string
}

export default function FacilityCarousel({
  images,
  facilityName,
  aspectRatioClass = 'aspect-[16/10] sm:aspect-[4/3]',
  priorityFirst = false,
  className = '',
  imageClassName = '',
}: FacilityCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const count = images.length

  const goToNext = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      setCurrentIndex((prev) => (prev + 1) % count)
    },
    [count]
  )

  const goToPrev = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      setCurrentIndex((prev) => (prev - 1 + count) % count)
    },
    [count]
  )

  const goToIndex = useCallback((idx: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex(idx)
  }, [])

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) return
    const diffX = touchStartX.current - touchEndX.current
    const minSwipeDistance = 40

    if (diffX > minSwipeDistance) {
      // Swiped left -> next
      e.stopPropagation()
      goToNext()
    } else if (diffX < -minSwipeDistance) {
      // Swiped right -> prev
      e.stopPropagation()
      goToPrev()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  if (!images || images.length === 0) {
    return (
      <div className={`relative w-full overflow-hidden bg-[#06140D] ${aspectRatioClass} ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
          No photo available
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative w-full overflow-hidden select-none group/carousel ${aspectRatioClass} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container with smooth translation */}
      <div
        className="absolute inset-0 flex h-full w-full transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {images.map((imgSrc, idx) => (
          <div key={imgSrc + idx} className="relative w-full h-full shrink-0 bg-[#040d07]">
            <Image
              src={imgSrc}
              alt={`${facilityName} photo ${idx + 1}`}
              fill
              priority={priorityFirst && idx === 0}
              loading={idx === 0 ? 'eager' : 'lazy'}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover object-center ${imageClassName}`}
            />
          </div>
        ))}
      </div>

      {/* Subtle Bottom Scrim for Pill Contrast */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none z-10" />

      {/* Instagram-style Nav Arrows (Desktop hover / accessible) */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous facility photo"
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/85 text-white/90 hover:text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition-all duration-200 z-20 cursor-pointer shadow-lg active:scale-95 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none md:pointer-events-auto'
            } hidden sm:flex`}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next facility photo"
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 hover:bg-black/85 text-white/90 hover:text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition-all duration-200 z-20 cursor-pointer shadow-lg active:scale-95 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none md:pointer-events-auto'
            } hidden sm:flex`}
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Instagram-Style Minimal Pagination Dots & Counter */}
      {count > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
          <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 shadow-md">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => goToIndex(idx, e)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-250 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-4 h-1.5 bg-[#2BA84A] shadow-[0_0_8px_rgba(43,168,74,0.8)]'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
