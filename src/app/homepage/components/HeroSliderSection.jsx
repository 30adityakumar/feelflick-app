// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const img = (p, s = "w342") => (p ? `https://image.tmdb.org/t/p/${s}${p}` : "/placeholder-movie.png");

export default function CarouselRow({ title, subtitle, tmdbCategory = "popular", rowId }) {
  const [items, setItems] = useState([]);
  const railRef = useRef(null);
  const nav = useNavigate();

  // Fetch items when category changes
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/movie/${tmdbCategory}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
    )
      .then((res) => res.json())
      .then((data) => setItems(data?.results ?? []))
      .catch(() => setItems([]));
  }, [tmdbCategory]);

  // Scroll the rail left or right by a percentage of the viewport width
  const scroll = (dir) => {
    const rail = railRef.current;
    if (!rail) return;
    const step = Math.min(window.innerWidth * 0.9, 900);
    rail.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className="relative py-5 select-none">
      {/* Header with title and optional subtitle */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {title}
          </h2>
          {subtitle && (
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs sm:text-sm font-semibold text-white/80">
              {subtitle}
            </span>
          )}
        </div>

        {/* Arrows for desktop */}
        <div className="hidden md:flex gap-3">
          <button
            onClick={() => scroll("left")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
            aria-label={`${rowId}-prev`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition"
            aria-label={`${rowId}-next`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Rail container with smooth horizontal scroll */}
      <div
        ref={railRef}
        className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-1.5 touch-pan-x"
      >
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => nav(`/movie/${m.id}`)}
            className="group relative snap-start rounded-2xl border border-white/12 bg-[#18181d] shadow-[0_10px_30px_rgba(0,0,0,.28)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400 
                       aspect-[2/3] w-[62vw] sm:w-[44vw] md:w-[240px] lg:w-[260px] transition-transform duration-300 hover:scale-105"
            aria-label={m.title}
          >
            <img
              src={img(m.poster_path)}
              alt={`${m.title} poster`}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/0 to-transparent px-3 pb-3 pt-8">
              <h3 className="truncate text-left text-base sm:text-lg font-bold drop-shadow-lg text-white">
                {m.title}
              </h3>
              <div className="mt-1 text-left text-xs sm:text-sm text-white/70 font-semibold flex items-center gap-2">
                <span>{m.release_date?.slice(0, 4) || "—"}</span>
                {typeof m.vote_average === "number" && (
                  <span aria-label={`Rating ${m.vote_average.toFixed(1)}`} className="flex items-center">
                    ★ {m.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Overlay arrows for mobile */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 md:hidden">
        <button
          onClick={() => scroll("left")}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white shadow-md hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={`${rowId}-prev-m`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white shadow-md hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={`${rowId}-next-m`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
