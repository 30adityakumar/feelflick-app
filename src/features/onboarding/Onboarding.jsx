// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Check, Search, X, Loader2, ChevronRight, Film } from 'lucide-react'

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
            .slice(0, 8)
          setResults(all)
          setSearching(false)
        } catch {
          if (active) {
            setResults([])
            setSearching(false)
          }
        }
      })()
    }, 400)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [query])

  const GENRES = useMemo(
    () => [
      { id: 28, label: 'Action' },
      { id: 12, label: 'Adventure' },
      { id: 16, label: 'Animation' },
      { id: 35, label: 'Comedy' },
      { id: 80, label: 'Crime' },
      { id: 99, label: 'Documentary' },
      { id: 18, label: 'Drama' },
      { id: 10751, label: 'Family' },
      { id: 14, label: 'Fantasy' },
      { id: 36, label: 'History' },
      { id: 27, label: 'Horror' },
      { id: 10402, label: 'Music' },
      { id: 9648, label: 'Mystery' },
      { id: 10749, label: 'Romance' },
      { id: 878, label: 'Sci-Fi' },
      { id: 53, label: 'Thriller' },
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
      }).eq('user_id', user_id)
      
      await supabase.auth.updateUser({ 
        data: { onboarding_complete: true, has_onboarded: true } 
      })
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: { session: updatedSession } } = await supabase.auth.getSession()
      if (!updatedSession?.user?.user_metadata?.onboarding_complete) {
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
      }, 2000)
      
    } catch (e) {
      setError(e.message || 'Could not save your preferences.')
      setLoading(false)
    }
  }

  // Loading
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 text-white/60 animate-spin" />
      </div>
    )
  }

  // Celebration
  if (celebrate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black">
        <div className="text-center space-y-6 animate-fade-in">
          <Film className="h-16 w-16 text-white mx-auto" />
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            You're all set
          </h1>
          <p className="text-lg text-white/60">Loading your personalized experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Progress */}
        {step >= 0 && <Progress step={step} />}
        
        {/* Steps */}
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
  )
}

// Progress bar (Apple-style minimal)
function Progress({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-12">
      <div className={`h-1 w-16 rounded-full transition-all duration-500 ${step === 0 ? 'bg-white' : 'bg-white/20'}`} />
      <div className={`h-1 w-16 rounded-full transition-all duration-500 ${step === 1 ? 'bg-white' : 'bg-white/20'}`} />
    </div>
  )
}

// Welcome screen (Netflix-style minimalist)
function WelcomeStep({ onNext, name }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
          {name ? `Welcome, ${name.split(' ')[0]}` : 'Welcome'}
        </h1>
        <p className="text-xl sm:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed">
          Let's personalize your experience in two quick steps
        </p>
      </div>
      
      <button
        onClick={onNext}
        className="group mt-8 px-10 py-4 bg-white text-black text-lg font-medium rounded-full hover:bg-white/90 transition-all duration-200 flex items-center gap-2"
      >
        Get started
        <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}

// Genre selection (Plex-style clean grid)
function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onSkip }) {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Pick your favorite genres
        </h2>
        <p className="text-lg text-white/60">
          Select as many as you like
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {GENRES.map((g) => {
          const isSelected = selectedGenres.includes(g.id)
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
              className={`relative h-20 sm:h-24 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 ${
                isSelected
                  ? 'bg-white text-black scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
              }`}
            >
              {g.label}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-center items-center gap-4 pt-6">
        <button
          onClick={onSkip}
          disabled={loading}
          className="px-6 py-3 text-white/60 hover:text-white transition-colors text-base font-medium"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          disabled={loading || selectedGenres.length < 1}
          className="px-10 py-4 bg-white text-black text-base font-medium rounded-full hover:bg-white/90 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue
          {selectedGenres.length > 0 && (
            <span className="text-sm opacity-70">({selectedGenres.length})</span>
          )}
        </button>
      </div>
    </div>
  )
}

// Movie search (Prime Video-style sophisticated)
function StepMovies({
  query, setQuery, results, searching, isMovieSelected, addMovie, removeMovie, favoriteMovies,
  error, loading, searchInputRef, onBack, onFinish
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Add your favorite movies
        </h2>
        <p className="text-lg text-white/60">
          The more you add, the better your recommendations
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search movies..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-14 pr-12 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
        />
        {searching && (
          <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 animate-spin" />
        )}
      </div>

      {/* Results */}
      {query && results.length > 0 && (
        <div className="max-w-4xl mx-auto grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
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
                className={`relative group aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200 ${
                  selected ? 'ring-2 ring-white scale-95' : 'hover:scale-105'
                } ${!canAdd && !selected ? 'opacity-30' : ''}`}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w342${r.poster_path}`}
                  alt={r.title}
                  className="w-full h-full object-cover"
                />
                {selected && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!query && favoriteMovies.length === 0 && (
        <div className="text-center py-20">
          <Film className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <p className="text-lg text-white/40">Start searching to add movies</p>
        </div>
      )}

      {/* Selected movies */}
      {favoriteMovies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Your picks <span className="text-white/60">({favoriteMovies.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {favoriteMovies.map(m => (
              <div key={m.id} className="relative group aspect-[2/3] rounded-lg overflow-hidden">
                <img
                  src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                  alt={m.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeMovie(m.id)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center items-center gap-4 pt-6">
        <button
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 text-white/60 hover:text-white transition-colors text-base font-medium"
        >
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={loading}
          className="px-10 py-4 bg-white text-black text-base font-medium rounded-full hover:bg-white/90 transition-all duration-200 disabled:opacity-30"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </span>
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  )
}

// Global styles
const styles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in { animation: fade-in 0.5s ease-out; }
`
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style')
  styleTag.textContent = styles
  document.head.appendChild(styleTag)
}
