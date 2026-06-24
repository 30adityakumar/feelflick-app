import { useEffect, useState } from 'react'
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

const CELEBRATION_MIN_MS = 2600

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
  const [completionReady, setCompletionReady] = useState(false)
  const [continuing, setContinuing] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)
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

  async function handleFinish() {
    setError('')
    setCompletionReady(false)
    setContinuing(false)
    setFadingOut(false)
    setCelebrate(true)
    const startedAt = Date.now()

    try {
      try {
        localStorage.setItem(MOODS_LS_KEY, JSON.stringify(moods))
      } catch {
        // Private mode or quota errors do not block onboarding.
      }

      await Promise.all([
        completeOnboarding({
          session,
          selectedGenres,
          favoriteMovies,
          ratings,
          moods,
          markAuthComplete: false,
        }),
        userId
          ? prefetchHomeData(userId).catch(prefetchError => {
              console.warn('Home data prefetch failed (non-fatal):', prefetchError)
            })
          : Promise.resolve(),
      ])

      clearDraft(userId)
      const remaining = Math.max(0, CELEBRATION_MIN_MS - (Date.now() - startedAt))
      if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining))
      setCompletionReady(true)
    } catch (finishError) {
      console.error('Onboarding save failed:', finishError)
      trackEvent(EVENTS.onboarding_error, {
        surface: 'onboarding',
        source: 'finish',
        error_kind: errorKind(finishError),
      })
      setError(finishError.message || 'Could not save your preferences. Please try again.')
      setCelebrate(false)
    }
  }

  async function handleCelebrationContinue() {
    if (!completionReady || continuing) return
    setContinuing(true)
    setFadingOut(true)

    if (!reduced) await new Promise(resolve => setTimeout(resolve, 900))

    navigate('/discover', {
      replace: true,
      state: { fromOnboarding: true, movieCount: favoriteMovies.length, moods },
    })

    try {
      await markOnboardingAuthComplete()
    } catch (metadataError) {
      console.warn('Onboarding auth metadata update failed after completion:', metadataError)
    }
  }

  if (checking || (userId && !hydrated)) return <BrandSplash />

  if (celebrate) {
    return (
      <CelebrationReveal
        moods={moods}
        selectedGenres={selectedGenres}
        favoriteMovies={favoriteMovies}
        ratings={ratings}
        fadingOut={fadingOut}
        ready={completionReady}
        continuing={continuing}
        onContinue={handleCelebrationContinue}
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
