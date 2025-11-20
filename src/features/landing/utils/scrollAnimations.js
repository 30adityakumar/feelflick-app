// src/features/landing/utils/scrollAnimations.js
import { useEffect, useRef, useState } from 'react'

/**
 * 🎬 Intersection Observer Hook
 * Triggers animation when element enters viewport
 */
export function useScrollAnimation(options = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        ...options,
      },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [options])

  return { ref, isVisible }
}

/**
 * 🎬 Staggered Animation Hook
 * For animating multiple children with delay
 */
export function useStaggeredAnimation(itemCount, delay = 100) {
  const [itemsVisible, setItemsVisible] = useState([])
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setItemsVisible((prev) => [...prev, i])
            }, i * delay)
          }
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [itemCount, delay])

  return { containerRef, itemsVisible }
}
