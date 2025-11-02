// src/app/homepage/components/CarouselRow.jsx
import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CarouselRow({
  title,
  items = [],
  tmdbBase = "https://image.tmdb.org/t/p",
  loading,
  pill,
}) {
  const nav = useNavigate();
  const scroller = useRef(null);

  const cards = useMemo(
    () =>
      items.map((m) => ({
        id: m.id,
        title: m.title,
        poster: m.poster_path ? `${tmdbBase}/w342${m.poster_path}` : null,
        year: m.release_date ? m.release_date.slice(0, 4) : "",
        rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
      })),
    [items, tmdbBase]
  );

  const scrollBy = (dir) => {
    const el = scroller.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-10 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-black tracking-tight text-[clamp(1.05rem,2vw,1.35rem)]">
            {title}
          </h2>
          {pill && (
            <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-white/90
                             bg-white/10 ring-1 ring-white/10">
              {pill}
            </span>
          )}
        </div>
        <div className="hidden md:flex gap-2 pr-4 lg:pr-10">
          <IconBtn onClick={() => scrollBy("left")}><ChevronLeft /></IconBtn>
          <IconBtn onClick={() => scrollBy("right")}><ChevronRight /></IconBtn>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scroller}
          className="
            flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory
            px-4 sm:px-6 lg:px-10 pb-1
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          "
        >
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : cards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => nav(`/movie/${c.id}`)}
                  className="
                    group relative w-[46vw] sm:w-[200px] lg:w-[220px]
                    shrink-0 snap-start rounded-2xl overflow-hidden ring-1 ring-white/7
                    bg-white/[.03] hover:bg-white/[.05] transition
                  "
                  aria-label={c.title}
                  title={c.title}
                >
                  {c.poster ? (
                    <img
                      src={c.poster}
                      alt=""
                      className="h-[64vw] sm:h-[300px] lg:h-[320px] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-[64vw] sm:h-[300px] lg:h-[320px] grid place-items-center text-white/40">
                      No image
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-95" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-white font-bold text-sm line-clamp-2 drop-shadow">
                      {c.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-white/80">
                      {c.year && <span>{c.year}</span>}
                      {c.rating !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                          {c.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-9 w-9 grid place-items-center rounded-full bg-white/10 text-white
                 hover:bg-white/15 ring-1 ring-white/10"
      aria-label="scroll"
    >
      <span className="h-5 w-5">{children}</span>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="w-[46vw] sm:w-[200px] lg:w-[220px] shrink-0 snap-start">
      <div className="h-[64vw] sm:h-[300px] lg:h-[320px] rounded-2xl bg-white/[.06] animate-pulse" />
    </div>
  );
}