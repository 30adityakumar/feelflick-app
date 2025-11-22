// src/app/pages/MovieDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { Play, Check, Star, Clock, ChevronRight, Tv2, Film, Image as ImageIcon, Tag, Share2, Eye, EyeOff, Plus } from 'lucide-react'

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
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null))
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
          fetch(`${TMDB.base}/movie/${id}?api_key=${TMDB.key}&language=en-US`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/credits?api_key=${TMDB.key}&language=en-US`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/videos?api_key=${TMDB.key}&language=en-US`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/recommendations?api_key=${TMDB.key}&language=en-US&page=1`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/images?api_key=${TMDB.key}`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/keywords?api_key=${TMDB.key}`).then((r) => r.json()),
          fetch(`${TMDB.base}/movie/${id}/release_dates?api_key=${TMDB.key}`).then((r) => r.json()),
        ])
        if (abort) return
        if (d?.success === false || d?.status_code) throw new Error(d?.status_message || 'Failed to load')

        setMovie(d)
        setCredits({ cast: (c?.cast || []).slice(0, 10), crew: c?.crew || [] })
        setVideos(v?.results || [])
        setRecs((r?.results || []).slice(0, 12))
        setImages({ backdrops: (i?.backdrops || []).slice(0, 6) })
        setKeywords((k?.keywords || []).slice(0, 12))

        const usCert = rel?.results?.find((r) => r.iso_3166_1 === 'US')?.release_dates?.[0]?.certification
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
        const region = (navigator?.language || 'en-US').split('-')[1]?.toUpperCase() || 'US'
        const area = json?.results?.[region] || json?.results?.US || null
        if (!active) return

        if (area) {
          const pick = (k) => (area[k] || []).slice(0, 6)
          setProviders({ flatrate: pick('flatrate'), rent: pick('rent'), buy: pick('buy'), link: area.link || '' })
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
    const t = (videos || []).find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
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

  return (
    <div className="relative bg-black text-white min-h-screen">
      {/* Hero */}
      <div className="relative w-full h-[50vh] md:h-[65vh]">
        <div className="absolute inset-0">
          {movie?.backdrop_path ? (
            <img src={IMG.backdrop(movie.backdrop_path)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-end pb-8">
          <div className="w-full max-w-6xl mx-auto px-6 md:px-8">
            <div className="flex gap-6 items-end">
              {/* Poster */}
              <div className="hidden md:block flex-shrink-0">
                <div className="w-48 lg:w-56 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                  {movie?.poster_path ? (
                    <img src={IMG.poster(movie.poster_path)} alt={movie?.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 grid place-items-center text-white/30">No Poster</div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pb-4">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-10 w-3/4 bg-white/10 rounded" />
                    <div className="h-5 w-1/2 bg-white/10 rounded" />
                  </div>
                ) : error ? (
                  <div className="rounded-lg bg-red-500/10 p-3 text-red-300 text-sm">{error}</div>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3">{movie?.title}</h1>
                    
                    {movie?.tagline && (
                      <p className="text-base text-white/70 italic mb-3">"{movie.tagline}"</p>
                    )}

                    {director && (
                      <p className="text-sm text-white/60 mb-3">Directed by <span className="text-white/90 font-medium">{director.name}</span></p>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm mb-4">
                      {rating && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 font-bold">
                          <Star className="h-3 w-3 fill-current" /> {rating}
                        </span>
                      )}
                      {year && <span className="px-2 py-1 rounded bg-white/10">{year}</span>}
                      {certification && <span className="px-2 py-1 rounded border border-white/20 text-xs">{certification}</span>}
                      {runtime && <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10"><Clock className="h-3 w-3" /> {runtime}</span>}
                    </div>

                    {movie?.overview && (
                      <p className="text-sm md:text-base text-white/80 leading-relaxed line-clamp-3 mb-4 max-w-2xl">{movie.overview}</p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {ytTrailer && (
                        <a href={ytTrailer} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold transition-all">
                          <Play className="h-4 w-4 fill-white" /> Trailer
                        </a>
                      )}
                      <button disabled={mutating} onClick={toggleWatchlist} className={`px-4 py-2 rounded-lg border font-medium transition-all ${wlStatus === 'want_to_watch' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                        {wlStatus === 'want_to_watch' ? <><Check className="inline h-4 w-4 mr-1" /> In Watchlist</> : <><Plus className="inline h-4 w-4 mr-1" /> Watchlist</>}
                      </button>
                      <button disabled={mutating} onClick={toggleWatched} className={`px-4 py-2 rounded-lg border font-medium transition-all ${wlStatus === 'watched' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                        {wlStatus === 'watched' ? <><Eye className="inline h-4 w-4 mr-1" /> Watched</> : <><EyeOff className="inline h-4 w-4 mr-1" /> Mark Watched</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-8">
          
          {/* Main */}
          <div className="space-y-8 min-w-0">
            {movie?.genres?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(g => (
                    <span key={g.id} className="px-3 py-1 rounded-full bg-white/10 text-sm">{g.name}</span>
                  ))}
                </div>
              </div>
            )}

            <CastSection cast={credits.cast} />
            <VideosSection videos={videos} />
            <ImagesSection images={images.backdrops} />
            <Rail title="Recommendations" items={recs} navigate={navigate} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WhereToWatch providers={providers} />
            {keywords.length > 0 && <KeywordsSection keywords={keywords} />}
            {movie?.belongs_to_collection && <CollectionCard collection={movie.belongs_to_collection} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sub-components
function WhereToWatch({ providers }) {
  if (!providers.flatrate?.length && !providers.rent?.length && !providers.buy?.length) return null
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Tv2 className="h-4 w-4 text-purple-400" /> Where to Watch</h3>
      {providers.flatrate?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-white/40 mb-2 uppercase">Stream</p>
          <div className="flex flex-wrap gap-2">
            {providers.flatrate.map(p => (
              <img key={p.provider_id} src={IMG.logo(p.logo_path)} alt={p.provider_name} title={p.provider_name} className="h-10 w-10 rounded-lg shadow" />
            ))}
          </div>
        </div>
      )}
      {(providers.rent?.length > 0 || providers.buy?.length > 0) && (
        <div>
          <p className="text-xs text-white/40 mb-2 uppercase">Rent / Buy</p>
          <div className="flex flex-wrap gap-2">
            {[...providers.rent, ...providers.buy].slice(0, 6).map((p, i) => (
              <img key={`${p.provider_id}-${i}`} src={IMG.logo(p.logo_path)} alt={p.provider_name} title={p.provider_name} className="h-10 w-10 rounded-lg shadow opacity-80" />
            ))}
          </div>
        </div>
      )}
      {providers.link && (
        <a href={providers.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
          via JustWatch <ChevronRight className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

function KeywordsSection({ keywords }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-purple-400" /> Keywords</h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map(k => (
          <span key={k.id} className="px-2 py-1 rounded bg-white/5 text-xs text-white/60">{k.name}</span>
        ))}
      </div>
    </div>
  )
}

function CollectionCard({ collection }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden group cursor-pointer">
      <div className="relative aspect-video">
        {collection.backdrop_path && <img src={IMG.backdrop(collection.backdrop_path)} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
          <span className="font-bold text-sm">{collection.name}</span>
        </div>
      </div>
    </div>
  )
}

function CastSection({ cast }) {
  if (!cast?.length) return null
  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Cast</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {cast.map(p => (
          <div key={p.id} className="flex-shrink-0 w-32">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 mb-2">
              {p.profile_path ? (
                <img src={IMG.profile(p.profile_path)} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-white/30">No Image</div>
              )}
            </div>
            <h3 className="text-sm font-bold leading-tight">{p.name}</h3>
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
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Film className="h-5 w-5 text-purple-400" /> Videos</h2>
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(v => (
          <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noreferrer" className="group relative aspect-video rounded-lg overflow-hidden bg-neutral-800">
            <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-4 w-4 fill-white" />
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-xs font-medium line-clamp-1">{v.name}</p>
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
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-purple-400" /> Images</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {images.map((img, idx) => (
          <div key={idx} className="flex-shrink-0 w-64 aspect-video rounded-lg overflow-hidden bg-neutral-800">
            <img src={IMG.still(img.file_path)} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Rail({ title, items, navigate }) {
  if (!items?.length) return null
  return (
    <div>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map(m => (
          <div key={m.id} onClick={() => navigate(`/movie/${m.id}`)} className="group cursor-pointer">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 mb-2 ring-1 ring-white/5 group-hover:ring-purple-500/50 transition-all">
              {m.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xs text-white/30">No Poster</div>
              )}
            </div>
            <h3 className="text-xs font-bold line-clamp-1">{m.title}</h3>
            <div className="flex items-center justify-between text-[10px] text-white/50 mt-1">
              <span>{yearOf(m.release_date)}</span>
              <span className="flex items-center gap-0.5 text-yellow-500"><Star className="h-2.5 w-2.5 fill-current" /> {m.vote_average?.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
