// src/shared/components/LazyRow.jsx
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * LazyRow
 * - Prevents below-the-fold components from mounting (and firing API calls) until near viewport
 * - Uses IntersectionObserver with rootMargin (offset) to pre-load before visible
 * - Includes resilient fallbacks (no IO support, SSR) to avoid blank sections
 * - Optional idle pre-warm (idleMs) for “Netflix-feel” progressive hydration
 *
 * Backwards compatible with:
 *   <LazyRow offset={400}>{...}</LazyRow>
 */
export default function LazyRow({
  children,
  offset = 400,

  // Layout stability (avoid CLS)
  minHeight = 256,
  placeholderClassName = 'h-64',

  // Control behavior
  enabled = true,
  once = true,

  // Optional: mount when browser is idle (even if not visible yet)
  // Set to 0 to disable (default).
  idleMs = 0,

  // Optional: hook for metrics/prefetch
  onVisible,

  // Optional styling passthrough
  className = '',
  style,
}) {
  const safeOffset = useMemo(() => {
    const n = typeof offset === 'number' ? offset : Number(offset)
    if (!Number.isFinite(n)) return 400
    return Math.max(0, Math.floor(n))
  }, [offset])

  const safeMinHeight = useMemo(() => {
    const n = typeof minHeight === 'number' ? minHeight : Number(minHeight)
    if (!Number.isFinite(n)) return 256
    return Math.max(0, Math.floor(n))
  }, [minHeight])

  const safeIdleMs = useMemo(() => {
    const n = typeof idleMs === 'number' ? idleMs : Number(idleMs)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.floor(n))
  }, [idleMs])

  const [shouldRender, setShouldRender] = useState(() => !enabled)
  const hostRef = useRef(null)

  // keep latest callback without retriggering observer setup
  const onVisibleRef = useRef(onVisible)
  onVisibleRef.current = onVisible

  // prevent accidental multi-fire of onVisible (common with idle+IO race)
  const didFireVisibleRef = useRef(false)
  const fireOnVisibleOnce = () => {
    if (didFireVisibleRef.current) return
    didFireVisibleRef.current = true
    onVisibleRef.current?.()
  }

  useEffect(() => {
    // If we already rendered once, never go back to placeholder
    if (shouldRender) return

    if (!enabled) {
      setShouldRender(true)
      return
    }

    let cancelled = false
    let observer = null
    let idleHandle = null
    let timeoutHandle = null

    const cleanup = () => {
      if (observer) observer.disconnect()
      observer = null

      if (idleHandle && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleHandle)
      }
      idleHandle = null

      if (timeoutHandle) clearTimeout(timeoutHandle)
      timeoutHandle = null
    }

    const reveal = () => {
      if (cancelled) return
      setShouldRender(true)
      fireOnVisibleOnce()
      if (once) cleanup()
    }

    // Optional: idle pre-warm so rows “wake up” progressively even without scrolling
    if (safeIdleMs > 0) {
      if (typeof requestIdleCallback === 'function') {
        idleHandle = requestIdleCallback(reveal, { timeout: safeIdleMs })
      } else {
        timeoutHandle = setTimeout(reveal, safeIdleMs)
      }
    }

    // SSR / unsupported browsers: don’t block rendering
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      reveal()
      return () => {
        cancelled = true
        cleanup()
      }
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          reveal()
        }
      },
      {
        root: null,
        // preload when within +/- offset px vertically
        rootMargin: `${safeOffset}px 0px`,
        threshold: 0.01,
      }
    )

    const el = hostRef.current
    if (el) {
      observer.observe(el)
    } else {
      // If ref isn’t ready, just render (avoids “stuck placeholders”)
      reveal()
    }

    return () => {
      cancelled = true
      cleanup()
    }
  }, [enabled, once, safeOffset, safeIdleMs, shouldRender])

  return (
    <div ref={hostRef} className={className} style={style}>
      {shouldRender ? (
        children
      ) : (
        <div
          aria-hidden="true"
          className={placeholderClassName}
          style={{ minHeight: safeMinHeight }}
        />
      )}
    </div>
  )
}
