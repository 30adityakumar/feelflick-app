// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

const ACCENT = '#fe9245'
const ACCENT2 = '#eb423b'
const BTN_BG = 'linear-gradient(90deg,#fe9245 10%,#eb423b 90%)'
const DARK_BG = 'rgba(22,19,28,0.9)'

// Helper
const strictTrue = (v) => v === true

export default function Onboarding() {
  const nav = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // UI state
  const [step, setStep] = useState(1)
  const [selectedGenres, setSelectedGenres] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [watchlist, setWatchlist] = useState([])

  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

  /* ----------------------- Auth & pre-check (once) ----------------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data?.subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) return
    ;(async () => {
      // If already marked complete, bounce to Home
      const meta = session.user.user_metadata || {}
      if (strictTrue(meta.onboarding_complete) || strictTrue(meta.has_onboarded)) {
        setChecking(false)
        nav('/home', { replace: true })
        return
      }
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_complete,onboarding_completed_at')
        .eq('id', session.user.id)
        .maybeSingle()
      if (error) {
        console.warn('users select error:', error)
        setChecking(false)
        return
      }
      if (strictTrue(data?.onboarding_complete) || Boolean(data?.onboarding_completed_at)) {
        setChecking(false)
        nav('/home', { replace: true })
        return
      }
      setChecking(false)
    })()
  }, [session, nav])

  /* ----------------------------- TMDb search ----------------------------- */
  useEffect(() => {
    let active = true
    if (!query) {
      setResults([])
      return () => {}
    }
    fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
        query
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        setResults((data?.results || []).slice(0, 10))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [query, TMDB_KEY])

  /* ----------------------------- UI helpers ------------------------------ */
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
      { id: 878, label: 'Sci-fi' },
      { id: 53, label: 'Thriller' },
    ],
    []
  )

  const toggleGenre = (id) =>
    setSelectedGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))

  const addMovie = (m) => {
    if (!watchlist.some((x) => x.id === m.id)) setWatchlist((w) => [...w, m])
    setQuery('')
    setResults([])
  }

  const removeMovie = (id) => setWatchlist((w) => w.filter((m) => m.id !== id))

  /* ------------------------------ Persisting ----------------------------- */
  async function finishOnboarding({ skipGenres = false, skipMovies = false } = {}) {
    if (!session?.user) return
    setError('')
    setLoading(true)
    try {
      const userId = session.user.id
      const email = session.user.email || null
      const name = session.user.user_metadata?.name || null

      // Ensure row exists
      await supabase.from('users').upsert([{ id: userId, email, name }], { onConflict: 'id' })

      // Save genres (optional)
      if (!skipGenres) {
        await supabase.from('user_preferences').delete().eq('user_id', userId)
        if (selectedGenres.length) {
          await supabase
            .from('user_preferences')
            .upsert(
              selectedGenres.map((genre_id) => ({ user_id: userId, genre_id })),
              { onConflict: 'user_id,genre_id' }
            )
        }
      }

      // Save watchlist (optional). Keep it simple: only user_watchlist with a soft “onboarding” tag.
      if (!skipMovies) {
        await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', userId)
          .eq('status', 'onboarding')

        if (watchlist.length) {
          await supabase
            .from('user_watchlist')
            .upsert(
              watchlist.map((m) => ({
                user_id: userId,
                movie_id: m.id, // FK to your movies table if present; otherwise keep table FK-free
                status: 'onboarding',
              })),
              { onConflict: 'user_id,movie_id' }
            )
        }
      }

      // Mark complete in both places (belt-and-suspenders)
      await supabase.from('users').update({
        onboarding_complete: true,
        onboarding_completed_at: new Date().toISOString(),
      }).eq('id', userId)

      await supabase.auth.updateUser({
        data: { onboarding_complete: true, has_onboarded: true, onboarded: true },
      })

      // 👉 Go straight to Home and tell the gate to skip once
      nav('/home', { replace: true, state: { fromOnboarding: true } })
    } catch (e) {
      console.error('Onboarding save failed:', e)
      setError('Could not save your preferences — please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* --------------------------------- UI ---------------------------------- */
  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white">
        <div className="text-xl font-extrabold tracking-tight">Loading profile…</div>
      </div>
    )
  }

  const CARD_WIDTH = typeof window !== 'undefined' && window.innerWidth < 700 ? '100vw' : '760px'
  const CARD_MARGIN =
    typeof window !== 'undefined' && window.innerWidth < 700 ? '12px' : '0 auto'

  return (
    <div
      className="min-h-screen w-screen flex flex-col items-stretch justify-stretch relative"
      style={{ background: `#0b0f15` }}
    >
      {/* Brand */}
      <div className="absolute left-6 top-5 z-10 flex items-center gap-2">
        <img src="/logo.png" alt="FeelFlick" className="w-9 h-9 rounded-md" />
        <span className="text-lg font-extrabold text-white tracking-tight">FeelFlick</span>
      </div>

      <div
        className="self-center"
        style={{
          width: CARD_WIDTH,
          margin: CARD_MARGIN,
          minHeight: 520,
          marginTop: 88,
          marginBottom: 20,
          background: DARK_BG,
          borderRadius: 22,
          boxShadow: '0 10px 44px #0007',
          padding: '30px 26px',
        }}
      >
        {error && (
          <div className="mb-4 rounded-md bg-[#3d1113] px-3 py-2 text-center text-[14px] font-semibold text-rose-300">
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <h2 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-white">
              Pick a few genres you love
            </h2>
            <p className="mb-4 text-center text-sm text-white/80">
              It helps us recommend movies that match your vibe.
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGenre(g.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium text-white transition
                    ${
                      selectedGenres.includes(g.id)
                        ? 'border-transparent'
                        : 'border-white/15 hover:border-white/30'
                    }`}
                  style={{
                    background: selectedGenres.includes(g.id)
                      ? 'linear-gradient(88deg,#FF5B2E,#367cff 80%)'
                      : 'transparent',
                    boxShadow: selectedGenres.includes(g.id) ? '0 2px 7px #fdaf4111' : 'none',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                className="rounded-lg px-6 py-2 text-[15px] font-extrabold text-white"
                style={{ background: BTN_BG, boxShadow: '0 2px 10px #eb423b22' }}
                onClick={() => setStep(2)}
              >
                Next
              </button>
              <button
                className="text-[13px] font-extrabold text-[#fe9245]"
                onClick={() => finishOnboarding({ skipGenres: true })}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-white">
              Got some favorite movies?
            </h2>
            <p className="mb-3 text-center text-sm text-white/80">
              Add a few to tune recommendations even more.
            </p>

            <input
              type="text"
              className="mb-2 w-full rounded-lg bg-[#232330] px-3 py-2.5 text-[13px] font-medium text-white outline-none"
              placeholder="Search a movie…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {query && results.length > 0 && (
              <div className="mb-2 max-h-[220px] overflow-y-auto rounded-xl bg-[#242134]">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addMovie(r)}
                    className="flex w-full items-center gap-2 border-b border-[#302c37] px-3 py-2 text-left hover:bg-[#232330]"
                  >
                    <img
                      src={
                        r.poster_path
                          ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
                          : 'https://dummyimage.com/46x69/232330/fff&text=?'
                      }
                      alt=""
                      className="h-[69px] w-[46px] rounded object-cover"
                    />
                    <div className="text-white">
                      <div className="text-[13px] font-semibold">{r.title}</div>
                      <div className="text-[12px] text-white/70">
                        {r.release_date ? r.release_date.slice(0, 4) : '—'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {watchlist.length > 0 && (
              <div className="mb-2">
                <div className="mb-1 text-[14px] font-bold text-white">Your picks:</div>
                <div className="flex flex-wrap gap-2">
                  {watchlist.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col items-center rounded-md bg-[#231d2d] px-1 py-1"
                    >
                      <img
                        src={
                          m.poster_path
                            ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                            : 'https://dummyimage.com/60x90/232330/fff&text=?'
                        }
                        alt=""
                        className="mx-1.5 h-[90px] w-[60px] rounded object-cover"
                      />
                      <button
                        className="mt-0 text-[20px] font-normal text-rose-400"
                        onClick={() => removeMovie(m.id)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                className="rounded-md px-3 py-1.5 text-xs font-extrabold text-[#fe9245]"
                onClick={() => setStep(1)}
              >
                &lt; Back
              </button>
              <button
                disabled={loading}
                className="rounded-xl px-6 py-2 text-[15px] font-extrabold text-white disabled:opacity-60"
                style={{ background: BTN_BG, boxShadow: '0 2px 10px #eb423b22' }}
                onClick={() => finishOnboarding()}
              >
                {loading ? 'Saving…' : 'Finish'}
              </button>
              <button
                disabled={loading}
                className="text-xs font-extrabold text-[#fe9245]"
                onClick={() => finishOnboarding({ skipMovies: true })}
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}