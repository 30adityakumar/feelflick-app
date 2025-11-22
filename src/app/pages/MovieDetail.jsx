// src/app/pages/MovieDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  Play, Plus, Check, Eye, EyeOff, Star, Clock, Calendar, 
  ChevronLeft, Share2, Info 
} from 'lucide-react'

const IMG = {
  backdrop: (p) => p ? `https://image.tmdb.org/t/p/original${p}` : '',
  poster: (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : '',
  profile: (p) => p ? `https://image.tmdb.org/t/p/w185${p}` : '',
}

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY

function formatRuntime(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [movie, setMovie] = useState(null)
  const [credits, setCredits] = useState({ cast: [], crew: [] })
  const [videos, setVideos] = useState([])
  const [similar, setSimilar] = useState([])
  const [user, setUser] = useState(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)

  // Get User
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
  }, [])

  // Fetch Movie Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [movieRes, creditsRes, videosRes, similarRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_KEY}`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}`).then(r => r.json()),
          fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${TMDB_KEY}`).then(r => r.json())
        ])

        setMovie(movieRes)
        setCredits({ cast: creditsRes.cast?.slice(0, 10) || [], crew: creditsRes.crew || [] })
        setVideos(videosRes.results || [])
        setSimilar(similarRes.results?.slice(0, 12) || [])

        // Check Watchlist/Watched Status
        if (user) {
          const [wl, wh] = await Promise.all([
            supabase.from('user_watchlist').select('movie_id').eq('user_id', user.id).eq('movie_id', Number(id)).maybeSingle(),
            supabase.from('movies_watched').select('movie_id').eq('user_id', user.id).eq('movie_id', Number(id)).maybeSingle()
          ])
          setIsInWatchlist(!!wl.data)
          setIsWatched(!!wh.data)
        }
      } catch (error) {
        console.error('Error fetching movie:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user])

  const trailer = useMemo(() => {
    const t = videos.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    return t ? `https://www.youtube.com/watch?v=${t.key}` : null
  }, [videos])

  const director = useMemo(() => credits.crew?.find(c => c.job === 'Director'), [credits])

  const ensureMovieInDb = async () => {
    await supabase.from('movies').upsert({
      tmdb_id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date || null,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      original_language: movie.original_language,
      runtime: movie.runtime,
      json_data: movie
    }, { onConflict: 'tmdb_id' })
  }

  const toggleWatchlist = async () => {
    if (!user) return navigate('/')
    
    if (isInWatchlist) {
      setIsInWatchlist(false)
      await supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', Number(id))
    } else {
      setIsInWatchlist(true)
      setIsWatched(false)
      await ensureMovieInDb()
      await Promise.all([
        supabase.from('user_watchlist').upsert({ user_id: user.id, movie_id: Number(id), added_at: new Date().toISOString(), status: 'want_to_watch' }, { onConflict: 'user_id,movie_id' }),
        supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', Number(id))
      ])
    }
  }

  const toggleWatched = async () => {
    if (!user) return navigate('/')
    
    if (isWatched) {
      setIsWatched(false)
      await supabase.from('movies_watched').delete().eq('user_id', user.id).eq('movie_id', Number(id))
    } else {
      setIsWatched(true)
      setIsInWatchlist(false)
      await ensureMovieInDb()
      await Promise.all([
        supabase.from('movies_watched').upsert({
          user_id: user.id, movie_id: Number(id), title: movie.title, poster: movie.poster_path,
          release_date: movie.release_date, vote_average: movie.vote_average,
          genre_ids: movie.genres?.map(g => g.id), watched_at: new Date().toISOString(), source: 'movie_detail'
        }, { onConflict: 'user_id,movie_id' }),
        supabase.from('user_watchlist').delete().eq('user_id', user.id).eq('movie_id', Number(id))
      ])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Movie not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative w-full h-[70vh] md:h-[80vh] lg:h-[90vh]">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <img 
            src={IMG.backdrop(movie.backdrop_path || movie.poster_path)} 
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden md:inline">Back</span>
        </button>

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end pb-8 md:pb-12 lg:pb-16">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="max-w-4xl">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-4 drop-shadow-2xl">
                {movie.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-white" />
                    <span className="font-bold">{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
                {movie.release_date && (
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                )}
                {movie.runtime && (
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Clock className="h-4 w-4" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {movie.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {movie.genres.map(genre => (
                    <span key={genre.id} className="px-3 py-1 rounded-full bg-white/10 text-sm backdrop-blur-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              {movie.overview && (
                <p className="text-sm md:text-base text-white/90 leading-relaxed line-clamp-3 mb-6 max-w-3xl">
                  {movie.overview}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {trailer && (
                  <a
                    href={trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold transition-all hover:scale-105 shadow-xl"
                  >
                    <Play className="h-5 w-5 fill-white" />
                    <span>Watch Trailer</span>
                  </a>
                )}

                {user && (
                  <>
                    <button
                      onClick={toggleWatchlist}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 backdrop-blur-md border shadow-xl ${
                        isInWatchlist
                          ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                          : 'bg-white/10 hover:bg-white/20 border-white/20'
                      }`}
                    >
                      {isInWatchlist ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                    </button>

                    <button
                      onClick={toggleWatched}
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 backdrop-blur-md border shadow-xl ${
                        isWatched
                          ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                          : 'bg-white/10 hover:bg-white/20 border-white/20'
                      }`}
                    >
                      {isWatched ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      <span>{isWatched ? 'Watched' : 'Mark as Watched'}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Director */}
              {director && (
                <p className="mt-4 text-sm text-white/70">
                  Directed by <span className="text-white font-semibold">{director.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      {credits.cast?.length > 0 && (
        <section className="py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Cast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {credits.cast.map(person => (
              <div key={person.id} className="group cursor-pointer">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 mb-2 group-hover:scale-105 transition-transform">
                  {person.profile_path ? (
                    <img src={IMG.profile(person.profile_path)} alt={person.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <Info className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <p className="font-semibold text-sm line-clamp-1">{person.name}</p>
                <p className="text-xs text-white/60 line-clamp-1">{person.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar Movies */}
      {similar.length > 0 && (
        <section className="py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Similar Movies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {similar.map(m => (
              <div
                key={m.id}
                onClick={() => navigate(`/movie/${m.id}`)}
                className="group cursor-pointer"
              >
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 mb-2 group-hover:scale-105 transition-transform shadow-lg">
                  <img src={IMG.poster(m.poster_path)} alt={m.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-medium line-clamp-2">{m.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
