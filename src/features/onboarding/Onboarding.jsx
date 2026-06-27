// src/features/onboarding/Onboarding.jsx
// FeelFlick — Onboarding V2 (mood-reactive). Mounted at /onboarding.
//
// Flow (4 steps): on completion the FIRST landing is /home (the personalized home
// for tonight, seeded by the onboarding signals + prefetched on finish).
//   1. Mood baseline
//   2. Genres
//   3. Films
//   4. Quick rate → completeOnboarding → /home
//
// Auth + completion logic mirrors the legacy Onboarding.jsx exactly so existing Supabase
// metadata + PostAuthGate continue to work.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { deriveOnboardingStatus } from '@/shared/lib/auth/onboardingStatus'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { completeOnboarding, markOnboardingAuthComplete } from '@/shared/services/onboarding'
import { prefetchHomeData } from '@/features/home/useHomeData'
import BrandSplash from '@/shared/ui/BrandSplash'

import AmbientGlow, { deriveMoodSignature } from './components/AmbientGlow'
import DnaRail from './components/DnaRail'
import CelebrationReveal from './components/CelebrationReveal'
import MoodStep from './steps/MoodStep'
import GenresStep from './steps/GenresStep'
import MoviesStep from './steps/MoviesStep'
import RatingStep from './steps/RatingStep'

import { MOODS_LS_KEY, SENTIMENT_RATINGS } from './data'
import { loadDraft, saveDraft, clearDraft } from './draft'
import { trackEvent, EVENTS, errorKind } from '@/shared/services/betaEvents'
import './onboarding.css'

// Drafts the in-flight onboarding (per signed-in user) so a refresh doesn't wipe
// selections. Keyed/loaded/cleared via ./draft — user-scoped so one account's
// draft can't leak into another on a shared browser (F2.23). Cleared on
// completion, sign-out, and the already-onboarded redirect.

export default function Onboarding() {
  const navigate = useNavigate()
  const { ready, session } = useAuthSession()
  const reduced = useReducedMotion()

  usePageMeta({ title: 'Taste profile · FeelFlick' })
  useEffect(() => { trackEvent(EVENTS.onboarding_started, { surface: 'onboarding' }) }, []) // B1.4b funnel entry

  const [checking, setChecking] = useState(true)
  const [celebrate, setCelebrate] = useState(false)
  // Drives the celebration → /home exit animation. When flipped to true, the
  // celebration content fades to opacity 0; the black backdrop remains until
  // navigate fires. Smooths what was previously a hard cut.
  const [fadingOut, setFadingOut] = useState(false)
  // Setup work (completeOnboarding + home prefetch) has resolved — reveals the
  // "See your picks" skip control and arms the floor auto-advance.
  const [setupReady, setSetupReady] = useState(false)
  const advancingRef = useRef(false)   // guards advance() against double-firing (auto + manual)
  const autoTimerRef = useRef(null)    // floor auto-advance timer
  // _loading kept for parity with callsites; the celebration screen is the
  // visible loading state, but we still flip the flag for any downstream prop.
  const [, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step state — starts empty and hydrates from the SIGNED-IN USER's scoped draft
  // once their id is known (deferred so we never read another user's draft, and
  // never a global default). Cleared on completion / sign-out / redirect.
  const userId = session?.user?.id ?? null
  const [hydrated, setHydrated] = useState(false)
  const [step, setStep] = useState(0)
  const [moods, setMoods] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [ratings, setRatings] = useState({})

  // Hydrate the user's scoped draft once their id is available (runs once).
  useEffect(() => {
    if (!userId || hydrated) return
    const draft = loadDraft(userId)
    if (draft) {
      if (typeof draft.step === 'number') setStep(draft.step)
      if (Array.isArray(draft.moods)) setMoods(draft.moods)
      if (Array.isArray(draft.selectedGenres)) setSelectedGenres(draft.selectedGenres)
      if (Array.isArray(draft.favoriteMovies)) setFavoriteMovies(draft.favoriteMovies)
      if (draft.ratings && typeof draft.ratings === 'object') setRatings(draft.ratings)
    }
    setHydrated(true)
  }, [userId, hydrated])

  // Persist the user's scoped draft on every change — only AFTER hydration (so the
  // empty initial state can't clobber a just-loaded draft) and only once the gate
  // has settled to render the steps (`!checking`), so a completed user being
  // redirected can't re-write the draft the gate just cleared. Best-effort.
  useEffect(() => {
    if (!userId || !hydrated || checking) return
    saveDraft(userId, { step, moods, selectedGenres, favoriteMovies, ratings })
  }, [userId, hydrated, checking, step, moods, selectedGenres, favoriteMovies, ratings])

  // Auth gate (same logic as legacy)
  useEffect(() => {
    if (!ready) return
    if (!session?.user) { setChecking(false); return }

    ;(async () => {
      try {
        if (deriveOnboardingStatus(session.user).isComplete) {
          clearDraft(session.user.id) // already onboarded → drop any stale draft
          navigate('/home', { replace: true })
          return
        }
        const { data } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle()
        // Single source of truth — `onboarding_complete`. We used to OR with
        // `onboarding_completed_at` as a defensive check, but if the flag was
        // explicitly reset to false while the timestamp lingered (a bad reset
        // path or a partial wipe), the OR caused a redirect-loop with
        // PostAuthGate: this gate said complete, PostAuthGate said not. The
        // rerunOnboarding flow now nulls both, so the OR is unnecessary.
        if (data?.onboarding_complete) {
          clearDraft(session.user.id) // already onboarded → drop any stale draft
          navigate('/home', { replace: true })
        } else setChecking(false)
      } catch {
        setChecking(false)
      }
    })()
  }, [ready, session, navigate])

  // Helpers reused across steps
  function toggleGenre(id) {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function isMovieSelected(id) { return favoriteMovies.some(m => m.id === id) }
  function addMovie(movie) {
    if (!isMovieSelected(movie.id) && favoriteMovies.length < 50) {
      setFavoriteMovies(prev => [...prev, movie])
    }
  }
  function removeMovie(id) { setFavoriteMovies(prev => prev.filter(m => m.id !== id)) }

  function handleRate(movie, sentiment) {
    const rating = SENTIMENT_RATINGS[sentiment]
    setRatings(prev => {
      const current = prev[movie.id]
      const currentSentiment = current === 9 ? 'loved' : current === 7 ? 'liked' : current === 5 ? 'okay' : null
      if (currentSentiment === sentiment) {
        const next = { ...prev }; delete next[movie.id]; return next
      }
      return { ...prev, [movie.id]: rating }
    })
  }

  // Floor the celebration stays up so the staggered reveal lands (it fully settles
  // ~7.7s; the coaching block appears at 6.3s). Duration is otherwise driven by the
  // actual setup work — we never hold past it on a fixed clock, never cut it short.
  // Reduced motion collapses the choreography to instant, so its floor is short
  // (no point holding a static screen). Replaces the prior flat 12s hold.
  const CELEBRATION_FLOOR_MS = 8000
  const CELEBRATION_FLOOR_REDUCED_MS = 2000

  // Fade the celebration out and hand off to /home. Idempotent — shared by the floor
  // auto-advance and the user tapping "See your picks", guarded so the two can't
  // double-navigate. ORDER MATTERS — navigate BEFORE flipping the auth metadata:
  // PostAuthGate has a rule `if (isOnboarded && pathname === '/onboarding') →
  // <Navigate to="/home" />`. Flipping first would fire that rule (location still
  // '/onboarding') before our own navigate; navigating first makes its pathname
  // check false (no double-nav). The 900ms fade (skipped under reduced motion) lets
  // us cross from full black into /home's dark canvas rather than a router blink.
  const advance = useCallback(async () => {
    if (advancingRef.current) return
    advancingRef.current = true
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null }
    setFadingOut(true)
    if (!reduced) await new Promise(r => setTimeout(r, 900))
    navigate('/home', { replace: true, state: { fromOnboarding: true } })
    // Flip the auth metadata after navigating. advance() runs detached (auto timer
    // or button click), so guard it: a late failure must not become an unhandled
    // rejection, and we keep the onboarding_error telemetry the prior in-try call
    // had. completeOnboarding already wrote onboarding_complete=true, so
    // PostAuthGate's DB fallback still treats the user as onboarded.
    try {
      await markOnboardingAuthComplete()
    } catch (e) {
      console.error('Auth onboarding flip failed post-navigate (non-fatal):', e)
      trackEvent(EVENTS.onboarding_error, { surface: 'onboarding', source: 'auth_flip', error_kind: errorKind(e) })
    }
  }, [navigate, reduced])

  // Clear a pending auto-advance timer on unmount.
  useEffect(() => () => { if (autoTimerRef.current) clearTimeout(autoTimerRef.current) }, [])

  async function handleFinish() {
    setError('')
    // Flip into celebration mode IMMEDIATELY — the staggered reveal is the cover
    // for the Supabase writes happening underneath.
    setCelebrate(true)
    setLoading(true)
    const startedAt = Date.now()

    try {
      try {
        localStorage.setItem(MOODS_LS_KEY, JSON.stringify(moods))
      } catch { /* private mode, quota — non-fatal */ }

      // Run completeOnboarding + home-data prefetch in parallel. CRITICAL: pass
      // markAuthComplete=false so PostAuthGate doesn't auto-navigate mid-reveal —
      // advance() flips the auth metadata itself, after navigating.
      await Promise.all([
        completeOnboarding({
          session, selectedGenres, favoriteMovies, ratings, moods,
          markAuthComplete: false,
        }),
        userId ? prefetchHomeData(userId).catch(err => {
          console.warn('Home data prefetch failed (non-fatal):', err)
        }) : Promise.resolve(),
      ])

      clearDraft(userId) // completion → drop this user's scoped draft + legacy key

      // Work done: reveal the "See your picks" skip so the user can leave now, and
      // auto-advance once the reveal has had room to land (the floor). Total auto =
      // max(floor, work) — adaptive: waits for slow work, never cuts the reveal, and
      // never holds on a fixed clock. If the user taps the skip first, advance()'s
      // guard makes this timer a no-op.
      setSetupReady(true)
      const floor = reduced ? CELEBRATION_FLOOR_REDUCED_MS : CELEBRATION_FLOOR_MS
      const remainder = Math.max(0, floor - (Date.now() - startedAt))
      autoTimerRef.current = setTimeout(() => { advance() }, remainder)
    } catch (e) {
      console.error('Onboarding save failed:', e)
      trackEvent(EVENTS.onboarding_error, { surface: 'onboarding', source: 'finish', error_kind: errorKind(e) })
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
      setCelebrate(false)
    }
  }

  // Loading — uses the shared BrandSplash (delayed 200ms so fast checks never flash).
  // Also hold the splash until the user's scoped draft has hydrated, so the steps
  // never flash at an empty step 0 before a same-user draft restores.
  if (checking || (userId && !hydrated)) {
    return <BrandSplash />
  }

  // Celebration → /home. Staggered reveals double as cover for the Supabase
  // writes happening underneath (~1-3s) so the wait feels intentional.
  if (celebrate) {
    return (
      <CelebrationReveal
        moods={moods}
        selectedGenres={selectedGenres}
        favoriteMovies={favoriteMovies}
        ratings={ratings}
        fadingOut={fadingOut}
        ready={setupReady}
        onEnter={advance}
      />
    )
  }

  // Main layout
  return (
    <div
      className="onboarding fixed inset-0 flex flex-col bg-black text-white overflow-hidden"
      style={{ '--ob-accent-rgb': deriveMoodSignature(moods) }}
    >
      <AmbientGlow moods={moods} />
      {/* Mood-signature atmosphere — a faint accent vignette + 1px top hairline
         that tint the room to the user's selected mood. CSS-only (no JS motion);
         the recolor tween collapses under the global reduced-motion reset. Mood
         is an ambient accent only — the brand gradient stays on the foreground. */}
      <div aria-hidden="true" className="ob-atmosphere pointer-events-none absolute inset-0" />
      {/* subtle grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '4px 4px',
        }}
      />

      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">
        {/* One fused chrome row: identity + progressbar + signal tally. The
           tally self-suppresses on the rating step (handled inside DnaRail). */}
        <DnaRail
          step={step}
          moods={moods}
          genres={selectedGenres}
          films={favoriteMovies}
          ratings={ratings}
        />

        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {step === 0 && (
                <MoodStep
                  moods={moods}
                  setMoods={setMoods}
                  onNext={() => { setError(''); setStep(1); trackEvent(EVENTS.onboarding_step_completed, { surface: 'onboarding', step_key: 'mood' }) }}
                  firstName={session?.user?.user_metadata?.name?.split(' ')[0] ?? null}
                />
              )}
              {step === 1 && (
                <GenresStep
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                  onBack={() => { setError(''); setStep(0) }}
                  onNext={() => { setError(''); setStep(2); trackEvent(EVENTS.onboarding_step_completed, { surface: 'onboarding', step_key: 'genres' }) }}
                />
              )}
              {step === 2 && (
                <MoviesStep
                  selectedGenreIds={selectedGenres}
                  moods={moods}
                  favoriteMovies={favoriteMovies}
                  addMovie={addMovie}
                  removeMovie={removeMovie}
                  isMovieSelected={isMovieSelected}
                  onBack={() => { setError(''); setStep(1) }}
                  onFinish={() => { setError(''); setStep(3); trackEvent(EVENTS.onboarding_step_completed, { surface: 'onboarding', step_key: 'movies' }) }}
                  loading={false}
                  error={error}
                />
              )}
              {step === 3 && (
                <RatingStep
                  favoriteMovies={favoriteMovies}
                  ratings={ratings}
                  onRate={handleRate}
                  onBack={() => { setError(''); setRatings({}); setStep(2) }}
                  onFinish={handleFinish}
                  error={error}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
