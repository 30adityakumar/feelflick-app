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
      .then((j) => (setItems(j?.results ?? []), setLoading(false)))
      .catch(() => { setItems([]); setLoading(false); });
  }, [tmdbCategory]);

  // Desktop/keyboard navigation
  useEffect(() => {
    function handleKey(e) {
      if (document.activeElement && railRef.current && railRef.current.contains(document.activeElement)) {
        if (e.key === "ArrowLeft") scroll("left");
        if (e.key === "ArrowRight") scroll("right");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const scroll = (dir) => {
    const rail = railRef.current;
    if (!rail) return;
    const step = Math.min(window.innerWidth * 0.88, 900);
    rail.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className="relative py-6 sm:py-7">
      {/* Header */}
      <header className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {title}
          </h2>
          {subtitle && (
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs sm:text-sm font-semibold text-white/85">
              {subtitle}
            </span>
          )}
        </div>
        {/* Desktop arrows */}
        <div className="hidden gap-3 md:flex">
          <button
            onClick={() => scroll("left")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/90 hover:bg-white/20 hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/90 hover:bg-white/20 hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-2 left-0 w-12 z-10 bg-gradient-to-r from-[#18181d]/95 via-[#18181d]/40 to-transparent" />
      <div className="pointer-events-none absolute inset-y-2 right-0 w-12 z-10 bg-gradient-to-l from-[#18181d]/95 via-[#18181d]/40 to-transparent" />

      {/* Movie Rail */}
      <div
        ref={railRef}
        className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-2 touch-pan-x scroll-smooth"
        tabIndex={0}
        aria-label={`${title} row`}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[2/3] w-[62vw] xs:w-[48vw] sm:w-[38vw] md:w-[220px] lg:w-[240px] rounded-2xl bg-white/7 animate-pulse"
              />
            ))
          : items.map((m) => (
              <button
                key={m.id}
                onClick={() => nav(`/movie/${m.id}`)}
                className="group relative snap-start rounded-2xl border border-white/14 bg-[#18181d] shadow-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400
                           aspect-[2/3] w-[62vw] xs:w-[48vw] sm:w-[38vw] md:w-[220px] lg:w-[240px] transition-transform duration-300 hover:scale-[1.065] focus:scale-105"
                style={{ minWidth: 0 }}
                aria-label={m.title}
                tabIndex={0}
              >
                <img
                  src={img(m.poster_path)}
                  alt={`${m.title} poster`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-focus:scale-105"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent px-3 pb-3 pt-9 blur-[.5px]">
                  <h3 className="truncate text-left text-lg font-bold drop-shadow-md text-white">{m.title}</h3>
                  <div className="mt-1 text-left text-xs text-white/80 flex items-center gap-2">
                    <span>{m.release_date?.slice(0, 4) || "—"}</span>
                    {typeof m.vote_average === "number" && (
                      <span className="flex items-center">
                        ★ {m.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                {/* Subtle glow on hover/focus */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl group-hover:shadow-[0_0_16px_2px_rgba(255,150,47,0.12)] group-focus:shadow-[0_0_32px_4px_rgba(254,146,69,0.23)] transition" />
              </button>
            ))}
      </div>

      {/* Mobile overlay arrows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 md:hidden">
        <button
          onClick={() => scroll("left")}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white shadow-lg hover:bg-black/80 active:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          aria-label={`Scroll ${title} left`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white shadow-lg hover:bg-black/80 active:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          aria-label={`Scroll ${title} right`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
