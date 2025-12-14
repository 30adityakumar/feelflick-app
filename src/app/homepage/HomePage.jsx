// src/app/homepage/HomePage.jsx
import { useOutletContext } from 'react-router-dom'

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

export default function HomePage({ preloadedHero = null, preloadedUser = null } = {}) {
  // Prefer auth context from PostAuthGate (Outlet), but keep props for future preloading
  const outlet = useOutletContext?.() || {}
  const userId = outlet.userId ?? preloadedUser?.id ?? null
  const user = outlet.user ?? preloadedUser ?? null

  // Reduce initial network contention by staggering rows behind the hero
  const enabledQuickPicks = useStaggeredEnabled(250)
  const enabledBecauseYouWatched = useStaggeredEnabled(450)

  // Genre recommendations should not compete with hero's first render
  const enabledGenre = useStaggeredEnabled(650)
  const genreRecs = useGenreRecommendations({ limit: 20, enabled: enabledGenre })

  return (
    <div
      className="relative w-full bg-black text-white min-h-screen overflow-x-hidden animate-fadeIn"
      style={{ animationDuration: '0.4s' }}
    >
      {/* Hero: pass userId from PostAuthGate so HeroTopPick does NOT do its own auth lookup */}
      <HeroTopPick userId={userId} preloadedData={preloadedHero} preloadedUser={user} />

      {/* Content Rows */}
      <div className="relative z-30 pb-20 md:pb-8 mt-4 overflow-visible">
        <div className="space-y-2 sm:space-y-4 overflow-visible">
          {enabledQuickPicks ? <QuickPicksRow /> : null}
          {enabledBecauseYouWatched ? <BecauseYouWatchedSection /> : null}

          {enabledGenre ? (
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
          ) : null}

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
