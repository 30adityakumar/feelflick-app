// src/features/onboarding/Onboarding.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Check, Loader2 } from 'lucide-react'

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
]

export default function Onboarding() {
  const nav = useNavigate()
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY
  const [userId, setUserId] = useState(null)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pickedGenres, setPickedGenres] = useState(new Set())
  const [movies, setMovies] = useState([])
  const [pickedMovies, setPickedMovies] = useState(new Set())

  // Get the authed user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data?.user?.id || null
      setUserId(id)
      if (!id) nav('/auth', { replace: true })
    })
  }, [nav])

  // Load 12 trending movies (fallback included)
  useEffect(() => {
    let abort = false
    ;(async () => {
      if (!TMDB_KEY) {
        if (!abort) {
          setMovies([
            { id: 155, title: 'The Dark Knight', poster_path: '/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg' },
            { id: 680, title: 'Pulp Fiction', poster_path: '/fIE3lAGcZDV1G6XM5KmuWnNsPp1.jpg' },
            { id: 550, title: 'Fight Club', poster_path: '/a26cQPRhJPX6GbWfQbvZdrrp9j9.jpg' },
            { id: 603, title: 'The Matrix', poster_path: '/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg' },
            { id: 27205, title: 'Inception', poster_path: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg' },
            { id: 1891, title: 'The Empire Strikes Back', poster_path: '/7BuH8itoSrLExs2YZSsM01Qk2no.jpg' },
          ])
        }
        return
      }
      try {
        const r = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`)
        const j = await r.json()
        const top = (j?.results || []).filter(m => m.poster_path).slice(0, 12)
        if (!abort) setMovies(top)
      } catch {
        if (!abort) setMovies([])
      }
    })()
    return () => { abort = true }
  }, [TMDB_KEY])

  const canContinueStep1 = pickedGenres.size >= 2 && pickedGenres.size <= 5
  const imgBase = 'https://image.tmdb.org/t/p/w342'

  function toggleGenre(id) {
    setPickedGenres(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else if (s.size < 5) s.add(id)
      return s
    })
  }

  function toggleMovie(id) {
    setPickedMovies(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else if (s.size < 3) s.add(id)
      return s
    })
  }

  const pickedGenreList = useMemo(() => Array.from(pickedGenres), [pickedGenres])
  const pickedMovieList = useMemo(() => Array.from(pickedMovies), [pickedMovies])

  async function finish() {
    if (!userId) return
    setSaving(true)
    setError('')
    try {
      // 1) save genres
      if (pickedGenreList.length) {
        const rows = pickedGenreList.map(gid => ({ user_id: userId, genre_id: gid }))
        await supabase.from('user_preferences').upsert(rows, { onConflict: 'user_id,genre_id', ignoreDuplicates: true })
      }
      // 2) optionally seed watchlist with onboarding status
      if (pickedMovieList.length) {
        const rows = pickedMovieList.map(mid => ({
          user_id: userId, movie_id: mid, status: 'onboarding',
        }))
        await supabase.from('user_watchlist').upsert(rows, { onConflict: 'user_id,movie_id', ignoreDuplicates: true })
      }
      // 3) mark onboarding complete
      await supabase.from('users').update({ onboarding_complete: true }).eq('id', userId)

      // 4) go home (tell the PostAuthGate we just finished)
      nav('/home', { replace: true, state: { fromOnboarding: true } })
    } catch (e) {
      setError(e?.message || 'Could not save preferences.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 md:px-6">
      {/* brand background is provided by your page shell; we keep this section clean */}
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold tracking-tight text-white">
            Let’s tailor FeelFlick to you
          </h1>
          <p className="mt-2 text-[13px] text-white/75">
            Pick a few genres you like {step === 1 ? '→ next, choose a couple of movies (optional).' : 'and confirm.'}
          </p>
        </div>

        {/* Card wrapper */}
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-md">
          {step === 1 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[12px] text-white/70">
                  Choose <span className="text-white/90">2–5</span> genres you enjoy
                </p>
                <span className="text-[12px] text-white/60">{pickedGenres.size} selected</span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {GENRES.map(g => {
                  const active = pickedGenres.has(g.id)
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g.id)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[14px] transition
                        ${active
                          ? 'border-brand-100/60 bg-brand-100/10 text-white'
                          : 'border-white/12 bg-white/[.05] text-white/85 hover:bg-white/10'}
                      `}
                    >
                      <span>{g.name}</span>
                      {active && <Check className="h-4 w-4 text-brand-100" />}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canContinueStep1}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 py-2.5 text-[.95rem] font-semibold text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[12px] text-white/70">
                  Pick up to <span className="text-white/90">3</span> movies you like (optional)
                </p>
                <span className="text-[12px] text-white/60">{pickedMovies.size} selected</span>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {movies.map(m => {
                  const active = pickedMovies.has(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMovie(m.id)}
                      className={`group relative overflow-hidden rounded-2xl ring-1 transition
                        ${active ? 'ring-brand-100/70' : 'ring-white/10 hover:ring-white/20'}
                      `}
                      title={m.title}
                    >
                      {m.poster_path ? (
                        <img
                          src={`${imgBase}${m.poster_path}`}
                          alt={m.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="aspect-[2/3] w-full bg-white/10" />
                      )}
                      {active && (
                        <div className="absolute inset-0 grid place-items-center bg-black/45 text-white">
                          <Check className="h-6 w-6 text-brand-100" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[.92rem] text-white/85 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={finish}
                  disabled={saving || pickedGenreList.length < 2}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 py-2.5 text-[.95rem] font-semibold text-white disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Finish
                </button>
              </div>
            </>
          )}

          {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </section>
  )
}