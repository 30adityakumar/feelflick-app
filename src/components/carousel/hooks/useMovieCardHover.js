import { useCallback, useEffect, useRef, useState } from 'react'

export const CARD_EXPAND_DELAY_MS = 180
const CLOSE_DELAY_MS = 90

export function useMovieCardHover({ scrollContainerRef } = {}) {
  const [intentId, setIntentId] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [canHover, setCanHover] = useState(true)
  const intentTimerRef = useRef(null)
  const closeTimerRef = useRef(null)

  const clearIntentTimer = useCallback(() => {
    if (intentTimerRef.current) {
      clearTimeout(intentTimerRef.current)
      intentTimerRef.current = null
    }
  }, [])

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const closeNow = useCallback(() => {
    clearIntentTimer()
    clearCloseTimer()
    setIntentId(null)
    setOpenId(null)
  }, [clearCloseTimer, clearIntentTimer])

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
      // WHY: intra-carousel horizontal scroll should not collapse the open card;
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
    clearIntentTimer()
    setIntentId(item.id)
    if (CARD_EXPAND_DELAY_MS <= 0) {
      setOpenId(item.id)
      return
    }

    intentTimerRef.current = setTimeout(() => {
      setOpenId(item.id)
    }, CARD_EXPAND_DELAY_MS)
  }, [clearCloseTimer, clearIntentTimer])

  const scheduleClose = useCallback(() => {
    clearIntentTimer()
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setIntentId(null)
      setOpenId(null)
    }, CLOSE_DELAY_MS)
  }, [clearCloseTimer, clearIntentTimer])

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
    canHover,
    intentId,
    openId,
    closeNow,
    handleCardEnter,
    handleCardLeave,
    handleCardFocus,
    handleCardBlur,
  }
}
