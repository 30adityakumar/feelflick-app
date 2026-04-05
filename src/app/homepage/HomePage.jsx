// src/app/homepage/HomePage.jsx
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { supabase } from '@/shared/lib/supabase/client'

import HeroTopPick from './components/HeroTopPick'
import BecauseYouWatchedSection from './components/BecauseYouWatchedSection'
import HiddenGemsRow from './components/HiddenGemsRow'
import TrendingForYouRow from './components/TrendingForYouRow'

import LazyRow from '@/shared/components/LazyRow'
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

  return (
    <div className="min-h-screen">
      {/* HERO (above the fold) */}
      <HeroTopPick
        userId={userId}
        preloadedUser={preloadedUser}
      />

      {/* CONTENT */}
      <div className="relative">
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

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">

            {/* Three curated rows */}
            <div
              className="space-y-4 sm:space-y-6"
              style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 1200px' }}
            >
              <LazyRow>
                <SectionErrorBoundary label="Because You Watched">
                  <BecauseYouWatchedSection userId={userId} />
                </SectionErrorBoundary>
              </LazyRow>

              <LazyRow>
                <SectionErrorBoundary label="Hidden Gems">
                  <HiddenGemsRow userId={userId} />
                </SectionErrorBoundary>
              </LazyRow>

              <LazyRow>
                <SectionErrorBoundary label="Trending For You">
                  <TrendingForYouRow userId={userId} />
                </SectionErrorBoundary>
              </LazyRow>
            </div>

            <div className="h-10 sm:h-16" />
          </div>
        </div>
      </div>
    </div>
  )
}
