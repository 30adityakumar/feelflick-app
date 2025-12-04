// src/app/homepage/HomePage.jsx

import HeroTopPick from './components/HeroTopPick'
import QuickPicksRow from './components/QuickPicksRow'
import PersonalizedCarouselRow from './components/PersonalizedCarouselRow'
import BecauseYouWatchedSection from './components/BecauseYouWatchedSection'
import HiddenGemsRow from './components/HiddenGemsRow'
import TrendingForYouRow from './components/TrendingForYouRow'
import SlowContemplativeRow from './components/SlowContemplativeRow'
import QuickWatchesRow from './components/QuickWatchesRow'
import { useHistoryRecommendations, useGenreRecommendations } from '@/shared/hooks/useRecommendations'

export default function HomePage() {
  const genreRecs = useGenreRecommendations({ limit: 20 })
  const historyRecs = useHistoryRecommendations({ limit: 20 })

  return (
    <div className="relative w-full bg-black text-white min-h-screen overflow-x-hidden">
      {/* Hero: Tonight's top pick */}
      <HeroTopPick />

      {/* Content Rows - overflow-visible is critical for card expansion */}
      <div className="relative z-30 pb-20 md:pb-8 mt-4 overflow-visible">
        <div className="space-y-2 sm:space-y-4 overflow-visible">
          {/* Quick picks */}
          <QuickPicksRow />

          {/* Because you watched */}
          <BecauseYouWatchedSection />

          {/* From your favorite genres */}
          <PersonalizedCarouselRow
            title="From your favorite genres"
            movies={genreRecs.data}
            loading={genreRecs.loading}
            error={genreRecs.error}
            rowId="favorite-genres"
          />

          {/* Hidden gems */}
          <HiddenGemsRow />

          {/* Trending this week */}
          <TrendingForYouRow />

          {/* Slow & Contemplative */}
          <SlowContemplativeRow />

          {/* Quick Watches */}
          <QuickWatchesRow />
        </div>
      </div>
    </div>
  )
}