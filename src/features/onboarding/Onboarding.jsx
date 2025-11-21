// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Check, Search, X, Sparkles, ArrowRight, Loader2, Star, ChevronLeft,
  Zap, Map, Palette, Laugh, Shield, Camera, Drama, Users, Wand2,
  BookOpen, Ghost, Music, Eye, Heart, Rocket, Flame
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
      { id: 28, label: 'Action', Icon: Zap },
      { id: 12, label: 'Adventure', Icon: Map },
      { id: 16, label: 'Animation', Icon: Palette },
      { id: 35, label: 'Comedy', Icon: Laugh },
      { id: 80, label: 'Crime', Icon: Shield },
      { id: 99, label: 'Documentary', Icon: Camera },
      { id: 18, label: 'Drama', Icon: Drama },
      { id: 10751, label: 'Family', Icon: Users },
      { id: 14, label: 'Fantasy', Icon: Wand2 },
      { id: 36, label: 'History', Icon: BookOpen },
      { id: 27, label: 'Horror', Icon: Ghost },
      { id: 10402, label: 'Music', Icon: Music },
      { id: 9648, label: 'Mystery', Icon: Eye },
      { id: 10749, label: 'Romance', Icon: Heart },
      { id: 878, label: 'Sci-Fi', Icon: Rocket },
      { id: 53, label: 'Thriller', Icon: Flame },
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
    <div className="fixed inset-0 bg-[#0B1120] overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#667eea]/5 via-transparent to-[#764ba2]/5" />

      <div className="relative h-full flex flex-col max-w-7xl mx-auto w-full">
        {/* Compact Progress */}
        {step >= 0 && <Progress step={step} />}
        
        {/* Steps - NO OVERFLOW */}
        <div className="flex-1 flex flex-col px-4 sm:px-6 md:px-8">
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
    <div className="flex items-center justify-center gap-3 py-4">
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
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8">
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
    <div className="flex-1 flex flex-col py-4 max-h-full">
      <div className="text-center mb-4">
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
        <div className="max-w-md mx-auto mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-w-5xl mx-auto">
          {GENRES.map((g) => {
            const isSelected = selectedGenres.includes(g.id)
            const Icon = g.Icon
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`relative h-16 sm:h-18 rounded-xl border-2 font-semibold text-xs sm:text-sm transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? 'border-[#667eea] bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className="flex flex-col items-center justify-center h-full gap-1">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>{g.label}</span>
                </span>
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5">
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

      <div className="flex justify-between items-center pt-3 border-t border-white/5">
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
    <div className="flex-1 flex flex-col py-4 max-h-full">
      <div className="text-center mb-4">
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
        <div className="max-w-md mx-auto mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      <div className="relative max-w-2xl mx-auto mb-3 w-full">
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

      <div className="flex-1 overflow-y-auto mb-3">
        {!query && favoriteMovies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Search className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-sm text-white/50">
              Start typing to search for movies
            </p>
          </div>
        )}

        {query && results.length > 0 && (
          <div className="max-w-3xl mx-auto rounded-xl bg-white/5 border border-white/10 overflow-hidden">
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
                  className={`flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-all border-b border-white/5 last:border-0 ${
                    selected ? 'bg-emerald-500/10' : ''
                  } ${!canAdd && !selected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                    alt={r.title}
                    className="w-10 h-15 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-white text-sm truncate">{r.title}</div>
                    <div className="text-xs text-white/50">{r.release_date?.slice(0, 4) || 'N/A'}</div>
                  </div>
                  {selected ? (
                    <div className="bg-emerald-500 rounded-full p-1.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-white stroke-[3]" />
                    </div>
                  ) : canAdd ? (
                    <span className="text-xs font-semibold text-[#667eea] flex-shrink-0">Add</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {query && !searching && results.length === 0 && (
          <div className="text-center py-8 text-white/50 text-sm">
            No movies found
          </div>
        )}

        {favoriteMovies.length > 0 && (
          <div className="max-w-5xl mx-auto mt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Your Collection
                <span className="text-xs font-normal text-white/50">({favoriteMovies.length}/50)</span>
              </h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {favoriteMovies.map((m) => (
                <div key={m.id} className="relative group">
                  <img
                    src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                    alt={m.title}
                    className="w-full aspect-[2/3] object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeMovie(m.id)}
                    className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${m.title}`}
                  >
                    <X className="h-3 w-3 text-white stroke-[3]" />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-1.5">
                    <span className="text-white text-[10px] font-semibold truncate leading-tight">{m.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-white/5">
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
