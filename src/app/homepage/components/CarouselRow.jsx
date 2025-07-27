import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

async function fetchMovies(endpoint) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=1`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.results || []).filter(m => !!m.poster_path);
}

export default function CarouselRow({ title, endpoint, emptyMessage, cardType }) {
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
    carouselRef.current.scrollBy({ left: -170, behavior: "smooth" });
  }
  function scrollRight() {
    carouselRef.current.scrollBy({ left: 170, behavior: "smooth" });
  }

  // Netflix-like card sizes for mobile
  const cardClass = cardType === "big"
    ? "w-[44vw] md:w-32 aspect-[2/3]"
    : "w-24 md:w-32 aspect-[2/3]";

  return (
    <section className="w-full m-0 p-0">
      <div className="flex items-center gap-2 pl-3 pr-0 pt-0 pb-2">
        <h3 className="text-base md:text-lg font-bold tracking-tight flex-1">{title}</h3>
        {/* Hide arrows on mobile, only show on desktop */}
        {movies.length > 6 && (
          <div className="hidden sm:flex gap-2 pr-3">
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
            flex gap-2 md:gap-4 overflow-x-auto p-0 m-0
            scrollbar-thin scrollbar-thumb-zinc-800
            scroll-smooth hide-scrollbar snap-x snap-mandatory
          "
          tabIndex={0}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`${cardClass} rounded-lg bg-zinc-900 animate-pulse`}
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
                ${cardClass} flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900
                cursor-pointer transition hover:scale-105 hover:shadow-lg focus-within:scale-105
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
                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                alt={movie.title}
                className="object-cover w-full h-full"
                draggable={false}
                loading="lazy"
              />
              {/* Title overlay like Netflix: visible on hover/focus or always for mobile */}
              <div className="w-full bg-zinc-950/80 py-1 px-1 text-xs font-semibold text-white text-center truncate block md:hidden">
                {movie.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
