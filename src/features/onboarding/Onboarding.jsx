// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import {
  Check, Search, X, Sparkles, ArrowRight, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchJson, getTrending, searchMovies } from '@/shared/api/tmdb'

export default function Onboarding() {
  const navigate = useNavigate()
  const { ready, session } = useAuthSession()
  const [checking, setChecking] = useState(true)
  // Steps: -1=welcome, 0=genres, 1=movies
  const [step, setStep] = useState(-1)
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
    if (step === 1 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150)
    }
  }, [step])

  // Fetch trending movies when entering movie step
  useEffect(() => {
    if (step !== 1) return

    let active = true
    ;(async () => {
      try {
        const data = await getTrending('movie', 'week')
        if (!active) return
        setTrendingMovies((data.results || []).filter(m => m.poster_path).slice(0, 12))
      } catch {
        if (active) setTrendingMovies([])
      }
    })()

    return () => {
      active = false
    }
  }, [step])

  // Check completion status
  useEffect(() => {
    if (!ready) return
    if (!session?.user) {
      setChecking(false)
      return
    }
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
  }, [ready, session, navigate])

  // Debounced TMDB movie search
  useEffect(() => {
    let active = true
    let timeout
    if (!query) { setResults([]); setSearching(false); return }
    setSearching(true)
    timeout = setTimeout(() => {
      (async () => {
        try {
          const data = await searchMovies(query)
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
        fullMovie = await fetchJson(`/movie/${tmdbMovie.id}`)
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

  // Celebration screen
  if (celebrate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden">
        {/* Cinematic atmosphere */}
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
          <p className="text-base text-white/45 leading-relaxed">
            Heading to your first recommendations…
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 45% at 50% 0%, rgba(88,28,135,0.18) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168,85,247,0.08) 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">
        {/* Progress bar — only shown during steps 0–1 */}
        {step >= 0 && <ProgressIndicator step={step} totalSteps={2} />}

        {/* Step content — animated transitions */}
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
              {step === -1 && (
                <WelcomeStep onNext={() => setStep(0)} name={session?.user?.user_metadata?.name} />
              )}
              {step === 0 && (
                <StepGenres
                  GENRES={GENRES}
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                  error={error}
                  loading={loading}
                  onNext={() => setStep(1)}
                  onBack={() => setStep(-1)}
                />
              )}
              {step === 1 && (
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
                  onBack={() => setStep(0)}
                  onFinish={saveAndGo}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.35); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.55); }
      `}</style>
    </div>
  )
}

// ─── Progress Indicator ────────────────────────────────────────────────────────

function ProgressIndicator({ step, totalSteps }) {
  const labels = ['Your Genres', 'Your Films']
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
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
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
        <span className="block text-sm font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          FEELFLICK
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
            Tell us what you love to watch — we&apos;ll build a taste profile and find exactly the right film tonight.
          </p>
        </div>

        {/* 2-step preview */}
        <div className="flex flex-col gap-3 text-left max-w-xs mx-auto">
          {[
            { symbol: '✦', label: 'Your genres', sub: 'we sharpen the focus' },
            { symbol: '✦', label: 'Your films',  sub: 'we learn your taste' },
          ].map(({ symbol, label, sub }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-purple-400 text-xs">{symbol}</span>
              <span className="text-sm font-semibold text-white">{label}</span>
              <span className="text-sm text-white/35">→ {sub}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/25 -mt-3">Takes about 60 seconds</p>

        {/* CTA */}
        <div className="space-y-3">
          <button
            onClick={onNext}
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-base shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Let&apos;s start
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Genre Step ────────────────────────────────────────────────────────────────

function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onBack }) {
  const count = selectedGenres.length
  const canProceed = count >= 3

  const statusText = count === 0
    ? 'Pick at least 3 — the more you choose, the better we know you'
    : count < 3
    ? `${3 - count} more to go`
    : count <= 5
    ? 'Great — add more or continue'
    : `${count} selected — nice range`

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none text-center px-6 pt-7 pb-5">
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
          What do you love<br className="sm:hidden" /> to watch?
        </h2>
        <p className="text-sm text-white/40 transition-all duration-300">{statusText}</p>
      </div>

      {error && (
        <div className="flex-none mx-6 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Tag cloud */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-5 pb-4">
        <div className="flex flex-wrap gap-2.5 justify-center max-w-xl mx-auto">
          {GENRES.map((g, idx) => {
            const isSelected = selectedGenres.includes(g.id)
            return (
              <motion.button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.025 }}
                whileTap={{ scale: 0.93 }}
                className={`px-5 py-[11px] rounded-full text-sm font-semibold transition-all duration-200 select-none
                  ${isSelected
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-[1.06]'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/9 hover:border-white/20 hover:text-white/80'
                  }`}
              >
                {g.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none px-6 py-4 border-t border-white/5">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-white/35 hover:text-white/65 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={onNext}
            disabled={loading || !canProceed}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
              canProceed
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/5 text-white/25 cursor-not-allowed'
            }`}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
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
  const canProceed = count >= 5
  const showTrending = trendingMovies.length > 0 && !query

  const statusText = count === 0
    ? 'Pick 5+ films you\'ve enjoyed — the more, the better'
    : count < 5
    ? `${5 - count} more to unlock recommendations`
    : count < 10
    ? 'Solid — keep adding or continue'
    : `${count} films — great taste profile`

  return (
    <div className="h-full flex flex-col min-h-0">

      {/* ── Search header ───────────────────────────────────────── */}
      <div className="flex-none px-4 sm:px-6 pt-5 pb-3">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">Films you love</h2>
            <p className="text-sm text-white/40">{statusText}</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 z-10" style={{ width: 17, height: 17 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search any film…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 focus:ring-2 focus:ring-purple-500/12 transition-all"
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
              </div>
            )}
            {query && !searching && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex-none mx-4 sm:mx-6 mb-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      {/* ── Scrollable body ──────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-3">

        {/* Search results */}
        {query && (
          <div className="max-w-xl mx-auto">
            {results.length > 0 ? (
              <div className="rounded-2xl border border-white/8 overflow-hidden bg-white/3 divide-y divide-white/5">
                {results.map((r) => {
                  const selected = isMovieSelected(r.id)
                  const canAdd = !selected && favoriteMovies.length < 50
                  const year = r.release_date?.slice(0, 4)
                  const rating = r.vote_average >= 1 ? r.vote_average.toFixed(1) : null
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        if (selected) removeMovie(r.id)
                        else if (canAdd) { addMovie(r); setQuery('') }
                      }}
                      disabled={!canAdd && !selected}
                      className={`flex w-full items-center gap-3.5 px-4 py-3 transition-all text-left group
                        ${selected ? 'bg-purple-500/8' : 'hover:bg-white/4'}
                        ${!canAdd && !selected ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {/* Poster */}
                      <div className="flex-none w-11 rounded-lg overflow-hidden bg-white/5 shadow-md" style={{ aspectRatio: '2/3' }}>
                        <img
                          src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                          alt={r.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm leading-snug truncate transition-colors ${selected ? 'text-purple-300' : 'text-white/90 group-hover:text-purple-300'}`}>
                          {r.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {year && <span className="text-xs text-white/30">{year}</span>}
                          {rating && <><span className="text-white/15 text-xs">·</span><span className="text-xs text-white/30">★ {rating}</span></>}
                        </div>
                      </div>
                      {/* Action */}
                      {selected ? (
                        <div className="flex-none w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
                          <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                        </div>
                      ) : canAdd ? (
                        <div className="flex-none w-7 h-7 rounded-full border border-white/12 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:border-purple-500/35 transition-all flex-shrink-0">
                          <span className="text-white/50 text-lg leading-none" style={{ marginTop: -2 }}>+</span>
                        </div>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : !searching ? (
              <div className="text-center py-10 text-white/30 text-sm">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : null}
          </div>
        )}

        {/* Trending poster grid */}
        {showTrending && (
          <div className="max-w-xl mx-auto">
            <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-3">
              Trending this week — tap to add
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {trendingMovies.map((m, idx) => {
                const selected = isMovieSelected(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { if (!selected) addMovie(m) }}
                    disabled={selected}
                    style={{ animationDelay: `${idx * 40}ms`, animation: 'slide-up 0.4s ease-out backwards' }}
                    className={`group relative rounded-xl overflow-hidden transition-all duration-200 ${
                      selected
                        ? 'ring-2 ring-purple-500/60 opacity-75'
                        : 'ring-1 ring-white/8 hover:ring-purple-500/40 hover:shadow-lg hover:shadow-purple-500/15 hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="aspect-[2/3]">
                      <img
                        src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                        alt={m.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Hover overlay */}
                    {!selected && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2">
                        <span className="text-[10px] font-semibold text-white leading-tight line-clamp-2">{m.title}</span>
                      </div>
                    )}
                    {/* Selected */}
                    {selected && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <Check className="h-4 w-4 text-white stroke-[2.5]" />
                        </div>
                      </div>
                    )}
                    {/* Title always below */}
                    <div className="absolute inset-x-0 bottom-0 h-10 flex items-end pb-1.5 px-1.5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                      <span className="text-[10px] font-medium text-white/70 line-clamp-1 leading-tight">{m.title}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Fallback empty state */}
        {!query && trendingMovies.length === 0 && count === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl border border-white/8 bg-white/3 flex items-center justify-center mb-4">
              <Search className="h-5 w-5 text-white/20" />
            </div>
            <p className="text-sm text-white/30 max-w-xs leading-relaxed">
              Search for films you love and we&apos;ll learn your taste from them
            </p>
          </div>
        )}

      </div>

      {/* ── Filmstrip — always-visible selected collection ──────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="flex-none border-t border-white/5 bg-black/95 backdrop-blur-sm px-4 sm:px-6 pt-3 pb-2"
          >
            {/* Progress row */}
            <div className="flex items-center gap-2 mb-2.5 max-w-xl mx-auto">
              <span className="text-[11px] font-semibold text-white/35 uppercase tracking-widest flex-shrink-0">Your picks</span>
              <div className="flex items-center gap-1 ml-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i < count ? 1 : 0.75, opacity: i < count ? 1 : 0.3 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-full transition-all duration-300 ${
                      i < count
                        ? 'w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'w-1.5 h-1.5 bg-white/20'
                    }`}
                  />
                ))}
                {count > 5 && (
                  <span className="text-[11px] font-bold text-purple-400 ml-1">+{count - 5}</span>
                )}
              </div>
              {count >= 5 && (
                <span className="ml-auto text-[11px] text-purple-400/70 font-medium">Ready to continue</span>
              )}
            </div>
            {/* Horizontal filmstrip */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none max-w-xl mx-auto pb-0.5">
              {favoriteMovies.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: idx === count - 1 ? 0 : 0 }}
                  className="group flex-none relative rounded-lg overflow-hidden ring-1 ring-white/10 hover:ring-purple-500/35 transition-all duration-200"
                  style={{ width: 44, aspectRatio: '2/3' }}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                    alt={m.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMovie(m.id)}
                    className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150"
                    aria-label={`Remove ${m.title}`}
                  >
                    <X className="h-3.5 w-3.5 text-white/90" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer buttons ───────────────────────────────────────── */}
      <div className="flex-none px-4 sm:px-6 py-4 border-t border-white/5 bg-black">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm font-medium text-white/35 hover:text-white/65 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-4">
            {!canProceed && (
              <button
                onClick={() => onFinish({ skipMovies: true })}
                disabled={loading}
                className="text-sm text-white/30 hover:text-white/55 transition-colors disabled:opacity-30"
              >
                Skip
              </button>
            )}
            <button
              onClick={onFinish}
              disabled={loading || !canProceed}
              className={`flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                canProceed
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <><Check className="h-4 w-4 stroke-[2.5]" /> Finish Setup</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
