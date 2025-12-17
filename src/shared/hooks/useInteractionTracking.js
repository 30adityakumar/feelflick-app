/**
 * useInteractionTracking Hook
 * Automatically tracks user interactions
 */

import { useEffect, useRef } from 'react'
import { 
  trackMovieView, 
  trackMovieHover, 
  initSession, 
  endSession 
} from '@/shared/services/interactions'

/**
 * Track movie card hover
 */
export function useMovieHover(movieId, source = 'unknown') {
  const hoverStartRef = useRef(null)

  const handleMouseEnter = () => {
    hoverStartRef.current = Date.now()
  }

  const handleMouseLeave = () => {
    if (hoverStartRef.current && movieId) {
      const duration = Date.now() - hoverStartRef.current
      trackMovieHover(movieId, duration, source)
      hoverStartRef.current = null
    }
  }

  return { handleMouseEnter, handleMouseLeave }
}

/**
 * Track page view
 */
export function usePageView(movieId, source = 'unknown') {
  useEffect(() => {
    if (movieId) {
      trackMovieView(movieId, source)
    }
  }, [movieId, source])
}

/**
 * Initialize session on app mount
 */
export function useSessionTracking() {
  useEffect(() => {
    initSession()

    return () => {
      endSession()
    }
  }, [])
}
