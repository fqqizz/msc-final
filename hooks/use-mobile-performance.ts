import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

export function useMobilePerformance() {
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)

  useEffect(() => {
    // 1. Monitor viewport size for mobile detection
    const mqlSize = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handleSizeChange = () => {
      setIsMobile(mqlSize.matches)
    }
    mqlSize.addEventListener('change', handleSizeChange)
    setIsMobile(mqlSize.matches)

    // 2. Monitor system prefers-reduced-motion media query
    const mqlMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = () => {
      setPrefersReducedMotion(mqlMotion.matches)
    }
    mqlMotion.addEventListener('change', handleMotionChange)
    setPrefersReducedMotion(mqlMotion.matches)

    return () => {
      mqlSize.removeEventListener('change', handleSizeChange)
      mqlMotion.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Performance mode is active on mobile devices or when system reduced motion is active
  const performanceMode = isMobile || prefersReducedMotion

  return {
    isMobile,
    prefersReducedMotion,
    performanceMode,
  }
}
