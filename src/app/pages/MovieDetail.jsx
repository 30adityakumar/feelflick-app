import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/app/header/Header";
import { supabase } from "@/shared/lib/supabase/client";
import { Bookmark, CheckCircle, PlayCircle, Trash2 } from "lucide-react";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/original";

export default function MovieDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  useEffect(() => {
    setLoading(true);
    async function fetchData() {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=en-US`);
      const data = await res.json();
      setMovie(data);

      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_KEY}`);
      setCredits(await creditsRes.json());

      const videoRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}`);
      const videosData = await videoRes.json();
      const ytTrailer = (videosData.results || []).find(v => v.type === "Trailer" && v.site === "YouTube");
      setTrailer(ytTrailer);

      const similarRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${TMDB_KEY}`);
      const similarData = await similarRes.json();
      setSimilar(similarData.results || []);

      if (data.imdb_id) {
        const omdb = await fetch(`https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_API_KEY}&i=${data.imdb_id}`);
        setRatings(await omdb.json());
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  // Check watchlist and watched status
  useEffect(() => {
    if (!user || !id) return;
    async function fetchStatuses() {
      const { data: wl } = await supabase
        .from('user_watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .eq('movie_id', id)
        .maybeSingle();
      setInWatchlist(!!wl);

      const { data: mw } = await supabase
        .from('movies_watched')
        .select('movie_id')
        .eq('user_id', user.id)
        .eq('movie_id', id)
        .maybeSingle();
      setIsWatched(!!mw);
    }
    fetchStatuses();
  }, [user, id, actionLoading]);

  async function ensureMovieInTable(movieData) {
    if (!movieData) return;
    const {
      id,
      title,
      original_title,
      release_date,
      overview,
      poster_path,
      backdrop_path,
      runtime,
      vote_average,
      vote_count,
      popularity,
      original_language,
      adult,
      budget,
      revenue,
      status
    } = movieData;

    await supabase
      .from('movies')
      .upsert([{
        id,
        title,
        original_title,
        release_date,
        overview,
        poster_path,
        backdrop_path,
        runtime,
        vote_average,
        vote_count,
        popularity,
        original_language,
        adult,
        budget,
        revenue,
        status
      }], { onConflict: ['id'] });
  }

  async function handleAddToWatchlist() {
    if (!user || !movie) return;
    setActionLoading(true);

    await ensureMovieInTable(movie);

    if (!isWatched) {
      await supabase
        .from('user_watchlist')
        .upsert({
          user_id: user.id,
          movie_id: movie.id,
        }, { onConflict: ['user_id', 'movie_id'] });
    }
    setActionLoading(false);
  }

  async function handleMarkAsWatched() {
    if (!user || !movie) return;
    setActionLoading(true);

    await ensureMovieInTable(movie);

    await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movie.id);

    const genresArray = movie.genres ? movie.genres.map(g => g.id) : null;
    await supabase
      .from('movies_watched')
      .upsert({
        user_id: user.id,
        movie_id: movie.id,
        title: movie.title,
        poster: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre_ids: genresArray,
      }, { onConflict: ['user_id', 'movie_id'] });

    setActionLoading(false);
  }

  async function handleRemoveFromWatchlist() {
    if (!user || !movie) return;
    setActionLoading(true);

    await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movie.id);

    setActionLoading(false);
  }

  if (loading) return <div className="text-white text-center mt-16">Loading...</div>;
  if (!movie) return <div className="text-white">Movie not found.</div>;

  const backdrop = movie.backdrop_path ? `${TMDB_BACKDROP}${movie.backdrop_path}` : "";
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : "/placeholder-movie.png";
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const genres = (movie.genres || []).map(g => g.name).join(", ");
  const runtime = movie.runtime ? `${movie.runtime} min` : "";
  const director = credits?.crew?.find(c => c.job === "Director");
  const topCast = credits?.cast?.slice(0, 6) || [];

  return (
    <div>
      <Header />
      {/* HERO BACKDROP */}
      <div
        className="relative w-full min-h-[60vh] sm:min-h-[440px] bg-black"
        style={{
          background: backdrop
            ? `linear-gradient(180deg,rgba(18,18,28,0.86) 60%,#181823 100%),url(${backdrop}) center/cover no-repeat`
            : "#161623"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#161623] to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end pt-10 md:pt-16 pb-7 px-3 md:px-6">
          {/* POSTER */}
          <div className="w-[54vw] min-w-[120px] max-w-[210px] sm:w-[210px] -mt-24 md:mt-0 md:mr-9 flex-shrink-0 mx-auto md:mx-0 drop-shadow-lg">
            <img
              src={posterUrl}
              alt={movie.title}
              className="rounded-2xl border-4 border-[#222] object-cover w-full h-[45vw] min-h-[180px] max-h-[315px] md:h-[350px] bg-[#222]"
              onError={e => { e.currentTarget.src = "/placeholder-movie.png"; }}
            />
          </div>
          {/* MAIN INFO */}
          <div className="flex-1 mt-8 md:mt-0 md:ml-7 text-left w-full">
            <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-y-1 gap-x-4 mb-2">
              <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow">{movie.title}</span>
              <span className="font-bold text-[#FFD866] text-xl sm:text-2xl">{year}</span>
            </div>
            {movie.tagline && (
              <div className="italic text-[#ffefa6b8] mb-2 text-base sm:text-lg">{movie.tagline}</div>
            )}
            <div className="flex flex-wrap gap-2 items-center text-[15px] sm:text-[16px] mb-3">
              {genres && <span className="opacity-90 text-zinc-200">{genres}</span>}
              {runtime && <span className="text-zinc-400">• {runtime}</span>}
              {director && <span className="text-zinc-400">• Dir: <span className="text-white">{director.name}</span></span>}
            </div>
            {/* RATINGS */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {movie.vote_average && (
                <span className="bg-[#393] text-white rounded-md px-2 py-1 font-semibold text-xs sm:text-sm">TMDb {movie.vote_average.toFixed(1)}</span>
              )}
              {ratings?.imdbRating && (
                <span className="bg-[#446] text-white rounded-md px-2 py-1 font-semibold text-xs sm:text-sm">IMDb {ratings.imdbRating}/10</span>
              )}
              {ratings?.Metascore && (
                <span className="bg-[#356] text-white rounded-md px-2 py-1 font-semibold text-xs sm:text-sm">Metacritic {ratings.Metascore}</span>
              )}
              {ratings?.Ratings?.find(r => r.Source === "Rotten Tomatoes") && (
                <span className="bg-[#b53] text-white rounded-md px-2 py-1 font-semibold text-xs sm:text-sm">
                  RT {ratings.Ratings.find(r => r.Source === "Rotten Tomatoes").Value}
                </span>
              )}
            </div>
            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2 w-full">
              {/* Add to Watchlist */}
              {!isWatched && !inWatchlist && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold shadow hover:scale-[1.03] transition text-base w-full sm:w-auto"
                  disabled={actionLoading}
                  onClick={handleAddToWatchlist}
                >
                  <Bookmark size={20} /> Add to Watchlist
                </button>
              )}
              {/* Remove from Watchlist */}
              {!isWatched && inWatchlist && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold border border-orange-400 text-orange-400 bg-[#251d11]/80 hover:bg-orange-400 hover:text-black shadow text-base w-full sm:w-auto"
                  disabled={actionLoading}
                  title="Remove from Watchlist"
                  onClick={handleRemoveFromWatchlist}
                >
                  <Trash2 size={20} /> Remove
                </button>
              )}
              {/* Mark as Watched */}
              {!isWatched && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#272d3e] text-white border border-zinc-600 font-semibold shadow hover:bg-green-700/80 hover:text-green-100 transition text-base w-full sm:w-auto"
                  disabled={actionLoading}
                  onClick={handleMarkAsWatched}
                >
                  <CheckCircle size={20} /> Mark as Watched
                </button>
              )}
              {/* Watched Badge */}
              {isWatched && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#244e23] text-green-300 border border-green-500 font-semibold shadow text-base w-full sm:w-auto"
                  disabled
                >
                  <CheckCircle size={20} /> Watched
                </button>
              )}
              {/* Trailer */}
              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#fff4] text-[#ffd884] border border-[#ffd884] font-semibold shadow hover:bg-[#ffd884] hover:text-black transition text-base w-full sm:w-auto"
                >
                  <PlayCircle size={20} /> Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION + CAST */}
      <div className="max-w-5xl mx-auto px-3 md:px-8 py-7 md:py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Overview */}
          <div className="md:col-span-2">
            <div className="text-lg sm:text-xl text-white font-semibold mb-2">Overview</div>
            <div className="text-zinc-200 leading-relaxed mb-4 text-base sm:text-lg">{movie.overview}</div>
          </div>
          {/* Cast */}
          <div>
            <div className="text-lg sm:text-xl text-white font-semibold mb-2">Top Cast</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
              {topCast.map(actor => (
                <div key={actor.id} className="opacity-93 whitespace-nowrap">
                  <span className="text-zinc-100">{actor.name}</span>
                  <span className="text-zinc-500"> as </span>
                  <span className="text-white font-bold">{actor.character}</span>
                </div>
              ))}
              {topCast.length === 0 && <span className="text-zinc-500">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* SIMILAR MOVIES */}
      {similar.length > 0 && (
        <div className="max-w-5xl mx-auto px-3 md:px-8 pb-12">
          <div className="font-extrabold text-lg sm:text-xl mb-3 text-white">You Might Also Like</div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {similar.slice(0, 10).map(sm => (
              <a
                href={`/movie/${sm.id}`}
                key={sm.id}
                className="block w-[38vw] min-w-[110px] max-w-[115px] sm:w-[112px] flex-shrink-0 text-white no-underline group"
              >
                <img
                  src={sm.poster_path ? `https://image.tmdb.org/t/p/w342${sm.poster_path}` : "/placeholder-movie.png"}
                  alt={sm.title}
                  className="w-full h-[27vw] min-h-[145px] max-h-[165px] rounded-lg mb-1 object-cover bg-[#23232e] shadow group-hover:scale-105 transition"
                />
                <div className="text-[13.5px] text-center font-semibold truncate">{sm.title}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
