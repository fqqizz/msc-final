'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgress() {
  const [isVisible, setIsVisible] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    const handleScroll = () => {
      // Show progress bar after scrolling past initial viewport
      setIsVisible(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 z-[60] origin-left"
      style={{
        scaleX,
        opacity: isVisible ? 1 : 0,
        background: 'linear-gradient(90deg, #2BA84A 0%, #10B981 50%, #7DD3FC 100%)',
        boxShadow: '0 0 10px rgba(43, 168, 74, 0.5)'
      }}
      transition={{ opacity: { duration: 0.2 } }}
    />
  )
}
