// src/shared/components/LazyRow.jsx
import { useEffect, useRef, useState } from 'react'

/**
 * Wrapper that only renders children when scrolled into viewport
 * Prevents off-screen API calls on initial page load
 */
export default function LazyRow({ children, offset = 400 }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // Stop observing after first visibility
        }
      },
      { rootMargin: `${offset}px` } // Load slightly before entering viewport
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [offset])

  return (
    <div ref={ref}>
      {isVisible ? children : <div className="h-64" />} {/* Placeholder to maintain layout */}
    </div>
  )
}