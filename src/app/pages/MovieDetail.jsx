// src/app/pages/MovieDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  Play,
  Bookmark,
  Check,
  Star,
  Clock,
  Calendar,
  Tv2,
  ChevronRight,
} from 'lucide-react'

const IMG = {
  backdrop: (p) => (p ? `https://image.tmdb.org/t/p/original${p}` : ''),
  poster: (p) => (p ? `https://image.tmdb.org/t/p/w500${p}` : ''),
  profile: (p) => (p ? `https://image.tmdb.org/t/p/w185${p}` : ''),
  logo: (p) => (p ? `https://image.tmdb.org/t/p/w92${p}` : ''),
}

const TMDB = {
  base: 'https://api.themoviedb.org/3',
  key: import.meta.env.VITE_TMDB_API_KEY,
}

function formatRuntime(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}
const yearOf = (d) => d?.slice?.(0, 4) || ''

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [movie, setMovie] = useState(null)
  const [cast, setCast] = useState([])
  const [videos, setVideos] = useState([])
  const [similar, setSimilar] = useState([])
  const [recs, setRecs] = useState([])
  const [providers, setProviders] = useState({ flatrate: [], rent: [], buy: [], link: '' })

  const [user, setUser] = useState(null)
  const [wlStatus, setWlStatus] = useState(null)
  const [mutating, setMutating] = useState(false)

  // Auth
  useEffect(() => {
    let unsub
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    unsub = data?.subscription?.unsubscribe
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [])

  // TMDB data
  useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!TMDB.key) throw new Error('TMDB key missing')
        const [d, c, v, s, r] = await Promise.all([
          fetch(`${TMDB.base}/movie/${id}?api_key=${TMDB.key}&language=en-US`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/credits?api_key=${TMDB.key}&language=en-US`).then((r) =>
            r.json()
          ),
          fetch(`${TMDB.base}/movie/${id}/videos?api_key=${TMDB.key}&language=en-US`).then((r) =>
            r.json()
          ),
          fetch(`${TMDB.base}/movie/${id}/similar?api_key=${TMDB.key}&language=en-US&page=1`).then(
            (r) => r.json()
          ),
          fetch(
            `${TMDB.base}/movie/${id}/recommendations?api_key=${TMDB.key}&language=en-US&page=1`
          ).then((r) => r.json()),
        ])
        if (abort) return
        if (d?.success === false || d?.status_code)
          throw new Error(d?.status_message || 'Failed to load')

        setMovie(d)
        setCast((c?.cast || []).slice(0, 8))
        setVideos(v?.results || [])
        setSimilar((s?.results || []).slice(0, 12))
        setRecs((r?.results || []).slice(0, 12))
      } catch (e) {
        if (!abort) setError(e?.message || 'Could not load movie.')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    load()
    return () => {
      abort = true
    }
  }, [id])

  // Providers
  useEffect(() => {
    let active = true
    async function loadProviders() {
      try {
        if (!TMDB.key) return
        const res = await fetch(`${TMDB.base}/movie/${id}/watch/providers?api_key=${TMDB.key}`)
        const json = await res.json()
        const region = (navigator?.language || 'en-US').split('-')[1]?.toUpperCase() || 'US'
        const area = json?.results?.[region] || json?.results?.US || null
        if (!active) return

        if (area) {
          const pick = (k) => (area[k] || []).slice(0, 8)
          setProviders({
            flatrate: pick('flatrate'),
            rent: pick('rent'),
            buy: pick('buy'),
            link: area.link || '',
          })
        } else {
          setProviders({ flatrate: [], rent: [], buy: [], link: '' })
        }
      } catch {
        if (!active) return
        setProviders({ flatrate: [], rent: [], buy: [], link: '' })
      }
    }
    loadProviders()
    return () => {
      active = false
    }
  }, [id])

  // Watchlist status
  useEffect(() => {
    let active = true
    async function readWL() {
      if (!user?.id) {
        setWlStatus(null)
        return
      }
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('status')
        .eq('user_id', user.id)
        .eq('movie_id', Number(id))
        .maybeSingle()
      if (!active) return
      if (error) setWlStatus(null)
      else setWlStatus(data?.status || null)
    }
    readWL()
    return () => {
      active = false
    }
  }, [user, id])

  const ytTrailer = useMemo(() => {
    const t = (videos || []).find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    )
    return t
      ? `https://www.youtube.com/watch?v=${t.key}`
      : movie?.title
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
          movie.title + ' trailer official'
        )}`
      : null
  }, [videos, movie])

  async function ensureAuthed() {
    if (user?.id) return true
    navigate('/auth', { replace: true, state: { from: `/movie/${id}` } })
    return false
  }

  async function ensureMovieRow(d) {
    try {
      const row = {
        id: d.id,
        title: d.title || d.name || '',
        poster_path: d.poster_path || null,
        backdrop_path: d.backdrop_path || null,
        release_date: d.release_date || null,
        vote_average: d.vote_average ?? null,
        popularity: d.popularity ?? null,
      }

      const { data: existing, error: selErr } = await supabase
        .from('movies')
        .select('id')
        .eq('id', d.id)
        .maybeSingle()

      if (selErr) {
        const { error: insBlindErr } = await supabase.from('movies').insert(row)
        if (insBlindErr) {
          const msg = `${insBlindErr.message || ''}`.toLowerCase()
          const dup =
            insBlindErr.code === '23505' || msg.includes('duplicate') || msg.includes('conflict')
          if (!dup) throw insBlindErr
        }
        return
      }

      if (existing) {
        await supabase
          .from('movies')
          .update({
            poster_path: row.poster_path,
            backdrop_path: row.backdrop_path,
            vote_average: row.vote_average,
            popularity: row.popularity,
            release_date: row.release_date,
            title: row.title,
          })
          .eq('id', d.id)
      } else {
        const { error: insErr } = await supabase.from('movies').insert(row)
        if (insErr) {
          const msg = `${insErr.message || ''}`.toLowerCase()
          const dup = insErr.code === '23505' || msg.includes('duplicate') || msg.includes('conflict')
          if (!dup) throw insErr
        }
      }
    } catch (e) {
      throw e
    }
  }

  async function writeStatus(nextStatus) {
    await ensureMovieRow(movie)

    const { error: updErr, count } = await supabase
      .from('user_watchlist')
      .update({ status: nextStatus })
      .eq('user_id', user.id)
      .eq('movie_id', Number(id))
      .select('user_id', { count: 'exact' })

    if (!updErr && (count ?? 0) > 0) return true

    const { error: insErr } = await supabase
      .from('user_watchlist')
      .insert({ user_id: user.id, movie_id: Number(id), status: nextStatus })

    if (insErr) {
      const msg = `${insErr.message || ''}`.toLowerCase()
      const dup = insErr.code === '23505' || msg.includes('duplicate') || msg.includes('conflict')
      if (dup) {
        await supabase
          .from('user_watchlist')
          .update({ status: nextStatus })
          .eq('user_id', user.id)
          .eq('movie_id', Number(id))
        return true
      }
      throw insErr
    }
    return true
  }

  async function deleteRow() {
    await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', Number(id))
  }

  async function toggleWatchlist() {
    if (!(await ensureAuthed())) return
    setMutating(true)
    try {
      if (wlStatus === 'want_to_watch') {
        await deleteRow()
        setWlStatus(null)
      } else if (wlStatus === 'watched') {
        await writeStatus('want_to_watch')
        setWlStatus('want_to_watch')
      } else {
        await writeStatus('want_to_watch')
        setWlStatus('want_to_watch')
      }
    } catch (e) {
      console.warn('watchlist write failed:', e)
    } finally {
      setMutating(false)
    }
  }

  async function toggleWatched() {
    if (!(await ensureAuthed())) return
    setMutating(true)
    try {
      if (wlStatus === 'watched') {
        await deleteRow()
        setWlStatus(null)
      } else {
        await writeStatus('watched')
        setWlStatus('watched')
      }
    } catch (e) {
      console.warn('watched write failed:', e)
    } finally {
      setMutating(false)
    }
  }

  const rating = movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : null
  const year = yearOf(movie?.release_date)
  const runtime = formatRuntime(movie?.runtime)

  return (
    <div className="relative bg-black text-white min-h-screen pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="relative w-full" style={{ paddingTop: 'var(--hdr-h, 64px)' }}>
        <div className="relative h-[75vh] sm:h-[80vh] md:h-[85vh]">
          {/* Backdrop */}
          <div className="absolute inset-0">
            {movie?.backdrop_path ? (
              <img
                src={IMG.backdrop(movie.backdrop_path)}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-neutral-900" />
            )}
          </div>

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 md:via-black/40 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-2/5 bg-gradient-to-t from-black via-black/95 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end pb-10 sm:pb-14 md:pb-16 lg:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12 w-full">
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 md:gap-8 items-end">
                {/* Poster */}
                <div className="hidden sm:block">
                  <div className="overflow-hidden rounded-xl ring-2 ring-white/20 shadow-2xl">
                    {movie?.poster_path ? (
                      <img
                        src={IMG.poster(movie.poster_path)}
                        alt=""
                        className="h-[280px] w-[187px] md:h-[340px] md:w-[227px] lg:h-[380px] lg:w-[253px] object-cover"
                        loading="eager"
                      />
                    ) : (
                      <div className="h-[280px] w-[187px] md:h-[340px] md:w-[227px] lg:h-[380px] lg:w-[253px] grid place-items-center bg-white/5 text-white/40 text-sm">
                        No poster
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="max-w-3xl">
                  {loading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-12 w-3/4 rounded bg-white/20" />
                      <div className="h-6 w-1/2 rounded bg-white/15" />
                    </div>
                  ) : error ? (
                    <div className="rounded-xl bg-red-500/10 p-4 text-red-300">{error}</div>
                  ) : (
                    <>
                      {/* Title + Badges */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight drop-shadow-2xl">
                          {movie?.title}
                        </h1>
                        {wlStatus === 'want_to_watch' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-bold text-blue-300">
                            <Bookmark className="h-3 w-3" />
                            Watchlisted
                          </span>
                        )}
                        {wlStatus === 'watched' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-xs font-bold text-green-300">
                            <Check className="h-3 w-3" />
                            Watched
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                        {rating && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/20 border border-green-500/30">
                            <Star className="h-3.5 w-3.5 text-green-400 fill-current" />
                            <span className="text-green-400 font-bold">{rating}</span>
                          </div>
                        )}
                        {year && <span className="text-white/90 font-semibold">{year}</span>}
                        {runtime && (
                          <span className="text-white/90 font-semibold flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {runtime}
                          </span>
                        )}
                        {movie?.genres?.length > 0 && (
                          <span className="text-white/70">
                            • {movie.genres.map((g) => g.name).slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Overview */}
                      {movie?.overview && (
                        <p className="text-sm sm:text-base text-white/90 leading-relaxed line-clamp-3 mb-5 drop-shadow-lg max-w-2xl">
                          {movie.overview}
                        </p>
                      )}

                      {/* Buttons */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {ytTrailer && (
                          <a
                            href={ytTrailer}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-black hover:bg-white/90 transition-all active:scale-95 shadow-2xl"
                          >
                            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                            Play Trailer
                          </a>
                        )}

                        <button
                          disabled={mutating}
                          onClick={toggleWatchlist}
                          className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold hover:bg-white/30 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                        >
                          <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="hidden xs:inline">
                            {wlStatus === 'want_to_watch' ? 'Listed' : 'Watchlist'}
                          </span>
                        </button>

                        <button
                          disabled={mutating}
                          onClick={toggleWatched}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-all active:scale-95 disabled:opacity-50 shadow-xl ${
                            wlStatus === 'watched'
                              ? 'bg-white/20 backdrop-blur-md hover:bg-white/30'
                              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400'
                          }`}
                        >
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="hidden xs:inline">
                            {wlStatus === 'watched' ? 'Watched' : 'Watched'}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="relative -mt-12 sm:-mt-16 md:-mt-20 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6 md:gap-8">
            {/* Main Content */}
            <div className="space-y-6 md:space-y-8">
              {/* Cast */}
              {cast?.length > 0 && <CastSection cast={cast} />}

              {/* Similar & Recommended */}
              {similar?.length > 0 && <Rail title="Similar Movies" items={similar} />}
              {recs?.length > 0 && <Rail title="You Might Also Like" items={recs} />}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Where to Watch */}
              <WhereToWatch providers={providers} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== Components ===== */

function WhereToWatch({ providers }) {
  const hasAny =
    providers.flatrate?.length || providers.rent?.length || providers.buy?.length
  if (!hasAny) return null

  const Row = ({ label, list }) => {
    if (!list?.length) return null
    return (
      <div className="mt-4 first:mt-3">
        <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
          {label}
        </h4>
        <div className="flex flex-wrap gap-2">
          {list.map((p) => (
            <div key={`${label}-${p.provider_id}`} className="relative group">
              <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 p-1.5 flex items-center justify-center overflow-hidden">
                {p.logo_path ? (
                  <img
                    src={IMG.logo(p.logo_path)}
                    alt={p.provider_name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-[8px] text-white/60 text-center">
                    {p.provider_name}
                  </span>
                )}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black/90 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {p.provider_name}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Tv2 className="h-4 w-4 text-white/90" />
        <h3 className="text-base font-bold">Where to Watch</h3>
      </div>
      <p className="text-[10px] text-white/50 mb-2">Data via JustWatch</p>

      <Row label="Stream" list={providers.flatrate} />
      <Row label="Rent" list={providers.rent} />
      <Row label="Buy" list={providers.buy} />

      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white transition-colors"
        >
          More options
          <ChevronRight className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

function CastSection({ cast }) {
  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold mb-4">Top Cast</h2>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-3 sm:gap-4">
        {cast.map((p) => (
          <div key={p.id} className="group">
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/5 border border-white/10 mb-2">
              {p.profile_path ? (
                <img
                  src={IMG.profile(p.profile_path)}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/40 text-xs">
                  No photo
                </div>
              )}
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white/90 line-clamp-2 leading-tight mb-0.5">
              {p.name}
            </h3>
            <p className="text-[10px] sm:text-xs text-white/60 line-clamp-1">{p.character}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Rail({ title, items }) {
  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((m) => (
          <Link key={m.id} to={`/movie/${m.id}`} className="group" title={m.title}>
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/5 border border-white/10 mb-2">
              {m.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                  alt={m.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/40 text-xs">
                  No poster
                </div>
              )}
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white/90 line-clamp-2 leading-tight mb-1">
              {m.title}
            </h3>
            {m.vote_average && (
              <p className="text-[10px] sm:text-xs text-white/60">
                ★ {Math.round(m.vote_average * 10) / 10}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
