// src/features/onboarding/Onboarding.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { completeOnboarding } from '@/shared/services/onboarding'
import { SENTIMENT_RATINGS } from './steps/RatingStep'

import CinematicBackdrop from './components/CinematicBackdrop'
import GenresStep from './steps/GenresStep'
import MoviesStep from './steps/MoviesStep'
import RatingStep from './steps/RatingStep'

const TOTAL_STEPS = 3

// === PROGRESS BAR ===
// Three spring-filled segments — no redundant step labels.

function ProgressBar({ step }) {
  return (
    <div className="flex-none px-6 py-5">
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className="h-[3px] flex-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: i <= step ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        ))}
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

  // Step 0: genres
  const [selectedGenres, setSelectedGenres] = useState([])
  // Step 1: films
  const [favoriteMovies, setFavoriteMovies] = useState([])
  // Step 2: ratings — { [tmdbId: number]: 9 | 7 | 5 }
  const [ratings, setRatings] = useState({})

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
  // Toggling: clicking the same sentiment again clears the rating for that film
  function handleRate(movie, sentiment) {
    const rating = SENTIMENT_RATINGS[sentiment]
    setRatings(prev => {
      // Resolve current sentiment key for this film (if any)
      const current = prev[movie.id]
      const currentSentiment = current === 9 ? 'loved' : current === 7 ? 'liked' : current === 5 ? 'okay' : null
      if (currentSentiment === sentiment) {
        // Same button tapped → clear rating
        const next = { ...prev }
        delete next[movie.id]
        return next
      }
      return { ...prev, [movie.id]: rating }
    })
  }

  // === FINISH ===
  async function handleFinish() {
    setError('')
    setLoading(true)

    try {
      await completeOnboarding({ session, selectedGenres, favoriteMovies, ratings })

      // Wait for auth metadata to propagate
      await new Promise(resolve => setTimeout(resolve, 500))
      const { data: { session: updatedSession } } = await supabase.auth.getSession()
      if (!updatedSession?.user?.user_metadata?.onboarding_complete) {
        window.location.href = '/home'
        return
      }

      setLoading(false)
      setCelebrate(true)
      setTimeout(() => navigate('/home', {
        replace: true,
        state: { fromOnboarding: true, movieCount: favoriteMovies.length },
      }), 2000)
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
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
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
    <div className="fixed inset-0 flex flex-col">
      {/* Cinematic backdrop — behind everything */}
      <CinematicBackdrop />

      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">
        <ProgressBar step={step} />

        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
                  ratings={ratings}
                  onRate={handleRate}
                  onBack={() => { setError(''); setRatings({}); setStep(1) }}
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
