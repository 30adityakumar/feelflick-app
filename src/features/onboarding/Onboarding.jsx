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

  // Step 2: Favorite Movies
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
          .filter((m) => m.poster_path)
          .sort(
            (a, b) =>
              (b.popularity || 0) - (a.popularity || 0) ||
              (b.vote_average || 0) - (a.vote_average || 0)
          )
          .slice(0, 10)
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
    if (!isMovieSelected(m.id) && favoriteMovies.length < 50) {
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
      <div className="min-h-screen grid place-items-center bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)] text-white/90">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading your profile…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]">
      {/* Gradient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[50vmin] w-[50vmin] rounded-full blur-3xl opacity-25 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="absolute -bottom-44 -right-44 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-30 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
      </div>

      {/* Full-screen container - mobile fills screen, desktop wider box */}
      <div className="relative min-h-screen flex items-center justify-center p-0 md:p-6">
        {/* Content card - full-screen mobile, contained desktop */}
        <div className="w-full h-full md:h-auto md:max-w-4xl md:rounded-2xl bg-black/70 md:bg-black/50 backdrop-blur-xl md:border md:border-white/10 md:shadow-2xl overflow-hidden flex flex-col">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 pt-6 md:pt-8 pb-4">
            <div
              className={`h-1 w-16 md:w-20 rounded-full transition-all duration-300 ${
                step === 1 ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B]' : 'bg-white/20'
              }`}
            />
            <div
              className={`h-1 w-16 md:w-20 rounded-full transition-all duration-300 ${
                step === 2 ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B]' : 'bg-white/20'
              }`}
            />
          </div>

          {/* Header */}
          <div className="px-6 md:px-10 pb-6">
            <h2 className="text-center text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2">
              {step === 1 ? 'Pick your favorite genres' : 'Add movies you love'}
            </h2>
            <p className="text-center text-sm md:text-base text-white/70 leading-relaxed max-w-2xl mx-auto">
              {step === 1
                ? 'Select genres that match your taste'
                : 'Search and add up to 50 movies to personalize your experience'}
            </p>
            {error && (
              <p className="mt-3 text-center text-xs md:text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2 max-w-lg mx-auto">
                {error}
              </p>
            )}
          </div>

          {/* Body - scrollable content area */}
          <div className="flex-1 px-6 md:px-10 pb-6 overflow-y-auto">
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

          {/* Footer actions - sticky bottom */}
          <div className="px-6 md:px-10 py-4 md:py-5 border-t border-white/10 bg-black/60 backdrop-blur-md">
            {step === 1 ? (
              <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
                <button
                  className="text-sm md:text-base font-semibold text-white/60 hover:text-white transition-colors disabled:opacity-50 active:scale-95"
                  disabled={loading}
                  onClick={() => saveAndGo({ skipGenres: true })}
                >
                  Skip
                </button>
                <button
                  className="flex-1 max-w-md px-8 py-3 md:py-3.5 rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white text-sm md:text-base font-bold shadow-lg hover:shadow-xl hover:from-[#FF9245] hover:to-[#E03C9E] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || selectedGenres.length === 0}
                  onClick={() => setStep(2)}
                >
                  {selectedGenres.length > 0 ? `Next (${selectedGenres.length})` : 'Select at least one'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
                <button
                  className="text-sm md:text-base font-semibold text-white/70 hover:text-white transition-colors disabled:opacity-50 active:scale-95"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  className="flex-1 max-w-md px-8 py-3 md:py-3.5 rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white text-sm md:text-base font-bold shadow-lg hover:shadow-xl hover:from-[#FF9245] hover:to-[#E03C9E] transition-all active:scale-95 disabled:opacity-50"
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
  )
}

/* ----------------------------- Step Components ----------------------------- */
function StepGenres({ GENRES, selectedGenres, toggleGenre }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3 max-w-4xl mx-auto">
      {GENRES.map((g) => {
        const isSelected = selectedGenres.includes(g.id)
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggleGenre(g.id)}
            className={`relative h-12 md:h-14 rounded-xl border-2 font-semibold text-sm md:text-base transition-all active:scale-95 ${
              isSelected
                ? 'border-[#FF9245] bg-gradient-to-br from-[#FF9245]/20 to-[#EB423B]/20 text-white shadow-lg scale-[1.02]'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <span className="relative z-10">{g.label}</span>
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 md:h-5 md:w-5 text-[#FF9245]" />
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
    <div className="space-y-5 md:space-y-6 max-w-3xl mx-auto">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          type="text"
          placeholder="Search your favorite movies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 md:py-3.5 rounded-xl border border-white/10 bg-white/5 text-sm md:text-base text-white placeholder-white/40 focus:outline-none focus:border-[#FF9245] focus:ring-2 focus:ring-[#FF9245]/30 transition-all"
        />
      </div>

      {/* Empty state */}
      {!query && favoriteMovies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
          <Sparkles className="h-12 w-12 md:h-14 md:w-14 text-white/30 mb-4" />
          <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-sm">
            Search for movies you love. The more you add, the better your recommendations will be.
          </p>
        </div>
      )}

      {/* Search results */}
      {query && results.length > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden max-h-[300px] overflow-y-auto">
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
                disabled={!selected && !canAdd}
                className="flex w-full items-center gap-3 md:gap-4 px-4 py-3 hover:bg-white/5 text-left transition-colors active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                  alt=""
                  className="w-12 h-[72px] md:w-14 md:h-[84px] object-cover rounded-lg flex-shrink-0 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm md:text-base font-medium text-white truncate">{r.title}</div>
                  <div className="text-xs md:text-sm text-white/60">
                    {r.release_date ? r.release_date.slice(0, 4) : 'Unknown'}
                  </div>
                </div>
                {selected ? (
                  <Check className="h-5 w-5 text-[#FF9245] flex-shrink-0" />
                ) : canAdd ? (
                  <span className="text-sm text-white/60 flex-shrink-0">Add</span>
                ) : (
                  <span className="text-xs text-white/40 flex-shrink-0">Limit reached</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {query && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm md:text-base text-white/60">No movies found. Try a different search.</p>
        </div>
      )}

      {/* Selected movies - grid layout with proper spacing */}
      {favoriteMovies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm md:text-base font-semibold text-white/90">
              Your picks ({favoriteMovies.length}/50)
            </h3>
            {favoriteMovies.length >= 5 && (
              <span className="text-xs md:text-sm text-green-400 font-medium">✓ Excellent selection!</span>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
            {favoriteMovies.map((m) => (
              <div key={m.id} className="relative group">
                <img
                  src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                  alt={m.title}
                  className="w-full aspect-[2/3] object-cover rounded-lg ring-2 ring-white/10 shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => removeMovie(m.id)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all active:scale-90 opacity-0 group-hover:opacity-100 md:opacity-100"
                  aria-label={`Remove ${m.title}`}
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
