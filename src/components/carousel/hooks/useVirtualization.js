// src/components/carousel/hooks/useVirtualization.js
import { useState, useEffect, useRef, useCallback } from 'react'

export function useVirtualization({
  items = [],
  itemWidth = 240,
  gap = 0,
  overscan = 3, // Render 3 extra items on each side
  containerRef
}) {
  const step = itemWidth + gap

  // Initialize with enough cards to fill the viewport — prevents the "0 cards → pop in" flash
  const [viewport, setViewport] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
    const initialEnd = Math.min(items.length, Math.ceil(vw / step) + overscan)
    return { start: 0, end: Math.max(initialEnd, overscan * 2) }
  })
  const rafRef = useRef(null)

  const updateViewport = useCallback(() => {
    if (!containerRef?.current || items.length === 0) return

    const scrollLeft = containerRef.current.scrollLeft
    const containerWidth = containerRef.current.clientWidth

    // Calculate visible range + overscan buffer
    const startIndex = Math.max(0, Math.floor(scrollLeft / step) - overscan)
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollLeft + containerWidth) / step) + overscan
    )

    setViewport({ start: startIndex, end: endIndex })
  }, [containerRef, items.length, overscan, step])

  // RAF-powered scroll listener (60fps smooth)
  useEffect(() => {
    const container = containerRef?.current
    if (!container) return

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateViewport)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    // Initial calculation
    updateViewport()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [updateViewport, containerRef])

  const visibleItems = items.slice(viewport.start, viewport.end)
  const totalWidth = items.length * step

  return {
    viewport,
    visibleItems,
    totalWidth,
    // Spacer widths for virtual scrolling
    leftSpacerWidth: viewport.start * step,
    rightSpacerWidth: (items.length - viewport.end) * step
  }
}
