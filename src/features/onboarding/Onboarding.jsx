// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Check, Search, X, Sparkles, ArrowRight, Loader2, Star, 
  ChevronLeft, ChevronRight, Info
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
  
  // Auto-focus search (Apple principle: guide users naturally)
  useEffect(() => {
    if (step === 1 && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150)
    }
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

  // Intelligent debounced search (Netflix principle: instant feedback)
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

  // Loading state (Apple principle: branded, minimal)
  if (checking) {
    return (
      <div className="h-screen grid place-items-center bg-[#0B1120]">
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

  // Celebration (Netflix principle: reward completion)
  if (celebrate) {
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

  return (
    <div className="fixed inset-0 bg-[#0B1120] flex flex-col">
      {/* Ambient background (subtle depth) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#667eea]/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#764ba2]/10 rounded-full blur-3xl animate-float-slow-delayed" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">
        
        {/* Progress Bar (Plex principle: clear progress indication) */}
        {step >= 0 && <ProgressIndicator step={step} totalSteps={2} />}
        
        {/* Content Area (perfectly scrollable) */}
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

      {/* Global Styles */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -20px); }
        }
        @keyframes float-slow-delayed {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-float-slow-delayed { animation: float-slow-delayed 25s ease-in-out infinite; }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        
        /* Custom scrollbar (Plex-style) */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(102, 126, 234, 0.4); 
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: rgba(102, 126, 234, 0.6); 
        }
      `}</style>
    </div>
  )
}

// Progress Indicator (Apple-inspired minimal design)
function ProgressIndicator({ step, totalSteps }) {
  const progressPercent = ((step + 1) / totalSteps) * 100
  
  return (
    <div className="flex-none px-6 py-5 border-b border-white/5">
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

// Welcome Step (Netflix-inspired hero)
function WelcomeStep({ onNext, name }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12 overflow-y-auto custom-scrollbar">
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

// Genre Step (Apple-inspired grid with smart feedback)
function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onBack }) {
  const getSmartFeedback = () => {
    const count = selectedGenres.length
    if (count === 0) return { text: 'Select 3-5 genres to get started', color: 'text-white/50' }
    if (count < 3) return { text: `${3 - count} more needed for quality recommendations`, color: 'text-[#667eea]' }
    if (count >= 3 && count <= 5) return { text: 'Perfect selection', color: 'text-emerald-400' }
    return { text: `${count} selected — you love variety!`, color: 'text-[#f093fb]' }
  }

  const feedback = getSmartFeedback()
  const canProceed = selectedGenres.length >= 3

  return (
    <div className="h-full flex flex-col px-6 py-6">
      {/* Header */}
      <div className="flex-none text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          What do you love to watch?
        </h2>
        <p className={`text-sm font-medium ${feedback.color} transition-colors duration-300`}>
          {feedback.text}
        </p>
      </div>

      {error && (
        <div className="flex-none max-w-md mx-auto mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Scrollable Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-2 px-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto pb-6">
          {GENRES.map((g, idx) => {
            const isSelected = selectedGenres.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`relative h-16 overflow-visible rounded-2xl border-2 font-semibold text-sm transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? 'border-[#667eea] bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 text-white shadow-lg shadow-[#667eea]/20'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20 hover:shadow-md'
                }`}
                style={{ 
                  animationDelay: `${idx * 20}ms`,
                  animation: 'slide-up 0.4s ease-out backwards'
                }}
              >
                <span className="flex items-center justify-center h-full px-3">
                  {g.label}
                </span>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-[#0B1120] rounded-full p-0.5 shadow-lg z-10">
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

      {/* Footer Actions */}
      <div className="flex-none pt-6 border-t border-white/5 flex items-center justify-between">
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

// Movies Step (Plex-inspired content discovery)
function StepMovies({
  query, setQuery, results, searching, isMovieSelected, addMovie, removeMovie, favoriteMovies,
  error, loading, searchInputRef, onBack, onFinish
}) {
  const getSmartFeedback = () => {
    const count = favoriteMovies.length
    if (count === 0) return { text: 'Add 5+ movies for personalized recommendations', color: 'text-white/50' }
    if (count < 5) return { text: `${5 - count} more for great recommendations`, color: 'text-[#667eea]' }
    if (count >= 5 && count < 10) return { text: 'Excellent — ready to continue', color: 'text-emerald-400' }
    return { text: `${count} movies — amazing taste!`, color: 'text-[#f093fb]' }
  }

  const feedback = getSmartFeedback()
  const canProceed = favoriteMovies.length >= 5

  return (
    <div className="h-full flex flex-col px-6 py-6">
      {/* Header */}
      <div className="flex-none text-center mb-5">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Add your favorite movies
        </h2>
        <p className={`text-sm font-medium ${feedback.color} transition-colors duration-300`}>
          {feedback.text}
        </p>
      </div>

      {error && (
        <div className="flex-none max-w-md mx-auto mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex-none relative max-w-2xl mx-auto mb-5 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for movies (e.g., Inception, The Matrix)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-[#667eea]/30 bg-white/5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#667eea] focus:ring-4 focus:ring-[#667eea]/20 transition-all backdrop-blur-sm"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="h-5 w-5 text-[#667eea] animate-spin" />
          </div>
        )}
        {query && !searching && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-2 px-2">
        
        {/* Empty State */}
        {!query && favoriteMovies.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-60">
            <Search className="h-16 w-16 mb-4" />
            <p className="text-sm text-white/70 max-w-xs">
              Start typing to discover and add movies you love
            </p>
          </div>
        )}

        {/* Search Results */}
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
                      else if (canAdd) {
                        addMovie(r)
                        setQuery('')
                      }
                    }}
                    disabled={!canAdd && !selected}
                    className={`flex w-full items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all border-b border-white/5 last:border-0 text-left group ${
                      selected ? 'bg-[#667eea]/10' : ''
                    } ${!canAdd && !selected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                      alt={r.title}
                      className="w-12 h-18 rounded-lg object-cover flex-shrink-0 shadow-md ring-1 ring-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-base truncate group-hover:text-[#667eea] transition-colors">{r.title}</div>
                      <div className="text-sm text-white/50">{r.release_date?.slice(0, 4) || 'Unknown'}</div>
                    </div>
                    {selected ? (
                      <div className="bg-emerald-500 rounded-full p-2">
                        <Check className="h-4 w-4 text-white stroke-[3]" />
                      </div>
                    ) : canAdd ? (
                      <span className="text-sm font-bold text-[#667eea] uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                        Add
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* No Results */}
        {query && !searching && results.length === 0 && (
          <div className="text-center py-12 text-white/50 text-sm">
            No movies found. Try a different search term.
          </div>
        )}

        {/* Selected Collection */}
        {favoriteMovies.length > 0 && (
          <div className="max-w-5xl mx-auto pb-6">
            <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-[#0B1120]/95 backdrop-blur-sm py-2 border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-3">
                Your Collection
                <span className="text-sm font-semibold text-white/50 bg-white/10 px-3 py-1 rounded-full">
                  {favoriteMovies.length}
                </span>
              </h3>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {favoriteMovies.map((m, idx) => (
                <div 
                  key={m.id} 
                  className="group relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10 hover:ring-[#667eea]/50 transition-all duration-300 hover:scale-105"
                  style={{ 
                    animationDelay: `${idx * 30}ms`,
                    animation: 'slide-up 0.4s ease-out backwards'
                  }}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                    alt={m.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Remove Button Overlay */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMovie(m.id)
                    }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center shadow-md z-20 transition-all"
                    title="Remove"
                  >
                    <X className="h-4 w-4 text-white stroke-[3]" />
                  </button>
                  <img ... />
                  <span className="absolute bottom-2 left-2 right-2 text-[11px] font-medium text-white/90 px-2 text-center line-clamp-2 bg-black/60 rounded shadow-sm">
                    {m.title}
                  </span>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex-none pt-6 border-t border-white/5 flex items-center justify-between bg-[#0B1120]">
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
          className={`flex items-center gap-3 px-10 py-3.5 rounded-full font-semibold text-sm transition-all duration-300 ${
            canProceed
              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving
            </>
          ) : (
            <>
              Complete Setup
              <Check className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
