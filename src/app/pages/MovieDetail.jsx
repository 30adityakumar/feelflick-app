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
  ChevronRight,
  Tv2,
  Film,
  Image as ImageIcon,
  Tag,
  Share2,
} from 'lucide-react'

const IMG = {
  backdrop: (p) => (p ? `https://image.tmdb.org/t/p/original${p}` : ''),
  poster: (p) => (p ? `https://image.tmdb.org/t/p/w500${p}` : ''),
  profile: (p) => (p ? `https://image.tmdb.org/t/p/w185${p}` : ''),
  logo: (p) => (p ? `https://image.tmdb.org/t/p/w92${p}` : ''),
  still: (p) => (p ? `https://image.tmdb.org/t/p/w500${p}` : ''),
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
  const [credits, setCredits] = useState({ cast: [], crew: [] })
  const [videos, setVideos] = useState([])
  const [recs, setRecs] = useState([])
  const [providers, setProviders] = useState({ flatrate: [], rent: [], buy: [], link: '' })
  const [images, setImages] = useState({ backdrops: [] })
  const [keywords, setKeywords] = useState([])
  const [certification, setCertification] = useState('')

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

  // TMDB data - Enhanced with more endpoints
  useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!TMDB.key) throw new Error('TMDB key missing')
        const [d, c, v, r, i, k, rel] = await Promise.all([
          fetch(`${TMDB.base}/movie/${id}?api_key=${TMDB.key}&language=en-US`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/credits?api_key=${TMDB.key}&language=en-US`).then((r) =>
            r.json()
          ),
          fetch(`${TMDB.base}/movie/${id}/videos?api_key=${TMDB.key}&language=en-US`).then((r) =>
            r.json()
          ),
          fetch(
            `${TMDB.base}/movie/${id}/recommendations?api_key=${TMDB.key}&language=en-US&page=1`
          ).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/images?api_key=${TMDB.key}`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/keywords?api_key=${TMDB.key}`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/release_dates?api_key=${TMDB.key}`).then((r) => r.json()),
        ])
        if (abort) return
        if (d?.success === false || d?.status_code)
          throw new Error(d?.status_message || 'Failed to load')

        setMovie(d)
        setCredits({ cast: (c?.cast || []).slice(0, 10), crew: c?.crew || [] })
        setVideos(v?.results || [])
        setRecs((r?.results || []).slice(0, 12))
        setImages({ backdrops: (i?.backdrops || []).slice(0, 6) })
        setKeywords((k?.keywords || []).slice(0, 12))
        
        // Get US certification
        const usCert = rel?.results
          ?.find((r) => r.iso_3166_1 === 'US')
          ?.release_dates?.[0]?.certification
        setCertification(usCert || '')
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
          const pick = (k) => (area[k] || []).slice(0, 6)
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
    return t ? `https://www.youtube.com/watch?v=${t.key}` : null
  }, [videos])

  const director = useMemo(() => {
    return credits.crew?.find((c) => c.job === 'Director')
  }, [credits])

  async function ensureAuthed() {
    if (user?.id) return true
    navigate('/', { replace: true, state: { from: `/movie/${id}` } })
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
      {/* Hero Section - Fixed header clearance with marginTop */}
      <div className="relative w-full" style={{ marginTop: 'var(--hdr-h, 64px)' }}>
        <div className="relative h-[55vh] md:h-[60vh]">
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

          {/* Enhanced Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 md:via-black/60 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-3/5 bg-gradient-to-t from-black to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end pb-6 md:pb-10">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 w-full">
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-end max-w-6xl">
                {/* Poster - Compact */}
                <div className="hidden md:block">
                  <div className="overflow-hidden rounded-md ring-2 ring-white/20 shadow-2xl">
                    {movie?.poster_path ? (
                      <img
                        src={IMG.poster(movie.poster_path)}
                        alt={movie?.title}
                        className="h-[260px] w-[173px] lg:h-[300px] lg:w-[200px] object-cover"
                        loading="eager"
                      />
                    ) : (
                      <div className="h-[260px] w-[173px] lg:h-[300px] lg:w-[200px] grid place-items-center bg-white/5 text-white/40 text-xs">
                        No poster
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="max-w-3xl space-y-2">
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 w-3/4 rounded bg-white/20" />
                      <div className="h-5 w-1/2 rounded bg-white/15" />
                    </div>
                  ) : error ? (
                    <div className="rounded-lg bg-red-500/10 p-3 text-red-300 text-sm">
                      {error}
                    </div>
                  ) : (
                    <>
                      {/* Title + Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight drop-shadow-2xl">
                          {movie?.title}
                        </h1>
                        {wlStatus === 'want_to_watch' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-300">
                            <Bookmark className="h-3 w-3" />
                            Watchlisted
                          </span>
                        )}
                        {wlStatus === 'watched' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] font-bold text-green-300">
                            <Check className="h-3 w-3" />
                            Watched
                          </span>
                        )}
                      </div>

                      {/* Tagline */}
                      {movie?.tagline && (
                        <p className="text-sm text-white/70 italic leading-tight">
                          "{movie.tagline}"
                        </p>
                      )}

                      {/* Director */}
                      {director && (
                        <p className="text-xs text-white/80">
                          Directed by <span className="font-semibold text-white/95">{director.name}</span>
                        </p>
                      )}

                      {/* Meta - Compact badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {rating && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30">
                            <Star className="h-3 w-3 fill-current text-green-400" />
                            <span className="text-green-400 font-bold">{rating}</span>
                          </div>
                        )}
                        {certification && (
                          <span className="px-2 py-0.5 rounded border border-white/30 text-white/90 font-bold">
                            {certification}
                          </span>
                        )}
                        {year && (
                          <span className="inline-flex items-center gap-1 text-white/80 font-medium">
                            <Calendar className="h-3 w-3" />
                            {year}
                          </span>
                        )}
                        {runtime && (
                          <span className="inline-flex items-center gap-1 text-white/80 font-medium">
                            <Clock className="h-3 w-3" />
                            {runtime}
                          </span>
                        )}
                      </div>

                      {/* Genres - Badge style */}
                      {movie?.genres?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {movie.genres.slice(0, 4).map((g) => (
                            <span
                              key={g.id}
                              className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[11px] font-medium"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Overview - 2 lines */}
                      {movie?.overview && (
                        <p className="hidden md:block text-sm text-white/90 leading-relaxed line-clamp-2 max-w-2xl drop-shadow-lg">
                          {movie.overview}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {ytTrailer && (
                          <a
                            href={ytTrailer}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2 text-sm font-bold text-black hover:bg-white/90 transition-all active:scale-95 shadow-xl"
                          >
                            <Play className="h-4 w-4 fill-current" />
                            Play Trailer
                          </a>
                        )}
                        <button
                          disabled={mutating}
                          onClick={toggleWatchlist}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur px-4 py-2 text-sm font-bold hover:bg-white/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <Bookmark className="h-4 w-4" />
                          <span className="hidden xs:inline">
                            {wlStatus === 'want_to_watch' ? 'Remove' : 'Watchlist'}
                          </span>
                        </button>
                        <button
                          disabled={mutating}
                          onClick={toggleWatched}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                            wlStatus === 'watched'
                              ? 'bg-white/20 backdrop-blur hover:bg-white/30'
                              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          <span className="hidden xs:inline">
                            {wlStatus === 'watched' ? 'Watched' : 'Watch'}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: movie?.title,
                                text: movie?.overview,
                                url: window.location.href,
                              })
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-sm font-bold hover:bg-white/20 transition-all active:scale-95"
                        >
                          <Share2 className="h-4 w-4" />
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

      {/* Content Sections - Fixed mobile spacing */}
      <div className="relative mt-4 md:-mt-8 z-30">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] xl:grid-cols-[1fr,340px] gap-6">
            {/* Main Content */}
            <div className="space-y-6 min-w-0">
              {/* Overview - Mobile only with proper spacing */}
              {movie?.overview && (
                <div className="md:hidden rounded-lg bg-white/5 backdrop-blur border border-white/10 p-4">
                  <h2 className="text-base font-bold mb-2">Overview</h2>
                  <p className="text-sm text-white/85 leading-relaxed">
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Where to Watch - Mobile Priority (shows at top) */}
              <div className="lg:hidden">
                <WhereToWatch providers={providers} />
              </div>

              {/* Cast */}
              {credits.cast?.length > 0 && <CastSection cast={credits.cast} />}

              {/* Videos */}
              {videos?.length > 0 && <VideosSection videos={videos} />}

              {/* Images Gallery */}
              {images.backdrops?.length > 0 && <ImagesSection images={images.backdrops} />}

              {/* Recommended */}
              {recs?.length > 0 && <Rail title="You Might Also Like" items={recs} />}
            </div>

            {/* Sidebar - Desktop Only */}
            <div className="hidden lg:block space-y-4 lg:sticky lg:top-20 lg:self-start">
              <WhereToWatch providers={providers} />
              {movie && <MovieDetails movie={movie} />}
              {movie?.production_companies?.length > 0 && (
                <ProductionCompanies companies={movie.production_companies} />
              )}
              {keywords?.length > 0 && <KeywordsSection keywords={keywords} />}
              {movie?.belongs_to_collection && (
                <CollectionCard collection={movie.belongs_to_collection} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== Components ===== */

function WhereToWatch({ providers }) {
  // Only show if flatrate (streaming) is available
  if (!providers.flatrate?.length) return null

  return (
    <div className="rounded-lg bg-white/5 backdrop-blur border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Tv2 className="h-4 w-4" />
          Where to Watch
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {providers.flatrate.map((p) => (
          <div
            key={p.provider_id}
            className="w-12 h-12 rounded-md bg-white/10 border border-white/10 p-1.5 flex items-center justify-center hover:scale-110 transition-transform"
            title={p.provider_name}
          >
            {p.logo_path ? (
              <img
                src={IMG.logo(p.logo_path)}
                alt={p.provider_name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-[8px] text-white/60 text-center leading-tight">
                {p.provider_name}
              </span>
            )}
          </div>
        ))}
      </div>
      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          More options
          <ChevronRight className="h-3 w-3" />
        </a>
      )}
      <p className="text-[10px] text-white/40 mt-2">via JustWatch</p>
    </div>
  )
}

function MovieDetails({ movie }) {
  const details = [
    { label: 'Budget', value: movie?.budget ? `$${(movie.budget / 1000000).toFixed(1)}M` : null },
    { label: 'Revenue', value: movie?.revenue ? `$${(movie.revenue / 1000000).toFixed(1)}M` : null },
    { label: 'Status', value: movie?.status },
    { label: 'Language', value: movie?.original_language?.toUpperCase() },
  ].filter((d) => d.value)

  if (!details.length) return null

  return (
    <div className="rounded-lg bg-white/5 backdrop-blur border border-white/10 p-4">
      <h2 className="text-sm font-bold mb-3">Details</h2>
      <div className="space-y-2">
        {details.map((d, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-white/60">{d.label}</span>
            <span className="text-white/90 font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductionCompanies({ companies }) {
  const top = companies.slice(0, 3)
  if (!top.length) return null

  return (
    <div className="rounded-lg bg-white/5 backdrop-blur border border-white/10 p-4">
      <h2 className="text-sm font-bold mb-3">Production</h2>
      <div className="flex flex-wrap gap-3">
        {top.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-center h-12 px-3 rounded bg-white/10 border border-white/10"
            title={c.name}
          >
            {c.logo_path ? (
              <img
                src={IMG.logo(c.logo_path)}
                alt={c.name}
                className="max-h-8 max-w-[80px] object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-[10px] text-white/70 text-center">{c.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function KeywordsSection({ keywords }) {
  if (!keywords?.length) return null

  return (
    <div className="rounded-lg bg-white/5 backdrop-blur border border-white/10 p-4">
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Keywords
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((k) => (
          <span
            key={k.id}
            className="px-2 py-1 rounded bg-white/10 text-white/70 text-[11px] font-medium hover:bg-white/20 transition-colors cursor-pointer"
          >
            {k.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function CollectionCard({ collection }) {
  const navigate = useNavigate()
  
  return (
    <div className="rounded-lg bg-white/5 backdrop-blur border border-white/10 p-4 overflow-hidden">
      <h2 className="text-sm font-bold mb-2">Part of a Collection</h2>
      <div className="relative aspect-[16/9] rounded overflow-hidden mb-2">
        {collection.backdrop_path ? (
          <img
            src={IMG.backdrop(collection.backdrop_path)}
            alt={collection.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-xs font-bold text-white line-clamp-2">{collection.name}</p>
        </div>
      </div>
      <button
        onClick={() => navigate(`/collection/${collection.id}`)}
        className="w-full text-xs font-semibold text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1"
      >
        View Collection
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  )
}

function CastSection({ cast }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-3">Top Cast</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-0.5">
        {cast.map((p) => (
          <div key={p.id} className="flex-shrink-0 w-[100px] group">
            <div className="aspect-[2/3] overflow-hidden rounded-md bg-white/5 border border-white/10 mb-2 shadow-md">
              {p.profile_path ? (
                <img
                  src={IMG.profile(p.profile_path)}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/30 text-xs">
                  No photo
                </div>
              )}
            </div>
            <h3 className="text-xs font-bold text-white/90 line-clamp-2 leading-tight mb-0.5">
              {p.name}
            </h3>
            <p className="text-[10px] text-white/60 line-clamp-1">{p.character}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function VideosSection({ videos }) {
  const filtered = videos.filter((v) => v.site === 'YouTube').slice(0, 6)
  if (!filtered.length) return null

  return (
    <div>
      <h2 className="text-base font-bold mb-3 flex items-center gap-2">
        <Film className="h-4 w-4" />
        Videos & Trailers
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((v) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.key}`}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-video rounded-md overflow-hidden bg-white/5 border border-white/10"
          >
            <img
              src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
              alt={v.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                <Play className="h-5 w-5 fill-current text-black ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
              <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                {v.name}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function ImagesSection({ images }) {
  if (!images?.length) return null

  return (
    <div>
      <h2 className="text-base font-bold mb-3 flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Images
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-0.5">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[200px] md:w-[240px] aspect-video rounded-md overflow-hidden bg-white/5 border border-white/10 shadow-md group"
          >
            <img
              src={IMG.still(img.file_path)}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function Rail({ title, items }) {
  const navigate = useNavigate()

  return (
    <div>
      <h2 className="text-base font-bold mb-3">{title}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate(`/movie/${m.id}`)}
            className="group text-left"
            title={m.title}
          >
            <div className="aspect-[2/3] overflow-hidden rounded-md bg-white/5 border border-white/10 mb-2 shadow-md group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
              {m.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                  alt={m.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/30 text-xs">
                  No poster
                </div>
              )}
            </div>
            <h3 className="text-xs font-bold text-white/90 line-clamp-2 leading-tight mb-0.5">
              {m.title}
            </h3>
            {m.vote_average > 0 && (
              <p className="text-[10px] text-white/60 flex items-center gap-0.5">
                <span className="text-yellow-400">★</span>
                {Math.round(m.vote_average * 10) / 10}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
