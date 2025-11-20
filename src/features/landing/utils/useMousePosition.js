// src/features/landing/utils/useMousePosition.js
import { useState, useEffect } from 'react'

export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let animationFrameId = null

    const updateMousePosition = (ev) => {
      // Throttle updates with requestAnimationFrame
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(() => {
        const x = (ev.clientX / window.innerWidth) * 2 - 1
        const y = (ev.clientY / window.innerHeight) * 2 - 1
        setMousePosition({ x, y })
      })
    }

    window.addEventListener('mousemove', updateMousePosition)

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return mousePosition
}
