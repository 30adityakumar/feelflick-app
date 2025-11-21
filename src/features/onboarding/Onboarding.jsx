// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Check, Search, X, Sparkles, ArrowRight, Loader2, Star } from 'lucide-react'

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function Onboarding() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(-1) // -1 = welcome, 0 = genres, 1 = movies
  const [selectedGenres, setSelectedGenres] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [celebrate, setCelebrate] = useState(false)

  const searchInputRef = useRef(null)
  
  // Auto-focus search input
  useEffect(() => {
    if (step === 1 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [step])

  // Auth/session
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Check onboarding completion
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

  // Debounced movie search with loading state
  useEffect(() => {
    let active = true
    let timeout
    if (!query) {
      setResults([])
      setSearching(false)
      return
    }
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
            .slice(0, 10)
          setResults(all)
          setSearching(false)
        } catch {
          if (active) {
            setResults([])
            setSearching(false)
          }
        }
      })()
    }, 300) // Debounce
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [query])

  const GENRES = useMemo(
    () => [
      { id: 28, label: 'Action', icon: '💥' },
      { id: 12, label: 'Adventure', icon: '🗺️' },
      { id: 16, label: 'Animation', icon: '🎨' },
      { id: 35, label: 'Comedy', icon: '😂' },
      { id: 80, label: 'Crime', icon: '🔫' },
      { id: 99, label: 'Documentary', icon: '📽️' },
      { id: 18, label: 'Drama', icon: '🎭' },
      { id: 10751, label: 'Family', icon: '👨‍👩‍👧' },
      { id: 14, label: 'Fantasy', icon: '🧙' },
      { id: 36, label: 'History', icon: '📜' },
      { id: 27, label: 'Horror', icon: '👻' },
      { id: 10402, label: 'Music', icon: '🎵' },
      { id: 9648, label: 'Mystery', icon: '🔍' },
      { id: 10749, label: 'Romance', icon: '💕' },
      { id: 878, label: 'Sci-Fi', icon: '🚀' },
      { id: 53, label: 'Thriller', icon: '😱' },
    ],
    []
  )

  const toggleGenre = (id) => setSelectedGenres(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])
  const isMovieSelected = (id) => favoriteMovies.some(x => x.id === id)
  const addMovie = (m) => {
    if (!isMovieSelected(m.id) && favoriteMovies.length < 50) {
      setFavoriteMovies(prev => [...prev, m])
    }
  }
  const removeMovie = (id) => setFavoriteMovies(prev => prev.filter(m => m.id !== id))

  async function ensureUserRowOrFail(user) {
    const { data: existing } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
    if (existing) return true
    const { error } = await supabase.from('users').insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
    })
    if (error) throw new Error('Could not create your profile')
    return true
  }

  async function saveAndGo(opts = {}) {
    setError('')
    setLoading(true)
    try {
      const user_id = session?.user?.id
      if (!user_id) throw new Error('No authenticated user.')
      await ensureUserRowOrFail(session.user)
      
      // Save genres
      if (!opts.skipGenres && selectedGenres.length) {
        await supabase.from('user_preferences').delete().eq('user_id', user_id)
        const rows = selectedGenres.map(genre_id => ({ user_id, genre_id }))
        await supabase.from('user_preferences').upsert(rows, { onConflict: 'user_id,genre_id' })
      }
      
      // Save movies
      if (!opts.skipMovies && favoriteMovies.length) {
        const rows = favoriteMovies.map(m => ({
          user_id,
          movie_id: m.id,
          title: m.title ?? null,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          release_date: m.release_date ?? null,
          vote_average: typeof m.vote_average === 'number' ? m.vote_average : null,
          genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids : null,
        }))
        await Promise.all(rows.map(row =>
          supabase.from('movies_watched').upsert(row, { onConflict: 'user_id,movie_id' })
        ))
      }
      
      // Mark complete
      await supabase.from('users').update({
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      }).eq('id', user_id)
      await supabase.auth.updateUser({ data: { onboarding_complete: true, has_onboarded: true } })
      
      setLoading(false)
      setCelebrate(true)
      setTimeout(() => navigate('/home', { replace: true, state: { fromOnboarding: true } }), 2200)
    } catch (e) {
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
    }
  }

  // Loading spinner
  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017]">
        <div className="flex flex-col items-center gap-4">
          <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent animate-pulse">
            FEELFLICK
          </span>
          <Loader2 className="h-8 w-8 text-white/90 animate-spin" />
          <span className="text-sm text-white/70">Loading your profile…</span>
        </div>
      </div>
    )
  }

  // Celebration
  if (celebrate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-amber-900 overflow-hidden">
        <ConfettiRain />
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <div className="mb-6">
            <Star className="h-20 w-20 sm:h-24 sm:w-24 text-amber-400 mx-auto animate-bounce fill-current" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-transparent mb-4 animate-slide-up">
            You're All Set!
          </h1>
          <p className="text-lg sm:text-xl text-white/90 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Time to discover your next favorite movie ✨
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017] overflow-hidden">
      {/* Animated background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[50vmin] w-[50vmin] rounded-full blur-3xl opacity-20 bg-gradient-radial from-purple-500/30 to-transparent animate-float" />
        <div className="absolute -bottom-44 -right-44 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-20 bg-gradient-radial from-pink-500/25 to-transparent animate-float-delayed" />
      </div>

      <div className="relative h-full flex flex-col max-w-6xl mx-auto w-full">
        {/* Progress */}
        {step >= 0 && <Progress step={step} />}
        
        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          {step === -1 && <WelcomeStep onNext={() => setStep(0)} name={session?.user?.user_metadata?.name} />}
          {step === 0 && (
            <StepGenres
              GENRES={GENRES}
              selectedGenres={selectedGenres}
              toggleGenre={toggleGenre}
              error={error}
              loading={loading}
              onNext={() => setStep(1)}
              onSkip={() => setStep(1)}
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
              error={error}
              loading={loading}
              searchInputRef={searchInputRef}
              onBack={() => setStep(0)}
              onFinish={saveAndGo}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Progress bar
function Progress({ step }) {
  return (
    <div className="flex items-center justify-center gap-3 pt-6 pb-4">
      <div className={`h-1.5 w-24 rounded-full transition-all duration-500 ${
        step === 0 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50' 
          : 'bg-white/10'
      }`} />
      <div className={`h-1.5 w-24 rounded-full transition-all duration-500 ${
        step === 1 
          ? 'bg-gradient-to-r from-pink-500 to-amber-400 shadow-lg shadow-pink-500/50' 
          : 'bg-white/10'
      }`} />
    </div>
  )
}

// Welcome screen
function WelcomeStep({ onNext, name }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4 animate-fade-in">
      <div className="mb-6">
        <Sparkles className="h-16 w-16 sm:h-20 sm:w-20 text-purple-400 mx-auto animate-pulse-slow" />
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 animate-slide-up">
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
          {name ? `Welcome, ${name}!` : 'Welcome!'}
        </span>
      </h1>
      <p className="text-lg sm:text-xl text-white/70 max-w-xl mx-auto mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
        Let's personalize your recommendations in just two quick steps.
        <br />
        <span className="text-white/50 text-base">Perfect movie nights start here! 🎬</span>
      </p>
      <button
        onClick={onNext}
        className="group relative px-10 py-4 sm:px-12 sm:py-5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white font-bold text-lg sm:text-xl shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 animate-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        <span className="flex items-center gap-3">
          Get started
          <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
        </span>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
      </button>
    </div>
  )
}

// Genre selection
function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onSkip }) {
  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
          Pick your favorite genres
        </h2>
        <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
          Select as many as you like—the more you choose, the better we understand your taste.
        </p>
        {selectedGenres.length >= 3 && (
          <p className="mt-3 text-sm sm:text-base text-green-400 font-semibold animate-bounce">
            ✨ Great selection! You're on fire!
          </p>
        )}
      </div>

      {error && (
        <div className="max-w-lg mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-shake">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {GENRES.map((g, idx) => {
          const isSelected = selectedGenres.includes(g.id)
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
              className={`group relative h-16 sm:h-20 rounded-2xl border-2 font-bold text-sm sm:text-base transition-all duration-300 active:scale-95 ${
                isSelected
                  ? 'border-purple-400 bg-gradient-to-br from-purple-500/40 to-pink-500/30 text-white shadow-xl shadow-purple-500/30 scale-105'
                  : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20 hover:scale-102'
              }`}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <span className="flex flex-col items-center justify-center h-full gap-1">
                <span className="text-xl sm:text-2xl">{g.icon}</span>
                <span>{g.label}</span>
              </span>
              {isSelected && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-1.5 shadow-lg animate-bounce-in">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-between items-center max-w-2xl mx-auto">
        <button
          onClick={onSkip}
          disabled={loading}
          className="px-6 py-3 text-sm sm:text-base font-semibold text-white/50 hover:text-white transition-colors disabled:opacity-50"
        >
          Skip for now
        </button>
        <button
          onClick={onNext}
          disabled={loading || selectedGenres.length < 1}
          className="px-8 sm:px-10 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-amber-400 text-white font-bold text-base sm:text-lg shadow-xl hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : selectedGenres.length > 0 ? `Next (${selectedGenres.length})` : 'Select at least one'}
        </button>
      </div>
    </div>
  )
}

// Movie search
function StepMovies({
  query, setQuery, results, searching, isMovieSelected, addMovie, removeMovie, favoriteMovies,
  error, loading, searchInputRef, onBack, onFinish
}) {
  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
          Add your favorite movies
        </h2>
        <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
          Search and add movies you love. The more you add, the smarter your recommendations become! 🎯
        </p>
        {favoriteMovies.length >= 5 && (
          <p className="mt-3 text-sm sm:text-base text-purple-400 font-semibold animate-pulse">
            🔥 {favoriteMovies.length} movies added—you're building an amazing profile!
          </p>
        )}
      </div>

      {error && (
        <div className="max-w-lg mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-shake">
          {error}
        </div>
      )}

      {/* Search input */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Type to search movies... (e.g., Inception)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-14 pr-5 py-4 sm:py-5 rounded-2xl border-2 border-pink-500/30 bg-white/5 backdrop-blur-sm text-base sm:text-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 transition-all shadow-lg"
        />
        {searching && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <Loader2 className="h-5 w-5 text-pink-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Empty state */}
      {!query && favoriteMovies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4">
            <Search className="h-16 w-16 text-pink-300/50 mx-auto" />
          </div>
          <p className="text-base sm:text-lg text-white/60 max-w-md">
            Start typing above to find your favorite movies!
          </p>
        </div>
      )}

      {/* Results */}
      {query && results.length > 0 && (
        <div className="max-w-3xl mx-auto mb-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden shadow-2xl max-h-96 overflow-y-auto">
          {results.map(r => {
            const selected = isMovieSelected(r.id)
            const canAdd = !selected && favoriteMovies.length < 50
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  if (selected) removeMovie(r.id)
                  else if (canAdd) {
                    addMovie(r)
                    setQuery('')
                  }
                }}
                disabled={!canAdd && !selected}
                className="flex w-full items-center gap-4 px-5 py-4 hover:bg-white/10 transition-all active:bg-white/15 disabled:opacity-50"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w154${r.poster_path}`}
                  alt={r.title}
                  className="w-14 h-21 rounded-lg object-cover shadow-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-bold text-white text-base sm:text-lg truncate">{r.title}</div>
                  <div className="text-sm text-white/60">{r.release_date?.slice(0, 4) || 'Unknown'}</div>
                </div>
                {selected ? (
                  <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                ) : canAdd ? (
                  <span className="text-sm font-semibold text-pink-400 flex-shrink-0">Add</span>
                ) : (
                  <span className="text-xs text-white/40 flex-shrink-0">Limit reached</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {query && !searching && results.length === 0 && (
        <div className="text-center py-8 text-white/60">
          No movies found. Try a different search term!
        </div>
      )}

      {/* Selected movies grid */}
      {favoriteMovies.length > 0 && (
        <div className="max-w-5xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              🎬 Your Collection
              <span className="text-sm sm:text-base font-normal text-white/60">({favoriteMovies.length}/50)</span>
            </h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {favoriteMovies.map(m => (
              <div key={m.id} className="relative group animate-scale-in">
                <img
                  src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                  alt={m.title}
                  className="w-full aspect-[2/3] object-cover rounded-xl shadow-xl ring-2 ring-white/10 group-hover:ring-pink-400/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeMovie(m.id)}
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all active:scale-90 z-10"
                  aria-label={`Remove ${m.title}`}
                >
                  <X className="h-4 w-4 text-white" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-2">
                  <span className="text-white text-xs font-semibold truncate">{m.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center max-w-2xl mx-auto pt-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 text-sm sm:text-base font-semibold text-white/60 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={loading}
          className="px-10 sm:px-12 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-amber-400 text-white font-bold text-base sm:text-lg shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </span>
          ) : (
            'Finish & Start Watching'
          )}
        </button>
      </div>
    </div>
  )
}

// Confetti animation
function ConfettiRain() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-6 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              backgroundColor: ['#a855f7', '#ec4899', '#f59e0b', '#3b82f6'][Math.floor(Math.random() * 4)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti linear infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes float-delayed { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite 1s; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.6s ease-out backwards; }
        @keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .hover\:scale-102:hover { transform: scale(1.02); }
      `}</style>
    </>
  )
}
