// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

const img = (p, s = "w500") =>
  p ? `https://image.tmdb.org/t/p/${s}${p}` : "/placeholder-movie.png";

export default function CarouselRow({
  title,
  tmdbCategory = "popular",
  rowId,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const railRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(
      `https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }&language=en-US&page=1`
    )
      .then((r) => r.json())
      .then((j) => {
        setItems(j?.results?.slice(0, 20) ?? []);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, [tmdbCategory]);

  const scroll = (dir) => {
    const rail = railRef.current;
    if (!rail) return;
    const scrollAmount = rail.clientWidth * 0.75;
    rail.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    setShowLeftArrow(rail.scrollLeft > 10);
    setShowRightArrow(
      rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 10
    );
  };

  useEffect(() => {
    const rail = railRef.current;
    if (rail) {
      rail.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => rail.removeEventListener("scroll", handleScroll);
    }
  }, [items]);

  const skeletons = Array.from({ length: 6 }).map((_, idx) => (
    <div
      key={idx}
      className="aspect-[2/3] w-[150px] min-w-[150px] sm:w-[180px] sm:min-w-[180px] md:w-[200px] md:min-w-[200px] rounded-md bg-neutral-800/60 animate-pulse flex-shrink-0"
    />
  ));

  return (
    <div className="relative group w-full">
      {/* Header - Production-grade spacing */}
      <div className="mb-3 px-4 sm:px-6 md:px-8 lg:px-12">
        <h2 className="text-base md:text-lg font-bold tracking-tight text-white/95">
          {title}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full">
        {/* Navigation Arrows - Netflix-style */}
        {!loading && (
          <>
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="hidden md:flex absolute left-2 top-0 bottom-0 z-40 w-12 items-center justify-center bg-gradient-to-r from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Previous"
              >
                <div className="h-10 w-10 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black hover:scale-110 transition-all duration-200 shadow-xl border border-white/10">
                  <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
                </div>
              </button>
            )}
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="hidden md:flex absolute right-2 top-0 bottom-0 z-40 w-12 items-center justify-center bg-gradient-to-l from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Next"
              >
                <div className="h-10 w-10 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black hover:scale-110 transition-all duration-200 shadow-xl border border-white/10">
                  <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                </div>
              </button>
            )}
          </>
        )}

        {/* Carousel Rail - Edge padding prevents cutoff */}
        <div
          ref={railRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-4 sm:px-6 md:px-8 lg:px-12"
          style={{
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: "1rem",
          }}
          role="list"
          aria-label={title}
        >
          {loading
            ? skeletons
            : items.map((m, idx) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  onClick={() => nav(`/movie/${m.id}`)}
                  index={idx}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

/* ===== Production-Grade Movie Card Component ===== */
function MovieCard({ movie, onClick, index }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group/card relative aspect-[2/3] w-[150px] min-w-[150px] sm:w-[180px] sm:min-w-[180px] md:w-[200px] md:min-w-[200px] flex-shrink-0 overflow-hidden rounded-md bg-neutral-900 transition-all duration-300 hover:scale-105 hover:z-50 hover:shadow-2xl focus:scale-105 focus:z-50 focus:outline-none focus:ring-2 focus:ring-white/50"
      style={{
        scrollSnapAlign: "start",
        transformOrigin: index === 0 ? "left" : "center",
      }}
      role="listitem"
      aria-label={movie.title}
    >
      {/* Poster Image */}
      <img
        src={img(movie.poster_path)}
        alt={movie.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />

      {/* Multi-layer Shadow for Depth */}
      <div className="absolute inset-0 shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover/card:shadow-[0_8px_30px_rgba(0,0,0,0.8)] transition-shadow duration-300" />

      {/* Gradient Overlay - Always visible on mobile, hover on desktop */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-100 md:opacity-0"
        }`}
      >
        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col justify-end p-3">
          {/* Play Button - Netflix-style, desktop only */}
          <div
            className={`hidden md:block absolute top-2 right-2 transition-all duration-300 ${
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-black hover:bg-white hover:scale-110 transition-all shadow-lg">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
          </div>

          {/* Movie Info */}
          <div className="space-y-1">
            {/* Title */}
            <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {movie.title}
            </h3>

            {/* Metadata Row */}
            <div className="flex items-center gap-2 text-[10px] text-white/90">
              {/* Year */}
              {movie.release_date && (
                <span className="font-medium">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}

              {/* Rating Badge - Netflix-style */}
              {movie.vote_average > 0 && (
                <>
                  <span className="text-white/40">•</span>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30">
                    <span className="text-green-400 text-[10px]">★</span>
                    <span className="text-green-400 font-semibold">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                </>
              )}

              {/* HD Badge - Prime Video style */}
              <span className="ml-auto px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[9px] font-bold tracking-wide">
                HD
              </span>
            </div>

            {/* Quick Action - Mobile only */}
            <div
              className={`md:hidden flex items-center gap-1.5 text-[10px] font-semibold text-white/80 transition-all duration-300 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Play Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Border Glow - Prime Video style */}
      <div
        className={`absolute inset-0 rounded-md transition-all duration-300 ${
          isHovered
            ? "ring-2 ring-white/20 ring-offset-2 ring-offset-black/50"
            : ""
        }`}
      />
    </button>
  );
}
