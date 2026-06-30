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
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { prefetchHomeData } from '@/features/home/useHomeData'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { deriveOnboardingStatus } from '@/shared/lib/auth/onboardingStatus'
import { supabase } from '@/shared/lib/supabase/client'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { completeOnboarding, markOnboardingAuthComplete } from '@/shared/services/onboarding'
import { errorKind, EVENTS, trackEvent } from '@/shared/services/betaEvents'
import BrandSplash from '@/shared/ui/BrandSplash'

import AmbientGlow, { deriveMoodSignature } from './components/AmbientGlow'
import CelebrationReveal from './components/CelebrationReveal'
import DnaRail from './components/DnaRail'
import TastePortrait from './components/TastePortrait'
import { MOODS_LS_KEY, SENTIMENT_RATINGS } from './data'
import { clearDraft, loadDraft, saveDraft } from './draft'
import GenresStep from './steps/GenresStep'
import MoodStep from './steps/MoodStep'
import MoviesStep from './steps/MoviesStep'
import RatingStep from './steps/RatingStep'
import './onboarding.css'

export default function Onboarding() {
  const navigate = useNavigate()
  const { ready, session } = useAuthSession()
  const reduced = useReducedMotion()

  usePageMeta({ title: 'Taste profile · FeelFlick' })
  useEffect(() => {
    trackEvent(EVENTS.onboarding_started, { surface: 'onboarding' })
  }, [])

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

  const userId = session?.user?.id ?? null
  const [hydrated, setHydrated] = useState(false)
  const [step, setStep] = useState(0)
  const [moods, setMoods] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [ratings, setRatings] = useState({})

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

  useEffect(() => {
    if (!userId || !hydrated || checking) return
    saveDraft(userId, { step, moods, selectedGenres, favoriteMovies, ratings })
  }, [userId, hydrated, checking, step, moods, selectedGenres, favoriteMovies, ratings])

  useEffect(() => {
    if (!ready) return
    if (!session?.user) {
      setChecking(false)
      return
    }

    ;(async () => {
      try {
        if (deriveOnboardingStatus(session.user).isComplete) {
          clearDraft(session.user.id)
          navigate('/home', { replace: true })
          return
        }

        const { data } = await supabase
          .from('users')
          .select('onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle()

        if (data?.onboarding_complete) {
          clearDraft(session.user.id)
          navigate('/home', { replace: true })
        } else {
          setChecking(false)
        }
      } catch {
        setChecking(false)
      }
    })()
  }, [ready, session, navigate])

  function toggleGenre(id) {
    setSelectedGenres(previous => previous.includes(id)
      ? previous.filter(value => value !== id)
      : [...previous, id])
  }

  function isMovieSelected(id) {
    return favoriteMovies.some(movie => movie.id === id)
  }

  function addMovie(movie) {
    if (!isMovieSelected(movie.id) && favoriteMovies.length < 50) {
      setFavoriteMovies(previous => [...previous, movie])
    }
  }

  function removeMovie(id) {
    setFavoriteMovies(previous => previous.filter(movie => movie.id !== id))
  }

  function handleRate(movie, sentiment) {
    const rating = SENTIMENT_RATINGS[sentiment]
    setRatings(previous => {
      const current = previous[movie.id]
      const currentSentiment = current === 9 ? 'loved' : current === 7 ? 'liked' : current === 5 ? 'okay' : null
      if (currentSentiment === sentiment) {
        const next = { ...previous }
        delete next[movie.id]
        return next
      }
      return { ...previous, [movie.id]: rating }
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

  if (checking || (userId && !hydrated)) return <BrandSplash />

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

  return (
    <div
      className="onboarding"
      style={{ '--ob-accent-rgb': deriveMoodSignature(moods) }}
    >
      <AmbientGlow moods={moods} />
      <div aria-hidden="true" className="ob-atmosphere" />
      <div aria-hidden="true" className="ob-grain" />

      <div className="ob-app-frame">
        <DnaRail
          step={step}
          moods={moods}
          genres={selectedGenres}
          films={favoriteMovies}
          ratings={ratings}
        />

        <TastePortrait
          compact
          moods={moods}
          genres={selectedGenres}
          films={favoriteMovies}
          ratings={ratings}
        />

        <div className="ob-conversation-layout">
          <div className="ob-step-stage">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={reduced ? { duration: 0 } : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="ob-step-motion"
              >
                {step === 0 && (
                  <MoodStep
                    moods={moods}
                    setMoods={setMoods}
                    onNext={() => {
                      setError('')
                      setStep(1)
                      trackEvent(EVENTS.onboarding_step_completed, { surface: 'onboarding', step_key: 'mood' })
                    }}
                    firstName={session?.user?.user_metadata?.name?.split(' ')[0] ?? null}
                  />
                )}

                {step === 1 && (
                  <GenresStep
                    selectedGenres={selectedGenres}
                    toggleGenre={toggleGenre}
                    onBack={() => {
                      setError('')
                      setStep(0)
                    }}
                    onNext={() => {
                      setError('')
                      setStep(2)
                      trackEvent(EVENTS.onboarding_step_completed, { surface: 'onboarding', step_key: 'genres' })
                    }}
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
                    onBack={() => {
                      setError('')
                      setStep(1)
                    }}
                    onFinish={() => {
                      setError('')
                      setStep(3)
                      trackEvent(EVENTS.onboarding_step_completed, { surface: 'onboarding', step_key: 'movies' })
                    }}
                    loading={false}
                    error={error}
                  />
                )}

                {step === 3 && (
                  <RatingStep
                    favoriteMovies={favoriteMovies}
                    ratings={ratings}
                    onRate={handleRate}
                    onBack={() => {
                      setError('')
                      setRatings({})
                      setStep(2)
                    }}
                    onFinish={handleFinish}
                    error={error}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <TastePortrait
            moods={moods}
            genres={selectedGenres}
            films={favoriteMovies}
            ratings={ratings}
          />
        </div>
      </div>
    </div>
  )
}
