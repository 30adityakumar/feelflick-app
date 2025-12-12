// src/shared/hooks/useStaggeredEnabled.js
import { useState, useEffect } from 'react'

/**
 * Returns `true` after a staggered delay
 * Prevents all lazy-loaded rows from firing API calls simultaneously
 * when they become visible together (e.g., fast scrolling)
 */
export function useStaggeredEnabled(delay = 0) {
  const [enabled, setEnabled] = useState(delay === 0)

  useEffect(() => {
    if (delay === 0) return

    const timer = setTimeout(() => setEnabled(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return enabled
}