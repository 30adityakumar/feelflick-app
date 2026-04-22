// src/features/onboarding/Onboarding.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { completeOnboarding } from '@/shared/services/onboarding'
import { SENTIMENT_RATINGS } from '@/app/pages/onboarding/RatingStep'

import GenresStep from '@/app/pages/onboarding/GenresStep'
import MoviesStep from '@/app/pages/onboarding/MoviesStep'
import RatingStep from '@/app/pages/onboarding/RatingStep'

const STEP_LABELS = ['Your Genres', 'Your Films', 'Rate One']
const TOTAL_STEPS = 3

// === PROGRESS INDICATOR ===

function ProgressIndicator({ step }) {
  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100

  return (
    <div className="flex-none px-6 py-4 border-b border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          Step {step + 1} of {TOTAL_STEPS}
        </span>
        <span className="text-xs font-semibold text-white/60">
          {STEP_LABELS[step]}
        </span>
      </div>
      <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

// === MAIN COMPONENT ===

export default function Onboarding() {
  const navigate = useNavigate()
  const { ready, session } = useAuthSession()

  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(0)
  const [celebrate, setCelebrate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0: genre selection
  const [selectedGenres, setSelectedGenres] = useState([])

  // Step 1: movie selection
  const [favoriteMovies, setFavoriteMovies] = useState([])

  // Step 2: rating anchor
  const [pick, setPick] = useState(null)

  // === AUTH CHECK ===
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

  // === GENRE HELPERS ===
  function toggleGenre(id) {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // === MOVIE HELPERS ===
  function isMovieSelected(id) { return favoriteMovies.some(m => m.id === id) }
  function addMovie(movie) {
    if (!isMovieSelected(movie.id) && favoriteMovies.length < 50) {
      setFavoriteMovies(prev => [...prev, movie])
    }
  }
  function removeMovie(id) { setFavoriteMovies(prev => prev.filter(m => m.id !== id)) }

  // === RATING HELPER ===
  function handleRate(movie, sentiment) {
    const rating = SENTIMENT_RATINGS[sentiment]
    setPick({ tmdbId: movie.id, sentiment, rating })
  }

  // === FINISH ===
  async function handleFinish() {
    setError('')
    setLoading(true)

    try {
      await completeOnboarding({
        session,
        selectedGenres,
        favoriteMovies,
        ratingPick: pick,
      })

      // Check if auth metadata update propagated; force reload if not
      await new Promise(resolve => setTimeout(resolve, 500))
      const { data: { session: updatedSession } } = await supabase.auth.getSession()
      if (!updatedSession?.user?.user_metadata?.onboarding_complete) {
        window.location.href = '/home'
        return
      }

      setLoading(false)
      setCelebrate(true)
      setTimeout(() => navigate('/home', { replace: true, state: { fromOnboarding: true } }), 2000)
    } catch (e) {
      console.error('Onboarding save failed:', e)
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
    }
  }

  // === LOADING SCREEN ===
  if (checking) {
    return (
      <div className="h-screen grid place-items-center bg-black">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(88,28,135,0.3) 0%, transparent 65%)' }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-6">
          <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
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

  // === CELEBRATION SCREEN ===
  if (celebrate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(88,28,135,0.6) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% 110%, rgba(168,85,247,0.25) 0%, transparent 65%)' }} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative text-center px-6"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-8"
          >
            <Sparkles className="h-16 w-16 mx-auto" style={{ color: 'rgb(168,85,247)' }} />
          </motion.div>
          <span className="block text-sm font-bold uppercase tracking-[0.22em] text-purple-400/70 mb-5">
            All set
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Your taste profile<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">is ready.</span>
          </h1>
          <p className="text-base text-white/40 leading-relaxed">
            Heading to your first recommendations…
          </p>
        </motion.div>
      </div>
    )
  }

  // === MAIN LAYOUT ===
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(88,28,135,0.18) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168,85,247,0.08) 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">
        <ProgressIndicator step={step} />

        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              {step === 0 && (
                <GenresStep
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                  onNext={() => { setError(''); setStep(1) }}
                  firstName={session?.user?.user_metadata?.name?.split(' ')[0] ?? null}
                />
              )}
              {step === 1 && (
                <MoviesStep
                  selectedGenreIds={selectedGenres}
                  favoriteMovies={favoriteMovies}
                  addMovie={addMovie}
                  removeMovie={removeMovie}
                  isMovieSelected={isMovieSelected}
                  onBack={() => { setError(''); setStep(0) }}
                  onFinish={() => { setError(''); setStep(2) }}
                  loading={false}
                  error={error}
                />
              )}
              {step === 2 && (
                <RatingStep
                  favoriteMovies={favoriteMovies}
                  pick={pick}
                  onRate={handleRate}
                  onBack={() => { setError(''); setPick(null); setStep(1) }}
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
