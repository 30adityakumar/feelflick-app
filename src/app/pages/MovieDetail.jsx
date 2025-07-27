import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/app/header/Header";
import { supabase } from "@/shared/lib/supabase/client";

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

  // Watchlist/Watched
  const [watchlistStatus, setWatchlistStatus] = useState(null); // null | "want_to_watch" | "watched"
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Fetch logged-in user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  // Fetch movie info
  useEffect(() => {
    setLoading(true);
    async function fetchData() {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=en-US`);
      const data = await res.json();
      setMovie(data);

      // Fetch credits
      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_KEY}`);
      setCredits(await creditsRes.json());

      // Fetch videos (trailers)
      const videoRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}`);
      const videosData = await videoRes.json();
      const ytTrailer = (videosData.results || []).find(v => v.type === "Trailer" && v.site === "YouTube");
      setTrailer(ytTrailer);

      // Fetch similar movies
      const similarRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${TMDB_KEY}`);
      const similarData = await similarRes.json();
      setSimilar(similarData.results || []);

      // Fetch OMDb ratings
      if (data.imdb_id) {
        const omdb = await fetch(`https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_API_KEY}&i=${data.imdb_id}`);
        setRatings(await omdb.json());
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  // Fetch user's watchlist status for this movie
  useEffect(() => {
    if (!user || !id) return;
    setWatchlistLoading(true);
    async function fetchWatchlistStatus() {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('status')
        .eq('user_id', user.id)
        .eq('movie_id', id)
        .single();
      if (data) setWatchlistStatus(data.status);
      else setWatchlistStatus(null);
      setWatchlistLoading(false);
    }
    fetchWatchlistStatus();
  }, [user, id]);

  // Upsert movie into your movies table
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

  // Add to watchlist
  async function handleAddToWatchlist() {
    if (!user || !movie) return;
    setWatchlistLoading(true);

    await ensureMovieInTable(movie);

    await supabase
      .from('user_watchlist')
      .upsert({
        user_id: user.id,
        movie_id: movie.id,
        status: 'want_to_watch',
      }, { onConflict: ['user_id', 'movie_id'] });

    setWatchlistStatus('want_to_watch');
    setWatchlistLoading(false);
  }

  // Mark as watched (also upsert in movies_watched)
  async function handleMarkAsWatched() {
    if (!user || !movie) return;
    setWatchlistLoading(true);

    await ensureMovieInTable(movie);

    // Upsert user_watchlist status
    await supabase
      .from('user_watchlist')
      .upsert({
        user_id: user.id,
        movie_id: movie.id,
        status: 'watched',
      }, { onConflict: ['user_id', 'movie_id'] });

    // Upsert movies_watched
    // Your table: id, created_at, user_id, movie_id, title, poster, release_date, vote_average, genre_ids
    // For genre_ids, map to array of ids from movie.genres (if available)
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

    setWatchlistStatus('watched');
    setWatchlistLoading(false);
  }

  if (loading) return <div className="text-white text-center mt-16">Loading...</div>;
  if (!movie) return <div className="text-white">Movie not found.</div>;

  // --- Page pieces ---
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
      <div
        className="min-h-screen pt-[70px] bg-cover bg-center"
        style={{
          background: backdrop
            ? `linear-gradient(180deg,rgba(10,10,24,0.95) 60%,#161623 95%), url(${backdrop}) center/cover no-repeat`
            : "#161623"
        }}
      >
        <div className="
          max-w-[920px] mx-auto bg-[rgba(23,23,34,0.98)]
          rounded-[22px] shadow-[0_10px_48px_#0009] overflow-hidden
        ">
          <div className="flex flex-wrap">
            <div className="flex-none bg-[#23232e] w-[288px]">
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-[288px] h-[430px] object-cover block rounded-br-[20px]"
                onError={e => { e.currentTarget.src = "/placeholder-movie.png"; }}
              />
            </div>
            <div className="flex-1 min-w-[260px] p-[36px_34px_34px_36px]">
              <div className="text-[36px] font-black mb-2 flex flex-wrap items-center">
                {movie.title}
                <span className="ml-2 font-normal text-[#ffbe60]">({year})</span>
              </div>
              <div className="text-[18px] opacity-90 mb-2">
                {genres}{genres && " • "}{runtime}
              </div>
              {movie.tagline && (
                <div className="italic opacity-80 mb-3">{movie.tagline}</div>
              )}
              <div className="text-[17px] my-4 leading-[1.54] opacity-97">
                {movie.overview}
              </div>
              <div className="mb-2 text-[#aab]">
                {director && <>🎬 <b className="text-white">{director.name}</b></>}
              </div>
              {topCast.length > 0 && (
                <div className="mb-3">
                  <div className="text-[#ffbe60] font-bold mb-1">Top Cast:</div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
                    {topCast.map(actor => (
                      <span key={actor.id} className="opacity-93">
                        {actor.name} <span className="text-[#aaa]">as</span> <span className="text-white">{actor.character}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Ratings */}
              <div className="my-4 text-[16px] flex flex-wrap gap-3">
                {movie.vote_average && (
                  <span className="bg-[#292] text-white rounded px-2 py-1 font-bold">TMDb {movie.vote_average.toFixed(1)}</span>
                )}
                {ratings?.imdbRating && (
                  <span className="bg-[#446] text-white rounded px-2 py-1 font-bold">IMDb {ratings.imdbRating}/10</span>
                )}
                {ratings?.Metascore && (
                  <span className="bg-[#356] text-white rounded px-2 py-1 font-bold">Metacritic {ratings.Metascore}</span>
                )}
                {ratings?.Ratings?.find(r => r.Source === "Rotten Tomatoes") && (
                  <span className="bg-[#b53] text-white rounded px-2 py-1 font-bold">
                    RT {ratings.Ratings.find(r => r.Source === "Rotten Tomatoes").Value}
                  </span>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {/* Add to Watchlist */}
                {watchlistStatus === "want_to_watch" ? (
                  <button
                    className="
                      py-3 px-9 bg-[#1b2530] text-orange-400 border border-orange-400 font-bold text-[17px] rounded-[9px]
                      cursor-default mr-2
                    "
                    disabled
                  >
                    Already in Watchlist
                  </button>
                ) : watchlistStatus === "watched" ? (
                  <button
                    className="
                      py-3 px-9 bg-[#282828] text-zinc-400 font-bold text-[17px] rounded-[9px]
                      cursor-default mr-2
                    "
                    disabled
                  >
                    Already Watched
                  </button>
                ) : (
                  <button
                    className="
                      py-3 px-9 bg-gradient-to-r from-orange-400 to-red-500
                      text-white font-bold text-[17px] rounded-[9px]
                      shadow transition hover:scale-105 active:scale-100 mr-2
                    "
                    onClick={handleAddToWatchlist}
                    disabled={watchlistLoading}
                  >
                    {watchlistLoading ? "Adding..." : "Add to Watchlist"}
                  </button>
                )}

                {/* Mark as Watched */}
                {watchlistStatus === "watched" ? (
                  <button
                    className="
                      py-3 px-7 bg-[#444] text-green-400 font-bold text-[16px] rounded-lg
                      cursor-default
                    "
                    disabled
                  >
                    Already Watched
                  </button>
                ) : (
                  <button
                    className="
                      py-3 px-7 bg-[#444] text-white font-bold text-[16px] rounded-lg
                      transition hover:scale-105 active:scale-100
                    "
                    onClick={handleMarkAsWatched}
                    disabled={watchlistLoading}
                  >
                    {watchlistLoading ? "Marking..." : "Mark as Watched"}
                  </button>
                )}

                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-5 bg-[#111b] text-[#ffd884] rounded-lg font-bold text-[15px] ml-2 hover:underline"
                  >
                    ▶ Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </div>
          {/* Similar Movies Row */}
          {similar.length > 0 && (
            <div className="mt-9 px-9 pb-7">
              <div className="font-extrabold text-[19px] mb-3">You Might Also Like</div>
              <div className="flex gap-5 overflow-x-auto">
                {similar.slice(0, 6).map(sm => (
                  <a
                    href={`/movie/${sm.id}`}
                    key={sm.id}
                    className="block w-[110px] text-white no-underline"
                  >
                    <img
                      src={sm.poster_path ? `https://image.tmdb.org/t/p/w342${sm.poster_path}` : "/placeholder-movie.png"}
                      alt={sm.title}
                      className="w-[110px] h-[160px] rounded-[9px] mb-1 object-cover bg-[#23232e]"
                    />
                    <div className="text-[14px] text-center font-semibold truncate">{sm.title}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
