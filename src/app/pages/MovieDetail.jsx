import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/app/header/Header";

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/original";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

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
                <button className="
                  py-3 px-9 bg-gradient-to-r from-orange-400 to-red-500
                  text-white font-bold text-[17px] rounded-[9px]
                  shadow transition hover:scale-105 active:scale-100 mr-2
                ">
                  Add to Watchlist
                </button>
                <button className="
                  py-3 px-7 bg-[#444] text-white font-bold text-[16px] rounded-lg
                  transition hover:scale-105 active:scale-100
                ">
                  Mark as Watched
                </button>
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
