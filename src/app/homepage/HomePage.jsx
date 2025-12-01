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
  // Existing personalized hooks (still reused for a simple row)
  const genreRecs = useGenreRecommendations({ limit: 20 })
  const historyRecs = useHistoryRecommendations({ limit: 20 })

  return (
    <div className="relative w-full bg-black text-white min-h-screen">
      {/* Hero: Tonight's top pick */}
      <HeroTopPick />

      {/* Content Rows */}
      <div className="relative z-30 space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 pb-20 md:pb-8 mt-4">
        {/* Block 2: Quick picks */}
        <QuickPicksRow />

        {/* Block 3: Because you watched (seeded rows) */}
        <BecauseYouWatchedSection />

        {/* Block 4: From your favorite genres (simple combined row for now) */}
        <PersonalizedCarouselRow
          title="From your favorite genres"
          movies={genreRecs.data}
          loading={genreRecs.loading}
          error={genreRecs.error}
          rowId="favorite-genres"
        />

        {/* Block 5: Hidden gems */}
        <HiddenGemsRow />

        {/* Block 6: Trending this week (for you) */}
        <TrendingForYouRow />

        {/* Block 7: Slow & Contemplative */}
        <SlowContemplativeRow />

        {/* Block 8: Quick Watches: movies under 90 minutes */}
        <QuickWatchesRow />
      </div>
    </div>
  )
}
