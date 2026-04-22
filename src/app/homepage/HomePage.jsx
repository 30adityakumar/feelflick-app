// src/app/homepage/HomePage.jsx
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

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

// === WELCOME BANNER ===

function WelcomeBanner({ onDismiss }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative mx-4 sm:mx-6 mt-4 rounded-2xl overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.55) 0%, rgba(168,85,247,0.35) 50%, rgba(219,39,119,0.25) 100%)' }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 border border-purple-400/25 rounded-2xl" aria-hidden="true" />
        <div className="relative flex items-center gap-4 px-5 py-4">
          <Sparkles className="h-5 w-5 flex-none text-purple-300" aria-hidden="true" />
          <p className="flex-1 text-sm font-medium text-white/90 leading-snug">
            Your taste profile is ready — here&apos;s what we picked for you.
          </p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss welcome message"
            className="flex-none text-white/40 hover:text-white/70 transition-colors text-lg leading-none font-light"
          >
            ×
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// === MAIN COMPONENT ===

export default function HomePage() {
  // Outlet context (PostAuthGate / AppShell may provide these)
  const outlet = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()

  // First-run welcome banner — shown once when navigating from onboarding
  const clearedStateRef = useRef(false)
  const [showWelcome, setShowWelcome] = useState(() => Boolean(location.state?.fromOnboarding))

  useEffect(() => {
    if (location.state?.fromOnboarding && !clearedStateRef.current) {
      clearedStateRef.current = true
      // Clear state so a refresh doesn't re-show the banner
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* First-run welcome banner */}
      {showWelcome && <WelcomeBanner onDismiss={() => setShowWelcome(false)} />}

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
