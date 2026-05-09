// src/features/onboarding/Onboarding.jsx
// FeelFlick — Onboarding V2 (mood-reactive). Mounted at /onboarding.
//
// Flow (4 steps, NO step 5 — lands on /home directly):
//   1. Mood baseline   (NEW)
//   2. Genres          (restyled)
//   3. Films           (legacy step, reused)
//   4. Quick rate      (restyled) → completeOnboarding → /home
//
// Auth + completion logic mirrors the legacy Onboarding.jsx exactly so existing Supabase
// metadata + PostAuthGate continue to work.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { completeOnboarding } from '@/shared/services/onboarding'

import AmbientGlow from './components/AmbientGlow'
import Progress from './components/Progress'
import TasteStrip from './components/TasteStrip'
import MoodStep from './steps/MoodStep'
import GenresStep from './steps/GenresStep'
import MoviesStep from './steps/MoviesStep'
import RatingStep from './steps/RatingStep'

import { MOODS_LS_KEY, SENTIMENT_RATINGS } from './data'
import './onboarding.css'

export default function Onboarding() {
  const navigate = useNavigate()
  const { ready, session } = useAuthSession()

  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(0)
  const [celebrate, setCelebrate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step state
  const [moods, setMoods] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [ratings, setRatings] = useState({})

  // Auth gate (same logic as legacy)
  useEffect(() => {
    if (!ready) return
    if (!session?.user) { setChecking(false); return }

    ;(async () => {
      try {
        const meta = session.user.user_metadata || {}
        if (meta.onboarding_complete || meta.has_onboarded || meta.onboarded) {
          navigate('/home', { replace: true })
          return
        }
        const { data } = await supabase
          .from('users')
          .select('onboarding_complete,onboarding_completed_at')
          .eq('id', session.user.id)
          .maybeSingle()
        const completed = data?.onboarding_complete || Boolean(data?.onboarding_completed_at)
        if (completed) navigate('/home', { replace: true })
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

  async function handleFinish() {
    setError('')
    setLoading(true)
    try {
      // Mirror the mood baseline to localStorage so the home page can read it
      // synchronously on first paint (avoids a Supabase round-trip for cold-start).
      // The authoritative value lives on users.taste_baseline_moods.
      try {
        localStorage.setItem(MOODS_LS_KEY, JSON.stringify(moods))
      } catch {
        // localStorage unavailable (private mode, quota exceeded) — non-fatal.
      }

      await completeOnboarding({ session, selectedGenres, favoriteMovies, ratings, moods })

      await new Promise(r => setTimeout(r, 500))
      const { data: { session: updatedSession } } = await supabase.auth.getSession()
      if (!updatedSession?.user?.user_metadata?.onboarding_complete) {
        window.location.href = '/home'
        return
      }

      setLoading(false)
      setCelebrate(true)
      setTimeout(() => navigate('/home', {
        replace: true,
        state: { fromOnboarding: true, movieCount: favoriteMovies.length, moods },
      }), 1600)
    } catch (e) {
      console.error('Onboarding save failed:', e)
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
    }
  }

  // Loading
  if (checking) {
    return (
      <div className="onboarding h-screen grid place-items-center bg-black relative overflow-hidden">
        <AmbientGlow moods={[]} />
        <div className="relative flex flex-col items-center gap-6">
          <span className="ob-display text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            FEELFLICK
          </span>
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="rgba(168,85,247,0.2)" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9v9z" fill="rgb(168,85,247)" />
          </svg>
        </div>
      </div>
    )
  }

  // Celebration → /home
  if (celebrate) {
    return (
      <div className="onboarding fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden">
        <AmbientGlow moods={moods} />
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center px-6"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-6"
          >
            <Sparkles className="h-14 w-14 mx-auto" style={{ color: 'rgb(168,85,247)' }} />
          </motion.div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-purple-300/80 mb-4">
            ✓ All set · Welcome home
          </p>
          <h1 className="ob-display text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Your taste profile<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">is ready.</span>
          </h1>
          <p className="text-base text-white/40 leading-relaxed mt-3">Heading to your first recommendations…</p>
        </motion.div>
      </div>
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
        <TasteStrip moods={moods} genres={selectedGenres} films={favoriteMovies} ratings={ratings} />

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
                  loading={loading}
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
