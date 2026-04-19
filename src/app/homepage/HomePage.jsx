// src/app/homepage/HomePage.jsx
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { supabase } from '@/shared/lib/supabase/client'
import { useUserTier } from '@/shared/hooks/useRecommendations'

import HeroTopPick from './components/HeroTopPick'
import BecauseYouWatchedSection from './components/BecauseYouWatchedSection'
import HiddenGemsRow from './components/HiddenGemsRow'
import TrendingForYouRow from './components/TrendingForYouRow'
import MoodCoherenceRow from './components/MoodCoherenceRow'
import YourGenresRow from './components/YourGenresRow'
import PopularRow from './components/PopularRow'
import OnboardingSeededRow from './components/OnboardingSeededRow'

import { SectionErrorBoundary } from '@/app/ErrorBoundary'

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

  const { tier } = useUserTier({ userId })

  return (
    <div className="overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* HERO (above the fold) */}
      <HeroTopPick
        userId={userId}
        preloadedUser={preloadedUser}
      />

      {/* CONTENT */}
      <div className="relative pb-24 sm:pb-32">
        {/* Hero → content seam */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 left-0 right-0 h-12 bg-gradient-to-b from-purple-500/10 via-black/0 to-black/0"
        />
        {/* Ambient purple glow — FeelFlick signature */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 w-[800px] h-[600px] -translate-y-1/3 opacity-30"
          style={{ background: 'radial-gradient(ellipse at 5% 10%, rgba(88,28,135,0.55) 0%, transparent 65%)' }}
        />

        <div className="mx-auto max-w-[1600px]">
          <div>
            <div className="space-y-0">

              {/* === COLD (0 watches) === */}
              {tier === 'cold' && (
                <>
                  <SectionErrorBoundary label="Based on Your Picks">
                    <OnboardingSeededRow userId={userId} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="Popular on FeelFlick">
                    <PopularRow />
                  </SectionErrorBoundary>
                </>
              )}

              {/* === WARMING (1-9 watches) === */}
              {tier === 'warming' && (
                <>
                  <SectionErrorBoundary label="Because You Watched">
                    <BecauseYouWatchedSection userId={userId} maxSeeds={1} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="Hidden Gems">
                    <HiddenGemsRow userId={userId} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="Trending For You">
                    <TrendingForYouRow userId={userId} />
                  </SectionErrorBoundary>
                </>
              )}

              {/* === ENGAGED (10+ watches) === */}
              {tier === 'engaged' && (
                <>
                  <SectionErrorBoundary label="Because You Watched">
                    <BecauseYouWatchedSection userId={userId} maxSeeds={2} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="More Like Your Vibe">
                    <MoodCoherenceRow userId={userId} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="Hidden Gems">
                    <HiddenGemsRow userId={userId} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="Your Genres">
                    <YourGenresRow userId={userId} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="Trending For You">
                    <TrendingForYouRow userId={userId} />
                  </SectionErrorBoundary>
                </>
              )}

              {/* While tier is loading (null), show skeleton rows */}
              {tier === null && (
                <>
                  <SectionErrorBoundary label="Because You Watched">
                    <BecauseYouWatchedSection userId={userId} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="Hidden Gems">
                    <HiddenGemsRow userId={userId} />
                  </SectionErrorBoundary>

                  <SectionErrorBoundary label="Trending For You">
                    <TrendingForYouRow userId={userId} />
                  </SectionErrorBoundary>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
