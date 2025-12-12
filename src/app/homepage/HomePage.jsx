// src/app/homepage/HomePage.jsx

import HeroTopPick from './components/HeroTopPick'
import QuickPicksRow from './components/QuickPicksRow'
import PersonalizedCarouselRow from './components/PersonalizedCarouselRow'
import BecauseYouWatchedSection from './components/BecauseYouWatchedSection'
import HiddenGemsRow from './components/HiddenGemsRow'
import TrendingForYouRow from './components/TrendingForYouRow'
import SlowContemplativeRow from './components/SlowContemplativeRow'
import QuickWatchesRow from './components/QuickWatchesRow'
import LazyRow from '@/shared/components/LazyRow'
import { useGenreRecommendations } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

export default function HomePage() {
  // Inside HomePage component
  const enabledGenre = useStaggeredEnabled(50) // Small delay after BecauseYouWatched
  const genreRecs = useGenreRecommendations({ limit: 20, enabled: enabledGenre })

  return (
    <div className="relative w-full bg-black text-white min-h-screen overflow-x-hidden">
      <HeroTopPick />

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