// src/shared/hooks/useSmartHomepageLoad.js
import { useState, useEffect } from 'react'
import { useTopPick } from './useRecommendations'

/**
 * Orchestrates homepage loading to feel instant
 * - Prefetches top pick during auth check
 * - Tracks loading stages for unified UI
 * - Hides individual component spinners
 */
export function useSmartHomepageLoad() {
  const [stage, setStage] = useState(1) // 1: auth, 2: loading, 3: ready
  const [isReady, setIsReady] = useState(false)

  // Start loading top pick immediately (parallel with auth)
  const topPick = useTopPick({ enabled: true })

  useEffect(() => {
    // Stage progression
    const timer1 = setTimeout(() => setStage(2), 200)  // Show "loading movies" immediately
    const timer2 = setTimeout(() => setStage(3), 800)  // Show "almost ready"
    
    // Hide loader once we have the hero
    if (topPick.data && !topPick.loading) {
      const timer3 = setTimeout(() => setIsReady(true), 1000) // Smooth transition
      return () => clearTimeout(timer3)
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [topPick.data, topPick.loading])

  return {
    stage,
    isReady,
    topPickData: topPick.data,
    topPickLoading: topPick.loading
  }
}