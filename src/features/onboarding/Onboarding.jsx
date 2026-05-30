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
import { Sparkles } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { deriveOnboardingStatus } from '@/shared/lib/auth/onboardingStatus'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { tmdbImg } from '@/shared/api/tmdb'
import { completeOnboarding, markOnboardingAuthComplete } from '@/shared/services/onboarding'
import { prefetchHomeData } from '@/features/home/useHomeData'
import BrandSplash from '@/shared/ui/BrandSplash'

import AmbientGlow from './components/AmbientGlow'
import Progress from './components/Progress'
import TasteStrip from './components/TasteStrip'
import MoodStep from './steps/MoodStep'
import GenresStep from './steps/GenresStep'
import MoviesStep from './steps/MoviesStep'
import RatingStep from './steps/RatingStep'

import { MOODS, MOODS_LS_KEY, GENRES, SENTIMENT_RATINGS } from './data'
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
    <div className="onboarding fixed inset-0 flex flex-col bg-black text-white overflow-hidden">
      <AmbientGlow moods={moods} />
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
        <Progress step={step} />
        {/* Hide the running profile-building counters on Step 4 — the rating
           card has its own progress eyebrow ("X TO GO") and the strip is
           noise above the card on mobile. */}
        {step !== 3 && (
          <TasteStrip moods={moods} genres={selectedGenres} films={favoriteMovies} ratings={ratings} />
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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

// === Celebration reveal ====================================================
// Multi-stage immersive reveal that plays after the last rating commits.
// Designed for calm: gentle easeOut curves, generous overlap between stages,
// spring physics on the entrances, subtle breathing motion on landed elements.
// Sentence-case body text + restraint on all-caps for dyslexic readers.
// AmbientGlow inherits the user's mood picks so the palette is personal.
//
// Stages (timeline in seconds from mount; durations overlap by design):
//   0.0  Sparkles icon eases in + slow rotation
//   0.4  Brand wordmark fades up — small, warm
//   1.2  Mood pills spring in (stagger)
//   2.4  Stats line eases in
//   3.4  Poster mosaic — gentle cascade with spring landing
//   5.5  "Tonight is yours." editorial close
//   7.6  Coaching beat — cold-start expectation-setting + Mark Watched hint
//        (Stage 5; held until fade-out at ~12s so it has reading time before
//         /discover takes over — also smooths the transition seam.)
//
// `prefers-reduced-motion` users get a static-but-staggered version:
// elements still fade in (no movement) and particles are suppressed.
const EASE = [0.16, 1, 0.3, 1]                          // quartOut — long settle, no overshoot
const SPRING = { type: 'spring', stiffness: 70, damping: 18, mass: 0.9 }

function CelebrationReveal({ moods, selectedGenres, favoriteMovies, ratings, fadingOut = false }) {
  const reduced = useReducedMotion()

  // Selected mood objects (RGB triplets, labels).
  const selectedMoods = (moods || [])
    .map(key => MOODS.find(m => m.key === key))
    .filter(Boolean)

  // Genre labels in the user's selected order.
  const selectedGenreLabels = (selectedGenres || [])
    .map(id => GENRES.find(g => g.id === id)?.name)
    .filter(Boolean)

  // Sentiment breakdown (loved/liked counts).
  const ratingValues = Object.values(ratings || {})
  const lovedCount = ratingValues.filter(r => r === SENTIMENT_RATINGS.loved).length
  const likedCount = ratingValues.filter(r => r === SENTIMENT_RATINGS.liked).length
  const filmCount  = (favoriteMovies || []).length

  // Posters from their picks (truncate to 5 even if more exist).
  const posterFilms = (favoriteMovies || []).slice(0, 5)

  return (
    <div className="onboarding fixed inset-0 z-9999 flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Slow, deep ambient glow — mood-tinted */}
      <AmbientGlow moods={moods} />

      {/* Soft grain (very subtle, helps the void feel like a screen) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '4px 4px',
        }}
      />

      {/* Drifting particles — suppressed for reduced-motion. Also fades to 0
         alongside the main content during fade-out, so they don't pop. */}
      {!reduced && (
        <motion.div
          className="absolute inset-0 z-0"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: fadingOut ? 0 : 1 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <CelebrationParticles moods={selectedMoods} />
        </motion.div>
      )}

      {/* Background "breathing" — slow scale on the whole stage. Gentle enough
         to feel like ambient life, not motion. Skipped for reduced-motion.
         When fadingOut, the entire content tweens to opacity 0 over 900ms;
         the black backdrop stays so the screen calmly goes dark before
         navigate fires (/discover's own overlay then fades up over 1.4s to
         reveal the page). Read together, ~2.3s of cinematic darkness. */}
      <motion.div
        className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 text-center"
        role="status"
        aria-live="polite"
        initial={false}
        animate={
          fadingOut
            ? { opacity: 0, scale: 1 }
            : reduced
              ? { opacity: 1 }
              : { opacity: 1, scale: [1, 1.012, 1] }
        }
        transition={
          fadingOut
            ? { duration: 0.9, ease: EASE }
            : reduced
              ? { duration: 0 }
              : { duration: 8, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Sparkles + kicker — Stage 0 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0.4 : 1.0, ease: EASE }}
          className="flex flex-col items-center"
        >
          {/* Slow rotation + breath on the sparkles */}
          <motion.div
            animate={reduced ? undefined : { rotate: 360 }}
            transition={reduced ? undefined : { duration: 22, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              animate={reduced ? undefined : { scale: [1, 1.08, 1] }}
              transition={reduced ? undefined : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-10 w-10" style={{ color: 'rgb(192, 132, 252)' }} aria-hidden="true" />
            </motion.div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ duration: reduced ? 0.4 : 0.9, delay: 0.4, ease: EASE }}
            className="ob-display mt-6 text-[11px] font-semibold uppercase tracking-[0.32em] text-purple-200/85"
          >
            Profile tuned · Edition №001
          </motion.p>
        </motion.div>

        {/* Mood pills — Stage 1, spring in with stagger */}
        {selectedMoods.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { delayChildren: 1.2, staggerChildren: 0.22 } } }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            {selectedMoods.map((m) => (
              <motion.span
                key={m.key}
                variants={{
                  hidden: { opacity: 0, y: 14, scale: 0.85 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={reduced ? { duration: 0.4, ease: EASE } : SPRING}
                className="ob-display rounded-full px-5 py-2 text-[14px] font-semibold tracking-[0.04em] text-white"
                style={{
                  background: `rgba(${m.rgb}, 0.18)`,
                  border: `1px solid rgba(${m.rgb}, 0.55)`,
                  boxShadow: `0 0 22px rgba(${m.rgb}, 0.30), inset 0 0 0 1px rgba(${m.rgb}, 0.1)`,
                }}
              >
                {/* Breathing tint — very subtle pulse keeps the pill alive */}
                <motion.span
                  className="block"
                  animate={reduced ? undefined : { opacity: [1, 0.78, 1] }}
                  transition={reduced ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {m.label}
                </motion.span>
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Stats line — Stage 2 — sentence case, easier to read */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.72, y: 0 }}
          transition={{ duration: reduced ? 0.4 : 0.9, delay: 2.4, ease: EASE }}
          className="mt-6 text-[13px] tracking-[0.02em] text-white/65"
        >
          {filmCount} film{filmCount === 1 ? '' : 's'}
          {selectedGenreLabels.length > 0 && ` · ${selectedGenreLabels.length} genre${selectedGenreLabels.length === 1 ? '' : 's'}`}
          {lovedCount > 0 && ` · ${lovedCount} loved`}
          {likedCount > 0 && ` · ${likedCount} liked`}
        </motion.p>

        {/* Poster mosaic — Stage 3, spring landing with gentle float */}
        {posterFilms.length > 0 && (
          <div className="mt-10 w-full">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.55, y: 0 }}
              transition={{ duration: reduced ? 0.4 : 0.9, delay: 3.0, ease: EASE }}
              className="mb-5 text-[12px] tracking-[0.02em] text-white/55"
            >
              From the films you’ve loved
            </motion.p>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { delayChildren: 3.4, staggerChildren: 0.18 } } }}
              className="flex items-end justify-center gap-2.5 sm:gap-3.5"
            >
              {posterFilms.map((film, i) => {
                const rating = ratings?.[film.id]
                const wasLoved = rating === SENTIMENT_RATINGS.loved
                // Slight rotation per poster — gives a hand-laid-out feel.
                const rotate = (i - (posterFilms.length - 1) / 2) * 3.2
                return (
                  <motion.div
                    key={film.id}
                    variants={{
                      hidden: { opacity: 0, y: 36, scale: 0.85, rotate: rotate * 0.4 },
                      visible: { opacity: 1, y: 0, scale: 1, rotate },
                    }}
                    transition={reduced ? { duration: 0.4, ease: EASE } : { ...SPRING, stiffness: 60, damping: 16 }}
                    className="relative h-28 w-[68px] flex-none overflow-hidden rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:h-36 sm:w-24"
                    style={{ originY: 1 }}
                  >
                    {/* Gentle float after landing — feels like the posters are breathing */}
                    <motion.div
                      className="h-full w-full"
                      animate={reduced ? undefined : { y: [0, -3, 0] }}
                      transition={reduced ? undefined : {
                        duration: 5 + i * 0.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 3.4 + i * 0.18 + 0.6,
                      }}
                    >
                      {film.poster_path ? (
                        <img
                          src={tmdbImg(film.poster_path, 'w185')}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-white/4 text-[10px] text-white/40">
                          {film.title?.slice(0, 12) ?? ''}
                        </div>
                      )}
                    </motion.div>
                    {/* Pink heart for loved films — appears after the poster lands */}
                    {wasLoved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 3.4 + i * 0.18 + 0.55,
                          duration: reduced ? 0.3 : 0.6,
                          ease: EASE,
                        }}
                        className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-pink-500/95 text-[10px] text-white shadow-[0_0_14px_rgba(236,72,153,0.7)]"
                        aria-hidden="true"
                      >
                        ♥
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        )}

        {/* Editorial close — Stage 4 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.5 : 1.2, delay: 5.5, ease: EASE }}
          className="mt-12"
        >
          <h1
            className="ob-display text-4xl font-normal leading-[1.05] text-white sm:text-5xl md:text-6xl"
            style={{ textWrap: 'balance', letterSpacing: '-0.02em' }}
          >
            Tonight is{' '}
            <em className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text italic text-transparent">
              yours.
            </em>
          </h1>
        </motion.div>

        {/* Coaching — Stage 5. The lead-out beat before /discover takes
           over. Sets cold-start expectations (engine will surface films
           you already know) and frames "Mark Watched" as the corrective
           signal that sharpens future picks. Held for ~4s before
           fade-out so the message has reading time + the seam to
           /discover feels guided rather than abrupt. Replaces the older
           "Opening your first edition…" stage — the coaching IS the
           lead-out now. */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.5 : 1.4, delay: 7.6, ease: EASE }}
          className="mt-10 max-w-[460px]"
        >
          <p className="ob-display text-[10px] font-semibold uppercase tracking-[0.32em] text-purple-200/65">
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-px w-4 align-middle"
              style={{ background: 'rgba(192,132,252,0.55)' }}
            />
            One last thing
          </p>
          <p
            className="mt-5 text-[15px] leading-[1.65] text-white/72"
            style={{ textWrap: 'pretty' }}
          >
            You&rsquo;ll see films you already know &mdash; that&rsquo;s the engine reaching. Tap{' '}
            <em className="not-italic font-semibold text-purple-100">Mark Watched</em>{' '}
            on any you&rsquo;ve seen, and FeelFlick sharpens by tomorrow.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

// === Celebration particles ================================================
// 14 drifting points tinted by the user's selected mood colours. Slow upward
// drift with easeInOut curve — feels like dust in light rather than linear
// flecks. Suppressed entirely for prefers-reduced-motion.
function CelebrationParticles({ moods }) {
  const rgbList = (moods || []).map(m => m.rgb)
  const fallback = ['192, 132, 252', '236, 72, 153']
  const palette = rgbList.length > 0 ? rgbList : fallback
  // Deterministic layout per mount — keys / positions stable from index.
  const points = Array.from({ length: 14 }, (_, i) => ({
    i,
    x: ((i * 73) % 100),
    y: 70 + ((i * 41) % 30),
    size: 2 + (i % 3),
    rgb: palette[i % palette.length],
    duration: 12 + (i % 5) * 2.4,        // 12-21s — much slower than before
    delay: (i * 0.42) % 6,
  }))
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {points.map(p => (
        <motion.span
          key={p.i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(${p.rgb}, 0.85)`,
            boxShadow: `0 0 10px rgba(${p.rgb}, 0.6)`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.7, 0], y: -360 }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
