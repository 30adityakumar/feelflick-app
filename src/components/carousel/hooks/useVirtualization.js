// src/components/carousel/hooks/useVirtualization.js
import { useState, useEffect, useRef, useCallback } from 'react'

export function useVirtualization({ 
  items = [], 
  itemWidth = 240, 
  overscan = 3, // Render 3 extra items on each side
  containerRef 
}) {
  const [viewport, setViewport] = useState({ start: 0, end: 0 })
  const rafRef = useRef(null)

  const updateViewport = useCallback(() => {
    if (!containerRef?.current || items.length === 0) return

    const rect = containerRef.current.getBoundingClientRect()
    const scrollLeft = containerRef.current.scrollLeft
    const containerWidth = containerRef.current.clientWidth

    // Calculate visible range + overscan buffer
    const startIndex = Math.max(0, Math.floor(scrollLeft / itemWidth) - overscan)
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollLeft + containerWidth) / itemWidth) + overscan
    )

    setViewport({ start: startIndex, end: endIndex })
  }, [items.length, itemWidth, overscan, containerRef])

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
  }, [updateViewport])

  const visibleItems = items.slice(viewport.start, viewport.end)
  const totalWidth = items.length * itemWidth

  return {
    viewport,
    visibleItems,
    totalWidth,
    // Spacer widths for virtual scrolling
    leftSpacerWidth: viewport.start * itemWidth,
    rightSpacerWidth: (items.length - viewport.end) * itemWidth
  }
}
