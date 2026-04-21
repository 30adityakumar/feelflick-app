// src/app/homepage/HomePage.jsx
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { supabase } from '@/shared/lib/supabase/client'
import { useHomepageRows } from '@/shared/hooks/useHomepageRows'

import HeroTopPick from './components/HeroTopPick'
import TopOfYourTasteRow from './components/TopOfYourTasteRow'
import CriticsSwoonedRow from './components/CriticsSwoonedRow'
import PeoplesChampionsRow from './components/PeoplesChampionsRow'
import Under90MinutesRow from './components/Under90MinutesRow'
import StillInOrbitRow from './components/StillInOrbitRow'
import MoodRow from './components/MoodRow'
import WatchlistRow from './components/WatchlistRow'
import SignatureDirectorRow from './components/SignatureDirectorRow'

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

  const rows = useHomepageRows(userId)

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
          <div className="space-y-0">

            {/* Row 2: Top of your taste (all tiers) */}
            <SectionErrorBoundary label="Top of Your Taste">
              <TopOfYourTasteRow
                data={rows.topOfTaste.data?.films}
                subtitle={rows.topOfTaste.data?.subtitle}
                loading={rows.topOfTaste.loading}
              />
            </SectionErrorBoundary>

            {/* Row 2b: More from {Director} (warming+) */}
            {rows.tier !== 'cold' && rows.tier !== null && (
              <SectionErrorBoundary label="Signature Director">
                <SignatureDirectorRow
                  data={rows.director.data}
                  loading={rows.director.loading}
                />
              </SectionErrorBoundary>
            )}

            {/* Row 3: Rotating — Critics swooned / People's champions */}
            <SectionErrorBoundary label="Critic Split">
              {rows.rotationVariant === 'B' && rows.tier === 'engaged' ? (
                <PeoplesChampionsRow
                  data={rows.criticSplit.data}
                  loading={rows.criticSplit.loading}
                />
              ) : (
                <CriticsSwoonedRow
                  data={rows.criticSplit.data}
                  loading={rows.criticSplit.loading}
                />
              )}
            </SectionErrorBoundary>

            {/* Row 4: Under 90 minutes (all tiers) */}
            <SectionErrorBoundary label="Under 90 Minutes">
              <Under90MinutesRow
                data={rows.under90.data}
                loading={rows.under90.loading}
              />
            </SectionErrorBoundary>

            {/* Row 5: Still in {seed}'s orbit (warming+) */}
            {rows.tier !== 'cold' && rows.tier !== null && (
              <SectionErrorBoundary label="Still in Orbit">
                <StillInOrbitRow
                  data={rows.orbit.data}
                  loading={rows.orbit.loading}
                />
              </SectionErrorBoundary>
            )}

            {/* Row 6: You've been in a {mood} mood (warming+) */}
            {rows.tier !== 'cold' && rows.tier !== null && (
              <SectionErrorBoundary label="Mood Row">
                <MoodRow
                  data={rows.mood.data}
                  loading={rows.mood.loading}
                />
              </SectionErrorBoundary>
            )}

            {/* Row 7: Still on your watchlist (engaged only) */}
            {rows.tier === 'engaged' && (
              <SectionErrorBoundary label="Watchlist">
                <WatchlistRow
                  data={rows.watchlist.data}
                  loading={rows.watchlist.loading}
                />
              </SectionErrorBoundary>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
