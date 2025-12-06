// src/components/carousel/hooks/useImpressionObserver.js
import { useEffect } from 'react'

export function useImpressionObserver({
  selector,
  rowName,
  threshold = 0.4,
  delayMs = 400,
  track,
}) {
  useEffect(() => {
    if (!track || typeof IntersectionObserver === 'undefined') return

    const elements = Array.from(document.querySelectorAll(selector))
    if (!elements.length) return

    const seen = new Set()
    const timers = new Map()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target
          const id = el.getAttribute('data-movie-id')
          const index = Number(el.getAttribute('data-index') ?? 0)

          if (!id || seen.has(id)) return

          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            // Schedule event to avoid micro-blips
            if (!timers.has(id)) {
              const t = setTimeout(() => {
                seen.add(id)
                timers.delete(id)
                track({
                  type: 'movie_impression',
                  movieId: id,
                  index,
                  row: rowName,
                })
              }, delayMs)
              timers.set(id, t)
            }
          } else {
            // Cancel pending if scrolled out before delay
            const t = timers.get(id)
            if (t) {
              clearTimeout(t)
              timers.delete(id)
            }
          }
        })
      },
      { threshold }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
    }
  }, [selector, rowName, threshold, delayMs, track])
}
