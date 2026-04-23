// src/app/homepage/HomePage.jsx
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
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
import StarterRows from './components/StarterRows'

import { SectionErrorBoundary } from '@/app/ErrorBoundary'

function pickFirstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v
  }
  return null
}

// === WELCOME BANNER ===

function WelcomeBanner({ movieCount, onDismiss }) {
  // Animate counter 0 → movieCount
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v))
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    if (!movieCount) return
    const controls = animate(count, movieCount, { duration: 1.2, ease: 'easeOut' })
    const unsub = rounded.on('change', v => setDisplayCount(v))
    return () => { controls.stop(); unsub() }
  }, [movieCount]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-4 sm:mx-6 mt-4 rounded-2xl overflow-hidden"
    >
      {/* Pulsing glow ring */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl"
        style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.5), rgba(236,72,153,0.4), rgba(168,85,247,0.5))' }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(88,28,135,0.65) 0%, rgba(168,85,247,0.4) 50%, rgba(219,39,119,0.3) 100%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-4 px-5 py-4">
        <Sparkles className="h-5 w-5 flex-none text-purple-300" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug">
            Your taste profile is ready.
          </p>
          {movieCount > 0 && (
            <p className="text-xs text-white/55 mt-0.5">
              {displayCount} film{displayCount !== 1 ? 's' : ''} matched — here&apos;s your first pick.
            </p>
          )}
        </div>
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
  )
}

// === MAIN COMPONENT ===

export default function HomePage() {
  const outlet = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()

  // Capture first-run state synchronously via useState initializer.
  // IMPORTANT: do NOT clear location.state on mount — clear only on banner dismiss.
  const [fromOnboarding] = useState(() => Boolean(location.state?.fromOnboarding))
  const [movieCount] = useState(() => location.state?.movieCount ?? 0)

  const [showBanner, setShowBanner] = useState(fromOnboarding)

  // Auto-dismiss after 10s
  useEffect(() => {
    if (!showBanner) return
    const timer = setTimeout(() => handleDismissBanner(), 10000)
    return () => clearTimeout(timer)
  }, [showBanner]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDismissBanner() {
    setShowBanner(false)
    // Clear state only after dismissal — prevents banner from reappearing on refresh
    navigate(location.pathname, { replace: true, state: {} })
  }

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
    return () => { mounted = false }
  }, [userId])

  const rows = useHomepageRows(userId)

  // Show starter rows for cold-start users (≤4 watches, no taste DNA yet).
  // Once they cross the cold threshold the standard rows take over automatically.
  const showStarter = rows.tier === 'cold'

  return (
    <div className="overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* First-run welcome banner */}
      <AnimatePresence>
        {showBanner && (
          <WelcomeBanner
            movieCount={movieCount}
            onDismiss={handleDismissBanner}
          />
        )}
      </AnimatePresence>

      {/* HERO (above the fold) */}
      <HeroTopPick
        userId={userId}
        preloadedUser={preloadedUser}
        isFirstRun={fromOnboarding}
      />

      {/* CONTENT */}
      <div className="relative pb-24 sm:pb-32">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 left-0 right-0 h-12 bg-gradient-to-b from-purple-500/10 via-black/0 to-black/0"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 w-[800px] h-[600px] -translate-y-1/3 opacity-30"
          style={{ background: 'radial-gradient(ellipse at 5% 10%, rgba(88,28,135,0.55) 0%, transparent 65%)' }}
        />

        <div className="mx-auto max-w-[1600px]">
          <div className="space-y-0">

            <SectionErrorBoundary label="Top of Your Taste">
              <TopOfYourTasteRow
                data={rows.topOfTaste.data?.films}
                subtitle={rows.topOfTaste.data?.subtitle}
                loading={rows.topOfTaste.loading}
              />
            </SectionErrorBoundary>

            {showStarter ? (
              // Cold-start: show genre/language/crowd-pleaser starter rows
              // instead of the taste-DNA rows that require watch history.
              <StarterRows userId={userId} />
            ) : (
              <>
                {rows.tier !== null && (
                  <SectionErrorBoundary label="Signature Director">
                    <SignatureDirectorRow
                      data={rows.director.data}
                      loading={rows.director.loading}
                    />
                  </SectionErrorBoundary>
                )}

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

                <SectionErrorBoundary label="Under 90 Minutes">
                  <Under90MinutesRow
                    data={rows.under90.data}
                    loading={rows.under90.loading}
                  />
                </SectionErrorBoundary>

                {rows.tier !== null && (
                  <SectionErrorBoundary label="Still in Orbit">
                    <StillInOrbitRow
                      data={rows.orbit.data}
                      loading={rows.orbit.loading}
                    />
                  </SectionErrorBoundary>
                )}

                {rows.tier !== null && (
                  <SectionErrorBoundary label="Mood Row">
                    <MoodRow
                      data={rows.mood.data}
                      loading={rows.mood.loading}
                    />
                  </SectionErrorBoundary>
                )}

                {rows.tier === 'engaged' && (
                  <SectionErrorBoundary label="Watchlist">
                    <WatchlistRow
                      data={rows.watchlist.data}
                      loading={rows.watchlist.loading}
                    />
                  </SectionErrorBoundary>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
