import { useCallback, useEffect, useRef, useState } from 'react'

export const CARD_EXPAND_DELAY_MS = 0
const CLOSE_DELAY_MS = 90

/**
 * Manages hover state for a carousel row.
 * Single `hoveredId` replaces the old intentId/openId two-state machine;
 * there is no longer an expanded panel to gate behind a delay.
 *
 * @param {{ scrollContainerRef?: import('react').RefObject<HTMLElement> }} [options]
 * @returns {{ hoveredId: string|null, canHover: boolean, closeNow: Function,
 *             handleCardEnter: Function, handleCardLeave: Function,
 *             handleCardFocus: Function, handleCardBlur: Function }}
 */
export function useMovieCardHover({ scrollContainerRef } = {}) {
  const [hoveredId, setHoveredId] = useState(null)
  const [canHover, setCanHover] = useState(true)
  const closeTimerRef = useRef(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const closeNow = useCallback(() => {
    clearCloseTimer()
    setHoveredId(null)
  }, [clearCloseTimer])

  useEffect(() => () => closeNow(), [closeNow])

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(hover: hover) and (pointer: fine)')
    if (!mediaQuery) return undefined

    const sync = () => setCanHover(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener?.('change', sync)
    return () => mediaQuery.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    const handleViewportChange = (event) => {
      const node = scrollContainerRef?.current
      // WHY: intra-carousel horizontal scroll should not collapse the hovered card;
      // only page-level scroll past the row should. contains() covers all descendants
      // (trackpad inertia, snap-scroll settle, etc.).
      if (node && event.target instanceof Node && node.contains(event.target)) {
        return
      }
      closeNow()
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [closeNow, scrollContainerRef])

  const scheduleOpen = useCallback((item) => {
    if (!item) return
    clearCloseTimer()
    setHoveredId(item.id)
  }, [clearCloseTimer])

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setHoveredId(null)
    }, CLOSE_DELAY_MS)
  }, [clearCloseTimer])

  const handleCardEnter = useCallback((item) => {
    if (!canHover) return
    scheduleOpen(item)
  }, [canHover, scheduleOpen])

  const handleCardLeave = useCallback(() => {
    scheduleClose()
  }, [scheduleClose])

  const handleCardFocus = useCallback((item) => {
    scheduleOpen(item)
  }, [scheduleOpen])

  const handleCardBlur = useCallback(() => {
    scheduleClose()
  }, [scheduleClose])

  return {
    hoveredId,
    canHover,
    closeNow,
    handleCardEnter,
    handleCardLeave,
    handleCardFocus,
    handleCardBlur,
  }
}
