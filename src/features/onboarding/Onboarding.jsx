// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Check, Search, X, Sparkles, ArrowRight, Confetti } from 'lucide-react'

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

export default function Onboarding() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(-1) // -1 = welcome, 0 = genres, 1 = movies, 2 = done
  const [selectedGenres, setSelectedGenres] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [celebrate, setCelebrate] = useState(false)

  // Focus search input when entering movie step
  const searchInputRef = useRef(null)
  useEffect(() => {
    if (step === 1 && searchInputRef.current) searchInputRef.current.focus()
  }, [step])

  // Auth/session & onboarding completion logic
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
        if (
          meta.onboarding_complete === true ||
          meta.has_onboarded === true ||
          meta.onboarded === true
        ) {
          navigate('/home', { replace: true })
          return
        }
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_complete,onboarding_completed_at')
          .eq('id', session.user.id)
          .maybeSingle()
        if (error) { setChecking(false); return }
        const completed = data?.onboarding_complete === true || Boolean(data?.onboarding_completed_at)
        if (completed) navigate('/home', { replace: true })
        else setChecking(false)
      } catch { setChecking(false) }
    })()
  }, [session, navigate])

  // Movie search
  useEffect(() => {
    let active = true
    if (!query) { setResults([]); return }
    (async () => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`
        )
        const data = await r.json()
        if (!active) return
        const all = (data.results || []).filter((m) => m.poster_path).sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0)
        ).slice(0, 10)
        setResults(all)
      } catch { if (active) setResults([]) }
    })()
    return () => { active = false }
  }, [query])

  // Genre options
  const GENRES = useMemo(
    () => [
      { id: 28, label: 'Action' }, { id: 12, label: 'Adventure' }, { id: 16, label: 'Animation' },
      { id: 35, label: 'Comedy' }, { id: 80, label: 'Crime' }, { id: 99, label: 'Documentary' },
      { id: 18, label: 'Drama' }, { id: 10751, label: 'Family' }, { id: 14, label: 'Fantasy' },
      { id: 36, label: 'History' }, { id: 27, label: 'Horror' }, { id: 10402, label: 'Music' },
      { id: 9648, label: 'Mystery' }, { id: 10749, label: 'Romance' }, { id: 878, label: 'Sci-Fi' }, { id: 53, label: 'Thriller' },
    ],
    []
  )

  const toggleGenre = (id) => setSelectedGenres((g) => g.includes(id) ? g.filter((x) => x !== id) : [...g, id])
  const isMovieSelected = (id) => favoriteMovies.some((x) => x.id === id)
  const addMovie = (m) => {
    if (!isMovieSelected(m.id) && favoriteMovies.length < 50) setFavoriteMovies((prev) => [...prev, m])
  }
  const removeMovie = (id) => setFavoriteMovies((prev) => prev.filter((m) => m.id !== id))

  // Enforce user row, save onboarding data
  async function ensureUserRowOrFail(user) {
    const { data: existing, error: selErr } = await supabase
      .from('users').select('id').eq('id', user.id).maybeSingle()
    if (selErr) throw new Error('Could not verify profile')
    if (existing) return true
    const payload = { id: user.id, email: user.email, name: user.user_metadata?.name || null }
    const { error: insErr } = await supabase.from('users').insert(payload)
    if (insErr) throw new Error('Could not create your profile')
    return true
  }

  async function saveAndGo(opts = {}) {
    setError('')
    setLoading(true)
    try {
      const user_id = session?.user?.id
      if (!user_id) throw new Error('No authenticated user.')
      await ensureUserRowOrFail(session.user)
      const email = session.user.email
      const name = session.user.user_metadata?.name || ''
      await supabase.from('users').update({ email, name }).eq('id', user_id)
      if (!opts.skipGenres && selectedGenres.length)
        await supabase.from('user_preferences').delete().eq('user_id', user_id)
      if (!opts.skipGenres && selectedGenres.length) {
        const rows = selectedGenres.map((genre_id) => ({ user_id, genre_id }))
        await supabase.from('user_preferences').upsert(rows, { onConflict: 'user_id,genre_id' })
      }
      if (!opts.skipMovies && favoriteMovies.length) {
        const uniq = Array.from(new Map(favoriteMovies.map((m) => [m.id, m])).values())
        const rows = uniq.map((m) => ({
          user_id, movie_id: m.id, title: m.title ?? null,
          poster: m.poster_path ? (m.poster_path.startsWith('http')
            ? m.poster_path
            : `https://image.tmdb.org/t/p/w500${m.poster_path}`)
            : null,
          release_date: m.release_date ?? null,
          vote_average: typeof m.vote_average === 'number' ? m.vote_average : null,
          genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids : null,
        }))
        // Save asynchronously for speed
        await Promise.all(rows.map(row =>
          supabase.from('movies_watched').upsert(row, { onConflict: 'user_id,movie_id' })
        ))
      }
      await supabase.from('users').update({
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      }).eq('id', user_id)
      await supabase.auth.updateUser({
        data: { onboarding_complete: true, has_onboarded: true },
      })
      setLoading(false)
      setCelebrate(true)
      setTimeout(() => navigate('/home', { replace: true, state: { fromOnboarding: true } }), 1800)
    } catch (e) {
      setError(e.message || 'Could not save your preferences. Please try again.')
      setLoading(false)
    }
  }

  // Show spinner until onboarding check is complete
  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)] text-white/90">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent mb-1">FEELFLICK</span>
          <div className="h-8 w-8 border-4 border-white/20 border-t-white rounded-full animate-spin" /> <span className="text-sm font-medium">Loading your profile…</span>
        </div>
      </div>
    )
  }

  // Confetti moment
  if (celebrate) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_60%,#E03C9E_100%)]">
        <ConfettiRain key="confetti" />
        <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent mb-3 mt-8">
          Welcome to FeelFlick!
        </span>
        <span className="text-lg sm:text-2xl text-white/80">You're all set ✨</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)] overflow-hidden">
      {/* Gradient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[50vmin] w-[50vmin] rounded-full blur-3xl opacity-25 bg-[radial-gradient(closest-side,rgba(168,85,247,0.2),rgba(168,85,247,0)_70%)]" />
        <div className="absolute -bottom-44 -right-44 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-25 bg-[radial-gradient(closest-side,rgba(236,72,153,0.22),rgba(236,72,153,0)_70%)]" />
      </div>
      <div className="relative h-full flex flex-col max-w-5xl mx-auto w-full">
        {/* Progress bar or step label */}
        <Progress step={step} max={1} />
        {/* Header */}
        {(step === -1) && (
          <WelcomeStep
            onNext={() => setStep(0)}
            name={session?.user?.user_metadata?.name}
          />
        )}
        {(step === 0) && (
          <StepGenres
            GENRES={GENRES}
            selectedGenres={selectedGenres}
            toggleGenre={toggleGenre}
            error={error}
            onNext={() => setStep(1)}
            loading={loading}
            onSkip={() => setStep(1)}
          />
        )}
        {(step === 1) && (
          <StepMovies
            query={query}
            setQuery={setQuery}
            results={results}
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

// Progress
function Progress({ step, max }) {
  if (step === -1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-5 pb-2 px-2">
      <div className={`h-1 w-20 rounded-full transition-all duration-300 ${step === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/15'}`} />
      <div className={`h-1 w-20 rounded-full transition-all duration-300 ${step === 1 ? 'bg-gradient-to-r from-pink-500 to-amber-400' : 'bg-white/15'}`} />
    </div>
  )
}

// Welcome Step 
function WelcomeStep({ onNext, name }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-14 text-center select-none">
      <Sparkles className="h-12 w-12 text-purple-400 mb-3 animate-bounce" />
      <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent mb-3">
        {name ? `Welcome, ${name}!` : "Welcome!"}
      </h2>
      <p className="text-base sm:text-lg text-white/70 max-w-md mx-auto mb-6">
        Let's personalize your recommendations.<br />Just two quick steps for a perfect movie night!
      </p>
      <button
        onClick={onNext}
        className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-amber-400 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-300"
      >
        Get started <ArrowRight className="inline ml-2 h-5 w-5" />
      </button>
    </div>
  )
}

// Genre selection
function StepGenres({ GENRES, selectedGenres, toggleGenre, error, loading, onNext, onSkip }) {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-white mb-2">
        Pick your favorite genres
      </h2>
      <p className="text-center text-base text-white/60 mb-7">
        Select as many as match your taste.
      </p>
      {error && (
        <p className="text-center text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-2 max-w-lg mx-auto mb-3">{error}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 px-2 pb-6">
        {GENRES.map((g) => {
          const isSelected = selectedGenres.includes(g.id)
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
              className={`relative h-12 sm:h-14 rounded-xl border-2 font-semibold text-sm sm:text-base select-none transition-all active:scale-95 ${
                isSelected
                  ? 'border-purple-400 bg-gradient-to-br from-purple-500/50 to-pink-500/40 text-white shadow-lg'
                  : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
              }`}
              style={{ transition: 'box-shadow 0.3s' }}
            >
              <span className="relative z-10">{g.label}</span>
              {isSelected && <Check className="absolute top-2 right-2 h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between items-center mt-5 max-w-lg mx-auto">
        <button
          className="text-sm font-semibold text-white/50 hover:text-white transition-colors disabled:opacity-50"
          disabled={loading}
          onClick={onSkip}
        >
          Skip
        </button>
        <button
          className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
          disabled={loading || selectedGenres.length < 1}
          onClick={onNext}
        >
          Next{selectedGenres.length ? ` (${selectedGenres.length})` : ''}
        </button>
      </div>
    </div>
  )
}

// Movie picker
function StepMovies({
  query, setQuery, results, isMovieSelected, addMovie, removeMovie, favoriteMovies,
  error, loading, searchInputRef, onBack, onFinish
}) {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-white mb-2">
        Add your favorite movies
      </h2>
      <p className="text-center text-base text-white/60 mb-7">
        Search and add up to 50 you love—the more you add, the smarter we get.
      </p>
      {error && (
        <p className="text-center text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-2 max-w-lg mx-auto mb-3">{error}</p>
      )}
      <div className="relative max-w-2xl mx-auto mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Type to search movies…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border border-white/10 bg-white/5 text-base text-white placeholder-white/40 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/30 transition-all"
        />
      </div>
      {!query && favoriteMovies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Sparkles className="h-10 w-10 text-pink-300 mb-2" />
          <p className="text-base text-white/60 max-w-md px-3">
            Add a few favorites so we can understand your taste.
          </p>
        </div>
      )}
      {/* Results */}
      {query && results.length > 0 && (
        <div className="max-w-2xl mx-auto rounded-xl bg-white/5 border border-white/10 overflow-hidden max-h-72 overflow-y-auto mb-6">
          {results.map((r) => {
            const selected = isMovieSelected(r.id)
            const canAdd = !selected && favoriteMovies.length < 50
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  if (selected) {
                    removeMovie(r.id)
                  } else if (canAdd) {
                    addMovie(r)
                    setQuery('')
                  }
                }}
                className={`flex w-full items-center gap-4 px-4 py-3 transition-all bg-transparent hover:bg-white/10 active:bg-white/15 ${selected ? 'opacity-60' : ''}`}
                disabled={!canAdd && !selected}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                  alt={r.title}
                  className="w-12 h-18 rounded-lg object-cover shadow"
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate text-white">{r.title}</div>
                  <div className="text-xs text-white/60">{r.release_date?.slice(0, 4) || 'Unknown'}</div>
                </div>
                {selected ? (
                  <Check className="h-5 w-5 text-amber-400" />
                ) : canAdd ? (
                  <span className="text-xs text-white/60">Add</span>
                ) : (
                  <span className="text-[11px] text-white/40">Limit reached</span>
                )}
              </button>
            )
          })}
        </div>
      )}
      {query && results.length === 0 && (
        <div className="text-center text-white/60 py-6">No movies found, try something else.</div>
      )}

      {/* Picks grid */}
      {favoriteMovies.length > 0 && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-sm sm:text-base font-bold text-white">
              Your picks ({favoriteMovies.length}/50)
            </span>
            {favoriteMovies.length >= 5 && (
              <span className="text-xs sm:text-sm text-green-400 font-medium animate-pulse">Excellent taste!</span>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
            {favoriteMovies.map((m) => (
              <div key={m.id} className="relative group">
                <img
                  src={`https://image.tmdb.org/t/p/w154${m.poster_path}`}
                  alt={m.title}
                  className="w-full aspect-[2/3] object-cover rounded-lg ring-2 ring-white/10 shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => removeMovie(m.id)}
                  className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all active:scale-90"
                  aria-label={`Remove ${m.title}`}
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mt-6 max-w-lg mx-auto">
        <button
          className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
          onClick={onBack}
          disabled={loading}
        >
          ← Back
        </button>
        <button
          className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50"
          disabled={loading}
          onClick={() => onFinish()}
        >
          {loading ? 'Saving…' : 'Finish'}
        </button>
      </div>
    </div>
  )
}

// Confetti component (pure css/svg)
function ConfettiRain() {
  return (
    <div className="absolute inset-0 pointer-events-none flex justify-center items-start z-50">
      <div className="w-full h-20 flex justify-center">
        {[...Array(60)].map((_, i) => (
          <span
            key={i}
            className="inline-block mx-0.5 w-1.5 h-6 rounded bg-gradient-to-b from-pink-400 via-purple-500 to-amber-400 opacity-80 animate-confetti"
            style={{
              animationDelay: `${Math.random() * 0.9}s`,
              animationDuration: `${0.9 + Math.random()}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.9 }
          85% { opacity: 0.85 }
          100% { transform: translateY(32vh) rotate(40deg); opacity: 0 }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )
}
