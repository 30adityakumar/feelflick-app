// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Check, Search, X, Sparkles, ArrowRight, Loader2, Star, ChevronLeft, Undo2, TrendingUp } from 'lucide-react'

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
  const [recentlyRemoved, setRecentlyRemoved] = useState(null)
  const [trendingMovies, setTrendingMovies] = useState([])

  const searchInputRef = useRef(null)
  
  // Auto-focus search input
  useEffect(() => {
    if (step === 1 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [step])

  // Load trending movies for empty state
  useEffect(() => {
    if (step === 1 && trendingMovies.length === 0) {
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`)
        .then(r => r.json())
        .then(data => {
          const movies = (data.results || [])
            .filter(m => m.poster_path)
            .slice(0, 12)
          setTrendingMovies(movies)
        })
        .catch(console.error)
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

  // Debounced movie search
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
            .slice(0, 12)
          setResults(all)
          setSearching(false)
        } catch {
          if (active) {
            setResults([])
            setSearching(false)
          }
        }
      })()
    }, 350)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [query])

  const GENRES = useMemo(
    () => [
      { id: 28, label: 'Action', icon: '💥', examples: 'Die Hard, Mad Max' },
      { id: 12, label: 'Adventure', icon: '🗺️', examples: 'Indiana Jones, LOTR' },
      { id: 16, label: 'Animation', icon: '🎨', examples: 'Pixar, Studio Ghibli' },
      { id: 35, label: 'Comedy', icon: '😂', examples: 'The Hangover, Superbad' },
      { id: 80, label: 'Crime', icon: '🔫', examples: 'Godfather, Heat' },
      { id: 99, label: 'Documentary', icon: '📽️', examples: 'Planet Earth, 13th' },
      { id: 18, label: 'Drama', icon: '🎭', examples: 'Shawshank, Forrest Gump' },
      { id: 10751, label: 'Family', icon: '👨‍👩‍👧', examples: 'Toy Story, Matilda' },
      { id: 14, label: 'Fantasy', icon: '🧙', examples: 'Harry Potter, Pan\'s Labyrinth' },
      { id: 36, label: 'History', icon: '📜', examples: '1917, Lincoln' },
      { id: 27, label: 'Horror', icon: '👻', examples: 'The Conjuring, Hereditary' },
      { id: 10402, label: 'Music', icon: '🎵', examples: 'Whiplash, La La Land' },
      { id: 9648, label: 'Mystery', icon: '🔍', examples: 'Knives Out, Gone Girl' },
      { id: 10749, label: 'Romance', icon: '💕', examples: 'Notebook, Pride & Prejudice' },
      { id: 878, label: 'Sci-Fi', icon: '🚀', examples: 'Interstellar, Blade Runner' },
      { id: 53, label: 'Thriller', icon: '😱', examples: 'Se7en, Prisoners' },
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
  
  const removeMovie = (id) => {
    const removed = favoriteMovies.find(m => m.id === id)
    if (removed) {
      setRecentlyRemoved(removed)
      setTimeout(() => setRecentlyRemoved(null), 5000)
    }
    setFavoriteMovies(prev => prev.filter(m => m.id !== id))
  }

  const undoRemove = () => {
    if (recentlyRemoved) {
      setFavoriteMovies(prev => [...prev, recentlyRemoved])
      setRecentlyRemoved(null)
    }
  }

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
      
      if (!opts.skipGenres && selectedGenres.length) {
        await supabase.from('user_preferences').delete().eq('user_id', user_id)
        const rows = selectedGenres.map(genre_id => ({ user_id, genre_id }))
        await supabase.from('user_preferences').upsert(rows, { onConflict: 'user_id,genre_id' })
      }
      
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
      
      await supabase.from('users').update({
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      }).eq('id', user_id)
      
      await supabase.auth.updateUser({ 
        data: { onboarding_complete: true, has_onboarded: true } 
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
      
      setTimeout(() => {
        navigate('/home', { 
          replace: true, 
          state: { fromOnboarding: true } 
        })
      }, 2400)
      
    } catch (e) {
      console.error('Onboarding save failed:', e)
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
    }
  }

  // Loading spinner
  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017]">
        <div className="flex flex-col items-center gap-6">
          <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent animate-pulse">
            FEELFLICK
          </span>
          <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
        </div>
      </div>
    )
  }

  // Celebration
  if (celebrate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-amber-900 overflow-hidden">
        <ConfettiRain />
        <div className="relative z-10 text-center px-6 animate-fade-in">
          <div className="mb-8">
            <Star className="h-28 w-28 sm:h-32 sm:w-32 text-amber-300 mx-auto animate-bounce fill-current drop-shadow-2xl" />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent mb-6 animate-slide-up drop-shadow-lg">
            {favoriteMovies.length >= 10 
              ? "Wow! You're a true cinephile!" 
              : favoriteMovies.length >= 5
              ? "You're All Set!"
              : "Great Start!"}
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 font-medium animate-slide-up mb-4" style={{ animationDelay: '0.15s' }}>
            {selectedGenres.length > 0 && `${selectedGenres.length} genres`}
            {selectedGenres.length > 0 && favoriteMovies.length > 0 && " • "}
            {favoriteMovies.length > 0 && `${favoriteMovies.length} movies`}
          </p>
          <p className="text-lg text-white/80 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Time to discover your perfect movie night ✨
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017] overflow-hidden">
      {/* Animated background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-1/4 -left-1/4 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-20 bg-gradient-radial from-purple-500/40 to-transparent animate-float" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[80vmin] w-[80vmin] rounded-full blur-3xl opacity-20 bg-gradient-radial from-pink-500/30 to-transparent animate-float-delayed" />
      </div>

      {/* Undo toast */}
      {recentlyRemoved && (
        <div className="fixed bottom-6 right-6 z-50 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl p-4 shadow-2xl animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">Removed</p>
              <p className="text-white/70 text-sm truncate max-w-[200px]">{recentlyRemoved.title}</p>
            </div>
            <button
              onClick={undoRemove}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </button>
          </div>
        </div>
      )}

      <div className="relative h-full flex flex-col max-w-7xl mx-auto w-full">
        {/* Progress */}
        {step >= 0 && <Progress step={step} />}
        
        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 md:px-12">
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
              trendingMovies={trendingMovies}
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

// Progress bar with labels
function Progress({ step }) {
  return (
    <div className="flex items-center justify-center gap-6 pt-8 pb-6">
      <div className="flex flex-col items-center gap-2">
        <div className={`h-2 w-28 sm:w-36 rounded-full transition-all duration-700 ${
          step === 0 
            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-pink-600 shadow-2xl shadow-purple-500/60 scale-110' 
            : 'bg-white/5'
        }`} />
        <span className={`text-xs font-semibold transition-colors duration-300 ${
          step === 0 ? 'text-white' : 'text-white/40'
        }`}>
          Genres
        </span>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className={`h-2 w-28 sm:w-36 rounded-full transition-all duration-700 ${
          step === 1 
            ? 'bg-gradient-to-r from-pink-500 via-amber-400 to-amber-500 shadow-2xl shadow-pink-500/60 scale-110' 
            : 'bg-white/5'
        }`} />
        <span className={`text-xs font-semibold transition-colors duration-300 ${
          step === 1 ? 'text-white' : 'text-white/40'
        }`}>
          Movies
        </span>
      </div>
    </div>
  )
}

// Welcome screen with trust signals
function WelcomeStep({ onNext, name }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] text-center px-6 animate-fade-in">
      <div className="mb-10">
        <Sparkles className="h-24 w-24 sm:h-28 sm:w-28 text-purple-400 mx-auto animate-pulse-slow drop-shadow-2xl" />
      </div>
      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-7 animate-slide-up leading-tight">
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
          {name ? `Welcome, ${name.split(' ')[0]}! 🎬` : 'Welcome! 🎬'}
        </span>
      </h1>
      <p className="text-xl sm:text-2xl md:text-3xl text-white/80 max-w-3xl mx-auto mb-4 font-medium leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
        Let's find your perfect movie match in just two quick steps.
      </p>
      <p className="text-base sm:text-lg text-white/50 mb-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        2 minutes • Skip anytime
      </p>
      <p className="text-sm text-white/40 mb-12 animate-slide-up" style={{ animationDelay: '0.17s' }}>
        Join 10,000+ movie lovers finding their perfect watch
      </p>
      <button
        onClick={onNext}
        className="group relative px-12 py-5 sm:px-16 sm:py-6 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white font-bold text-xl sm:text-2xl shadow-2xl hover:shadow-purple-500/60 transition-all duration-500 hover:scale-105 active:scale-95 animate-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        <span className="flex items-center gap-4">
          Get started
          <ArrowRight className="h-6 w-6 sm:h-7 sm:w-7 group-hover:translate-x-2 transition-transform duration-300" />
        </span>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
      </button>
    </div>
  )
}

// Genre selection with smarter guidance
function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onSkip }) {
  const getGuidanceText = () => {
    const count = selectedGenres.length
    if (count === 0) return "Select 3-5 genres for best results"
    if (count === 1) return "Great start! Add 2-4 more for better recommendations"
    if (count === 2) return "Almost there! Add 1-3 more"
    if (count >= 3 && count < 6) return "Perfect! That's enough (or keep going)"
    if (count >= 6) return "Wow! You love variety 🎉"
    return ""
  }

  return (
    <div className="max-w-6xl mx-auto py-10 sm:py-16 animate-fade-in">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 leading-tight">
          Pick your favorite genres
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-4">
          Select as many as you like—the more you choose, the better we understand your taste.
        </p>
        <p className="text-sm sm:text-base text-white/50 font-medium">
          {getGuidanceText()}
        </p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-300 text-base text-center font-medium animate-shake backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-12">
        {GENRES.map((g, idx) => {
          const isSelected = selectedGenres.includes(g.id)
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
              title={g.examples}
              className={`group relative h-24 sm:h-28 md:h-32 rounded-3xl border-3 font-bold text-base sm:text-lg md:text-xl transition-all duration-400 active:scale-95 ${
                isSelected
                  ? 'border-transparent bg-gradient-to-br from-purple-500/50 via-pink-500/40 to-pink-600/50 text-white shadow-2xl shadow-purple-500/40 scale-105 backdrop-blur-md'
                  : 'border-white/10 bg-white/5 text-white/90 hover:bg-white/10 hover:border-white/25 hover:scale-102 backdrop-blur-sm'
              }`}
              style={{ animationDelay: `${idx * 0.025}s` }}
            >
              <span className="flex flex-col items-center justify-center h-full gap-2">
                <span className="text-3xl sm:text-4xl md:text-5xl drop-shadow-lg">{g.icon}</span>
                <span className="drop-shadow-md">{g.label}</span>
              </span>
              {isSelected && (
                <div className="absolute -top-3 -right-3">
                  <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-full p-2 shadow-2xl animate-bounce-in">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white stroke-[3]" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-between items-center max-w-4xl mx-auto pt-4">
        <button
          onClick={onSkip}
          disabled={loading}
          className="text-sm text-white/30 hover:text-white/50 underline transition-colors disabled:opacity-50"
        >
          Skip this step
        </button>
        <button
          onClick={onNext}
          disabled={loading || selectedGenres.length < 1}
          className="px-10 sm:px-14 py-4 sm:py-5 rounded-full bg-gradient-to-r from-pink-500 via-pink-600 to-amber-500 text-white font-bold text-lg sm:text-xl shadow-2xl hover:shadow-pink-500/60 transition-all duration-400 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : selectedGenres.length > 0 ? `Next (${selectedGenres.length})` : 'Select at least one'}
        </button>
      </div>
    </div>
  )
}

// Movie search with trending movies
function StepMovies({
  query, setQuery, results, searching, isMovieSelected, addMovie, removeMovie, favoriteMovies,
  trendingMovies, error, loading, searchInputRef, onBack, onFinish
}) {
  const getGuidanceText = () => {
    const count = favoriteMovies.length
    if (count === 0) return "Add 5-10 movies you love for personalized recommendations"
    if (count < 5) return `${5 - count} more to unlock great recommendations!`
    if (count >= 5 && count < 10) return "Great! You can add more or finish now"
    if (count >= 10) return "Amazing collection! 🎬"
    return ""
  }

  return (
    <div className="max-w-6xl mx-auto py-10 sm:py-16 animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 leading-tight">
          Add your favorite movies
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-4">
          Search and add movies you love. The more you add, the smarter your recommendations become! 🎯
        </p>
        <p className="text-sm sm:text-base text-white/50 font-medium">
          {getGuidanceText()}
        </p>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-300 text-base text-center font-medium animate-shake backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Search input */}
      <div className="relative max-w-3xl mx-auto mb-10">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/50" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Type to search movies... (e.g., Inception)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-16 pr-6 py-5 sm:py-6 rounded-2xl border-3 border-pink-400/40 bg-white/8 backdrop-blur-md text-lg sm:text-xl text-white placeholder-white/50 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/30 transition-all shadow-2xl font-medium"
        />
        {searching && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <Loader2 className="h-6 w-6 text-pink-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Trending movies as starter */}
      {!query && favoriteMovies.length === 0 && trendingMovies.length > 0 && (
        <div className="max-w-5xl mx-auto mb-10">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Trending This Week</h3>
            <span className="text-sm text-white/50">Click to add</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {trendingMovies.map((m) => {
              const selected = isMovieSelected(m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => !selected && addMovie(m)}
                  disabled={selected}
                  className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
                    selected ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
                  }`}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                    alt={m.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  {selected && (
                    <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-sm flex items-center justify-center">
                      <Check className="h-8 w-8 text-white stroke-[3]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                    <span className="text-white text-xs font-bold truncate">{m.title}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Search results */}
      {query && results.length > 0 && (
        <div className="max-w-4xl mx-auto mb-10 rounded-3xl bg-white/5 backdrop-blur-md border-2 border-white/10 overflow-hidden shadow-2xl">
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {results.map((r, idx) => {
              const selected = isMovieSelected(r.id)
              const canAdd = !selected && favoriteMovies.length < 50
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    if (selected) removeMovie(r.id)
                    else if (canAdd) addMovie(r)
                  }}
                  disabled={!canAdd && !selected}
                  className={`flex w-full items-center gap-5 px-6 py-5 hover:bg-white/10 transition-all duration-300 border-b border-white/5 last:border-0 ${
                    selected ? 'bg-emerald-500/10' : ''
                  } ${!canAdd && !selected ? 'opacity-50 cursor-not-allowed' : 'active:bg-white/15'}`}
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w185${r.poster_path}`}
                    alt={r.title}
                    className="w-16 h-24 sm:w-20 sm:h-30 rounded-xl object-cover shadow-xl flex-shrink-0 ring-2 ring-white/10"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-bold text-white text-lg sm:text-xl mb-1 truncate">{r.title}</div>
                    <div className="text-sm sm:text-base text-white/60 font-medium">{r.release_date?.slice(0, 4) || 'Unknown'}</div>
                  </div>
                  {selected ? (
                    <div className="bg-emerald-500 rounded-full p-2.5 flex-shrink-0 shadow-lg">
                      <Check className="h-5 w-5 text-white stroke-[3]" />
                    </div>
                  ) : canAdd ? (
                    <span className="text-base font-bold text-pink-400 flex-shrink-0 px-4">Add</span>
                  ) : (
                    <span className="text-xs text-white/40 flex-shrink-0">Limit reached</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* No results */}
      {query && !searching && results.length === 0 && (
        <div className="text-center py-12 text-white/60 text-lg font-medium">
          No movies found. Try a different search term!
        </div>
      )}

      {/* Selected movies grid */}
      {favoriteMovies.length > 0 && (
        <div className="max-w-6xl mx-auto mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span className="text-3xl">🎬</span> Your Collection
              <span className="text-lg sm:text-xl font-semibold text-white/60">({favoriteMovies.length}/50)</span>
            </h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-5">
            {favoriteMovies.map((m, idx) => (
              <div key={m.id} className="relative group animate-scale-in" style={{ animationDelay: `${idx * 0.04}s` }}>
                <img
                  src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                  alt={m.title}
                  className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl ring-2 ring-white/10 group-hover:ring-pink-400/60 transition-all duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => removeMovie(m.id)}
                  className="absolute -top-2.5 -right-2.5 h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 z-10 ring-2 ring-white/20"
                  aria-label={`Remove ${m.title}`}
                >
                  <X className="h-5 w-5 text-white stroke-[3]" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-end p-3">
                  <span className="text-white text-xs sm:text-sm font-bold truncate drop-shadow-lg">{m.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center max-w-4xl mx-auto pt-6">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-4 text-base sm:text-lg font-semibold text-white/60 hover:text-white/90 transition-all duration-300 disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={loading}
          className="px-12 sm:px-16 py-4 sm:py-5 rounded-full bg-gradient-to-r from-pink-500 via-pink-600 to-amber-500 text-white font-bold text-lg sm:text-xl shadow-2xl hover:shadow-pink-500/60 transition-all duration-400 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
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

// Confetti animation (unchanged)
function ConfettiRain() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-8 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              backgroundColor: ['#a855f7', '#ec4899', '#f59e0b', '#3b82f6', '#10b981'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2.5 + Math.random() * 2}s`,
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
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
        @keyframes float-delayed { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-40px); } }
        .animate-float { animation: float 10s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 12s ease-in-out infinite 1.5s; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.8s ease-out backwards; }
        @keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scale-in 0.5s ease-out backwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(1.08); } }
        .animate-pulse-slow { animation: pulse-slow 3.5s ease-in-out infinite; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
        .border-3 { border-width: 3px; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(236, 72, 153, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(236, 72, 153, 0.7); }
      `}</style>
    </>
  )
}
