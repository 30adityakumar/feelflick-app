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
    const scrollAmount = rail.clientWidth * 0.8;
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
      className="aspect-[2/3] w-[40vw] min-w-[40vw] xs:w-[35vw] xs:min-w-[35vw] sm:w-[28vw] sm:min-w-[28vw] md:w-[20vw] md:min-w-[20vw] lg:w-[15vw] lg:min-w-[15vw] xl:w-[13vw] xl:min-w-[13vw] 2xl:w-[200px] 2xl:min-w-[200px] rounded-lg bg-neutral-800/60 animate-pulse flex-shrink-0"
    />
  ));

  return (
    <div className="relative group w-full">
      {/* Header - Smaller, cleaner */}
      <div className="mb-2 md:mb-3 px-4 md:px-8 lg:px-12">
        <h2 className="text-sm md:text-base lg:text-lg font-bold tracking-tight text-white">
          {title}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full">
        {/* Navigation Arrows - Subtle */}
        {!loading && (
          <>
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="hidden md:flex absolute left-0 top-0 bottom-0 z-30 w-12 items-center justify-center bg-gradient-to-r from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Previous"
              >
                <div className="h-8 w-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all border border-white/10">
                  <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </button>
            )}
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="hidden md:flex absolute right-0 top-0 bottom-0 z-30 w-12 items-center justify-center bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Next"
              >
                <div className="h-8 w-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all border border-white/10">
                  <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </button>
            )}
          </>
        )}

        {/* Carousel Rail - Tighter spacing */}
        <div
          ref={railRef}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3 px-4 md:px-8 lg:px-12"
          role="list"
          aria-label={title}
        >
          {loading
            ? skeletons
            : items.map((m) => (
                <button
                  key={m.id}
                  onClick={() => nav(`/movie/${m.id}`)}
                  className="group/card relative aspect-[2/3] w-[40vw] min-w-[40vw] xs:w-[35vw] xs:min-w-[35vw] sm:w-[28vw] sm:min-w-[28vw] md:w-[20vw] md:min-w-[20vw] lg:w-[15vw] lg:min-w-[15vw] xl:w-[13vw] xl:min-w-[13vw] 2xl:w-[200px] 2xl:min-w-[200px] snap-start overflow-hidden rounded-lg bg-neutral-900 transition-all duration-200 hover:scale-105 hover:z-20 hover:shadow-2xl focus:scale-105 focus:z-20 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-md flex-shrink-0"
                  role="listitem"
                  aria-label={m.title}
                >
                  <img
                    src={img(m.poster_path)}
                    alt={m.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />

                  {/* Overlay - Always visible on mobile, hover on desktop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 mb-0.5">
                        {m.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                        {m.release_date && (
                          <span>{new Date(m.release_date).getFullYear()}</span>
                        )}
                        {m.vote_average > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <span className="text-yellow-400">★</span>
                              {m.vote_average.toFixed(1)}
                            </span>
                          </>
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
