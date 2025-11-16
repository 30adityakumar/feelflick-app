// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      {/* Header - More padding on desktop */}
      <div className="mb-3 px-4 sm:px-6 md:px-10 lg:px-16">
        <h2 className="text-base md:text-lg font-bold tracking-tight text-white/95">
          {title}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full">
        {/* Navigation Arrows - Positioned inside padding zone */}
        {!loading && (
          <>
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="hidden md:flex absolute left-4 lg:left-6 top-0 bottom-0 z-40 w-12 items-center justify-center bg-gradient-to-r from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
                className="hidden md:flex absolute right-4 lg:right-6 top-0 bottom-0 z-40 w-12 items-center justify-center bg-gradient-to-l from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Next"
              >
                <div className="h-10 w-10 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black hover:scale-110 transition-all duration-200 shadow-xl border border-white/10">
                  <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                </div>
              </button>
            )}
          </>
        )}

        {/* Carousel Rail - Increased desktop padding */}
        <div
          ref={railRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-4 sm:px-6 md:px-10 lg:px-16"
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

/* ===== Movie Card Component - Bug Fixed ===== */
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

      {/* Gradient Overlay - FIXED: Always visible, no conditional opacity */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-100">
        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col justify-end p-3">
          {/* Movie Info - Always visible */}
          <div className="space-y-1">
            {/* Title - Strong text shadow for readability */}
            <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {movie.title}
            </h3>

            {/* Metadata Row */}
            <div className="flex items-center gap-2 text-[10px] text-white/90">
              {/* Year */}
              {movie.release_date && (
                <span className="font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}

              {/* Rating Badge */}
              {movie.vote_average > 0 && (
                <>
                  <span className="text-white/40">•</span>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                    <span className="text-green-400 text-[10px]">★</span>
                    <span className="text-green-400 font-semibold">
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                </>
              )}

              {/* HD Badge */}
              <span className="ml-auto px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[9px] font-bold tracking-wide backdrop-blur-sm">
                HD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Border Glow */}
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
