// src/features/landing/utils/scrollAnimations.js
import { useEffect, useRef, useState } from 'react'

/**
 * 🎬 Intersection Observer Hook
 * Triggers animation when element enters viewport
 * 
 * @param {Object} options - IntersectionObserver options
 * @returns {Object} { ref, isVisible }
 */
export function useScrollAnimation(options = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Once visible, stop observing (animation only plays once)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        ...options,
      }
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
 * 
 * @param {number} itemCount - Number of items to animate
 * @param {number} delay - Delay between each item (ms)
 * @returns {Object} { containerRef, itemsVisible }
 */
export function useStaggeredAnimation(itemCount, delay = 100) {
  const [itemsVisible, setItemsVisible] = useState([])
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the reveal
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setItemsVisible(prev => [...prev, i])
            }, i * delay)
          }
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [itemCount, delay])

  return { containerRef, itemsVisible }
}
