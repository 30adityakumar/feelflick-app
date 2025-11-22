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

  // Watchlist status
  useEffect(() => {
    let active = true
    async function readWL() {
      if (!user?.id) {
        setWlStatus(null)
        return
      }
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
    } catch (e) {
      console.warn('watched failed', e)
    } finally {
      setMutating(false)
    }
  }

  const rating = movie?.vote_average ? Math.round(movie.vote_average * 10) / 10 : null
  const year = yearOf(movie?.release_date)
  const runtime = formatRuntime(movie?.runtime)

  if (loading) return <div className="min-h-screen bg-black" />

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-10">
      {/* 1. HERO BANNER */}
      <div className="relative w-full h-[50vh] md:h-[65vh] lg:h-[75vh]">
        <div className="absolute inset-0 bg-neutral-900">
          {movie?.backdrop_path && (
            <img 
              src={IMG.backdrop(movie.backdrop_path)} 
              alt="" 
              className="w-full h-full object-cover opacity-60" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end pb-10 px-4 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-8 items-end w-full max-w-7xl mx-auto">
            
            {/* Poster (Hidden on Mobile) */}
            <div className="hidden md:block relative rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-[2/3]">
              {movie?.poster_path ? (
                <img src={IMG.poster(movie.poster_path)} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-800" />
              )}
            </div>

            {/* Main Info */}
            <div className="space-y-4 md:space-y-6 max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-xl">
                {movie?.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm md:text-base font-medium text-white/90">
                {rating && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm text-purple-100">
                    <Star className="h-4 w-4 text-purple-400 fill-purple-400" /> {rating}
                  </span>
                )}
                {year && <span>{year}</span>}
                {runtime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {runtime}
                  </span>
                )}
                {certification && <span className="px-1.5 py-0.5 border border-white/30 rounded text-xs font-bold">{certification}</span>}
              </div>

              {movie?.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(g => (
                    <span key={g.id} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs md:text-sm hover:bg-white/20 transition-colors">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {movie?.tagline && (
                <p className="text-lg md:text-xl text-white/70 italic font-medium">"{movie.tagline}"</p>
              )}

              <p className="text-base md:text-lg leading-relaxed text-white/80 line-clamp-4 md:line-clamp-none max-w-2xl">
                {movie?.overview}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2">
                {ytTrailer && (
                  <a 
                    href={ytTrailer} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/20"
                  >
                    <Play className="h-5 w-5 fill-white" /> Watch Trailer
                  </a>
                )}

                <div className="flex items-center gap-2">
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

                  <button 
                    onClick={() => { if (navigator.share) navigator.share({ title: movie?.title, text: movie?.overview, url: window.location.href }) }}
                    className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-12">
          
          {/* Left Column (Main) */}
          <div className="space-y-12">
            
            {/* Mobile: Where to Watch */}
            <div className="lg:hidden">
              <WhereToWatch providers={providers} />
            </div>

            {/* Cast */}
            {credits.cast?.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Top Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {credits.cast.map(p => (
                    <div key={p.id} className="group">
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 mb-3">
                        {p.profile_path ? (
                          <img src={IMG.profile(p.profile_path)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-white/30 text-xs">No Image</div>
                        )}
                      </div>
                      <h3 className="font-bold text-sm leading-tight">{p.name}</h3>
                      <p className="text-xs text-white/50 mt-1">{p.character}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {videos?.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Film className="h-6 w-6 text-purple-400" /> Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.filter(v => v.site === 'YouTube').slice(0, 4).map(v => (
                    <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noreferrer" className="group relative aspect-video rounded-xl overflow-hidden bg-neutral-800 block">
                      <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 fill-white text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                        <p className="text-sm font-medium line-clamp-1">{v.name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Backdrops */}
            {images.backdrops?.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><ImageIcon className="h-6 w-6 text-purple-400" /> Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.backdrops.map((img, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden bg-neutral-800">
                      <img src={IMG.still(img.file_path)} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {recs?.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {recs.map(m => (
                    <div key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="cursor-pointer group">
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 mb-2 relative">
                        {m.poster_path ? (
                          <img src={IMG.poster(m.poster_path)} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-xs text-white/30">No Poster</div>
                        )}
                        {m.vote_average > 0 && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 text-yellow-500 fill-current" /> {m.vote_average.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white/90 line-clamp-1 group-hover:text-purple-400 transition-colors">{m.title}</h3>
                      <p className="text-xs text-white/50">{yearOf(m.release_date)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar (Desktop) */}
          <div className="hidden lg:flex flex-col gap-8 sticky top-24 h-fit">
            <WhereToWatch providers={providers} />
            
            <div className="rounded-xl bg-neutral-900/50 border border-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold mb-4">Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/50">Status</span>
                  <span>{movie?.status}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/50">Original Language</span>
                  <span className="uppercase">{movie?.original_language}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/50">Budget</span>
                  <span>{movie?.budget > 0 ? `$${(movie.budget / 1000000).toFixed(1)}M` : '-'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-white/50">Revenue</span>
                  <span>{movie?.revenue > 0 ? `$${(movie.revenue / 1000000).toFixed(1)}M` : '-'}</span>
                </div>
              </div>
            </div>

            {keywords?.length > 0 && (
              <div className="rounded-xl bg-neutral-900/50 border border-white/5 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-purple-400" /> Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(k => (
                    <span key={k.id} className="px-2 py-1 rounded bg-white/5 text-xs text-white/70 border border-white/5">
                      {k.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

function WhereToWatch({ providers }) {
  if (!providers.flatrate?.length && !providers.rent?.length && !providers.buy?.length) return null
  return (
    <div className="rounded-xl bg-neutral-900/50 border border-white/5 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Tv2 className="h-5 w-5 text-purple-400" /> Where to Watch
      </h3>
      
      {providers.flatrate?.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-white/50 uppercase font-bold tracking-wider mb-3">Stream</p>
          <div className="flex flex-wrap gap-3">
            {providers.flatrate.map(p => (
              <img key={p.provider_id} src={IMG.logo(p.logo_path)} alt={p.provider_name} title={p.provider_name} className="h-10 w-10 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {(providers.rent?.length > 0 || providers.buy?.length > 0) && (
        <div>
          <p className="text-xs text-white/50 uppercase font-bold tracking-wider mb-3">Rent / Buy</p>
          <div className="flex flex-wrap gap-3">
            {[...providers.rent, ...providers.buy].slice(0, 5).map((p, i) => (
              <img key={`${p.provider_id}-${i}`} src={IMG.logo(p.logo_path)} alt={p.provider_name} title={p.provider_name} className="h-10 w-10 rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
            ))}
          </div>
        </div>
      )}
      
      {providers.link && (
        <a href={providers.link} target="_blank" rel="noreferrer" className="mt-6 block text-center text-xs font-bold text-purple-400 hover:text-purple-300 border-t border-white/10 pt-4">
          View all options on TMDB
        </a>
      )}
    </div>
  )
}
