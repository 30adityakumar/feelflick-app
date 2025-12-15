// src/shared/hooks/useStaggeredEnabled.js
import { useEffect, useMemo, useState } from 'react'

/**
 * Returns `true` after a staggered delay.
 * Prevents multiple rows/hooks from firing simultaneously.
 *
 * Production behavior:
 * - delay <= 0 (or invalid) => enabled immediately
 * - delay changes are handled correctly (including non-zero -> 0)
 */
export function useStaggeredEnabled(delay = 0) {
  const safeDelay = useMemo(() => {
    const n = typeof delay === 'number' ? delay : Number(delay)
    if (!Number.isFinite(n)) return 0
    return Math.max(0, Math.floor(n))
  }, [delay])

  const [enabled, setEnabled] = useState(safeDelay === 0)

  useEffect(() => {
    // If delay is 0, ensure we're enabled immediately
    if (safeDelay === 0) {
      setEnabled(true)
      return
    }

    // Reset to false when a new positive delay is applied
    setEnabled(false)

    const timer = setTimeout(() => setEnabled(true), safeDelay)
    return () => clearTimeout(timer)
  }, [safeDelay])

  return enabled
}
