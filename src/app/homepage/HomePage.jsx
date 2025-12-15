// src/app/homepage/HomePage.jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Layers } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'

import HeroTopPick from './components/HeroTopPick'
import QuickPicksRow from './components/QuickPicksRow'
import PersonalizedCarouselRow from './components/PersonalizedCarouselRow'
import BecauseYouWatchedSection from './components/BecauseYouWatchedSection'
import HiddenGemsRow from './components/HiddenGemsRow'
import TrendingForYouRow from './components/TrendingForYouRow'

import LazyRow from '@/shared/components/LazyRow'
import { useGenreRecommendations } from '@/shared/hooks/useRecommendations'
import { useStaggeredEnabled } from '@/shared/hooks/useStaggeredEnabled'

function pickFirstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v
  }
  return null
}

export default function HomePage() {
  // Outlet context (PostAuthGate / AppShell may provide these)
  const outlet = useOutletContext() || {}

  const preloadedUser =
    outlet.preloadedUser ||
    outlet.user ||
    outlet.sessionUser ||
    outlet.profile?.user ||
    null

  const initialUserId = pickFirstDefined(
    preloadedUser?.id,
    outlet.userId,
    outlet.session?.user?.id
  )

  // Resolve userId without blocking first paint
  const [userId, setUserId] = useState(initialUserId)

  useEffect(() => {
    if (userId) return
    let mounted = true

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return
        setUserId(session?.user?.id || null)
      })
      .catch(() => {
        if (!mounted) return
        setUserId(null)
      })

    return () => {
      mounted = false
    }
  }, [userId])

  // Track the current hero movie so other rows can exclude it without re-fetching hero
  const [heroMovie, setHeroMovie] = useState(null)

  // If user changes (login/logout), clear hero state to avoid stale exclusions
  useEffect(() => {
    setHeroMovie(null)
  }, [userId])

  const handleHeroMovie = useCallback((payload) => {
    // payload: { internalId, tmdbId, movie }
    setHeroMovie(payload || null)
  }, [])

  const heroExcludeIds = useMemo(() => {
    const id = heroMovie?.internalId
    return typeof id === 'number' ? [id] : []
  }, [heroMovie?.internalId])

  // Staggered enables for above/below the fold work
  const enabledGenre = useStaggeredEnabled(50)

  // Genre row (optional). With your updated hooks, passing userId avoids extra auth waiting.
  const genre = useGenreRecommendations({
    limit: 20,
    enabled: enabledGenre,
    userId,
  })

  const genreTitle = useMemo(() => 'Because your taste has range', [])

  return (
    <div className="min-h-screen">
      {/* HERO (above the fold) */}
      <HeroTopPick
        userId={userId}
        preloadedUser={preloadedUser}
        onHeroMovie={handleHeroMovie}
      />

      {/* CONTENT */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 left-0 right-0 h-12 bg-gradient-to-b from-purple-500/10 via-black/0 to-black/0"
        />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="pt-6 sm:pt-8 space-y-10 sm:space-y-12">
            {/* Quick picks near top (exclude current hero) */}
            <section aria-label="Quick picks">
              <QuickPicksRow userId={userId} excludeIds={heroExcludeIds} />
            </section>

            {/* Genre row */}
            <section aria-label="Genre recommendations">
              <PersonalizedCarouselRow
                title={genreTitle}
                movies={genre.data || []}
                loading={genre.loading}
                error={genre.error}
                icon={Layers}
                rowId="genre-recs"
                placement="genre"
              />
            </section>

            {/* Lazy rows (below fold) */}
            <div
              className="space-y-10 sm:space-y-12"
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: '1px 1200px',
              }}
            >
              <LazyRow>
                <BecauseYouWatchedSection userId={userId} />
              </LazyRow>

              <LazyRow>
                <HiddenGemsRow userId={userId} />
              </LazyRow>

              <LazyRow>
                <TrendingForYouRow userId={userId} />
              </LazyRow>
            </div>

            <div className="h-16 sm:h-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
