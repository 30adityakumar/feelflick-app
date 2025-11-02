import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TMDB_IMG = (p, size = "w342") =>
  p ? `https://image.tmdb.org/t/p/${size}${p}` : "/placeholder-movie.png";

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
    <div className="relative py-6">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[1.25rem] md:text-[1.35rem] font-extrabold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <span className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[12px] font-semibold text-white/80">
              {subtitle}
            </span>
          )}
        </div>

        {/* Arrows (desktop) */}
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

      {/* Rail */}
      <div
        ref={railRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2"
      >
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => nav(`/movie/${m.id}`)}
            className="group relative aspect-[2/3] w-[44vw] min-w-[44vw] snap-start overflow-hidden rounded-2xl border border-white/8 bg-[#18181d] shadow-[0_10px_30px_rgba(0,0,0,.28)] sm:w-[220px] sm:min-w-[220px] md:w-[240px] md:min-w-[240px] lg:w-[260px] lg:min-w-[260px] touch-manipulation"
            aria-label={m.title}
          >
            <img
              src={TMDB_IMG(m.poster_path)}
              alt={m.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/0 to-transparent px-3 pb-2 pt-10">
              <div className="truncate text-left text-[.95rem] font-bold drop-shadow">
                {m.title}
              </div>
              <div className="mt-0.5 text-left text-xs text-white/75">
                {m.release_date?.slice(0, 4) || "—"}
                {Number.isFinite(m.vote_average) && (
                  <span className="ml-2">★ {m.vote_average.toFixed(1)}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Arrows (mobile overlay) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-2 md:hidden">
        <button
          onClick={() => scroll("left")}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white shadow-md"
          aria-label={`${rowId}-prev-m`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white shadow-md"
          aria-label={`${rowId}-next-m`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}