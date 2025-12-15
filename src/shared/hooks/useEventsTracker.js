// src/shared/hooks/useEventsTracker.js

/**
 * Event Tracking Hooks
 * 
 * React hooks for tracking user interactions and behaviors
 * Automatically tracks page views, scroll depth, time on page, etc.
 */

import { useEffect, useRef, useCallback } from 'react'
import { trackEvent } from '@/shared/services/events-tracker'

/**
 * Hook to track page views, scroll depth, and time on page
 * 
 * @param {Object} options
 * @param {string} options.page - Page identifier (e.g., 'home', 'movie_detail')
 * @param {boolean} options.trackPageView - Whether to track page view on mount
 * @param {boolean} options.trackScroll - Whether to track scroll depth
 * @param {boolean} options.trackTimeOnPage - Whether to track time spent
 * @param {Object} options.metadata - Additional metadata to include
 */
export function usePageTracking({
  page,
  trackPageView = true,
  trackScroll = true,
  trackTimeOnPage = true,
  metadata = {}
} = {}) {
  const mountTime = useRef(Date.now())
  const scrollTracked = useRef({
    '25': false,
    '50': false,
    '75': false,
    '100': false
  })

  // Track page view on mount
  useEffect(() => {
    if (trackPageView) {
      trackEvent(
        null, // Will be filled by trackEvent if user is logged in
        'page_view',
        null,
        {
          page,
          ...metadata,
          timestamp: new Date().toISOString()
        }
      )
    }
  }, [page, trackPageView, metadata])

  // Track scroll depth
  useEffect(() => {
    if (!trackScroll) return

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const scrollPercent = Math.round((scrolled / scrollHeight) * 100)

      // Track milestones
      const milestones = ['25', '50', '75', '100']
      milestones.forEach((milestone) => {
        if (scrollPercent >= parseInt(milestone) && !scrollTracked.current[milestone]) {
          scrollTracked.current[milestone] = true
          
          trackEvent(
            null,
            'scroll_depth',
            null,
            {
              page,
              depth: milestone,
              ...metadata
            }
          )
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [page, trackScroll, metadata])

  // Track time on page (on unmount)
  useEffect(() => {
    if (!trackTimeOnPage) return

    return () => {
      const timeSpent = Math.round((Date.now() - mountTime.current) / 1000) // seconds
      
      trackEvent(
        null,
        'time_on_page',
        null,
        {
          page,
          duration_seconds: timeSpent,
          ...metadata
        }
      )
    }
  }, [page, trackTimeOnPage, metadata])
}

/**
 * Hook to track trailer plays
 * 
 * @param {string|number} movieId - TMDB movie ID
 * @param {string} source - Where the trailer was played from
 * @returns {Function} trackPlay - Function to call when trailer is played
 */
export function useTrailerTracking(movieId, source = 'unknown') {
  return useCallback(() => {
    trackEvent(
      null,
      'trailer_play',
      movieId,
      {
        source,
        timestamp: new Date().toISOString()
      }
    )
  }, [movieId, source])
}

/**
 * Hook to track movie card interactions (hover and click)
 * 
 * @param {string|number} movieId - TMDB movie ID
 * @param {string} source - Where the card is shown (e.g., 'hero_slider', 'carousel_row')
 * @param {Object} options
 * @param {Function} options.onClick - Callback to execute on click
 * @returns {Object} { ref, handleClick } - Ref to attach to card and click handler
 */
export function useMovieCardTracking(movieId, source, { onClick } = {}) {
  const hoverStartRef = useRef(null)
  const hasTrackedHover = useRef(false)

  const ref = useCallback((node) => {
    if (!node) return

    // Track hover (mouse enter)
    const handleMouseEnter = () => {
      hoverStartRef.current = Date.now()
      
      if (!hasTrackedHover.current) {
        hasTrackedHover.current = true
        
        trackEvent(
          null,
          'movie_hover',
          movieId,
          {
            source,
            timestamp: new Date().toISOString()
          }
        )
      }
    }

    // Track hover duration (mouse leave)
    const handleMouseLeave = () => {
      if (hoverStartRef.current) {
        const duration = Math.round((Date.now() - hoverStartRef.current) / 1000)
        
        trackEvent(
          null,
          'movie_hover_end',
          movieId,
          {
            source,
            duration_seconds: duration
          }
        )
        
        hoverStartRef.current = null
      }
    }

    node.addEventListener('mouseenter', handleMouseEnter)
    node.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter)
      node.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [movieId, source])

  const handleClick = useCallback((e) => {
    trackEvent(
      null,
      'movie_click',
      movieId,
      {
        source,
        timestamp: new Date().toISOString()
      }
    )

    // Call the original onClick if provided
    if (onClick) {
      onClick(e)
    }
  }, [movieId, source, onClick])

  return { ref, handleClick }
}

/**
 * Hook to track search queries
 * 
 * @returns {Function} trackSearchQuery - Function to call when search is performed
 */
export function useSearchTracking() {
  return useCallback((query, resultsCount = 0) => {
    trackEvent(
      null,
      'search',
      null,
      {
        query,
        results_count: resultsCount,
        timestamp: new Date().toISOString()
      }
    )
  }, [])
}
