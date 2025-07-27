import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Helper: fetch from TMDb endpoints
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

  function scrollLeft() {
    carouselRef.current.scrollBy({ left: -260, behavior: "smooth" });
  }
  function scrollRight() {
    carouselRef.current.scrollBy({ left: 260, behavior: "smooth" });
  }

  return (
    <section className="w-full">
      <div className="flex items-center gap-3 px-2 pb-1">
        <h3 className="text-lg md:text-xl font-bold tracking-tight flex-1">
          {title}
        </h3>
        {/* Arrows (hide on mobile if few items) */}
        {movies.length > 5 && (
          <div className="flex gap-2">
            <button
              className="p-1 rounded-full hover:bg-zinc-800 active:scale-95 transition disabled:opacity-30"
              onClick={scrollLeft}
              aria-label="Scroll left"
              disabled={loading || movies.length < 1}
              type="button"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="p-1 rounded-full hover:bg-zinc-800 active:scale-95 transition disabled:opacity-30"
              onClick={scrollRight}
              aria-label="Scroll right"
              disabled={loading || movies.length < 1}
              type="button"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        )}
      </div>
      <div className="relative">
        <div
          ref={carouselRef}
          className="
            flex gap-4 overflow-x-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-zinc-800
            scroll-smooth hide-scrollbar snap-x snap-mandatory
          "
          tabIndex={0}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Loading */}
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-28 md:w-36 aspect-[2/3] rounded-lg bg-zinc-900 animate-pulse"
              />
            ))}
          {/* Error */}
          {error && (
            <div className="p-4 text-red-400 font-semibold">{error}</div>
          )}
          {/* No results */}
          {!loading && !error && movies.length === 0 && (
            emptyMessage ? (
              <div className="p-4">{emptyMessage}</div>
            ) : (
              <div className="p-4 text-zinc-400">No movies found here.</div>
            )
          )}
          {/* Movie Cards */}
          {movies.map(movie => (
            <div
              key={movie.id}
              className="
                w-28 md:w-36 aspect-[2/3] flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900
                cursor-pointer transition hover:scale-105 hover:shadow-lg focus-within:scale-105
                snap-start group
              "
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
                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                alt={movie.title}
                className="object-cover w-full h-full"
                draggable={false}
                loading="lazy"
              />
              <div className="pt-2 pb-3 w-full flex flex-col items-center gap-0.5 bg-zinc-950/90">
                <div className="font-semibold text-xs text-white truncate w-full text-center">
                  {movie.title}
                </div>
                <div className="text-xs text-zinc-400">
                  {movie.release_date ? movie.release_date.slice(0, 4) : ""}
                </div>
                {movie.vote_average > 0 && (
                  <span className="px-1 py-0.5 rounded bg-[#23212b] text-yellow-300 font-bold text-[10px] mt-1">
                    ★ {movie.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
