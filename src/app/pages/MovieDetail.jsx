// src/app/pages/MovieDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Play, Plus, Check, Star, Clock, ChevronRight, Tv2, Film, Image as ImageIcon, Tag, Share2, Eye, EyeOff, ArrowLeft } from 'lucide-react'

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
  const [wlStatus, setWlStatus] = useState(null) 
  const [mutating, setMutating] = useState(false)

  // Auth
  useEffect(() => {
    let unsub = supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data } = supabase.auth.onAuthStateChange((e, session) => setUser(session?.user || null))
    return () => { if (typeof unsub === 'function') unsub() ; data?.subscription?.unsubscribe() }
  }, [])

  // TMDB Data
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
        setCredits({ cast: c?.cast?.slice(0, 15) || [], crew: c?.crew || [] })
        setVideos(v?.results || [])
        setRecs(r?.results?.slice(0, 10) || [])
        setImages({ backdrops: i?.backdrops?.slice(0, 8) || [] })
        setKeywords(k?.keywords?.slice(0, 15) || [])

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
        const region = 'US'
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

  // Watchlist Status
  useEffect(() => {
    let active = true
    async function readWL() {
      if (!user?.id) { setWlStatus(null); return }
      // Using TMDB IDs
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

  async function ensureAuthed() {
    if (user?.id) return true
    navigate('/login', { replace: true, state: { from: `/movie/${id}` } })
    return false
  }

  async function ensureMovieRow(d) {
    try {
      await supabase.from('movies').upsert({
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
    } catch (e) { console.error("Movie upsert error:", e) }
  }

  async function toggleWatchlist() {
    if (!await ensureAuthed()) return
    setMutating(true)
    try {
      if (wlStatus === 'want_to_watch') {
        await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', Number(id))
        setWlStatus(null)
      } else {
        await ensureMovieRow(movie)
        await Promise.all([
          supabase.from('user_watchlist').upsert({ user_id: user.id, movie_id: Number(id), status: 'want_to_watch', added_at: new Date().toISOString() }, { onConflict: 'user_id,movie_id' }),
          supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', Number(id))
        ])
        setWlStatus('want_to_watch')
      }
    } catch (e) { console.warn('watchlist failed', e) } finally { setMutating(false) }
  }

  async function toggleWatched() {
    if (!await ensureAuthed()) return
    setMutating(true)
    try {
      if (wlStatus === 'watched') {
        await supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', Number(id))
        setWlStatus(null)
      } else {
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
    } catch (e) { console.warn('watched failed', e) } finally { setMutating(false) }
  }

  const rating = movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : null
  const year = yearOf(movie?.release_date)
  const runtime = formatRuntime(movie?.runtime)

  if (error) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold mb-2 text-purple-400">Oops!</h2>
      <p className="text-white/60 mb-6">{error}</p>
      <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition-colors">Go Home</button>
    </div>
  )

  return (
    <div className="relative bg-black text-white min-h-screen pb-20 selection:bg-purple-500/30">
      {/* Top Navigation Back Button (Mobile mainly) */}
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all active:scale-95 md:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Hero Section */}
      <div className="relative w-full">
        <div className="relative h-[60vh] md:h-[75vh] lg:h-[80vh] w-full">
          {/* Loading State */}
          {loading && <div className="absolute inset-0 bg-neutral-900 animate-pulse" />}
          
          {/* Backdrop */}
          {!loading && (
            <div className="absolute inset-0">
              {movie?.backdrop_path ? (
                <img src={IMG.backdrop(movie.backdrop_path)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-900" />
              )}
            </div>
          )}

          {/* Gradients - Carefully tuned for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent opacity-80" />
          <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black to-transparent" />

          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-end pb-10 md:pb-16">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10 w-full">
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-8 lg:gap-12 items-end">
                
                {/* Poster (Desktop) - Floating with shadow */}
                <div className="hidden md:block flex-shrink-0 relative group">
                  <div className="relative overflow-hidden rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-[1.02]">
                    {movie?.poster_path ? (
                      <img src={IMG.poster(movie.poster_path)} alt={movie?.title} className="w-[240px] lg:w-[300px] aspect-[2/3] object-cover" />
                    ) : (
                      <div className="w-[240px] lg:w-[300px] aspect-[2/3] bg-neutral-800 grid place-items-center text-white/30">No Poster</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Info Block */}
                <div className="max-w-4xl space-y-5 md:space-y-6">
                  {loading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-10 w-2/3 bg-white/10 rounded-lg" />
                      <div className="h-6 w-1/3 bg-white/10 rounded-lg" />
                    </div>
                  ) : (
                    <>
                      {/* Title & Meta */}
                      <div className="space-y-3">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white drop-shadow-xl">
                          {movie?.title}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm font-medium text-white/90">
                          {rating && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/10 backdrop-blur-md">
                              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                              <span className="font-bold">{rating}</span>
                            </div>
                          )}
                          {year && <span className="opacity-80">{year}</span>}
                          {certification && (
                            <span className="px-2 py-0.5 rounded border border-white/30 text-[11px] font-bold bg-black/20 backdrop-blur-sm">
                              {certification}
                            </span>
                          )}
                          {runtime && (
                            <span className="flex items-center gap-1.5 opacity-80">
                              <Clock className="h-3.5 w-3.5" /> {runtime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tagline & Overview */}
                      <div className="space-y-3">
                        {movie?.tagline && (
                          <p className="text-lg text-purple-200/90 italic font-medium tracking-wide">"{movie.tagline}"</p>
                        )}
                        {movie?.overview && (
                          <p className="text-base md:text-lg text-white/80 leading-relaxed line-clamp-4 md:line-clamp-none max-w-3xl font-light">
                            {movie.overview}
                          </p>
                        )}
                      </div>

                      {/* Genres */}
                      {movie?.genres?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {movie.genres.map(g => (
                            <span key={g.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-default backdrop-blur-sm">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {ytTrailer && (
                          <a 
                            href={ytTrailer} 
                            target="_blank" 
                            rel="noreferrer"
                            className="h-12 md:h-14 px-8 rounded-xl bg-white text-black font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                          >
                            <Play className="h-5 w-5 fill-black" />
                            <span>Play Trailer</span>
                          </a>
                        )}

                        <div className="flex items-center gap-3">
                          <button 
                            disabled={mutating} 
                            onClick={toggleWatchlist}
                            className={`h-12 md:h-14 w-12 md:w-14 rounded-full border flex items-center justify-center transition-all hover:scale-110 active:scale-90 backdrop-blur-md ${
                              wlStatus === 'want_to_watch' 
                                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' 
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            }`}
                            title={wlStatus === 'want_to_watch' ? "Remove from Watchlist" : "Add to Watchlist"}
                          >
                            {wlStatus === 'want_to_watch' ? <Check className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                          </button>

                          <button 
                            disabled={mutating} 
                            onClick={toggleWatched}
                            className={`h-12 md:h-14 w-12 md:w-14 rounded-full border flex items-center justify-center transition-all hover:scale-110 active:scale-90 backdrop-blur-md ${
                              wlStatus === 'watched' 
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.5)]' 
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            }`}
                            title={wlStatus === 'watched' ? "Mark as Unwatched" : "Mark as Watched"}
                          >
                            {wlStatus === 'watched' ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
                          </button>

                          <button 
                            onClick={() => { if (navigator.share) navigator.share({ title: movie?.title, text: movie?.overview, url: window.location.href }) }}
                            className="h-12 md:h-14 w-12 md:w-14 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-90"
                            title="Share"
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10 mt-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,360px] gap-12 xl:gap-16">
          
          {/* Left Column (Scrollable Content) */}
          <div className="space-y-12 min-w-0">
            {/* Mobile Where to Watch */}
            <div className="xl:hidden">
              <WhereToWatch providers={providers} />
            </div>

            <CastSection cast={credits.cast} />
            <VideosSection videos={videos} />
            <ImagesSection images={images.backdrops} />
            <Rail title="More Like This" items={recs} />
          </div>

          {/* Right Sidebar (Sticky on Desktop) */}
          <div className="hidden xl:block space-y-8 sticky top-28 self-start">
            <WhereToWatch providers={providers} />
            <MovieDetails movie={movie} />
            {keywords.length > 0 && <KeywordsSection keywords={keywords} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Sub-Components with Refined UI ---

function WhereToWatch({ providers }) {
  const hasOptions = providers.flatrate?.length || providers.rent?.length || providers.buy?.length
  if (!hasOptions) return null

  return (
    <div className="rounded-2xl bg-neutral-900/50 border border-white/10 p-6 backdrop-blur-xl">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
        <Tv2 className="h-5 w-5 text-purple-400" /> Where to Watch
      </h3>
      
      <div className="space-y-6">
        {providers.flatrate?.length > 0 && (
          <div>
            <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">Stream</p>
            <div className="flex flex-wrap gap-3">
              {providers.flatrate.map(p => (
                <div key={p.provider_id} className="group relative" title={p.provider_name}>
                  <img src={IMG.logo(p.logo_path)} alt={p.provider_name} className="h-12 w-12 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10" />
                </div>
              ))}
            </div>
          </div>
        )}

        {(providers.rent?.length > 0 || providers.buy?.length > 0) && (
          <div>
            <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-3">Rent or Buy</p>
            <div className="flex flex-wrap gap-3">
              {[...providers.rent, ...providers.buy].slice(0, 6).map((p, i) => (
                <div key={`${p.provider_id}-${i}`} className="group relative" title={p.provider_name}>
                  <img src={IMG.logo(p.logo_path)} alt={p.provider_name} className="h-12 w-12 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10 opacity-80 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {providers.link && (
        <a href={providers.link} target="_blank" rel="noreferrer" className="mt-6 block w-full text-center py-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold text-purple-300 hover:text-white transition-all border border-white/5">
          Check All Options
        </a>
      )}
    </div>
  )
}

function MovieDetails({ movie }) {
  if (!movie) return null
  const details = [
    { label: 'Status', value: movie.status },
    { label: 'Budget', value: movie.budget > 0 ? `$${(movie.budget / 1000000).toFixed(1)}M` : '-' },
    { label: 'Revenue', value: movie.revenue > 0 ? `$${(movie.revenue / 1000000).toFixed(1)}M` : '-' },
    { label: 'Original Language', value: movie.original_language?.toUpperCase() },
  ]
  return (
    <div className="rounded-2xl bg-neutral-900/50 border border-white/10 p-6 backdrop-blur-xl">
      <h3 className="text-lg font-bold mb-5">Information</h3>
      <div className="space-y-4">
        {details.map((d, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-white/40 font-medium">{d.label}</span>
            <span className="text-white/90 font-semibold">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KeywordsSection({ keywords }) {
  return (
    <div className="rounded-2xl bg-neutral-900/50 border border-white/10 p-6 backdrop-blur-xl">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
        <Tag className="h-4 w-4 text-purple-400" /> Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map(k => (
          <span key={k.id} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-white/60 hover:text-white transition-all cursor-default border border-white/5">
            {k.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function CastSection({ cast }) {
  if (!cast?.length) return null
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6 text-white">Top Cast</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cast.map(p => (
          <div key={p.id} className="group bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
            <div className="aspect-square rounded-full overflow-hidden mb-3 bg-neutral-800 mx-auto w-24 h-24 shadow-lg">
              {p.profile_path ? (
                <img src={IMG.profile(p.profile_path)} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-white/20">No Image</div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">{p.name}</h3>
              <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{p.character}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function VideosSection({ videos }) {
  const filtered = videos?.filter(v => v.site === 'YouTube').slice(0, 3) || []
  if (!filtered.length) return null
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Film className="h-6 w-6 text-purple-500" /> Videos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(v => (
          <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noreferrer" className="group relative aspect-video rounded-xl overflow-hidden bg-neutral-800 shadow-lg ring-1 ring-white/10 hover:ring-purple-500/50 transition-all">
            <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-300 shadow-2xl">
                <Play className="h-6 w-6 fill-white text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black to-transparent">
              <p className="text-sm font-semibold text-white line-clamp-1">{v.name}</p>
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
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <ImageIcon className="h-6 w-6 text-purple-500" /> Gallery
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
        {images.map((img, idx) => (
          <div key={idx} className="flex-shrink-0 w-[300px] md:w-[400px] aspect-video rounded-xl overflow-hidden bg-neutral-800 snap-start shadow-lg ring-1 ring-white/10 group">
            <img src={IMG.still(img.file_path)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
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
      <h2 className="text-2xl font-bold mb-6 text-white">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {items.map(m => (
          <div key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800 mb-3 shadow-lg ring-1 ring-white/5 group-hover:ring-purple-500/50 transition-all duration-300 relative">
              {m.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-white/30">No Poster</div>
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">{m.title}</h3>
            <div className="flex items-center justify-between text-xs text-white/50 mt-1.5">
              <span>{yearOf(m.release_date)}</span>
              <span className="flex items-center gap-1 text-yellow-500 font-medium"><Star className="h-3 w-3 fill-current" /> {m.vote_average?.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
