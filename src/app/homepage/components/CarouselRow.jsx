// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const img = (p, s = "w342") => (p ? `https://image.tmdb.org/t/p/${s}${p}` : "/placeholder-movie.png");

export default function CarouselRow({ title, subtitle, tmdbCategory = "popular", rowId }) {
  const [items, setItems] = useState([]);
  const railRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
    )
      .then((r) => r.json())
      .then((j) => setItems(j?.results ?? []))
      .catch(() => setItems([]));
  }, [tmdbCategory]);

  const scroll = (dir) => {
    const rail = railRef.current;
    if (!rail) return;
    const step = Math.min(rail.clientWidth * 0.9, 900);
    rail.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <div className="relative py-4 sm:py-5">
      {/* Header */}
      <div className="mb-2.5 sm:mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[1.05rem] sm:text-[1.2rem] md:text-[1.35rem] font-extrabold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <span className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[11px] sm:text-[12px] font-semibold text-white/80">
              {subtitle}
            </span>
          )}
        </div>

        {/* Desktop arrows */}
        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => scroll("left")}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/10 text-white/90 hover:bg-white/15"
            aria-label={`${rowId}-prev`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/10 text-white/90 hover:bg-white/15"
            aria-label={`${rowId}-next`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Rail (mobile-first) */}
      <div
        ref={railRef}
        className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1.5"
      >
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => nav(`/movie/${m.id}`)}
            className="group relative aspect-[2/3] w-[62vw] min-w-[62vw] xs:w-[56vw] xs:min-w-[56vw] sm:w-[44vw] sm:min-w-[44vw] md:w-[240px] md:min-w-[240px] lg:w-[260px] lg:min-w-[260px] snap-start overflow-hidden rounded-2xl border border-white/8 bg-[#18181d] shadow-[0_10px_30px_rgba(0,0,0,.28)] touch-manipulation"
            aria-label={m.title}
          >
            <img
              src={img(m.poster_path)}
              alt={m.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/0 to-transparent px-2.5 pb-2 pt-8">
              <div className="truncate text-left text-[.92rem] sm:text-[.95rem] font-bold drop-shadow">
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
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1 md:hidden">
        <button
          onClick={() => scroll("left")}
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white"
          aria-label={`${rowId}-prev-m`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white"
          aria-label={`${rowId}-next-m`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}