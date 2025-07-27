import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

async function fetchFeaturedMovies() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`);
  const data = await res.json();
  return (data.results || []).slice(0, 6); // Top 6 featured
}

export default function HeroCarousel() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchFeaturedMovies().then(setMovies).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-[50vw] md:h-[360px] bg-zinc-900 animate-pulse" />;

  return (
    <section className="relative w-full py-2 px-0 mb-2 overflow-x-auto">
      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto scrollbar-thin snap-x snap-mandatory px-3 md:justify-center"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {movies.map(movie => (
          <div
            key={movie.id}
            className="snap-start flex-shrink-0 w-[83vw] md:w-[420px] aspect-[16/9] rounded-xl relative group overflow-hidden shadow-lg bg-zinc-900"
          >
            <img
              src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path || movie.poster_path}`}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover z-0"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/50 to-transparent z-10" />
            <div className="absolute bottom-4 left-4 z-20 max-w-[66vw] md:max-w-[260px]">
              <img
                src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
                alt={movie.title}
                className="w-12 h-16 rounded shadow-md mb-2 border-2 border-white/10"
                draggable={false}
              />
              <div className="font-bold text-lg text-white mb-1 drop-shadow line-clamp-2">{movie.title}</div>
              <button
                className="py-1 px-4 rounded bg-orange-500 text-white font-semibold text-xs shadow hover:scale-105 transition"
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
