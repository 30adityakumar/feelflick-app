import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const TMDB_IMG = (path, size = "w1280") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : "";

export default function HeroSliderSection({ className = "" }) {
  const [slides, setSlides] = useState([]);
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const timer = useRef(null);

  useEffect(() => {
    // lightweight list for hero
    fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
    )
      .then((r) => r.json())
      .then((j) => setSlides(j?.results?.slice(0, 6) ?? []))
      .catch(() => setSlides([]));
  }, []);

  // auto-advance
  useEffect(() => {
    if (!slides.length) return;
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(() => setI((p) => (p + 1) % slides.length), 5500);
    return () => clearInterval(timer.current);
  }, [slides.length]);

  const current = slides[i] || {};
  const backdrop = useMemo(
    () => TMDB_IMG(current.backdrop_path || current.poster_path, "w1280"),
    [current]
  );

  function viewDetails() {
    if (current?.id) nav(`/movie/${current.id}`);
  }

  return (
    <section
      className={[
        // full-bleed container, zero top spacing
        "relative w-[100vw] overflow-hidden select-none",
        "bg-[#0f0f10]",
        className,
      ].join(" ")}
      style={{ marginTop: 0 }}
    >
      {/* MEDIA */}
      <div className="relative w-[100vw] aspect-[16/7] sm:aspect-[16/6] lg:aspect-[16/5]">
        {/* image */}
        {backdrop && (
          <img
            src={backdrop}
            alt={current?.title || ""}
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
            loading="eager"
          />
        )}

        {/* gradient for text legibility */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.45)_0%,rgba(0,0,0,.35)_35%,rgba(0,0,0,.65)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_15%_60%,rgba(0,0,0,.62),transparent_60%)]" />
      </div>

      {/* COPY + CTA (safe gutter) */}
      <div className="absolute inset-0 flex items-end">
        <div className="mx-auto mb-8 w-full max-w-[1680px] px-4 md:px-8">
          <div className="max-w-[780px]">
            <h1 className="text-white font-black tracking-tight leading-tight text-[clamp(1.8rem,3.4vw,3.2rem)] drop-shadow-[0_2px_18px_rgba(0,0,0,.6)]">
              {current?.title || "Featured"}
            </h1>
            {current?.overview && (
              <p className="mt-2 text-white/85 text-base md:text-[1.05rem] leading-relaxed line-clamp-4">
                {current.overview}
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={viewDetails}
                className="inline-flex items-center justify-center rounded-[14px] bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 py-2.5 text-[0.95rem] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,.28)] hover:brightness-[1.05] focus:outline-none"
              >
                View details
              </button>
              <button
                onClick={() => setI((p) => (p + 1) % (slides.length || 1))}
                className="inline-flex items-center justify-center rounded-[14px] border border-white/25 bg-black/30 px-5 py-2.5 text-[0.95rem] font-semibold text-white/90 backdrop-blur-sm hover:bg-white/10 focus:outline-none"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIPS */}
      <div className="pointer-events-none absolute right-6 top-5 hidden gap-1.5 md:flex">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={[
              "h-1.5 w-1.5 rounded-full",
              idx === i ? "bg-white/90" : "bg-white/40",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}