// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const img = (p, s = "w500") => (p ? `https://image.tmdb.org/t/p/${s}${p}` : "/placeholder-movie.png");

export default function CarouselRow({ title, subtitle, tmdbCategory = "popular", rowId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const railRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(
      `https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
    )
      .then((r) => r.json())
      .then((j) => {
        setItems(j?.results ?? []);
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
    rail.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  const handleScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    setShowLeftArrow(rail.scrollLeft > 10);
    setShowRightArrow(rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 10);
  };

  useEffect(() => {
    const rail = railRef.current;
    if (rail) {
      rail.addEventListener("scroll", handleScroll);
      handleScroll();
      return () => rail.removeEventListener("scroll", handleScroll);
    }
  }, [items]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") scroll("right");
    if (e.key === "ArrowLeft") scroll("left");
  };

  const skeletons = Array.from({ length: 6 }).map((_, idx) => (
    <div
      key={idx}
      className="aspect-[2/3] w-[40vw] min-w-[40vw] xs:w-[35vw] xs:min-w-[35vw] sm:w-[28vw] sm:min-w-[28vw] md:w-[23vw] md:min-w-[23vw] lg:w-[18vw] lg:min-w-[18vw] xl:w-[220px] xl:min-w-[220px] rounded-lg bg-neutral-800/60 animate-pulse"
    />
  ));

  return (
    <div className="relative group px-4 sm:px-6 md:px-8 lg:px-12">
      {/* Header */}
      <div className="mb-3 md:mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-white">
            {title}
          </h2>
          {subtitle && (
            <span className="hidden sm:inline-block rounded-full bg-white/10 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-white/90">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12">
        {/* Desktop Navigation Arrows */}
        {!loading && (
          <>
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="hidden md:grid absolute left-0 top-0 bottom-0 z-20 w-12 lg:w-16 place-items-center bg-gradient-to-r from-black/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:opacity-100"
                aria-label={`${rowId}-prev`}
              >
                <div className="grid h-10 w-10 lg:h-12 lg:w-12 place-items-center rounded-full bg-black/80 text-white hover:bg-black/95 hover:scale-110 transition-all shadow-2xl">
                  <ChevronLeft className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={2.5} />
                </div>
              </button>
            )}
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="hidden md:grid absolute right-0 top-0 bottom-0 z-20 w-12 lg:w-16 place-items-center bg-gradient-to-l from-black/95 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:opacity-100"
                aria-label={`${rowId}-next`}
              >
                <div className="grid h-10 w-10 lg:h-12 lg:w-12 place-items-center rounded-full bg-black/80 text-white hover:bg-black/95 hover:scale-110 transition-all shadow-2xl">
                  <ChevronRight className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={2.5} />
                </div>
              </button>
            )}
          </>
        )}

        {/* Carousel Rail */}
        <div
          ref={railRef}
          className="flex gap-2 md:gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 sm:px-6 md:px-8 lg:px-12"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="list"
          aria-label={title}
        >
          {loading
            ? skeletons
            : items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => nav(`/movie/${m.id}`)}
                  className="group/card relative aspect-[2/3] w-[40vw] min-w-[40vw] xs:w-[35vw] xs:min-w-[35vw] sm:w-[28vw] sm:min-w-[28vw] md:w-[23vw] md:min-w-[23vw] lg:w-[18vw] lg:min-w-[18vw] xl:w-[220px] xl:min-w-[220px] snap-start overflow-hidden rounded-lg bg-neutral-900 transition-all duration-300 hover:scale-105 hover:z-10 focus:scale-105 focus:z-10 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg hover:shadow-2xl"
                  role="listitem"
                  aria-label={m.title}
                  tabIndex={0}
                >
                  <img
                    src={img(m.poster_path)}
                    alt={m.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                        {m.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs text-white/90">
                        {m.release_date && (
                          <span className="font-medium">
                            {new Date(m.release_date).getFullYear()}
                          </span>
                        )}
                        {m.vote_average && (
                          <span className="flex items-center gap-0.5">
                            <span className="text-yellow-400">★</span>
                            <span className="font-semibold">{m.vote_average.toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}
