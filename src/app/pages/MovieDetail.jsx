// src/app/pages/MovieDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Play, Bookmark, Check, Star, Clock, Calendar, ChevronRight, Tv2, Film, Image as ImageIcon, Tag, Share2, Eye, EyeOff, Plus } from 'lucide-react'

const IMG = {
  backdrop: (p) => p ? `https://image.tmdb.org/t/p/original${p}` : '',
  poster: (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : '',
  profile: (p) => p ? `https://image.tmdb.org/t/p/w185${p}` : '',
  logo: (p) => p ? `https://image.tmdb.org/t/p/w92${p}` : '',
  still: (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : '',
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
  const [error, setError] = useState(null)
  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState({ cast: [], crew: [] })
  const [videos, setVideos] = useState([])
  const [recs, setRecs] = useState([])
  const [providers, setProviders] = useState({ flatrate: [], rent: [], buy: [], link: '' })
  const [images, setImages] = useState({ backdrops: [] })
  const [keywords, setKeywords] = useState([])
  const [certification, setCertification] = useState(null)
  const [user, setUser] = useState(null)
  const [wlStatus, setWlStatus] = useState(null) // 'want_to_watch' or 'watched' or null
  const [mutating, setMutating] = useState(false)

  // Auth
  useEffect(() => {
    let unsub = supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data } = supabase.auth.onAuthStateChange((e, session) => setUser(session?.user || null))
    return () => { if (typeof unsub === 'function') unsub() ; data?.subscription?.unsubscribe() }
  }, [])

  // TMDB data
  useEffect(() => {
    let abort = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!TMDB.key) throw new Error("TMDB key missing")
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
        if (d?.success === false || d?.status_code) throw new Error(d?.status_message || "Failed to load")

        setMovie(d)
        setCredits({ cast: c?.cast?.slice(0, 10) || [], crew: c?.crew || [] })
        setVideos(v?.results || [])
        setRecs(r?.results?.slice(0, 12) || [])
        setImages({ backdrops: i?.backdrops?.slice(0, 6) || [] })
        setKeywords(k?.keywords?.slice(0, 12) || [])

        const usCert = rel?.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.['0']?.certification
        setCertification(usCert)

      } catch (e) {
        if (!abort) setError(e?.message || "Could not load movie.")
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
        // const region = navigator?.language?.split('-')[1]?.toUpperCase() || 'US'
        const region = 'US' // Default to US for consistency or use logic above
        const area = json?.results?.[region] || null
        if (!active) return

        if (area) {
          setProviders({
            flatrate: area.flatrate || [],
            rent: area.rent || [],
            buy: area.buy || [],
            link: area.link || ''
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
    return () => { active = false }
  }, [id])

  // Watchlist status
  useEffect(() => {
    let active = true
    async function readWL() {
      if (!user?.id) {
        setWlStatus(null)
        return
      }
      // Use TMDB ID directly as per updated schema logic
      const { data: wlData } = await supabase.from('user_watchlist').select('movie_id').eq('user_id', user.id).eq('movie_id', Number(id)).maybeSingle()
      const { data: whData } = await supabase.from('movies_watched').select('movie_id').eq('user_id', user.id).eq('movie_id', Number(id)).maybeSingle()

      if (!active) return

      if (wlData) setWlStatus('want_to_watch')
      else if (whData) setWlStatus('watched')
      else setWlStatus(null)
    }
    readWL()
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
    navigate('/login', { replace: true, state: { from: `/movie/${id}` } })
    return false
  }

  // IMPORTANT: Upsert movie to DB for reference
  async function ensureMovieRow(d) {
    try {
      await supabase
        .from('movies')
        .upsert({
          tmdb_id: d.id,
          title: d.title || d.name,
          original_title: d.original_title,
          overview: d.overview,
          poster_path: d.poster_path,
          backdrop_path: d.backdrop_path,
          release_date: d.release_date || null,
          vote_average: d.vote_average,
          vote_count: d.vote_count,
          popularity: d.popularity,
          original_language: d.original_language,
          json_data: d
        }, { onConflict: 'tmdb_id' })
    } catch (e) {
      console.error("Movie upsert error:", e)
    }
  }

  async function toggleWatchlist() {
    if (!await ensureAuthed()) return
    setMutating(true)
    try {
      if (wlStatus === 'want_to_watch') {
        // Remove
        await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', Number(id))
        setWlStatus(null)
      } else {
        // Add (and remove from watched if there)
        await ensureMovieRow(movie)
        await Promise.all([
          supabase.from('user_watchlist').upsert({ user_id: user.id, movie_id: Number(id), status: 'want_to_watch', added_at: new Date().toISOString() }, { onConflict: 'user_id,movie_id' }),
          supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', Number(id))
        ])
        setWlStatus('want_to_watch')
      }
    } catch (e) {
      console.warn('watchlist failed', e)
    } finally {
      setMutating(false)
    }
  }

  async function toggleWatched() {
    if (!await ensureAuthed()) return
    setMutating(true)
    try {
      if (wlStatus === 'watched') {
        // Remove
        await supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', Number(id))
        setWlStatus(null)
      } else {
        // Add (and remove from watchlist if there)
        await ensureMovieRow(movie)
        await Promise.all([
          supabase.from('movies_watched').upsert({
            user_id: user.id, movie_id: Number(id), watched_at: new Date().toISOString(),
            title: movie.title, poster: movie.poster_path, vote_average: movie.vote_average,
            release_date: movie.release_date || null, genre_ids: movie.genres?.map(g => g.id) || []
          }, { onConflict: 'user_id,movie_id' }),
          supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', Number(id))
        ])
        setWlStatus('watched')
      }
    } catch (e) {
      console.warn('watched failed', e)
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
      <div className="relative w-full">
        <div className="relative h-[55vh] md:h-[70vh]" style={{ marginTop: 'var(--hdr-h, 0px)' }}>
          {/* Backdrop */}
          <div className="absolute inset-0">
            {movie?.backdrop_path ? (
              <img src={IMG.backdrop(movie.backdrop_path)} alt="" className="w-full h-full object-cover loading-eager" />
            ) : (
              <div className="w-full h-full bg-neutral-900" />
            )}
          </div>

          {/* Enhanced Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end pb-8 md:pb-12">
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 w-full">
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 md:gap-10 items-end">
                
                {/* Poster (Desktop) */}
                <div className="hidden md:block flex-shrink-0">
                  <div className="overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10">
                    {movie?.poster_path ? (
                      <img src={IMG.poster(movie.poster_path)} alt={movie?.title} className="w-[220px] lg:w-[260px] aspect-[2/3] object-cover" />
                    ) : (
                      <div className="w-[220px] lg:w-[260px] aspect-[2/3] bg-neutral-800 grid place-items-center text-white/30">No Poster</div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="max-w-3xl space-y-4">
                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-12 w-3/4 bg-white/10 rounded" />
                      <div className="h-6 w-1/2 bg-white/10 rounded" />
                    </div>
                  ) : error ? (
                    <div className="rounded-lg bg-red-500/10 p-4 text-red-300 text-sm">{error}</div>
                  ) : (
                    <>
                      {/* Title & Badges */}
                      <div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight drop-shadow-2xl mb-3">
                          {movie?.title}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/80">
                          {rating && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                              <Star className="h-3.5 w-3.5 text-purple-400 fill-purple-400" />
                              <span className="text-purple-100 font-bold">{rating}</span>
                            </div>
                          )}
                          {year && <span>{year}</span>}
                          {certification && <span className="px-1.5 py-0.5 rounded border border-white/20 text-xs font-bold">{certification}</span>}
                          {runtime && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" /> {runtime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tagline */}
                      {movie?.tagline && (
                        <p className="text-base md:text-lg text-white/70 italic font-medium">"{movie.tagline}"</p>
                      )}

                      {/* Overview */}
                      {movie?.overview && (
                        <p className="text-sm md:text-base text-white/90 leading-relaxed line-clamp-4 max-w-2xl drop-shadow-md">
                          {movie.overview}
                        </p>
                      )}

                      {/* Genres */}
                      {movie?.genres?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {movie.genres.map(g => (
                            <span key={g.id} className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:bg-white/20 transition-colors cursor-default">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-4">
                        {/* Trailer / Watch Now */}
                        {ytTrailer && (
                          <a 
                            href={ytTrailer} 
                            target="_blank" 
                            rel="noreferrer"
                            className="group inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/20"
                          >
                            <Play className="h-5 w-5 fill-white group-hover:scale-110 transition-transform" />
                            <span>Watch Trailer</span>
                          </a>
                        )}

                        {/* Watchlist */}
                        <button 
                          disabled={mutating} 
                          onClick={toggleWatchlist}
                          className={`inline-flex items-center justify-center h-12 w-12 rounded-xl border backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${
                            wlStatus === 'want_to_watch' 
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                              : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                          }`}
                          title={wlStatus === 'want_to_watch' ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          {wlStatus === 'want_to_watch' ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        </button>

                        {/* Watched */}
                        <button 
                          disabled={mutating} 
                          onClick={toggleWatched}
                          className={`inline-flex items-center justify-center h-12 w-12 rounded-xl border backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${
                            wlStatus === 'watched' 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                              : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                          }`}
                          title={wlStatus === 'watched' ? "Mark as Unwatched" : "Mark as Watched"}
                        >
                          {wlStatus === 'watched' ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>

                        {/* Share */}
                        <button 
                          onClick={() => { if (navigator.share) navigator.share({ title: movie?.title, text: movie?.overview, url: window.location.href }) }}
                          className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                          title="Share"
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
      </div>

      {/* Content Sections */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 lg:px-12 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8 lg:gap-12">
          
          {/* Main Column */}
          <div className="space-y-10 min-w-0">
            {/* Mobile Only: Where to Watch */}
            <div className="lg:hidden">
              <WhereToWatch providers={providers} />
            </div>

            <CastSection cast={credits.cast} />
            <VideosSection videos={videos} />
            <ImagesSection images={images.backdrops} />
            <Rail title="You Might Also Like" items={recs} />
          </div>

          {/* Sidebar (Desktop) */}
          <div className="hidden lg:block space-y-6 sticky top-24 self-start">
            <WhereToWatch providers={providers} />
            <MovieDetails movie={movie} />
            {keywords.length > 0 && <KeywordsSection keywords={keywords} />}
            {movie?.belongs_to_collection && <CollectionCard collection={movie.belongs_to_collection} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Sub-components (Styled for Production) ---

function WhereToWatch({ providers }) {
  if (!providers.flatrate?.length && !providers.rent?.length && !providers.buy?.length) return null
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Tv2 className="h-4 w-4 text-purple-400" /> Where to Watch
        </h2>
      </div>
      {/* Flatrate */}
      {providers.flatrate?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-2 uppercase tracking-wider font-bold">Stream</p>
          <div className="flex flex-wrap gap-2">
            {providers.flatrate.map(p => (
              <div key={p.provider_id} className="group relative" title={p.provider_name}>
                <img src={IMG.logo(p.logo_path)} alt={p.provider_name} className="h-10 w-10 rounded-lg shadow-lg group-hover:scale-110 transition-transform" />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Rent/Buy combined for brevity */}
      {(providers.rent?.length > 0 || providers.buy?.length > 0) && (
        <div>
          <p className="text-xs text-white/50 mb-2 uppercase tracking-wider font-bold">Rent / Buy</p>
          <div className="flex flex-wrap gap-2">
            {[...providers.rent, ...providers.buy].slice(0, 6).map((p, i) => (
              <div key={`${p.provider_id}-${i}`} className="group relative" title={p.provider_name}>
                <img src={IMG.logo(p.logo_path)} alt={p.provider_name} className="h-10 w-10 rounded-lg shadow-lg group-hover:scale-110 transition-transform opacity-80 hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      )}
      {providers.link && (
        <a href={providers.link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors">
          View all options <ChevronRight className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

function MovieDetails({ movie }) {
  if (!movie) return null
  const details = [
    { label: 'Status', value: movie.status },
    { label: 'Budget', value: movie.budget ? `$${(movie.budget / 1000000).toFixed(1)}M` : '-' },
    { label: 'Revenue', value: movie.revenue ? `$${(movie.revenue / 1000000).toFixed(1)}M` : '-' },
    { label: 'Original Language', value: movie.original_language?.toUpperCase() },
  ]
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
      <h2 className="text-base font-bold mb-4">Details</h2>
      <div className="space-y-3">
        {details.map((d, i) => (
          <div key={i} className="flex justify-between text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
            <span className="text-white/50">{d.label}</span>
            <span className="text-white/90 font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KeywordsSection({ keywords }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
      <h2 className="text-base font-bold mb-4 flex items-center gap-2">
        <Tag className="h-4 w-4 text-purple-400" /> Tags
      </h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map(k => (
          <span key={k.id} className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors cursor-default border border-white/5">
            {k.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function CollectionCard({ collection }) {
  if (!collection) return null
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden group cursor-pointer">
      <div className="relative aspect-video">
        {collection.backdrop_path && <img src={IMG.backdrop(collection.backdrop_path)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-4">
          <span className="font-bold text-white">{collection.name}</span>
        </div>
      </div>
      <div className="p-3 bg-white/5 text-center">
        <span className="text-xs font-bold text-purple-300 flex items-center justify-center gap-1">
          View Collection <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  )
}

function CastSection({ cast }) {
  if (!cast?.length) return null
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-white/90">Top Cast</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {cast.map(p => (
          <div key={p.id} className="flex-shrink-0 w-[120px] snap-start">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 mb-2">
              {p.profile_path ? (
                <img src={IMG.profile(p.profile_path)} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-white/30">No Image</div>
              )}
            </div>
            <h3 className="text-sm font-bold text-white leading-tight">{p.name}</h3>
            <p className="text-xs text-white/50 line-clamp-1">{p.character}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function VideosSection({ videos }) {
  const filtered = videos?.filter(v => v.site === 'YouTube').slice(0, 4) || []
  if (!filtered.length) return null
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-white/90 flex items-center gap-2">
        <Film className="h-5 w-5 text-purple-400" /> Videos
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(v => (
          <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noreferrer" className="group relative aspect-video rounded-xl overflow-hidden bg-neutral-800">
            <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-5 w-5 fill-white text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
              <p className="text-sm font-medium text-white line-clamp-1">{v.name}</p>
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
      <h2 className="text-xl font-bold mb-4 text-white/90 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-purple-400" /> Gallery
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {images.map((img, idx) => (
          <div key={idx} className="flex-shrink-0 w-[280px] aspect-video rounded-xl overflow-hidden bg-neutral-800 snap-start">
            <img src={IMG.still(img.file_path)} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Rail({ title, items }) {
  const navigate = useNavigate()
  if (!items?.length) return null
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-white/90">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(m => (
          <div key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800 mb-2 shadow-lg ring-1 ring-white/5 group-hover:ring-purple-500/50 transition-all">
              {m.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-white/30">No Poster</div>
              )}
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">{m.title}</h3>
            <div className="flex items-center justify-between text-xs text-white/50 mt-1">
              <span>{yearOf(m.release_date)}</span>
              <span className="flex items-center gap-1 text-yellow-500"><Star className="h-3 w-3 fill-current" /> {m.vote_average?.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
