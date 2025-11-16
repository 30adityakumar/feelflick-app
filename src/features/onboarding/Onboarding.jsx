// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Check, Search, X, Sparkles } from 'lucide-react'

export default function Onboarding() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(1)

  // Step 1: Genres
  const [selectedGenres, setSelectedGenres] = useState([])

  // Step 2: Favorite Movies (search-only, no bias)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [favoriteMovies, setFavoriteMovies] = useState([])

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

  /* ----------------------------- Session Check ----------------------------- */
  useEffect(() => {
    let unsub
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    unsub = data?.subscription?.unsubscribe
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [])

  /* ------------------------- Already Onboarded Check ------------------------ */
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

        if (error) {
          console.warn('users SELECT failed:', error.message)
          setChecking(false)
          return
        }

        const completed =
          data?.onboarding_complete === true || Boolean(data?.onboarding_completed_at)
        if (completed) navigate('/home', { replace: true })
        else setChecking(false)
      } catch (e) {
        console.warn('onboarding check failed:', e)
        setChecking(false)
      }
    })()
  }, [session, navigate])

  /* ----------------------------- Movie Search ----------------------------- */
  useEffect(() => {
    let active = true
    if (!query) {
      setResults([])
      return
    }
    ;(async () => {
      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
            query
          )}`
        )
        const data = await r.json()
        if (!active) return
        const all = (data.results || [])
          .filter((m) => m.poster_path) // Only show movies with posters
          .sort(
            (a, b) =>
              (b.popularity || 0) - (a.popularity || 0) ||
              (b.vote_average || 0) - (a.vote_average || 0)
          )
          .slice(0, 8) // Limit to 8 results for clean UX
        setResults(all)
      } catch {
        if (!active) return
        setResults([])
      }
    })()
    return () => {
      active = false
    }
  }, [query, TMDB_KEY])

  /* ------------------------------- Genres ------------------------------- */
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

  const toggleGenre = (id) =>
    setSelectedGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))

  const isMovieSelected = (id) => favoriteMovies.some((x) => x.id === id)
  const addMovie = (m) => {
    if (!isMovieSelected(m.id) && favoriteMovies.length < 10) {
      setFavoriteMovies((prev) => [...prev, m])
    }
  }
  const removeMovie = (id) => setFavoriteMovies((prev) => prev.filter((m) => m.id !== id))

  /* ------------------------- Save & Navigate ------------------------- */
  async function ensureUserRowOrFail(user) {
    const { data: existing, error: selErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (selErr) {
      console.warn('users SELECT failed:', selErr)
      throw new Error('Could not verify profile')
    }
    if (existing) return true

    const payload = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
    }
    const { error: insErr } = await supabase.from('users').insert(payload)
    if (insErr) {
      console.error('users INSERT failed:', insErr)
      throw new Error('Could not create your profile')
    }
    return true
  }

  async function saveAndGo(opts = {}) {
    const { skipGenres = false, skipMovies = false } = opts
    setError('')
    setLoading(true)
    try {
      const user_id = session?.user?.id
      if (!user_id) throw new Error('No authenticated user.')

      await ensureUserRowOrFail(session.user)

      const email = session.user.email
      const name = session.user.user_metadata?.name || ''
      const { error: updErr } = await supabase
        .from('users')
        .update({ email, name })
        .eq('id', user_id)
      if (updErr) console.warn('users UPDATE warn:', updErr)

      if (!skipGenres && selectedGenres.length) {
        await supabase.from('user_preferences').delete().eq('user_id', user_id)
        const rows = selectedGenres.map((genre_id) => ({ user_id, genre_id }))
        const { error: upErr } = await supabase
          .from('user_preferences')
          .upsert(rows, { onConflict: 'user_id,genre_id' })
        if (upErr) console.warn('user_preferences upsert warn:', upErr)
      }

      if (!skipMovies && favoriteMovies.length) {
        const uniq = Array.from(new Map(favoriteMovies.map((m) => [m.id, m])).values())
        const rows = uniq.map((m) => ({
          user_id,
          movie_id: m.id,
          title: m.title ?? null,
          poster: m.poster_path
            ? m.poster_path.startsWith('http')
              ? m.poster_path
              : `https://image.tmdb.org/t/p/w500${m.poster_path}`
            : null,
          release_date: m.release_date ?? null,
          vote_average: typeof m.vote_average === 'number' ? m.vote_average : null,
          genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids : null,
        }))

        for (const row of rows) {
          const { error: insErr } = await supabase
            .from('movies_watched')
            .upsert(row, { onConflict: 'user_id,movie_id' })
          if (insErr) console.warn('movies_watched upsert warn:', insErr)
        }
      }

      await supabase
        .from('users')
        .update({
          onboarding_complete: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user_id)

      await supabase.auth.updateUser({
        data: { onboarding_complete: true, has_onboarded: true },
      })

      navigate('/home', { replace: true, state: { fromOnboarding: true } })
    } catch (e) {
      console.error('Onboarding save failed:', e)
      setError(e.message || 'Could not save your preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* -------------------------------- UI -------------------------------- */
  if (checking) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-white/90">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading your profile…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]">
      {/* Gradient orbs (very subtle) */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-20 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="absolute -bottom-44 -right-44 h-[55vmin] w-[55vmin] rounded-full blur-3xl opacity-25 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
      </div>

      {/* Content - no scroll needed */}
      <div
        className="h-full w-full flex items-center justify-center px-3 py-3"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 12px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        }}
      >
        {/* Card - fits viewport perfectly */}
        <div className="relative w-full max-w-xl">
          {/* Gradient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-1.5 rounded-xl opacity-30 blur-xl bg-gradient-to-r from-orange-500/15 via-red-500/15 to-pink-500/15"
          />

          {/* Card container */}
          <div className="relative rounded-xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Progress indicator - minimal */}
            <div className="flex items-center justify-center gap-1.5 pt-3 pb-2.5">
              <div
                className={`h-0.5 w-10 rounded-full transition-all duration-300 ${
                  step === 1 ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B]' : 'bg-white/15'
                }`}
              />
              <div
                className={`h-0.5 w-10 rounded-full transition-all duration-300 ${
                  step === 2 ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B]' : 'bg-white/15'
                }`}
              />
            </div>

            {/* Header - ultra-compact */}
            <div className="px-4 pb-3">
              <h2 className="text-center text-lg sm:text-xl font-black text-white mb-1">
                {step === 1 ? 'Pick your favorite genres' : 'Add movies you love'}
              </h2>
              <p className="text-center text-[11px] sm:text-xs text-white/65 leading-snug">
                {step === 1
                  ? 'Select genres that match your taste'
                  : 'Search and add movies to personalize your experience'}
              </p>
              {error && (
                <p className="mt-2 text-center text-[10px] sm:text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5">
                  {error}
                </p>
              )}
            </div>

            {/* Body - compact, no scroll */}
            <div className="px-4 pb-3">
              {step === 1 ? (
                <StepGenres
                  GENRES={GENRES}
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                />
              ) : (
                <StepMovies
                  query={query}
                  setQuery={setQuery}
                  results={results}
                  isMovieSelected={isMovieSelected}
                  addMovie={addMovie}
                  removeMovie={removeMovie}
                  favoriteMovies={favoriteMovies}
                />
              )}
            </div>

            {/* Footer actions - minimal padding */}
            <div className="px-4 py-2.5 border-t border-white/10 bg-black/50">
              {step === 1 ? (
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="text-[11px] sm:text-xs font-semibold text-white/50 hover:text-white/80 transition-colors disabled:opacity-50 active:scale-95"
                    disabled={loading}
                    onClick={() => saveAndGo({ skipGenres: true })}
                  >
                    Skip
                  </button>
                  <button
                    className="flex-1 max-w-[200px] px-6 py-2 rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl hover:from-[#FF9245] hover:to-[#E03C9E] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || selectedGenres.length === 0}
                    onClick={() => setStep(2)}
                  >
                    {selectedGenres.length > 0 ? `Next (${selectedGenres.length})` : 'Select at least one'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="text-[11px] sm:text-xs font-semibold text-white/70 hover:text-white transition-colors disabled:opacity-50 active:scale-95"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    ← Back
                  </button>
                  <button
                    className="flex-1 max-w-[200px] px-6 py-2 rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl hover:from-[#FF9245] hover:to-[#E03C9E] transition-all active:scale-95 disabled:opacity-50"
                    disabled={loading}
                    onClick={() => saveAndGo()}
                  >
                    {loading ? 'Saving…' : 'Finish'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Step Components ----------------------------- */
function StepGenres({ GENRES, selectedGenres, toggleGenre }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
      {GENRES.map((g) => {
        const isSelected = selectedGenres.includes(g.id)
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggleGenre(g.id)}
            className={`relative h-9 sm:h-10 rounded-lg border-2 font-semibold text-[11px] sm:text-xs transition-all active:scale-95 ${
              isSelected
                ? 'border-[#FF9245] bg-gradient-to-br from-[#FF9245]/25 to-[#EB423B]/20 text-white shadow-md scale-[1.02]'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <span className="relative z-10">{g.label}</span>
            {isSelected && (
              <div className="absolute top-1 right-1">
                <Check className="h-3 w-3 text-[#FF9245]" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function StepMovies({
  query,
  setQuery,
  results,
  isMovieSelected,
  addMovie,
  removeMovie,
  favoriteMovies,
}) {
  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
        <input
          type="text"
          placeholder="Search your favorite movies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF9245] focus:ring-1 focus:ring-[#FF9245]/30 transition-all"
        />
      </div>

      {/* Empty state with helpful hint */}
      {!query && favoriteMovies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Sparkles className="h-8 w-8 text-white/20 mb-2" />
          <p className="text-[11px] text-white/50 leading-relaxed max-w-xs">
            Search for movies you love. This helps us understand your taste and give you better recommendations.
          </p>
        </div>
      )}

      {/* Search results - compact */}
      {query && results.length > 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden max-h-[180px] overflow-y-auto">
          {results.map((r) => {
            const selected = isMovieSelected(r.id)
            const canAdd = !selected && favoriteMovies.length < 10
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
                disabled={!selected && !canAdd}
                className="flex w-full items-center gap-2 px-2.5 py-2 hover:bg-white/5 text-left transition-colors active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                  alt=""
                  className="w-8 h-12 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] sm:text-xs font-medium text-white truncate">{r.title}</div>
                  <div className="text-[10px] text-white/50">
                    {r.release_date ? r.release_date.slice(0, 4) : 'Unknown'}
                  </div>
                </div>
                {selected ? (
                  <Check className="h-3.5 w-3.5 text-[#FF9245] flex-shrink-0" />
                ) : canAdd ? (
                  <span className="text-[10px] text-white/50 flex-shrink-0">Add</span>
                ) : (
                  <span className="text-[10px] text-white/30 flex-shrink-0">Max 10</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div className="text-center py-4">
          <p className="text-[11px] text-white/50">No movies found. Try a different search.</p>
        </div>
      )}

      {/* Selected movies - horizontal scroll */}
      {favoriteMovies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] sm:text-xs font-semibold text-white/70">
              Your picks ({favoriteMovies.length}/10)
            </h3>
            {favoriteMovies.length >= 3 && (
              <span className="text-[10px] text-green-400">✓ Good to go!</span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {favoriteMovies.map((m) => (
              <div key={m.id} className="relative group flex-shrink-0">
                <img
                  src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                  alt={m.title}
                  className="w-12 h-[72px] object-cover rounded-md ring-2 ring-white/10"
                />
                <button
                  type="button"
                  onClick={() => removeMovie(m.id)}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors active:scale-90"
                  aria-label={`Remove ${m.title}`}
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
