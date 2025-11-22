// src/app/pages/MovieDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Play, Bookmark, Check, Star, Clock, Calendar, ChevronRight, Tv2, Film, Image as ImageIcon, Tag, Share2, Eye, EyeOff, Plus } from 'lucide-react'

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

const yearOf = (d) => d?.slice?.(0, 4)

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
  
  // User State
  const [user, setUser] = useState(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [mutating, setMutating] = useState(false)

  // Auth
  useEffect(() => {
    let unsub
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // TMDB data
  useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!TMDB.key) throw new Error('TMDB key missing')
        const [d, c, v, r, i, k, rel] = await Promise.all([
          fetch(`${TMDB.base}/movie/${id}?api_key=${TMDB.key}&language=en-US`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/credits?api_key=${TMDB.key}&language=en-US`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/videos?api_key=${TMDB.key}&language=en-US`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/recommendations?api_key=${TMDB.key}&language=en-US&page=1`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/images?api_key=${TMDB.key}`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/keywords?api_key=${TMDB.key}`).then(r => r.json()),
          fetch(`${TMDB.base}/movie/${id}/release_dates?api_key=${TMDB.key}`).then(r => r.json()),
        ])

        if (abort) return
        if (d?.success === false || d?.status_code) throw new Error(d?.status_message || 'Failed to load')

        setMovie(d)
        setCredits({ cast: c?.cast?.slice(0, 10) || [], crew: c?.crew || [] })
        setVideos(v?.results || [])
        setRecs(r?.results?.slice(0, 12) || [])
        setImages({ backdrops: i?.backdrops?.slice(0, 6) || [] })
        setKeywords(k?.keywords?.slice(0, 12) || [])

        const usCert = rel?.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.[0]?.certification
        setCertification(usCert || '')

      } catch (e) {
        if (!abort) setError(e?.message || 'Could not load movie.')
      } finally {
        if (!abort) setLoading(false)
      }
    }
    load()
    return () => { abort = true }
  }, [id])

  // Providers
  useEffect(() => {
    let active = true
    async function loadProviders() {
      try {
        if (!TMDB.key) return
        const res = await fetch(`${TMDB.base}/movie/${id}/watch/providers?api_key=${TMDB.key}`)
        const json = await res.json()
        const area = json?.results?.['US'] || null
        if (!active) return

        if (area) {
          const pick = (k) => (area[k] || []).slice(0, 6)
          setProviders({ flatrate: pick('flatrate'), rent: pick('rent'), buy: pick('buy'), link: area.link })
        } else {
          setProviders({ flatrate: [], rent: [], buy: [], link: '' })
        }
      } catch {
        if (!active) return
        setProviders({ flatrate: [], rent: [], buy: [], link: '' })
      }
    }
    loadProviders()
    return () => { active = false }
  }, [id])

  // Watchlist & Watched Status Sync
  useEffect(() => {
    let active = true
    async function syncStatus() {
      if (!user?.id || !id) return
      
      const tmdbId = Number(id)

      // Check Watchlist (using TMDB ID directly)
      const { data: wl } = await supabase
        .from('user_watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .eq('movie_id', tmdbId)
        .maybeSingle()
      
      // Check History (using TMDB ID directly)
      const { data: wh } = await supabase
        .from('movies_watched')
        .select('movie_id')
        .eq('user_id', user.id)
        .eq('movie_id', tmdbId)
        .maybeSingle()

      if (!active) return
      
      setIsInWatchlist(!!wl)
      setIsWatched(!!wh)
    }
    syncStatus()
    return () => { active = false }
  }, [user, id])

  const ytTrailer = useMemo(() => {
    const t = videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    return t ? `https://www.youtube.com/watch?v=${t.key}` : null
  }, [videos])

  const director = useMemo(() => {
    return credits.crew?.find(c => c.job === 'Director')
  }, [credits])

  async function ensureAuthed() {
    if (user?.id) return true
    navigate('/auth', { replace: true, state: { from: `/movie/${id}` } })
    return false
  }

  // --- ACTION HANDLERS ---

  async function ensureMovieInDb(movieData) {
    await supabase
      .from('movies')
      .upsert({
        tmdb_id: movieData.id,
        title: movieData.title,
        original_title: movieData.original_title,
        overview: movieData.overview,
        poster_path: movieData.poster_path,
        backdrop_path: movieData.backdrop_path,
        release_date: movieData.release_date || null,
        vote_average: movieData.vote_average,
        vote_count: movieData.vote_count,
        popularity: movieData.popularity,
        original_language: movieData.original_language,
        json_data: movieData
      }, { onConflict: 'tmdb_id' })
  }

  async function toggleWatchlist() {
    if (!await ensureAuthed()) return
    setMutating(true)
    const tmdbId = Number(id)

    try {
      if (isInWatchlist) {
        await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
        setIsInWatchlist(false)
      } else {
        setIsInWatchlist(true)
        setIsWatched(false) // Optimistic update

        await ensureMovieInDb(movie)
        await Promise.all([
          supabase.from('user_watchlist').upsert({ 
            user_id: user.id, 
            movie_id: tmdbId, 
            added_at: new Date().toISOString(), 
            status: 'want_to_watch' 
          }, { onConflict: 'user_id,movie_id' }),
          
          supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
        ])
      }
    } catch (e) {
      console.warn('watchlist toggle failed', e)
    } finally {
      setMutating(false)
    }
  }

  async function toggleWatched() {
    if (!await ensureAuthed()) return
    setMutating(true)
    const tmdbId = Number(id)

    try {
      if (isWatched) {
        await supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
        setIsWatched(false)
      } else {
        setIsWatched(true)
        setIsInWatchlist(false) // Optimistic update

        await ensureMovieInDb(movie)
        await Promise.all([
          supabase.from('movies_watched').upsert({
            user_id: user.id,
            movie_id: tmdbId,
            title: movie.title,
            poster: movie.poster_path,
            release_date: movie.release_date || null,
            vote_average: movie.vote_average,
            genre_ids: movie.genres?.map(g => g.id) || [],
            watched_at: new Date().toISOString(),
            source: 'movie_detail'
          }, { onConflict: 'user_id,movie_id' }),
          
          supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', tmdbId)
        ])
      }
    } catch (e) {
      console.warn('watched toggle failed', e)
    } finally {
      setMutating(false)
    }
  }

  const rating = movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : null
  const year = yearOf(movie?.release_date)
  const runtime = formatRuntime(movie?.runtime)

  return (
    // REMOVED: style={{ marginTop: 'var(--hdr-h, 64px)' }} on the main image container
    <div className="relative bg-black text-white min-h-screen pb-20 md:pb-8">
      
      {/* Hero Section - Full Bleed */}
      <div className="relative w-full h-[70vh] md:h-[80vh]"> {/* Increased height for better impact */}
        
        {/* Backdrop - Absolute top 0 */}
        <div className="absolute inset-0">
          {movie?.backdrop_path ? (
            <img
              src={IMG.backdrop(movie.backdrop_path)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
          
          {/* Gradients - Same as HeroSlider */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black via-black/70 to-transparent z-10" />
          <div className="absolute inset-y-0 left-0 w-full md:w-3/5 bg-gradient-to-r from-black via-black/70 md:via-black/40 to-transparent z-10" />
          <div className="absolute bottom-0 inset-x-0 h-4/5 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end pb-8 md:pb-12 pt-24"> {/* Added pt-24 for header clearance */}
          <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 w-full">
            <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 md:gap-10 items-end">
              
              {/* Poster - Desktop Only */}
              <div className="hidden md:block flex-shrink-0">
                <div className="rounded-xl overflow-hidden ring-1 ring-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  {movie?.poster_path ? (
                    <img
                      src={IMG.poster(movie.poster_path)}
                      alt={movie?.title}
                      className="w-[220px] lg:w-[260px] aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-[220px] lg:w-[260px] aspect-[2/3] grid place-items-center bg-white/5 text-white/40 text-xs">
                      No poster
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-4 md:space-y-6 max-w-4xl">
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 w-3/4 rounded bg-white/10" />
                    <div className="h-6 w-1/2 rounded bg-white/10" />
                  </div>
                ) : error ? (
                  <div className="rounded-lg bg-red-500/10 p-4 text-red-300 text-sm border border-red-500/20">{error}</div>
                ) : (
                  <>
                    {/* Title Block */}
                    <div className="space-y-2">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] drop-shadow-2xl">
                        {movie?.title}
                      </h1>
                      
                      {/* Tagline */}
                      {movie?.tagline && (
                        <p className="text-lg text-white/80 font-medium italic drop-shadow-md">
                          "{movie.tagline}"
                        </p>
                      )}
                    </div>

                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm md:text-base font-medium">
                      {rating && (
                        <div className="flex items-center gap-1.5 text-purple-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-white font-bold">{rating}</span>
                        </div>
                      )}
                      {year && <span className="text-white/90">{year}</span>}
                      {runtime && (
                        <div className="flex items-center gap-1.5 text-white/70">
                          <span className="w-1 h-1 rounded-full bg-white/40" />
                          {runtime}
                        </div>
                      )}
                      {certification && (
                        <span className="px-2 py-0.5 rounded border border-white/30 text-white/80 text-xs font-bold">
                          {certification}
                        </span>
                      )}
                    </div>

                    {/* Genres */}
                    {movie?.genres?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {movie.genres.slice(0, 4).map(g => (
                          <span key={g.id} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/90 text-xs font-medium backdrop-blur-sm">
                            {g.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Overview */}
                    {movie?.overview && (
                      <p className="hidden md:block text-white/80 text-base md:text-lg leading-relaxed line-clamp-3 max-w-3xl drop-shadow-md">
                        {movie.overview}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {ytTrailer && (
                        <a
                          href={ytTrailer}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                          <Play className="h-5 w-5 fill-current" />
                          Watch Trailer
                        </a>
                      )}

                      <button
                        disabled={mutating}
                        onClick={toggleWatchlist}
                        className={`inline-flex items-center justify-center h-12 px-6 rounded-xl font-bold transition-all border backdrop-blur-md ${
                          isInWatchlist 
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                            : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {isInWatchlist ? <Check className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                        {isInWatchlist ? 'In Watchlist' : 'Watchlist'}
                      </button>

                      <button
                        disabled={mutating}
                        onClick={toggleWatched}
                        className={`inline-flex items-center justify-center h-12 w-12 rounded-xl transition-all border backdrop-blur-md ${
                          isWatched 
                            ? 'bg-green-500/20 border-green-500/50 text-green-300' 
                            : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                        }`}
                        title={isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                      >
                        {isWatched ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>

                      <button
                        onClick={() => navigator.share?.({ title: movie?.title, text: movie?.overview, url: window.location.href })}
                        className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-md"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="relative z-30 mt-8 md:mt-12">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,360px] gap-8 lg:gap-12">
            
            {/* Main Content */}
            <div className="space-y-10 min-w-0">
              {/* Mobile Overview */}
              {movie?.overview && (
                <div className="md:hidden">
                  <h2 className="text-xl font-bold mb-3">Overview</h2>
                  <p className="text-white/80 leading-relaxed">{movie.overview}</p>
                </div>
              )}

              {/* Mobile Providers */}
              <div className="lg:hidden">
                <WhereToWatch providers={providers} />
              </div>

              {credits.cast?.length > 0 && <CastSection cast={credits.cast} />}
              {videos?.length > 0 && <VideosSection videos={videos} />}
              {images.backdrops?.length > 0 && <ImagesSection images={images.backdrops} />}
              {recs?.length > 0 && <Rail title="You Might Also Like" items={recs} />}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block space-y-6">
              <WhereToWatch providers={providers} />
              <MovieDetails movie={movie} director={director} />
              {movie?.production_companies?.length > 0 && <ProductionCompanies companies={movie.production_companies} />}
              {keywords?.length > 0 && <KeywordsSection keywords={keywords} />}
              {movie?.belongs_to_collection && <CollectionCard collection={movie.belongs_to_collection} />}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// --- Component Helpers ---

function WhereToWatch({ providers }) {
  if (!providers.flatrate?.length) return null
  return (
    <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5">
      <h3 className="font-bold mb-4 flex items-center gap-2 text-purple-300">
        <Tv2 className="h-4 w-4" /> Where to Watch
      </h3>
      <div className="flex flex-wrap gap-3">
        {providers.flatrate.map((p) => (
          <div key={p.provider_id} className="w-12 h-12 rounded-xl bg-white/5 p-2 border border-white/5" title={p.provider_name}>
            <img src={IMG.logo(p.logo_path)} alt={p.provider_name} className="w-full h-full object-contain rounded-md" />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/30 mt-3">Data via JustWatch</p>
    </div>
  )
}

function MovieDetails({ movie, director }) {
  const details = [
    { label: 'Director', value: director?.name },
    { label: 'Budget', value: movie?.budget ? `$${(movie.budget / 1000000).toFixed(1)}M` : null },
    { label: 'Revenue', value: movie?.revenue ? `$${(movie.revenue / 1000000).toFixed(1)}M` : null },
    { label: 'Status', value: movie?.status },
    { label: 'Language', value: movie?.original_language?.toUpperCase() },
  ].filter(d => d.value)

  if (!details.length) return null
  return (
    <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5">
      <h3 className="font-bold mb-4 text-purple-300">Details</h3>
      <div className="space-y-3">
        {details.map((d, i) => (
          <div key={i} className="flex justify-between text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <span className="text-white/50">{d.label}</span>
            <span className="text-white font-medium">{d.value}</span>
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
    <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5">
      <h3 className="font-bold mb-4 text-purple-300">Production</h3>
      <div className="flex flex-wrap gap-3">
        {top.map(c => (
          <div key={c.id} className="h-10 px-3 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
            {c.logo_path ? (
              <img src={IMG.logo(c.logo_path)} alt={c.name} className="h-5 w-auto object-contain brightness-0 invert" />
            ) : (
              <span className="text-xs text-white/70">{c.name}</span>
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
    <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5">
      <h3 className="font-bold mb-4 flex items-center gap-2 text-purple-300">
        <Tag className="h-4 w-4" /> Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map(k => (
          <span key={k.id} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/70 transition-colors cursor-default border border-white/5">
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
    <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 group cursor-pointer" onClick={() => navigate(`/collection/${collection.id}`)}>
      <h3 className="font-bold mb-4 text-purple-300">Part of a Collection</h3>
      <div className="relative aspect-video rounded-xl overflow-hidden">
        {collection.backdrop_path ? (
          <img src={IMG.backdrop(collection.backdrop_path)} alt={collection.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-white/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-bold text-white group-hover:text-purple-300 transition-colors">{collection.name}</p>
          <p className="text-xs text-white/60 flex items-center gap-1 mt-1">
            View Collection <ChevronRight className="h-3 w-3" />
          </p>
        </div>
      </div>
    </div>
  )
}

function CastSection({ cast }) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Top Cast</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {cast.map(p => (
          <div key={p.id} className="flex-shrink-0 w-32 group">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-3 shadow-md">
              {p.profile_path ? (
                <img src={IMG.profile(p.profile_path)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/20 text-xs">No Image</div>
              )}
            </div>
            <h3 className="font-bold text-sm truncate group-hover:text-purple-400 transition-colors">{p.name}</h3>
            <p className="text-xs text-white/50 truncate">{p.character}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function VideosSection({ videos }) {
  const filtered = videos.filter(v => v.site === 'YouTube').slice(0, 4)
  if (!filtered.length) return null
  return (
    <section>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(v => (
          <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noreferrer" className="group relative aspect-video rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 hover:ring-purple-500/50 transition-all">
            <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                <Play className="h-6 w-6 fill-white text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
              <p className="text-sm font-medium truncate">{v.name}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

function ImagesSection({ images }) {
  if (!images?.length) return null
  return (
    <section>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Backdrops</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {images.map((img, idx) => (
          <div key={idx} className="flex-shrink-0 w-64 aspect-video rounded-xl overflow-hidden bg-white/5 shadow-lg hover:ring-1 hover:ring-purple-500/50 transition-all">
            <img src={IMG.still(img.file_path)} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  )
}

function Rail({ title, items }) {
  const navigate = useNavigate()
  if (!items?.length) return null
  return (
    <section>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(m => (
          <div key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-2 shadow-lg relative">
              {m.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/20">No Poster</div>
              )}
              {m.vote_average > 0 && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-bold flex items-center gap-1 border border-white/10">
                  <Star className="h-2.5 w-2.5 fill-purple-500 text-purple-500" />
                  {m.vote_average.toFixed(1)}
                </div>
              )}
            </div>
            <h3 className="text-sm font-bold leading-tight group-hover:text-purple-400 transition-colors line-clamp-1">{m.title}</h3>
            <p className="text-xs text-white/40">{yearOf(m.release_date)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
