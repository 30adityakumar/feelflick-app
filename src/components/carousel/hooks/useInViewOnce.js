// src/components/carousel/hooks/useInViewOnce.js
import { useEffect, useRef, useState } from 'react'

export function useInViewOnce({ threshold = 0.2, rootMargin = '0px' } = {}) {
  const ref = useRef(null)
  const [hasBeenInView, setHasBeenInView] = useState(false)

  useEffect(() => {
    if (hasBeenInView) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasBeenInView(true)
            observer.disconnect()
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasBeenInView, threshold, rootMargin])

  return { ref, hasBeenInView }
}
