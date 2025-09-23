// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'

const ACCENT = '#fe9245'
const ACCENT2 = '#eb423b'
const BTN_BG = 'linear-gradient(90deg,#fe9245 10%,#eb423b 90%)'
const GENRE_SELECTED_BG =
  'linear-gradient(88deg, var(--theme-color,#FF5B2E), var(--theme-color-secondary,#367cff) 80%)'
const DARK_BG = 'rgba(22,19,28,0.9)'

export default function Onboarding() {
  const nav = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  const [step, setStep] = useState(1)
  const [selectedGenres, setSelectedGenres] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showAllResults, setShowAllResults] = useState(false)
  const [watchlist, setWatchlist] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

  /* --------------------------- Auth + profile gate --------------------------- */
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
      const uid = session.user.id
      // Your users table has only `id` (FK to auth.users)
      const { data, error: selErr } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', uid)
        .single()

      if (selErr) {
        console.warn('users select failed:', selErr)
        // Don’t block; allow onboarding to render
        setChecking(false)
        return
      }

      if (data?.onboarding_complete || session.user.user_metadata?.onboarding_complete) {
        nav('/home', { replace: true })
      } else {
        setChecking(false)
      }
    })()
  }, [session, nav])

  /* ------------------------------ Static genres ----------------------------- */
  const GENRES = useMemo(
    () => [
      { id: 28, label: 'Action' }, { id: 12, label: 'Adventure' },
      { id: 16, label: 'Animation' }, { id: 35, label: 'Comedy' },
      { id: 80, label: 'Crime' }, { id: 99, label: 'Documentary' },
      { id: 18, label: 'Drama' }, { id: 10751, label: 'Family' },
      { id: 14, label: 'Fantasy' }, { id: 36, label: 'History' },
      { id: 27, label: 'Horror' }, { id: 10402, label: 'Music' },
      { id: 9648, label: 'Mystery' }, { id: 10749, label: 'Romance' },
      { id: 878, label: 'Sci-fi' }, { id: 53, label: 'Thriller' },
    ],
    []
  )

  /* ------------------------------- TMDb search ------------------------------ */
  useEffect(() => {
    let active = true
    if (!query) { setResults([]); setShowAllResults(false); return }

    fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
        query
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        const all = (data.results || []).sort(
          (a, b) =>
            (b.popularity || 0) - (a.popularity || 0) ||
            (b.vote_average || 0) - (a.vote_average || 0)
        )
        setResults(all)
        setShowAllResults(false)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [query, TMDB_KEY])

  /* --------------------------------- helpers -------------------------------- */
  const toggleGenre = (id) =>
    setSelectedGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))

  const handleAddMovie = (m) => {
    if (!watchlist.some((x) => x.id === m.id)) {
      setWatchlist((w) => [...w, m])
    }
    setQuery('')
    setResults([])
    setShowAllResults(false)
  }
  const handleRemoveMovie = (id) => setWatchlist((w) => w.filter((m) => m.id !== id))

  /* --------------------------- finish / save handler ------------------------- */
  async function saveAndGo(skipGenres = false, skipMovies = false) {
    if (!session?.user) return
    setError('')
    setLoading(true)
    const user_id = session.user.id
    const email = session.user.email
    const name = session.user.user_metadata?.name || ''

    try {
      // Ensure a users row exists
      await supabase.from('users').upsert([{ id: user_id, email, name }], { onConflict: 'id' })

      // Genres
      if (!skipGenres) {
        await supabase.from('user_preferences').delete().eq('user_id', user_id)
        if (selectedGenres.length) {
          await supabase.from('user_preferences').insert(
            selectedGenres.map((genre_id) => ({ user_id, genre_id }))
          )
        }
      }

      // Movies: upsert each TMDb movie into `movies`, get PK id, then write `user_watchlist`
      if (!skipMovies) {
        const moviePkIds = []
        for (const m of watchlist) {
          // Upsert by unique tmdb_id; then re-select PK id
          const up = await supabase
            .from('movies')
            .upsert(
              {
                tmdb_id: m.id,
                title: m.title,
                poster_path: m.poster_path ?? null,
                release_date: m.release_date ?? null,
              },
              { onConflict: 'tmdb_id' }
            )
            .select('id') // PostgREST returns affected rows when .select() is chained
          if (up.error) throw up.error

          const id = Array.isArray(up.data) ? up.data[0]?.id : up.data?.id
          if (!id) {
            // Fallback: explicit select if upsert didn’t return row
            const sel = await supabase.from('movies').select('id').eq('tmdb_id', m.id).single()
            if (sel.error) throw sel.error
            moviePkIds.push(sel.data.id)
          } else {
            moviePkIds.push(id)
          }
        }

        // Clear any onboarding rows, then insert fresh (avoid relying on a composite unique index)
        for (const movie_id of moviePkIds) {
          await supabase.from('user_watchlist').delete().eq('user_id', user_id).eq('movie_id', movie_id)
          const ins = await supabase
            .from('user_watchlist')
            .insert({ user_id, movie_id, status: 'onboarding' })
          if (ins.error) throw ins.error
        }
      }

      // Mark onboarding complete in BOTH places (table + auth metadata)
      const u1 = await supabase.from('users').update({ onboarding_complete: true }).eq('id', user_id)
      if (u1.error) throw u1.error

      // Update auth metadata (ignore benign PKCE console warnings that supabase-js may log)
      const u2 = await supabase.auth.updateUser({ data: { onboarding_complete: true } })
      if (u2.error) {
        // Not fatal to block the user, but log it
        console.warn('auth.updateUser metadata failed:', u2.error?.message)
      }

      // Go home
      nav('/home', { replace: true })
    } catch (e) {
      console.error('Onboarding save failed:', e)
      // Surface a concise, friendly error
      const msg =
        e?.message?.includes('foreign key constraint')
          ? 'We couldn’t save your picks because the movie record wasn’t created yet. Please try again.'
          : e?.message || 'Could not save your preferences — please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  /* ---------------------------------- UI ----------------------------------- */
  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white font-bold text-xl">
        Loading profile…
      </div>
    )
  }

  // Responsive card sizing (matches your previous approach)
  const CARD_WIDTH = typeof window !== 'undefined' && window.innerWidth < 700 ? '100vw' : '700px'
  const CARD_MARGIN =
    typeof window !== 'undefined' && window.innerWidth < 700 ? '11px' : '0 auto'
  const genreFontSize = 12

  return (
    <div
      className="min-h-screen w-screen flex flex-col items-stretch justify-stretch relative"
      style={{
        background: `#0c1017`,
      }}
    >
      {/* Brand lockup */}
      <div className="absolute left-8 top-6 z-10 flex items-center gap-2.5">
        <img src="/logo.png" alt="FeelFlick" className="w-[42px] h-[42px] rounded-[12px] shadow-md" />
        <span className="text-[23px] font-extrabold text-white tracking-tight drop-shadow-lg">
          FeelFlick
        </span>
      </div>

      {/* Card */}
      <div
        className="self-center flex flex-col"
        style={{
          width: CARD_WIDTH,
          margin: CARD_MARGIN,
          minHeight: 500,
          marginTop: 72,
          marginBottom: 16,
          background: DARK_BG,
          borderRadius: 22,
          boxShadow: '0 8px 44px 0 #0007',
          padding: '36px 30px 27px 30px',
          zIndex: 10,
        }}
      >
        {error && (
          <div className="text-red-200 bg-[#3d1113] rounded-md text-center mb-4 font-semibold text-[14.5px] py-2 px-1.5">
            {error}
          </div>
        )}

        {/* Step 1 — Genres */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-extrabold text-white text-center mb-1 tracking-tight">
              Let’s get to know your taste.
            </h2>
            <div className="text-[13px] font-normal text-[#e9e9ef] text-center mb-3 mt-1 tracking-tight">
              Pick a few genres you love — it helps us recommend movies that truly match your energy.
            </div>

            <div className="grid grid-cols-4 gap-2 w-full mx-auto mb-4 justify-items-center items-center">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="w-[120px] h-[34px] rounded-xl border text-white font-medium transition-all duration-150"
                  style={{
                    margin: '3px 0',
                    border: `1.1px solid ${ACCENT}`,
                    background: selectedGenres.includes(g.id) ? GENRE_SELECTED_BG : 'transparent',
                    boxShadow: selectedGenres.includes(g.id) ? '0 2px 7px #fdaf4111' : 'none',
                    padding: '3.5px 0',
                    fontSize: genreFontSize,
                  }}
                  onClick={() => toggleGenre(g.id)}
                >
                  <span className="font-medium text-center leading-[1.17] truncate">{g.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-center mt-2 gap-6">
              <button
                className="px-6 py-2 rounded-lg font-extrabold text-[15px] text-white"
                style={{
                  background: BTN_BG,
                  boxShadow: '0 2px 10px #eb423b22',
                  opacity: loading ? 0.7 : 1,
                  minWidth: 80,
                  letterSpacing: 0.01,
                }}
                disabled={loading}
                onClick={() => setStep(2)}
              >
                Next
              </button>
              <button
                className="bg-none text-[#fe9245] font-extrabold text-[13.5px] border-none cursor-pointer min-w-[44px]"
                disabled={loading}
                onClick={() => saveAndGo(true, false)}
              >
                Skip
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Movies */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-extrabold text-white text-center mb-1 tracking-tight">
              Got some favorite movies?
            </h2>
            <div className="text-[13px] text-white/90 text-center mb-2 mt-1 tracking-tight">
              Pick a few to help us understand your taste and give you more personalized suggestions.
            </div>

            <input
              type="text"
              placeholder="Search a movie…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#232330] rounded-lg py-2.5 px-3 text-[13px] font-medium text-white outline-none border-none mb-2 mt-0 shadow"
            />

            {query && results.length > 0 && (
              <div className="bg-[#242134] rounded-[20px] max-h-[200px] overflow-y-auto mb-1.5 shadow">
                {(showAllResults ? results : results.slice(0, 3)).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center px-3 py-1.5 border-b border-[#302c37] cursor-pointer gap-1.5 transition-colors duration-100 hover:bg-[#232330]"
                    onClick={() => handleAddMovie(r)}
                  >
                    <img
                      src={
                        r.poster_path
                          ? `https://image.tmdb.org/t/p/w185${r.poster_path}`
                          : 'https://dummyimage.com/80x120/232330/fff&text=No+Image'
                      }
                      alt={r.title}
                      className="w-[27px] h-[40px] object-cover rounded-[5px] mr-0.5 mb-0.5 bg-[#101012]"
                    />
                    <span className="text-white font-semibold text-[13px]">
                      {r.title}{' '}
                      <span className="text-white/70 font-normal">
                        {r.release_date ? `(${r.release_date.slice(0, 4)})` : ''}
                      </span>
                    </span>
                  </div>
                ))}
                {!showAllResults && results.length > 3 && (
                  <div
                    className="text-center py-1 text-[#fe9245] font-semibold text-[14px] cursor-pointer select-none"
                    onClick={() => setShowAllResults(true)}
                  >
                    See more
                  </div>
                )}
              </div>
            )}

            {watchlist.length > 0 && (
              <div>
                <div className="text-white font-bold text-[14px] mt-2.5 mb-1.5">Your picks:</div>
                <div className="flex flex-wrap gap-2.5 mb-2.5">
                  {watchlist.map((m) => (
                    <div key={m.id} className="flex flex-col items-center gap-0.5 bg-[#231d2d] rounded-md px-0.5 py-0.5">
                      <img
                        src={
                          m.poster_path
                            ? `https://image.tmdb.org/t/p/w92${m.poster_path}`
                            : 'https://dummyimage.com/80x120/232330/fff&text=No+Image'
                        }
                        alt={m.title}
                        className="w-[60px] h-[90px] object-cover rounded bg-[#101012] mx-1.5"
                      />
                      <span className="text-white text-[13px] mt-1 text-center">{m.title}</span>
                      <button
                        className="bg-none border-none text-[#fd7069] text-[22px] mt-0 mx-0 cursor-pointer font-normal opacity-80"
                        onClick={() => handleRemoveMovie(m.id)}
                        tabIndex={-1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-2 gap-4">
              <button
                className="px-3 py-1.5 rounded-md font-extrabold text-xs text-[#fe9245] bg-none border-none mr-2 cursor-pointer"
                disabled={loading}
                onClick={() => setStep(1)}
              >
                &lt; Back
              </button>
              <button
                className="px-6 py-2 rounded-xl font-extrabold text-[15px] text-white"
                style={{ background: BTN_BG, boxShadow: '0 2px 10px #eb423b22', opacity: loading ? 0.7 : 1, minWidth: 65 }}
                disabled={loading}
                onClick={() => saveAndGo(false, false)}
              >
                Finish
              </button>
              <button
                className="bg-none text-[#fe9245] font-extrabold text-xs border-none cursor-pointer min-w-[44px]"
                disabled={loading}
                onClick={() => saveAndGo(false, true)}
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