// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const tmdbImg = (p, s = "w1280") => (p ? `https://image.tmdb.org/t/p/${s}${p}` : "");

export default function HeroSliderSection({ className = "" }) {
  const [slides, setSlides] = useState([]);
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const timer = useRef(null);

  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US&page=1`
    )
      .then((r) => r.json())
      .then((j) => setSlides(j?.results?.slice(0, 6) ?? []))
      .catch(() => setSlides([]));
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    clearInterval(timer.current);
    timer.current = setInterval(() => setI((p) => (p + 1) % slides.length), 5500);
    return () => clearInterval(timer.current);
  }, [slides.length]);

  const cur = slides[i] || {};
  const backdrop = useMemo(
    () => tmdbImg(cur.backdrop_path || cur.poster_path, "w1280"),
    [cur]
  );

  const viewDetails = () => cur?.id && nav(`/movie/${cur.id}`);

  return (
    <section
      className={[
        "relative w-[100vw] overflow-hidden select-none bg-[#0f0f10]",
        className,
      ].join(" ")}
      style={{ marginTop: 0 }}
    >
      {/* Media */}
      <div className="relative w-[100vw] aspect-[16/10] xs:aspect-[16/9] sm:aspect-[16/7] lg:aspect-[16/5]">
        {backdrop && (
          <img
            src={backdrop}
            alt={cur?.title || ""}
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
            loading="eager"
          />
        )}
        {/* Legibility overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.45)_0%,rgba(0,0,0,.35)_35%,rgba(0,0,0,.65)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_14%_60%,rgba(0,0,0,.62),transparent_60%)]" />
      </div>

      {/* Copy + CTA */}
      <div className="absolute inset-0 flex items-end pb-4 sm:pb-6 md:pb-7">
        <div className="mx-auto w-full max-w-[1680px] px-3 sm:px-4 md:px-8">
          <div className="max-w-[760px]">
            <h1 className="text-white font-black tracking-tight leading-tight text-[clamp(1.65rem,3.3vw,3rem)] drop-shadow-[0_2px_18px_rgba(0,0,0,.6)]">
              {cur?.title || "Featured"}
            </h1>
            {!!cur?.overview && (
              <p className="mt-2 text-white/85 text-[clamp(.95rem,1.1vw,1.05rem)] leading-relaxed line-clamp-4">
                {cur.overview}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={viewDetails}
                className="inline-flex min-h-10 items-center justify-center rounded-[14px] bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-4.5 sm:px-5 py-2.5 text-[.95rem] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,.28)] hover:brightness-[1.05] focus:outline-none"
              >
                View details
              </button>
              <button
                onClick={() => setI((p) => (p + 1) % (slides.length || 1))}
                className="inline-flex min-h-10 items-center justify-center rounded-[14px] border border-white/25 bg-black/30 px-4.5 sm:px-5 py-2.5 text-[.95rem] font-semibold text-white/90 backdrop-blur-sm hover:bg-white/10 focus:outline-none"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pips */}
      <div className="pointer-events-none absolute right-4 top-4 hidden gap-1.5 sm:flex">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={["h-1.5 w-1.5 rounded-full", idx === i ? "bg-white/90" : "bg-white/40"].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}