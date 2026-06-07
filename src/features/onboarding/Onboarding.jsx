// src/features/onboarding/Onboarding.jsx
// FeelFlick — Onboarding V2 (mood-reactive). Mounted at /onboarding.
//
// Flow (4 steps): on completion the FIRST landing is /discover — cold-start, since
// /home needs watch history to feel personal; returning users route to /home.
//   1. Mood baseline
//   2. Genres
//   3. Films
//   4. Quick rate → completeOnboarding → /discover
//
// Auth + completion logic mirrors the legacy Onboarding.jsx exactly so existing Supabase
// metadata + PostAuthGate continue to work.

import { useEffect, useState } from 'react'
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
import './onboarding.css'

// Drafts the in-flight onboarding so a refresh doesn't wipe selections.
// Cleared by completeOnboarding once data is persisted to Supabase.
const ONBOARDING_DRAFT_KEY = 'ff_onboarding_draft_v1'

function loadDraft() {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw)
    return draft && typeof draft === 'object' ? draft : null
  } catch {
    return null
  }
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { ready, session } = useAuthSession()
  const reduced = useReducedMotion()

  usePageMeta({ title: 'Taste profile · FeelFlick' })

  const [checking, setChecking] = useState(true)
  const [celebrate, setCelebrate] = useState(false)
  // Drives the celebration → /discover exit animation. When flipped to true, the
  // celebration content fades to opacity 0; the black backdrop remains until
  // navigate fires. Smooths what was previously a hard cut.
  const [fadingOut, setFadingOut] = useState(false)
  // _loading kept for parity with callsites; the celebration screen is the
  // visible loading state, but we still flip the flag for any downstream prop.
  const [, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step state — hydrate from localStorage draft so a mid-flow refresh doesn't
  // wipe selections. The draft is cleared in handleFinish on success.
  const draft = loadDraft()
  const [step, setStep] = useState(draft?.step ?? 0)
  const [moods, setMoods] = useState(draft?.moods ?? [])
  const [selectedGenres, setSelectedGenres] = useState(draft?.selectedGenres ?? [])
  const [favoriteMovies, setFavoriteMovies] = useState(draft?.favoriteMovies ?? [])
  const [ratings, setRatings] = useState(draft?.ratings ?? {})

  // Persist draft on every change. Best-effort — quota/private-mode failures are non-fatal.
  useEffect(() => {
    try {
      localStorage.setItem(
        ONBOARDING_DRAFT_KEY,
        JSON.stringify({ step, moods, selectedGenres, favoriteMovies, ratings }),
      )
    } catch {
      // localStorage unavailable — flow still works, just no refresh persistence.
    }
  }, [step, moods, selectedGenres, favoriteMovies, ratings])

  // Auth gate (same logic as legacy)
  useEffect(() => {
    if (!ready) return
    if (!session?.user) { setChecking(false); return }

    ;(async () => {
      try {
        if (deriveOnboardingStatus(session.user).isComplete) {
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
        if (data?.onboarding_complete) navigate('/home', { replace: true })
        else setChecking(false)
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

  // Minimum time the celebration screen stays up (ms). The reveal sequence
  // takes roughly this long — we hold here even if Supabase finishes early
  // so the brand moment always lands. Calmer pacing (longer durations, more
  // overlap) keeps it readable for dyslexic users and predictable for OCD-
  // sensitive ones — both groups benefit from slower, intentional motion.
  // Bumped from 7500 → 12000 in the /discover handoff revision so the new
  // Stage 5 coaching block ("Mark Watched on films you already know…") has
  // 4–5s of reading time before fade-out. The longer hold also dampens the
  // celebration → /discover seam by giving the eye more time to settle
  // before the route swap.
  const CELEBRATION_MIN_MS = 12000

  async function handleFinish() {
    setError('')
    // Flip into celebration mode IMMEDIATELY — the staggered reveal is the
    // cover for the Supabase writes happening underneath.
    setCelebrate(true)
    setLoading(true)
    const celebrationStartedAt = Date.now()

    try {
      try {
        localStorage.setItem(MOODS_LS_KEY, JSON.stringify(moods))
      } catch { /* private mode, quota — non-fatal */ }

      // Run completeOnboarding + home-data prefetch in parallel.
      // CRITICAL: pass markAuthComplete=false. If we let the service flip the
      // auth metadata now, PostAuthGate fires onAuthStateChange the moment the
      // metadata changes and auto-navigates /onboarding → /home, killing the
      // celebration mid-reveal. We hold the flip until after the celebration's
      // min duration below.
      const userId = session?.user?.id
      await Promise.all([
        completeOnboarding({
          session, selectedGenres, favoriteMovies, ratings, moods,
          markAuthComplete: false,
        }),
        userId ? prefetchHomeData(userId).catch(err => {
          console.warn('Home data prefetch failed (non-fatal):', err)
        }) : Promise.resolve(),
      ])

      try { localStorage.removeItem(ONBOARDING_DRAFT_KEY) } catch { /* noop */ }

      // Hold for the remainder of the celebration min duration so the reveal
      // animation always has room to land.
      const elapsed = Date.now() - celebrationStartedAt
      const remainder = Math.max(0, CELEBRATION_MIN_MS - elapsed)
      if (remainder > 0) await new Promise(r => setTimeout(r, remainder))

      // Begin the fade-out — celebration content tweens to opacity 0 while the
      // black backdrop stays. /discover then covers the seam with its own
      // black overlay that fades up slowly (~1.4s) to reveal the page.
      // The result is a smooth dim → full black → unhurried rise transition,
      // around 2.3s of dark continuity that reads as cinematic intent rather
      // than a router blink. Match the 900ms tween duration in
      // CelebrationReveal (particles + main content opacity transitions).
      const reducedAtFade = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      setFadingOut(true)
      if (!reducedAtFade) {
        await new Promise(r => setTimeout(r, 900))
      }

      // First landing goes to /discover, not /home.
      //
      // Reasoning: /home is at its best with history — the Briefing's
      // engine reranking, the personal lists (director / similar / genre /
      // fit / actor), the DNA portrait, and the taste-twin pulse all need
      // ≥5 logged films before they feel personal. A fresh user with zero
      // history sees DNA's "Patterns forming…", twin pulse hidden (no
      // twins), and personal lists falling back to static CURATED_LISTS —
      // /home reads as generic on day 1.
      //
      // /discover delivers the core promise ("I feel X → give me a film")
      // in one screen using the just-collected onboarding signals
      // (taste_baseline_moods + favorites + genre prefs). After the user
      // logs/skips/rates their first few films, /home earns its space and
      // becomes the natural landing on subsequent sessions — RootEntry +
      // PostAuthGate route authenticated returners to /home as usual.
      //
      // ORDER MATTERS — navigate BEFORE flipping the auth metadata:
      // PostAuthGate has a rule `if (isOnboarded && pathname === '/onboarding')
      // → <Navigate to="/home" />`. If we flip first, that rule fires the
      // next render (location still '/onboarding') and the user sees a
      // glimpse of /home before our navigate('/discover') takes over.
      // Navigating first changes location to '/discover' so when the auth
      // listener fires moments later the rule's pathname check is false.
      navigate('/discover', {
        replace: true,
        state: { fromOnboarding: true, movieCount: favoriteMovies.length, moods },
      })

      // Flip the auth metadata after the route change has committed.
      // PostAuthGate's onAuthStateChange listener will re-evaluate and fall
      // through (pathname is now '/discover'), so no double-navigate.
      await markOnboardingAuthComplete()
    } catch (e) {
      console.error('Onboarding save failed:', e)
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
      setCelebrate(false)
    }
  }

  // Loading — uses the shared BrandSplash (delayed 200ms so fast checks never flash).
  if (checking) {
    return <BrandSplash />
  }

  // Celebration → /discover. Staggered reveals double as cover for the Supabase
  // writes happening underneath (~1-3s) so the wait feels intentional.
  if (celebrate) {
    return (
      <CelebrationReveal
        moods={moods}
        selectedGenres={selectedGenres}
        favoriteMovies={favoriteMovies}
        ratings={ratings}
        fadingOut={fadingOut}
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
                  onNext={() => { setError(''); setStep(1) }}
                  firstName={session?.user?.user_metadata?.name?.split(' ')[0] ?? null}
                />
              )}
              {step === 1 && (
                <GenresStep
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                  onBack={() => { setError(''); setStep(0) }}
                  onNext={() => { setError(''); setStep(2) }}
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
                  onFinish={() => { setError(''); setStep(3) }}
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
