// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  Check, Search, X, Sparkles, ArrowRight, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react'

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

// Mood definitions — IDs match DiscoverPage (1–12) for cross-feature consistency
const MOODS = [
  { id: 1,  name: 'Cozy',        emoji: '☕', desc: 'Warm and comforting',   color: 'border-orange-400/60 bg-orange-500/10' },
  { id: 2,  name: 'Adventurous', emoji: '🗺️', desc: 'Bold and exciting',     color: 'border-blue-400/60 bg-blue-500/10' },
  { id: 3,  name: 'Heartbroken', emoji: '💔', desc: 'Emotionally raw',       color: 'border-pink-400/60 bg-pink-500/10' },
  { id: 4,  name: 'Curious',     emoji: '🔍', desc: 'Mind-expanding',        color: 'border-purple-400/60 bg-purple-500/10' },
  { id: 5,  name: 'Nostalgic',   emoji: '🎞️', desc: 'Classic favorites',     color: 'border-yellow-400/60 bg-yellow-500/10' },
  { id: 6,  name: 'Energized',   emoji: '⚡', desc: 'High-energy fun',       color: 'border-green-400/60 bg-green-500/10' },
  { id: 7,  name: 'Anxious',     emoji: '😰', desc: 'Need to decompress',    color: 'border-indigo-400/60 bg-indigo-500/10' },
  { id: 8,  name: 'Romantic',    emoji: '💕', desc: 'Love and connection',   color: 'border-red-400/60 bg-red-500/10' },
  { id: 9,  name: 'Inspired',    emoji: '✨', desc: 'Uplifting stories',     color: 'border-amber-400/60 bg-amber-500/10' },
  { id: 10, name: 'Silly',       emoji: '🤪', desc: 'Light and funny',       color: 'border-lime-400/60 bg-lime-500/10' },
  { id: 11, name: 'Dark',        emoji: '🌑', desc: 'Gritty and intense',    color: 'border-gray-400/60 bg-gray-500/10' },
  { id: 12, name: 'Overwhelmed', emoji: '😵', desc: 'Complete escape',       color: 'border-teal-400/60 bg-teal-500/10' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  // Steps: -1=welcome, 0=moods, 1=genres, 2=movies
  const [step, setStep] = useState(-1)
  const [selectedMoods, setSelectedMoods] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [trendingMovies, setTrendingMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [celebrate, setCelebrate] = useState(false)

  const searchInputRef = useRef(null)

  // Auto-focus search input on movie step
  useEffect(() => {
    if (step === 2 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150)
    }
  }, [step])

  // Fetch trending movies when entering movie step
  useEffect(() => {
    if (step !== 2) return
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`)
      .then(r => r.json())
      .then(data => setTrendingMovies((data.results || []).filter(m => m.poster_path).slice(0, 12)))
      .catch(() => {})
  }, [step])

  // Session management
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Check completion status
  useEffect(() => {
    if (!session?.user) return
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
      } catch { setChecking(false) }
    })()
  }, [session, navigate])

  // Debounced TMDB movie search
  useEffect(() => {
    let active = true
    let timeout
    if (!query) { setResults([]); setSearching(false); return }
    setSearching(true)
    timeout = setTimeout(() => {
      (async () => {
        try {
          const r = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
          )
          const data = await r.json()
          if (!active) return
          const all = (data.results || [])
            .filter(m => m.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 12)
          setResults(all)
          setSearching(false)
        } catch {
          if (active) { setResults([]); setSearching(false) }
        }
      })()
    }, 300)
    return () => { active = false; clearTimeout(timeout) }
  }, [query])

  const GENRES = useMemo(() => [
    { id: 28,    label: 'Action',      emoji: '⚔️' },
    { id: 12,    label: 'Adventure',   emoji: '🧭' },
    { id: 16,    label: 'Animation',   emoji: '🎨' },
    { id: 35,    label: 'Comedy',      emoji: '😂' },
    { id: 80,    label: 'Crime',       emoji: '🔫' },
    { id: 99,    label: 'Documentary', emoji: '🎙️' },
    { id: 18,    label: 'Drama',       emoji: '🎭' },
    { id: 10751, label: 'Family',      emoji: '🏠' },
    { id: 14,    label: 'Fantasy',     emoji: '🧙' },
    { id: 36,    label: 'History',     emoji: '🏛️' },
    { id: 27,    label: 'Horror',      emoji: '👻' },
    { id: 10402, label: 'Music',       emoji: '🎵' },
    { id: 9648,  label: 'Mystery',     emoji: '🔍' },
    { id: 10749, label: 'Romance',     emoji: '💌' },
    { id: 878,   label: 'Sci-Fi',      emoji: '🚀' },
    { id: 53,    label: 'Thriller',    emoji: '⚡' },
  ], [])

  const toggleMood = (id) => {
    setSelectedMoods(m => {
      if (m.includes(id)) return m.filter(x => x !== id)
      if (m.length >= 4) return m // max 4
      return [...m, id]
    })
  }
  const toggleGenre = (id) => setSelectedGenres(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])
  const isMovieSelected = (id) => favoriteMovies.some(x => x.id === id)
  const addMovie = (m) => { if (!isMovieSelected(m.id) && favoriteMovies.length < 50) setFavoriteMovies(prev => [...prev, m]) }
  const removeMovie = (id) => setFavoriteMovies(prev => prev.filter(m => m.id !== id))

  async function ensureUserRowOrFail(user) {
    const { data: existing } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
    if (existing) return true
    const { error } = await supabase.from('users').insert({
      id: user.id, email: user.email, name: user.user_metadata?.name || null,
    })
    if (error) throw new Error('Could not create your profile')
    return true
  }

  async function ensureMovieExists(tmdbMovie) {
    try {
      const { data: existing } = await supabase.from('movies').select('id').eq('tmdb_id', tmdbMovie.id).maybeSingle()
      if (existing) return existing.id

      let fullMovie = tmdbMovie
      try {
        const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbMovie.id}?api_key=${TMDB_KEY}`)
        if (detailsRes.ok) fullMovie = await detailsRes.json()
      } catch (err) {
        console.warn('Could not fetch full movie details, using search data:', err)
      }

      const movieRow = {
        tmdb_id: fullMovie.id, title: fullMovie.title, original_title: fullMovie.original_title,
        release_date: fullMovie.release_date || null, overview: fullMovie.overview || null,
        poster_path: fullMovie.poster_path, backdrop_path: fullMovie.backdrop_path,
        runtime: fullMovie.runtime || null, vote_average: fullMovie.vote_average || null,
        vote_count: fullMovie.vote_count || null, popularity: fullMovie.popularity || null,
        original_language: fullMovie.original_language, adult: fullMovie.adult || false,
        budget: fullMovie.budget || null, revenue: fullMovie.revenue || null,
        status: fullMovie.status || null, tagline: fullMovie.tagline || null,
        homepage: fullMovie.homepage || null, imdb_id: fullMovie.imdb_id || null,
        json_data: fullMovie,
      }

      const { data: inserted, error } = await supabase
        .from('movies').upsert(movieRow, { onConflict: 'tmdb_id', ignoreDuplicates: false })
        .select('id').single()

      if (error) { console.error('Failed to insert movie:', error); throw new Error(`Could not save movie: ${fullMovie.title}`) }
      return inserted.id
    } catch (err) {
      console.error('ensureMovieExists failed:', err)
      throw err
    }
  }

  async function saveAndGo(opts = {}) {
    setError('')
    setLoading(true)

    try {
      const user_id = session?.user?.id
      if (!user_id) throw new Error('No authenticated user.')

      await ensureUserRowOrFail(session.user)

      // 1. Save genre preferences
      if (!opts.skipGenres && selectedGenres.length) {
        await supabase.from('user_preferences').delete().eq('user_id', user_id)
        const genreRows = selectedGenres.map(genre_id => ({ user_id, genre_id }))
        await supabase.from('user_preferences').upsert(genreRows, { onConflict: 'user_id,genre_id' })
      }

      // 2. Save favorite movies
      if (!opts.skipMovies && favoriteMovies.length) {
        const moviePromises = favoriteMovies.map(async (tmdbMovie) => {
          try {
            const internalMovieId = await ensureMovieExists(tmdbMovie)
            return {
              user_id, movie_id: internalMovieId, watched_at: new Date().toISOString(),
              source: 'onboarding', watch_duration_minutes: null, mood_session_id: null,
            }
          } catch (err) {
            console.error(`Failed to process movie ${tmdbMovie.title}:`, err)
            return null
          }
        })

        const historyRows = (await Promise.all(moviePromises)).filter(Boolean)
        if (historyRows.length > 0) {
          const { error: historyError } = await supabase.from('user_history').insert(historyRows)
          if (historyError) { console.error('Failed to save watch history:', historyError); throw new Error('Could not save your favorite movies') }
        }
      }

      // 3. Mark onboarding complete + save mood preferences
      await supabase.from('users').update({
        onboarding_complete: true, onboarding_completed_at: new Date().toISOString(),
      }).eq('id', user_id)

      await supabase.auth.updateUser({
        data: {
          onboarding_complete: true,
          has_onboarded: true,
          ...(selectedMoods.length > 0 && { preferred_moods: selectedMoods }),
        }
      })

      await new Promise(resolve => setTimeout(resolve, 500))
      const { data: { session: updatedSession } } = await supabase.auth.getSession()

      if (!updatedSession?.user?.user_metadata?.onboarding_complete) {
        console.warn('Session not yet updated, forcing reload')
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

  // Loading screen
  if (checking) {
    return (
      <div className="h-screen grid place-items-center bg-[#0B1120]">
        <div className="flex flex-col items-center gap-5">
          <span className="text-3xl font-black bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
            FEELFLICK
          </span>
          <Loader2 className="h-7 w-7 text-[#667eea] animate-spin" />
        </div>
      </div>
    )
  }

  // Celebration screen
  if (celebrate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]">
        <div className="text-center px-6 animate-fade-in">
          <Sparkles className="h-20 w-20 text-white mx-auto mb-8 animate-bounce-gentle" />
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 animate-slide-up">
            Your taste profile is ready
          </h1>
          <p className="text-lg text-white/90 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Heading to your first recommendations…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0B1120] flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#667eea]/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#764ba2]/10 rounded-full blur-3xl animate-float-slow-delayed" />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">
        {/* Progress bar — only shown during steps 0–2 */}
        {step >= 0 && <ProgressIndicator step={step} totalSteps={3} />}

        {/* Step content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {step === -1 && (
            <WelcomeStep onNext={() => setStep(0)} name={session?.user?.user_metadata?.name} />
          )}
          {step === 0 && (
            <StepMoods
              moods={MOODS}
              selectedMoods={selectedMoods}
              toggleMood={toggleMood}
              onBack={() => setStep(-1)}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepGenres
              GENRES={GENRES}
              selectedGenres={selectedGenres}
              toggleGenre={toggleGenre}
              error={error}
              loading={loading}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepMovies
              query={query}
              setQuery={setQuery}
              results={results}
              searching={searching}
              isMovieSelected={isMovieSelected}
              addMovie={addMovie}
              removeMovie={removeMovie}
              favoriteMovies={favoriteMovies}
              trendingMovies={trendingMovies}
              error={error}
              loading={loading}
              searchInputRef={searchInputRef}
              onBack={() => setStep(1)}
              onFinish={saveAndGo}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, -20px); } }
        @keyframes float-slow-delayed { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, 20px); } }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.05); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-float-slow-delayed { animation: float-slow-delayed 25s ease-in-out infinite; }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(102,126,234,0.4); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(102,126,234,0.6); }
      `}</style>
    </div>
  )
}

// ─── Progress Indicator ────────────────────────────────────────────────────────

function ProgressIndicator({ step, totalSteps }) {
  const labels = ['Your Moods', 'Your Genres', 'Your Films']
  const progressPercent = ((step + 1) / totalSteps) * 100

  return (
    <div className="flex-none px-6 py-4 border-b border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          Step {step + 1} of {totalSteps}
        </span>
        <span className="text-xs font-semibold text-white/60">
          {labels[step]}
        </span>
      </div>
      <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

// ─── Welcome Step ──────────────────────────────────────────────────────────────

function WelcomeStep({ onNext, name }) {
  const firstName = name ? name.split(' ')[0] : null

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12 overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto space-y-10 animate-fade-in">
        {/* Brand */}
        <span className="block text-sm font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
          FeelFlick
        </span>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            {firstName ? (
              <>Hey {firstName},<br />films for how you feel</>
            ) : (
              'Films for how you feel right now'
            )}
          </h1>
          <p className="text-base text-white/55 leading-relaxed max-w-sm mx-auto">
            Tell us your moods, genres, and favorite films —<br />
            we'll find exactly what to watch tonight.
          </p>
        </div>

        {/* 3-step preview */}
        <div className="flex flex-col gap-3 text-left max-w-xs mx-auto">
          {[
            { symbol: '✦', label: 'Your moods',  sub: 'we match the vibe' },
            { symbol: '✦', label: 'Your genres', sub: 'we sharpen the focus' },
            { symbol: '✦', label: 'Your films',  sub: 'we learn your taste' },
          ].map(({ symbol, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-[#667eea] text-xs">{symbol}</span>
              <span className="text-sm font-semibold text-white">{label}</span>
              <span className="text-sm text-white/35">→ {sub}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={onNext}
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Let's start
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-xs text-white/30">Takes about 90 seconds</p>
        </div>
      </div>
    </div>
  )
}

// ─── Mood Step (NEW) ───────────────────────────────────────────────────────────

function StepMoods({ moods, selectedMoods, toggleMood, onBack, onNext }) {
  const atMax = selectedMoods.length >= 4

  return (
    <div className="h-full flex flex-col px-6 py-6">
      {/* Header */}
      <div className="flex-none text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          What moods bring you to a film?
        </h2>
        <p className="text-sm text-white/45">
          {selectedMoods.length === 0
            ? 'Pick up to 4 that feel like you'
            : atMax
            ? `${selectedMoods.length} selected — looking good`
            : `${selectedMoods.length} selected — pick up to ${4 - selectedMoods.length} more`}
        </p>
      </div>

      {/* Mood grid */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-2 px-2">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pb-6">
          {moods.map((mood, idx) => {
            const isSelected = selectedMoods.includes(mood.id)
            const isDisabled = atMax && !isSelected
            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => toggleMood(mood.id)}
                disabled={isDisabled}
                style={{ animationDelay: `${idx * 25}ms`, animation: 'slide-up 0.4s ease-out backwards' }}
                className={`relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200 text-center
                  ${isSelected
                    ? `${mood.color} shadow-lg scale-[1.02]`
                    : isDisabled
                    ? 'border-white/5 bg-white/3 opacity-40 cursor-not-allowed'
                    : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
                  }`}
              >
                <span className="text-3xl leading-none">{mood.emoji}</span>
                <span className="text-sm font-semibold text-white leading-tight">{mood.name}</span>
                <span className="text-[10px] text-white/45 leading-tight">{mood.desc}</span>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[#0B1120] rounded-full p-0.5">
                    <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-full p-1">
                      <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none pt-5 border-t border-white/5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
            selectedMoods.length > 0
              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              : 'bg-white/8 text-white/40 hover:text-white/60 hover:bg-white/12 border border-white/10'
          }`}
        >
          {selectedMoods.length > 0 ? 'Continue' : 'Skip for now'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Genre Step ────────────────────────────────────────────────────────────────

function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onBack }) {
  const count = selectedGenres.length
  const feedback = count === 0
    ? { text: 'Select 3–5 genres to get started', color: 'text-white/45' }
    : count < 3
    ? { text: `${3 - count} more needed for quality recommendations`, color: 'text-[#667eea]' }
    : count <= 5
    ? { text: 'Perfect selection', color: 'text-emerald-400' }
    : { text: `${count} selected — you love variety!`, color: 'text-[#f093fb]' }

  const canProceed = count >= 3

  return (
    <div className="h-full flex flex-col px-6 py-6">
      {/* Header */}
      <div className="flex-none text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          What do you love to watch?
        </h2>
        <p className={`text-sm font-medium ${feedback.color} transition-colors duration-300`}>
          {feedback.text}
        </p>
      </div>

      {error && (
        <div className="flex-none max-w-md mx-auto mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-2 px-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto pb-6">
          {GENRES.map((g, idx) => {
            const isSelected = selectedGenres.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                style={{ animationDelay: `${idx * 20}ms`, animation: 'slide-up 0.4s ease-out backwards' }}
                className={`relative h-24 overflow-visible rounded-2xl border-2 transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? 'border-[#667eea] bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 text-white shadow-lg shadow-[#667eea]/20'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className="flex flex-col items-center justify-center h-full gap-1.5 px-3">
                  <span className="text-2xl leading-none">{g.emoji}</span>
                  <span className="text-sm font-semibold leading-tight">{g.label}</span>
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[#0B1120] rounded-full p-0.5 shadow-lg z-10">
                    <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-full p-1.5">
                      <Check className="h-3 w-3 text-white stroke-[3]" />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none pt-5 border-t border-white/5 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white/70 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={loading || !canProceed}
          className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
            canProceed
              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Movie Step ────────────────────────────────────────────────────────────────

function StepMovies({
  query, setQuery, results, searching, isMovieSelected, addMovie, removeMovie,
  favoriteMovies, trendingMovies, error, loading, searchInputRef, onBack, onFinish
}) {
  const count = favoriteMovies.length
  const feedback = count === 0
    ? { text: 'Add 5+ movies for personalized recommendations — or skip', color: 'text-white/45' }
    : count < 5
    ? { text: `${5 - count} more for great recommendations`, color: 'text-[#667eea]' }
    : count < 10
    ? { text: 'Excellent — ready to continue', color: 'text-emerald-400' }
    : { text: `${count} movies — amazing taste!`, color: 'text-[#f093fb]' }

  const canProceed = count >= 5
  // Collapse trending row once search is active or 5+ movies added
  const showTrending = trendingMovies.length > 0 && !query && count < 5

  return (
    <div className="h-full flex flex-col px-6 py-6">
      {/* Header */}
      <div className="flex-none text-center mb-5">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          Add your favorite movies
        </h2>
        <p className={`text-sm font-medium ${feedback.color} transition-colors duration-300`}>
          {feedback.text}
        </p>
      </div>

      {error && (
        <div className="flex-none max-w-md mx-auto mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex-none relative max-w-2xl mx-auto mb-5 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 z-10" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for movies (e.g., Inception, The Matrix)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-[#667eea]/30 bg-white/5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#667eea] focus:ring-4 focus:ring-[#667eea]/20 transition-all"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="h-5 w-5 text-[#667eea] animate-spin" />
          </div>
        )}
        {query && !searching && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-2 px-2">

        {/* Trending row — shown when no search query and fewer than 5 movies added */}
        {showTrending && (
          <div className="max-w-3xl mx-auto mb-6">
            <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-3">
              Trending this week — tap to add
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {trendingMovies.map(m => {
                const selected = isMovieSelected(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { if (!selected) addMovie(m) }}
                    disabled={selected}
                    title={m.title}
                    className={`flex-none relative w-16 aspect-[2/3] rounded-lg overflow-hidden ring-2 transition-all duration-200 ${
                      selected ? 'ring-emerald-400 opacity-60' : 'ring-white/10 hover:ring-[#667eea]/60 hover:scale-105'
                    }`}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                    {selected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check className="h-5 w-5 text-emerald-400 stroke-[3]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state — only when no trending, no query, no favorites */}
        {!query && favoriteMovies.length === 0 && !showTrending && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-60">
            <Search className="h-14 w-14 mb-4 text-white/30" />
            <p className="text-sm text-white/60 max-w-xs">
              Start typing to discover and add movies you love
            </p>
          </div>
        )}

        {/* Search results dropdown */}
        {query && results.length > 0 && (
          <div className="max-w-3xl mx-auto rounded-2xl bg-[#0f172a]/80 border border-white/10 overflow-hidden shadow-2xl mb-6 backdrop-blur-md">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {results.map((r) => {
                const selected = isMovieSelected(r.id)
                const canAdd = !selected && favoriteMovies.length < 50
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      if (selected) removeMovie(r.id)
                      else if (canAdd) { addMovie(r); setQuery('') }
                    }}
                    disabled={!canAdd && !selected}
                    className={`flex w-full items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-left group ${selected ? 'bg-[#667eea]/10' : ''} ${!canAdd && !selected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                      alt={r.title}
                      className="w-12 rounded-lg object-cover flex-shrink-0 shadow-md ring-1 ring-white/10"
                      style={{ aspectRatio: '2/3' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-base truncate group-hover:text-[#667eea] transition-colors">{r.title}</div>
                      <div className="text-sm text-white/45">{r.release_date?.slice(0, 4) || 'Unknown'}</div>
                    </div>
                    {selected ? (
                      <div className="bg-emerald-500 rounded-full p-2">
                        <Check className="h-4 w-4 text-white stroke-[3]" />
                      </div>
                    ) : canAdd ? (
                      <span className="text-sm font-bold text-[#667eea] uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">Add</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {query && !searching && results.length === 0 && (
          <div className="text-center py-12 text-white/45 text-sm">
            No movies found. Try a different search term.
          </div>
        )}

        {/* Selected collection */}
        {favoriteMovies.length > 0 && (
          <div className="max-w-5xl mx-auto pb-6">
            <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-[#0B1120]/95 backdrop-blur-sm py-2 border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-3">
                Your Collection
                <span className="text-sm font-semibold text-white/45 bg-white/10 px-3 py-1 rounded-full">
                  {favoriteMovies.length}
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {favoriteMovies.map((m, idx) => (
                <div
                  key={m.id}
                  className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 hover:ring-[#667eea]/50 transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${idx * 30}ms`, animation: 'slide-up 0.4s ease-out backwards' }}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                    alt={m.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeMovie(m.id) }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center shadow-md z-20 transition-all hover:scale-110"
                    title="Remove"
                  >
                    <X className="h-4 w-4 text-white stroke-[3]" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                    <span className="text-[11px] font-medium text-white/90 line-clamp-2 leading-tight">{m.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-none pt-5 border-t border-white/5 bg-[#0B1120]">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white/70 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-4">
            {!canProceed && (
              <button
                onClick={() => onFinish({ skipMovies: true })}
                disabled={loading}
                className="text-sm font-medium text-white/35 hover:text-white/60 transition-colors disabled:opacity-30"
              >
                Skip for now
              </button>
            )}
            <button
              onClick={onFinish}
              disabled={loading || !canProceed}
              className={`flex items-center gap-3 px-10 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                canProceed
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving</>
              ) : (
                <><Check className="h-4 w-4" /> Complete Setup</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
