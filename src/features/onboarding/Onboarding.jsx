// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Check, Search, X, Sparkles, ArrowRight, Loader2, Star, ChevronLeft, Trash2
} from 'lucide-react'

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
  
  useEffect(() => {
    if (step === 1 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [step])

  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

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
    }, 350)
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
      }, 2000)
      
    } catch (e) {
      console.error('Onboarding save failed:', e)
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="h-screen grid place-items-center bg-[#0B1120]">
        <div className="flex flex-col items-center gap-4">
          <span className="text-3xl font-black bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
            FEELFLICK
          </span>
          <Loader2 className="h-8 w-8 text-[#667eea] animate-spin" />
        </div>
      </div>
    )
  }

  if (celebrate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]">
        <div className="text-center px-6 animate-fade-in">
          <Star className="h-20 w-20 text-white mx-auto mb-6 animate-pulse fill-current" />
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Profile Complete
          </h1>
          <p className="text-lg text-white/90">
            Preparing your personalized experience
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0B1120] flex flex-col">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#667eea]/5 via-transparent to-[#764ba2]/5 pointer-events-none" />

      {/* Main Container - Full Height, No Overflow */}
      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full">
        
        {/* Progress Bar (Pinned Top) */}
        {step >= 0 && <Progress step={step} />}
        
        {/* Step Content (Scrollable Area) */}
        <div className="flex-1 min-h-0 overflow-hidden">
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

function Progress({ step }) {
  return (
    <div className="flex-none flex items-center justify-center gap-3 py-6 px-4">
      <div className="flex flex-col items-center gap-1.5">
        <div className={`h-1 w-20 rounded-full transition-all duration-500 ${
          step === 0 
            ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' 
            : 'bg-white/10'
        }`} />
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
          step === 0 ? 'text-white' : 'text-white/30'
        }`}>
          Genres
        </span>
      </div>
      
      <div className="flex flex-col items-center gap-1.5">
        <div className={`h-1 w-20 rounded-full transition-all duration-500 ${
          step === 1 
            ? 'bg-gradient-to-r from-[#764ba2] to-[#f093fb]' 
            : 'bg-white/10'
        }`} />
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
          step === 1 ? 'text-white' : 'text-white/30'
        }`}>
          Movies
        </span>
      </div>
    </div>
  )
}

function WelcomeStep({ onNext, name }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 overflow-y-auto">
      <Sparkles className="h-12 w-12 text-[#667eea] mb-6" />
      
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
        <span className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
          {name ? `Welcome, ${name.split(' ')[0]}` : 'Welcome'}
        </span>
      </h1>
      
      <p className="text-base sm:text-lg text-white/70 max-w-md mx-auto mb-2">
        Personalize your recommendations in two quick steps
      </p>
      
      <p className="text-xs text-white/40 mb-8">
        Takes less than 2 minutes
      </p>
      
      <button
        onClick={onNext}
        className="group px-8 py-3 rounded-full bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white font-semibold text-sm hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <span className="flex items-center gap-2">
          Get Started
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>
    </div>
  )
}

function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onSkip }) {
  return (
    <div className="h-full flex flex-col px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex-none text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Select Your Favorite Genres
        </h2>
        <p className="text-sm text-white/60 mb-1">
          Choose 3-5 genres for best recommendations
        </p>
        {selectedGenres.length >= 3 && (
          <p className="text-xs text-emerald-400 font-semibold">
            Perfect selection
          </p>
        )}
      </div>

      {error && (
        <div className="flex-none max-w-md mx-auto mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center w-full">
          {error}
        </div>
      )}

      {/* Scrollable Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-w-5xl mx-auto pb-4">
          {GENRES.map((g) => {
            const isSelected = selectedGenres.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`relative h-14 rounded-xl border-2 font-semibold text-sm transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? 'border-[#667eea] bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className="flex items-center justify-center h-full px-2">
                  {g.label}
                </span>
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 bg-[#0B1120] rounded-full">
                    <div className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white stroke-[3]" />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer Actions (Pinned) */}
      <div className="flex-none py-4 border-t border-white/5 flex justify-between items-center mt-auto">
        <button
          onClick={onSkip}
          disabled={loading}
          className="text-xs text-white/30 hover:text-white/50 underline transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          disabled={loading || selectedGenres.length < 1}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : selectedGenres.length > 0 ? `Next (${selectedGenres.length})` : 'Select at least one'}
        </button>
      </div>
    </div>
  )
}

function StepMovies({
  query, setQuery, results, searching, isMovieSelected, addMovie, removeMovie, favoriteMovies,
  error, loading, searchInputRef, onBack, onFinish
}) {
  return (
    <div className="h-full flex flex-col px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex-none text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          Add Your Favorite Movies
        </h2>
        <p className="text-sm text-white/60 mb-1">
          Add 5-10 movies for personalized recommendations
        </p>
        {favoriteMovies.length >= 5 && (
          <p className="text-xs text-[#667eea] font-semibold">
            {favoriteMovies.length} movies added
          </p>
        )}
      </div>

      {error && (
        <div className="flex-none max-w-md mx-auto mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center w-full">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex-none relative max-w-2xl mx-auto mb-4 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search movies (e.g., Inception)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-[#667eea]/30 bg-white/5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 transition-all"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 text-[#667eea] animate-spin" />
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2 custom-scrollbar relative">
        
        {/* Empty State */}
        {!query && favoriteMovies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Search className="h-12 w-12 mb-3" />
            <p className="text-sm">Start typing to search for movies</p>
          </div>
        )}

        {/* Search Results Dropdown */}
        {query && results.length > 0 && (
          <div className="max-w-3xl mx-auto rounded-xl bg-[#0f172a] border border-white/10 overflow-hidden shadow-2xl mb-6 sticky top-0 z-20">
            {results.map((r) => {
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
                  className={`flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-left ${
                    selected ? 'bg-[#667eea]/10' : ''
                  } ${!canAdd && !selected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                    alt={r.title}
                    className="w-10 h-15 rounded-md object-cover flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{r.title}</div>
                    <div className="text-xs text-white/50">{r.release_date?.slice(0, 4) || 'N/A'}</div>
                  </div>
                  {selected ? (
                    <div className="bg-emerald-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white stroke-[3]" />
                    </div>
                  ) : canAdd ? (
                    <span className="text-xs font-bold text-[#667eea] uppercase tracking-wide">Add</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {/* Selected Collection Grid */}
        {favoriteMovies.length > 0 && (
          <div className="max-w-5xl mx-auto pb-6">
            <div className="sticky top-0 z-10 bg-[#0B1120]/95 backdrop-blur-sm py-2 mb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Your Collection
                <span className="text-xs font-normal text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                  {favoriteMovies.length} / 50
                </span>
              </h3>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {favoriteMovies.map((m) => (
                <div key={m.id} className="relative group aspect-[2/3] rounded-lg overflow-hidden shadow-lg ring-1 ring-white/10">
                  <img
                    src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                    alt={m.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Remove Overlay - Always accessible on touch, hover on desktop */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeMovie(m.id)
                      }}
                      className="h-8 w-8 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center shadow-lg transform hover:scale-110 transition-all"
                      title="Remove movie"
                    >
                      <X className="h-4 w-4 text-white stroke-[3]" />
                    </button>
                    <span className="text-[10px] font-medium text-white/90 px-2 text-center line-clamp-2">
                      {m.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions (Pinned) */}
      <div className="flex-none py-4 border-t border-white/5 flex justify-between items-center mt-auto bg-[#0B1120]">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={loading}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving
            </span>
          ) : (
            'Complete Setup'
          )}
        </button>
      </div>
    </div>
  )
}
