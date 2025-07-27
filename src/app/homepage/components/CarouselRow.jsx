import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

async function fetchMovies(endpoint) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=1`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.results || []).filter(m => !!m.poster_path);
}

export default function CarouselRow({ title, endpoint, emptyMessage }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const carouselRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMovies(endpoint)
      .then(setMovies)
      .catch(() => setError("Could not fetch movies."))
      .finally(() => setLoading(false));
  }, [endpoint]);

  // Premium: small cards, nice gap, padded left/right
  const cardClass = "w-[28vw] h-[39vw] md:w-40 md:h-60 mx-1";

  return (
    <section className="w-full m-0 p-0 mt-8 md:mt-12">
      <div className="flex items-center gap-2 px-4 md:px-0 pt-0 pb-2">
        <h3 className="text-lg md:text-2xl font-bold tracking-tight flex-1">{title}</h3>
      </div>
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex gap-0 md:gap-6 overflow-x-auto p-0 m-0 px-3 md:px-0 scrollbar-thin scroll-smooth hide-scrollbar snap-x snap-mandatory"
          tabIndex={0}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`${cardClass} rounded-xl bg-zinc-900 animate-pulse`}
              />
            ))}
          {error && (
            <div className="p-4 text-red-400 font-semibold">{error}</div>
          )}
          {!loading && !error && movies.length === 0 && (
            emptyMessage ? (
              <div className="p-4">{emptyMessage}</div>
            ) : (
              <div className="p-4 text-zinc-400">No movies found here.</div>
            )
          )}
          {movies.map(movie => (
            <div
              key={movie.id}
              className={`
                ${cardClass} flex-shrink-0 rounded-xl overflow-hidden bg-zinc-900
                cursor-pointer transition hover:scale-105 hover:shadow-xl focus-within:scale-105
                snap-start group
              `}
              tabIndex={0}
              role="button"
              aria-label={`Open details for ${movie.title}`}
              onClick={() => navigate(`/movie/${movie.id}`)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/movie/${movie.id}`);
                }
              }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="object-cover w-full h-full"
                draggable={false}
                loading="lazy"
              />
              <div className="w-full bg-zinc-950/90 py-1 px-1 text-xs font-semibold text-white text-center truncate block md:hidden">
                {movie.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
