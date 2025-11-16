// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Check, Search, X } from 'lucide-react'

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
  const [showAllResults, setShowAllResults] = useState(false)
  const [favoriteMovies, setFavoriteMovies] = useState([])
  const [popular, setPopular] = useState([])
  const [popularSource, setPopularSource] = useState(null)

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

  /* ----------------------- Popular Movies (App + TMDB) ---------------------- */
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const since = new Date()
        since.setDate(since.getDate() - 90)

        const { data: watched, error: wErr } = await supabase
          .from('movies_watched')
          .select('movie_id')
          .gte('created_at', since.toISOString())
          .limit(5000)

        if (!wErr && watched && watched.length >= 6) {
          const counts = new Map()
          for (const r of watched) {
            counts.set(r.movie_id, (counts.get(r.movie_id) || 0) + 1)
          }
          const topIds = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([id]) => id)

          const { data: topMovies } = await supabase
            .from('movies')
            .select('id,title,poster_path,release_date,popularity,vote_average')
            .in('id', topIds)

          const withPosters = (topMovies || [])
            .filter((m) => m?.poster_path)
            .sort(
              (a, b) =>
                (b.popularity || 0) - (a.popularity || 0) ||
                (b.vote_average || 0) - (a.vote_average || 0)
            )
            .slice(0, 6)

          if (active && withPosters.length === 6) {
            setPopular(withPosters)
            setPopularSource('app')
            return
          }
        }
      } catch {}

      try {
        const r = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}`
        )
        const j = await r.json()
        const picks = (j?.results || [])
          .filter((m) => m.poster_path)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 6)
        if (active) {
          setPopular(picks)
          setPopularSource('tmdb')
        }
      } catch {
        if (active) setPopular([])
      }
    })()
    return () => {
      active = false
    }
  }, [TMDB_KEY])

  /* ----------------------------- Movie Search ----------------------------- */
  useEffect(() => {
    let active = true
    if (!query) {
      setResults([])
      setShowAllResults(false)
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
        const all = (data.results || []).sort(
          (a, b) =>
            (b.popularity || 0) - (a.popularity || 0) ||
            (b.vote_average || 0) - (a.vote_average || 0)
        )
        setResults(all)
        setShowAllResults(false)
      } catch {
        if (!active) return
        setResults([])
        setShowAllResults(false)
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
    if (!isMovieSelected(m.id)) setFavoriteMovies((prev) => [...prev, m])
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
      setError(e.message || 'Could not save your preferences — please try again.')
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
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]">
      {/* Gradient orbs (subtle) */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[50vmin] w-[50vmin] rounded-full blur-3xl opacity-30 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="absolute -bottom-44 -right-44 h-[60vmin] w-[60vmin] rounded-full blur-3xl opacity-40 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
      </div>

      {/* Content scroller */}
      <div
        className="h-[100svh] w-full flex items-center justify-center px-4 py-8 overflow-y-auto"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 32px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 32px)',
        }}
      >
        {/* Card */}
        <div className="relative w-full max-w-2xl">
          {/* Gradient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 rounded-3xl opacity-60 blur-2xl bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20"
          />

          {/* Card container */}
          <div className="relative rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 pt-6 pb-4">
              <div
                className={`h-1.5 w-16 rounded-full transition-all ${
                  step === 1 ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B]' : 'bg-white/20'
                }`}
              />
              <div
                className={`h-1.5 w-16 rounded-full transition-all ${
                  step === 2 ? 'bg-gradient-to-r from-[#FF9245] to-[#EB423B]' : 'bg-white/20'
                }`}
              />
            </div>

            {/* Header */}
            <div className="px-6 sm:px-8 pb-6">
              <h2 className="text-center text-2xl sm:text-3xl font-black text-white mb-2">
                {step === 1 ? 'What genres do you love?' : 'Tell us your favorite movies'}
              </h2>
              <p className="text-center text-sm text-white/70">
                {step === 1
                  ? 'Pick a few genres that match your taste. We will use this to find movies you love.'
                  : 'Search or pick from popular movies. The more you add, the better your recommendations.'}
              </p>
              {error && (
                <p className="mt-3 text-center text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Body */}
            <div className="px-6 sm:px-8 pb-6 max-h-[50vh] overflow-y-auto">
              {step === 1 && (
                <StepGenres
                  GENRES={GENRES}
                  selectedGenres={selectedGenres}
                  toggleGenre={toggleGenre}
                />
              )}

              {step === 2 && (
                <StepMovies
                  popular={popular}
                  popularSource={popularSource}
                  query={query}
                  setQuery={setQuery}
                  results={results}
                  showAllResults={showAllResults}
                  setShowAllResults={setShowAllResults}
                  isMovieSelected={isMovieSelected}
                  addMovie={addMovie}
                  removeMovie={removeMovie}
                  favoriteMovies={favoriteMovies}
                />
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 sm:px-8 py-6 border-t border-white/10 bg-black/30">
              {step === 1 ? (
                <div className="flex items-center justify-between gap-4">
                  <button
                    className="text-sm font-semibold text-white/60 hover:text-white transition-colors disabled:opacity-50"
                    disabled={loading}
                    onClick={() => saveAndGo({ skipGenres: true })}
                  >
                    Skip for now
                  </button>
                  <button
                    className="flex-1 max-w-xs px-8 py-3 rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white font-bold shadow-lg hover:shadow-xl hover:from-[#FF9245] hover:to-[#E03C9E] transition-all active:scale-95 disabled:opacity-50"
                    disabled={loading || selectedGenres.length === 0}
                    onClick={() => setStep(2)}
                  >
                    {selectedGenres.length > 0
                      ? `Next (${selectedGenres.length} selected)`
                      : 'Select at least one'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <button
                    className="text-sm font-semibold text-white/80 hover:text-white transition-colors disabled:opacity-50"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    ← Back
                  </button>
                  <button
                    className="flex-1 max-w-xs px-8 py-3 rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white font-bold shadow-lg hover:shadow-xl hover:from-[#FF9245] hover:to-[#E03C9E] transition-all active:scale-95 disabled:opacity-50"
                    disabled={loading}
                    onClick={() => saveAndGo()}
                  >
                    {loading ? 'Saving…' : favoriteMovies.length > 0 ? 'Finish' : 'Skip & Finish'}
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {GENRES.map((g) => {
        const isSelected = selectedGenres.includes(g.id)
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggleGenre(g.id)}
            className={`relative h-12 sm:h-14 rounded-xl border-2 font-semibold text-sm sm:text-base transition-all ${
              isSelected
                ? 'border-[#FF9245] bg-gradient-to-br from-[#FF9245]/20 to-[#EB423B]/20 text-white shadow-lg'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <span className="relative z-10">{g.label}</span>
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4 text-[#FF9245]" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

function StepMovies({
  popular,
  popularSource,
  query,
  setQuery,
  results,
  showAllResults,
  setShowAllResults,
  isMovieSelected,
  addMovie,
  removeMovie,
  favoriteMovies,
}) {
  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          type="text"
          placeholder="Search for a movie…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-[#FF9245] focus:ring-2 focus:ring-[#FF9245]/20 transition-all"
        />
      </div>

      {/* Search results */}
      {query && results.length > 0 && (
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden max-h-64 overflow-y-auto">
          {(showAllResults ? results : results.slice(0, 6)).map((r) => {
            const selected = isMovieSelected(r.id)
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  if (selected) {
                    removeMovie(r.id)
                  } else {
                    addMovie(r)
                    setQuery('')
                  }
                }}
                className="flex w-full items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
              >
                <img
                  src={
                    r.poster_path
                      ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
                      : 'https://via.placeholder.com/92x138/1a1a1a/666?text=No+Image'
                  }
                  alt=""
                  className="w-12 h-18 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{r.title}</div>
                  <div className="text-xs text-white/60">
                    {r.release_date ? r.release_date.slice(0, 4) : 'Unknown year'}
                  </div>
                </div>
                {selected ? (
                  <Check className="h-5 w-5 text-[#FF9245] flex-shrink-0" />
                ) : (
                  <span className="text-xs text-white/60 flex-shrink-0">Add</span>
                )}
              </button>
            )
          })}
          {!showAllResults && results.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllResults(true)}
              className="w-full py-3 text-sm font-semibold text-[#FF9245] hover:bg-white/5 transition-colors"
            >
              Show all {results.length} results
            </button>
          )}
        </div>
      )}

      {/* Popular movies (when not searching) */}
      {!query && popular.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-3">
            {popularSource === 'app' ? 'Popular with FeelFlick users' : 'Popular movies'}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {popular.map((m) => {
              const selected = isMovieSelected(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => (selected ? removeMovie(m.id) : addMovie(m))}
                  className="relative group rounded-lg overflow-hidden ring-2 ring-white/10 hover:ring-[#FF9245]/50 transition-all"
                  title={m.title}
                >
                  <img
                    src={
                      m.poster_path?.startsWith?.('http')
                        ? m.poster_path
                        : `https://image.tmdb.org/t/p/w185${m.poster_path}`
                    }
                    alt={m.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  {selected && (
                    <div className="absolute inset-0 bg-[#FF9245]/20 ring-2 ring-[#FF9245] flex items-center justify-center">
                      <Check className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                  )}
                  {!selected && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected movies */}
      {favoriteMovies.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-3">
            Your favorites ({favoriteMovies.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {favoriteMovies.map((m) => (
              <div key={m.id} className="relative group">
                <img
                  src={
                    m.poster_path
                      ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                      : 'https://via.placeholder.com/92x138/1a1a1a/666?text=No+Image'
                  }
                  alt={m.title}
                  className="w-16 h-24 object-cover rounded-lg ring-2 ring-white/10"
                />
                <button
                  type="button"
                  onClick={() => removeMovie(m.id)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors"
                  aria-label={`Remove ${m.title}`}
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
