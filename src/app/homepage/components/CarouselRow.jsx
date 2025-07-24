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
  const [scroll, setScroll] = useState(0);
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

  // Scroll functions for left/right arrow
  function scrollLeft() {
    carouselRef.current.scrollBy({ left: -320, behavior: "smooth" });
    setScroll(carouselRef.current.scrollLeft - 320);
  }
  function scrollRight() {
    carouselRef.current.scrollBy({ left: 320, behavior: "smooth" });
    setScroll(carouselRef.current.scrollLeft + 320);
  }

  return (
    <section className="w-full">
      {/* Row Title */}
      <div className="flex items-center gap-3 px-2 pb-2">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight flex-1">
          {title}
        </h3>
        {/* Arrows (hide on mobile if few items) */}
        {movies.length > 6 && (
          <div className="flex gap-2">
            <button
              className="p-1 rounded-full hover:bg-zinc-800 active:scale-95 transition disabled:opacity-30"
              onClick={scrollLeft}
              aria-label="Scroll left"
              disabled={loading || movies.length < 1}
              type="button"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="p-1 rounded-full hover:bg-zinc-800 active:scale-95 transition disabled:opacity-30"
              onClick={scrollRight}
              aria-label="Scroll right"
              disabled={loading || movies.length < 1}
              type="button"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>
      {/* Movie Carousel */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="
            flex gap-3 overflow-x-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-zinc-800
            scroll-smooth hide-scrollbar snap-x snap-mandatory
          "
          tabIndex={0}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Loading */}
          {loading &&
            Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-[132px] md:w-[158px] h-[210px] rounded-xl bg-zinc-900 animate-pulse"
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
                w-[132px] md:w-[158px] flex-shrink-0
                flex flex-col items-center justify-between
                rounded-xl overflow-hidden bg-zinc-900
                cursor-pointer transition group shadow hover:scale-[1.045] hover:z-20 focus-within:scale-[1.045]
                snap-start
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
              <div className="relative w-full h-[188px] md:h-[205px] bg-zinc-800">
                <img
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title}
                  className="object-cover w-full h-full transition group-hover:opacity-85"
                  draggable={false}
                  loading="lazy"
                />
                {/* Optional: Overlay for hover */}
                {/* <button
                  className="absolute bottom-2 right-2 px-3 py-1 bg-orange-500 rounded-lg text-white text-xs opacity-0 group-hover:opacity-90 transition"
                  onClick={e => {
                    e.stopPropagation();
                    // handle add to watchlist...
                  }}
                >
                  + Watchlist
                </button> */}
              </div>
              <div className="px-1 pt-2 pb-3 w-full flex flex-col items-center gap-1">
                <div className="font-bold text-sm text-center truncate w-full">
                  {movie.title}
                </div>
                <div className="text-xs text-zinc-400">
                  {movie.release_date ? movie.release_date.slice(0, 4) : ""}
                </div>
                {movie.vote_average > 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#23212b] text-yellow-300 font-bold text-xs mt-1">
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
