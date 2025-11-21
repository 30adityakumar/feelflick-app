// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Check, Search, X, Sparkles, ArrowRight, Loader2, Star, 
  ChevronLeft, ChevronRight, Info, Trash2
} from 'lucide-react'

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function Onboarding() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(-1) 
  const [selectedGenres, setSelectedGenres] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [celebrate, setCelebrate] = useState(false)

  const searchInputRef = useRef(null)
  
  // Auto-focus
  useEffect(() => {
    if (step === 1 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150)
    }
  }, [step])

  // Session
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // Check completion
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

  // Search
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
    }, 300)
    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [query])

  const GENRES = useMemo(() => [
    { id: 28, label: 'Action' }, { id: 12, label: 'Adventure' }, { id: 16, label: 'Animation' },
    { id: 35, label: 'Comedy' }, { id: 80, label: 'Crime' }, { id: 99, label: 'Documentary' },
    { id: 18, label: 'Drama' }, { id: 10751, label: 'Family' }, { id: 14, label: 'Fantasy' },
    { id: 36, label: 'History' }, { id: 27, label: 'Horror' }, { id: 10402, label: 'Music' },
    { id: 9648, label: 'Mystery' }, { id: 10749, label: 'Romance' }, { id: 878, label: 'Sci-Fi' },
    { id: 53, label: 'Thriller' }
  ], [])

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
      console.error(e)
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
    }
  }

  if (checking) return <LoadingScreen />
  if (celebrate) return <CelebrationScreen />

  return (
    <div className="fixed inset-0 bg-[#0B1120] flex flex-col h-[100dvh]">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#667eea]/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#764ba2]/10 rounded-full blur-3xl animate-float-slow-delayed" />
      </div>

      {/* Main Container - using 100dvh ensures it fits mobile viewports properly */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-6xl mx-auto">
        
        {step >= 0 && <ProgressIndicator step={step} totalSteps={2} />}
        
        {/* Content Area - Flex-1 pushes footer down, min-h-0 allows scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overscroll-contain">
          <div className="min-h-full flex flex-col">
            {step === -1 && <WelcomeStep onNext={() => setStep(0)} name={session?.user?.user_metadata?.name} />}
            
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

      {/* Global Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(102, 126, 234, 0.4); 
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}

// --- Components ---

function LoadingScreen() {
  return (
    <div className="h-[100dvh] grid place-items-center bg-[#0B1120]">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full blur-xl opacity-30 animate-pulse" />
          <span className="relative text-3xl font-black bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
            FEELFLICK
          </span>
        </div>
        <Loader2 className="h-7 w-7 text-[#667eea] animate-spin" />
      </div>
    </div>
  )
}

function CelebrationScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb]">
      <div className="text-center px-6 animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
          <Star className="relative h-20 w-20 text-white mx-auto fill-current animate-bounce-gentle" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 animate-slide-up">
          You're All Set
        </h1>
        <p className="text-lg text-white/90 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Crafting your personalized experience
        </p>
      </div>
    </div>
  )
}

function ProgressIndicator({ step, totalSteps }) {
  const progressPercent = ((step + 1) / totalSteps) * 100
  return (
    <div className="flex-none px-6 py-5 border-b border-white/5 bg-[#0B1120]/50 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Step {step + 1} of {totalSteps}
        </span>
        <span className="text-xs font-semibold text-white/70">
          {step === 0 ? 'Select Genres' : 'Add Movies'}
        </span>
      </div>
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

function WelcomeStep({ onNext, name }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-[#667eea]/20 rounded-full blur-2xl" />
          <Sparkles className="relative h-14 w-14 text-[#667eea] mx-auto" />
        </div>
        <div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 leading-tight">
            <span className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
              {name ? `Hey ${name.split(' ')[0]}` : 'Welcome to FeelFlick'}
            </span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Let's personalize your experience in just two quick steps
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-white/40">
          <Info className="h-4 w-4" />
          <span>Takes about 90 seconds</span>
        </div>
        <button
          onClick={onNext}
          className="group inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Let's Begin
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}

function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onBack }) {
  const canProceed = selectedGenres.length >= 3
  return (
    <div className="flex flex-col flex-1 px-6 py-6">
      <div className="flex-none text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          What do you love to watch?
        </h2>
        <p className={`text-sm font-medium transition-colors duration-300 ${
          selectedGenres.length >= 3 ? 'text-emerald-400' : 'text-white/50'
        }`}>
          {selectedGenres.length < 3 ? `Select ${3 - selectedGenres.length} more genres` : 'Great selection!'}
        </p>
      </div>

      {error && (
        <div className="flex-none max-w-md mx-auto mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex-1 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {GENRES.map((g, idx) => {
            const isSelected = selectedGenres.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`relative h-16 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 active:scale-95 overflow-hidden ${
                  isSelected
                    ? 'border-[#667eea] bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 text-white shadow-lg shadow-[#667eea]/20'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className="flex items-center justify-center h-full px-3 relative z-10">
                  {g.label}
                </span>
                {/* FIX 1: Checkmark inside container */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-emerald-500 rounded-full p-0.5 shadow-sm z-20 animate-in fade-in zoom-in duration-200">
                    <Check className="h-2.5 w-2.5 text-white stroke-[4]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* FIX 3: Sticky Footer with background backdrop to prevent blocking */}
      <div className="sticky bottom-0 -mx-6 px-6 py-6 border-t border-white/5 bg-[#0B1120]/80 backdrop-blur-xl flex items-center justify-between mt-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={loading || !canProceed}
          className={`flex items-center gap-3 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
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

function StepMovies({
  query, setQuery, results, searching, isMovieSelected, addMovie, removeMovie, favoriteMovies,
  error, loading, searchInputRef, onBack, onFinish
}) {
  const canProceed = favoriteMovies.length >= 5

  return (
    <div className="flex flex-col flex-1 px-6 py-6">
      <div className="flex-none text-center mb-5">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Add your favorite movies
        </h2>
        <p className={`text-sm font-medium transition-colors duration-300 ${
          canProceed ? 'text-emerald-400' : 'text-white/50'
        }`}>
          {canProceed ? 'Excellent collection!' : `${5 - favoriteMovies.length} more to go`}
        </p>
      </div>

      {error && (
        <div className="flex-none max-w-md mx-auto mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex-none relative max-w-2xl mx-auto mb-5 w-full z-30">
        {/* FIX 2: Sharp Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="h-5 w-5 text-white/40" strokeWidth={2.5} />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search movies..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-[#667eea]/30 bg-white/5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#667eea] focus:ring-4 focus:ring-[#667eea]/20 transition-all backdrop-blur-sm"
        />
        {searching ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="h-5 w-5 text-[#667eea] animate-spin" />
          </div>
        ) : query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {/* Search Results Dropdown */}
        {query && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#0f172a] border border-white/10 overflow-hidden shadow-2xl z-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {results.map((r) => {
              const selected = isMovieSelected(r.id)
              const canAdd = !selected && favoriteMovies.length < 50
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    if (selected) removeMovie(r.id)
                    else if (canAdd) {
                      addMovie(r)
                      setQuery('')
                    }
                  }}
                  disabled={!canAdd && !selected}
                  className={`flex w-full items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-left ${
                    selected ? 'bg-[#667eea]/10' : ''
                  } ${!canAdd && !selected ? 'opacity-40' : ''}`}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                    alt=""
                    className="w-10 h-14 rounded-md object-cover bg-white/5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{r.title}</div>
                    <div className="text-xs text-white/50">{r.release_date?.slice(0, 4)}</div>
                  </div>
                  {selected ? (
                    <Check className="h-5 w-5 text-emerald-400" />
                  ) : canAdd && (
                    <span className="text-xs font-bold text-[#667eea] uppercase">Add</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-1 pb-6 min-h-0">
        {favoriteMovies.length > 0 ? (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Collection</h3>
              <span className="text-xs font-medium text-white/40">{favoriteMovies.length} / 50</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {favoriteMovies.map((m) => (
                <div key={m.id} className="group relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10">
                  <img
                    src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                    alt={m.title}
                    className="w-full h-full object-cover"
                  />
                  {/* FIX 2: Always Visible Remove Button on Mobile, Hover on Desktop */}
                  <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeMovie(m.id)
                      }}
                      className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
                    >
                      <X className="h-4 w-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !query && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40 pb-20">
              <Search className="h-12 w-12 mb-4" strokeWidth={1.5} />
              <p className="text-sm">Search for your favorite movies above</p>
            </div>
          )
        )}
      </div>

      {/* FIX 3: Mobile-Safe Sticky Footer */}
      <div className="sticky bottom-0 -mx-6 px-6 py-6 border-t border-white/5 bg-[#0B1120]/80 backdrop-blur-xl flex items-center justify-between mt-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-40">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white/80 transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        
        <button
          onClick={onFinish}
          disabled={loading || !canProceed}
          className={`flex items-center gap-3 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
            canProceed
              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Setup'}
          {!loading && <Check className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
