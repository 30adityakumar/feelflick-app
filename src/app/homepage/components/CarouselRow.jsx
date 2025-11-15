// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const img = (p, s = "w342") => (p ? `https://image.tmdb.org/t/p/${s}${p}` : "/placeholder-movie.png");

export default function CarouselRow({ title, subtitle, tmdbCategory = "popular", rowId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const step = Math.max(rail.clientWidth * 0.85, 320);
    rail.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  // Keyboard left/right for accessibility
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") scroll("right");
    if (e.key === "ArrowLeft") scroll("left");
  };

  // Skeleton Card
  const skeletons = Array.from({ length: 8 }).map((_, idx) => (
    <div key={idx} className="aspect-[2/3] w-[46vw] xs:w-[40vw] sm:w-[25vw] md:w-[190px] lg:w-[220px] rounded-2xl bg-white/10 animate-pulse" />
  ));

  return (
    <div className="relative py-4 sm:py-5 group">
      {/* Header */}
      <div className="mb-2.5 sm:mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[1.05rem] sm:text-[1.2rem] md:text-[1.35rem] font-extrabold tracking-tight">{title}</h2>
          {subtitle && (
            <span className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[11px] sm:text-[12px] font-semibold text-white/80">
              {subtitle}
            </span>
          )}
        </div>
        {/* Desktop arrows overlay, fade in on hover */}
        <div className="hidden md:flex gap-2 transition-opacity group-hover:opacity-100 opacity-70 absolute right-4 top-1/2 -translate-y-1/2 z-20">
          <button
            onClick={() => scroll("left")}
            tabIndex={0}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/85 shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label={`${rowId}-prev`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => scroll("right")}
            tabIndex={0}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/85 shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label={`${rowId}-next`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
      {/* Carousel rail */}
      <div
        ref={railRef}
        className="no-scrollbar -mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-2 md:pb-3 touch-pan-x"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label={title}
      >
        {loading
          ? skeletons
          : items.map((m) => (
              <button
                key={m.id}
                onClick={() => nav(`/movie/${m.id}`)}
                className="group relative aspect-[2/3] w-[46vw] min-w-[46vw] xs:w-[40vw] xs:min-w-[40vw] sm:w-[28vw] sm:min-w-[28vw] md:w-[190px] md:min-w-[190px] lg:w-[220px] lg:min-w-[220px] snap-start overflow-hidden rounded-2xl border border-white/8 bg-[#17181c] shadow-[0_4px_18px_rgba(0,0,0,.28)] focus:ring-2 focus:ring-white/60 transition-all hover:scale-[1.04] focus:scale-[1.04] outline-none"
                aria-label={m.title}
                tabIndex={0}
              >
                <img
                  src={img(m.poster_path)}
                  alt={m.title}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                />
                {/* Overlay gradient & info */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/0 to-transparent px-2.5 pb-2 pt-8">
                  <div className="truncate text-left text-[.98rem] sm:text-[1.04rem] font-semibold drop-shadow">
                    {m.title}
                  </div>
                  <div className="mt-0.5 text-left text-[11px] sm:text-xs text-white/75">
                    {m.release_date?.slice(0, 4) || "—"}
                    {Number.isFinite(m.vote_average) && (
                      <span className="ml-2">★ {m.vote_average.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
      </div>
      {/* Mobile overlay arrows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1 md:hidden z-10">
        <button
          onClick={() => scroll("left")}
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white shadow-lg"
          aria-label={`${rowId}-prev-m`}
          tabIndex={-1}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white shadow-lg"
          aria-label={`${rowId}-next-m`}
          tabIndex={-1}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
