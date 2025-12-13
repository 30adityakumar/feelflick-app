// src/app/homepage/HomePage.jsx

import { useState, useEffect } from 'react'
import HeroTopPick from './components/HeroTopPick'
import QuickPicksRow from './components/QuickPicksRow'
import PersonalizedCarouselRow from './components/PersonalizedCarouselRow'
import BecauseYouWatchedSection from './components/BecauseYouWatchedSection'
import HiddenGemsRow from './components/HiddenGemsRow'
import TrendingForYouRow from './components/TrendingForYouRow'
import SlowContemplativeRow from './components/SlowContemplativeRow'
import QuickWatchesRow from './components/QuickWatchesRow'
import LazyRow from '@/shared/components/LazyRow'
import FeelFlickLoader from '@/shared/components/FeelFlickLoader'
import { useGenreRecommendations, useTopPick } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

export default function HomePage() {
  const [loadingStage, setLoadingStage] = useState(1)
  const [showContent, setShowContent] = useState(false)

  // Prefetch hero immediately
  const topPick = useTopPick({ enabled: true })

  // Genre recommendations with stagger
  const enabledGenre = useStaggeredEnabled(50)
  const genreRecs = useGenreRecommendations({ limit: 20, enabled: enabledGenre })

  // Loading stage progression
  useEffect(() => {
    // Stage 1: Auth (handled by PostAuthGate, we're at stage 2)
    const timer1 = setTimeout(() => setLoadingStage(2), 100)
    
    // Stage 2: Loading movies
    const timer2 = setTimeout(() => setLoadingStage(3), 600)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  // Show content when hero is ready
  useEffect(() => {
    if (topPick.data && !topPick.loading) {
      // Add small delay for smooth transition
      const timer = setTimeout(() => setShowContent(true), 400)
      return () => clearTimeout(timer)
    }
  }, [topPick.data, topPick.loading])

  // Show unified loader until hero is ready
  if (!showContent) {
    return <FeelFlickLoader stage={loadingStage} />
  }

  return (
    <div 
      className="relative w-full bg-black text-white min-h-screen overflow-x-hidden animate-fadeIn"
      style={{ animationDuration: '0.6s' }}
    >
      {/* Hero: Pre-loaded, renders immediately */}
      <HeroTopPick preloadedData={topPick.data} />

      {/* Content Rows */}
      <div className="relative z-30 pb-20 md:pb-8 mt-4 overflow-visible">
        <div className="space-y-2 sm:space-y-4 overflow-visible">
          {/* Above fold - load immediately */}
          <QuickPicksRow />
          <BecauseYouWatchedSection />

          {/* Below fold - lazy load */}
          <LazyRow>
            <PersonalizedCarouselRow
              title="From your favorite genres"
              movies={genreRecs.data}
              loading={genreRecs.loading}
              error={genreRecs.error}
              rowId="favorite-genres"
              placement="favorite_genres"
            />
          </LazyRow>

          <LazyRow>
            <HiddenGemsRow />
          </LazyRow>

          <LazyRow>
            <TrendingForYouRow />
          </LazyRow>

          <LazyRow>
            <SlowContemplativeRow />
          </LazyRow>

          <LazyRow>
            <QuickWatchesRow />
          </LazyRow>
        </div>
      </div>
    </div>
  )
}