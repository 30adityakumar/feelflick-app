// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const img = (p, s = "w500") => (p ? `https://image.tmdb.org/t/p/${s}${p}` : "/placeholder-movie.png");

export default function CarouselRow({ title, tmdbCategory = "popular", rowId }) {
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
      className="aspect-[2/3] w-[38vw] min-w-[38vw] xs:w-[34vw] xs:min-w-[34vw] sm:w-[28vw] sm:min-w-[28vw] md:w-[22vw] md:min-w-[22vw] lg:w-[17vw] lg:min-w-[17vw] xl:w-[15vw] xl:min-w-[15vw] 2xl:w-[240px] 2xl:min-w-[240px] rounded-lg bg-neutral-800/60 animate-pulse"
    />
  ));

  return (
    <div className="relative group w-full overflow-hidden">
      {/* Header with proper padding */}
      <div className="mb-4 md:mb-5 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white">
          {title}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full">
        {/* Desktop Navigation Arrows with proper positioning */}
        {!loading && (
          <>
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="hidden md:grid absolute left-0 top-0 bottom-0 z-30 w-12 lg:w-16 xl:w-20 place-items-center bg-gradient-to-r from-black via-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:opacity-100"
                aria-label={`${rowId}-prev`}
              >
                <div className="grid h-12 w-12 lg:h-14 lg:w-14 place-items-center rounded-full bg-black/80 backdrop-blur-sm text-white hover:bg-black/95 hover:scale-110 transition-all shadow-2xl border border-white/10">
                  <ChevronLeft className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={2.5} />
                </div>
              </button>
            )}
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="hidden md:grid absolute right-0 top-0 bottom-0 z-30 w-12 lg:w-16 xl:w-20 place-items-center bg-gradient-to-l from-black via-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:opacity-100"
                aria-label={`${rowId}-next`}
              >
                <div className="grid h-12 w-12 lg:h-14 lg:w-14 place-items-center rounded-full bg-black/80 backdrop-blur-sm text-white hover:bg-black/95 hover:scale-110 transition-all shadow-2xl border border-white/10">
                  <ChevronRight className="h-7 w-7 lg:h-8 lg:w-8" strokeWidth={2.5} />
                </div>
              </button>
            )}
          </>
        )}

        {/* Carousel Rail with proper padding */}
        <div
          ref={railRef}
          className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4 pl-4 pr-4 sm:pl-6 sm:pr-6 md:pl-8 md:pr-8 lg:pl-12 lg:pr-12 xl:pl-16 xl:pr-16"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="list"
          aria-label={title}
          style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
        >
          {loading
            ? skeletons
            : items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => nav(`/movie/${m.id}`)}
                  className="group/card relative aspect-[2/3] w-[38vw] min-w-[38vw] xs:w-[34vw] xs:min-w-[34vw] sm:w-[28vw] sm:min-w-[28vw] md:w-[22vw] md:min-w-[22vw] lg:w-[17vw] lg:min-w-[17vw] xl:w-[15vw] xl:min-w-[15vw] 2xl:w-[240px] 2xl:min-w-[240px] snap-start overflow-hidden rounded-lg bg-neutral-900 transition-all duration-300 hover:scale-105 hover:z-20 hover:shadow-2xl focus:scale-105 focus:z-20 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg flex-shrink-0"
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

                  {/* Overlay with Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 md:p-4">
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white leading-tight line-clamp-2 drop-shadow-lg mb-1">
                        {m.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs md:text-sm text-white/90">
                        {m.release_date && (
                          <span className="font-medium">
                            {new Date(m.release_date).getFullYear()}
                          </span>
                        )}
                        {m.vote_average && (
                          <span className="flex items-center gap-1">
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
