// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const tmdbImg = (p, s = "w1280") => (p ? `https://image.tmdb.org/t/p/${s}${p}` : "");

export default function HeroSliderSection({ className = "" }) {
  const [slides, setSlides] = useState([]);
  const [i, setI] = useState(0);
  const [fade, setFade] = useState("in");
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
    timer.current = setInterval(() => {
      setFade("out");
      setTimeout(() => {
        setI((prev) => (prev + 1) % slides.length);
        setFade("in");
      }, 400);
    }, 5200);
    return () => clearInterval(timer.current);
  }, [slides.length, i]);

  const cur = slides[i] || {};
  const backdrop = useMemo(
    () => tmdbImg(cur.backdrop_path || cur.poster_path, "w1280"),
    [cur]
  );

  const viewDetails = () => cur?.id && nav(`/movie/${cur.id}`);

  return (
    <section
      className={[
        "relative w-full overflow-hidden select-none bg-[#0f0f10] transition-all duration-500",
        className,
      ].join(" ")}
      style={{ marginTop: 0 }}
      aria-label="Featured carousel"
    >
      {/* Media */}
      <div
        className="relative w-full aspect-[16/10] xs:aspect-[16/9] sm:aspect-[16/7] lg:aspect-[16/5] flex items-center justify-center"
        style={{ background: "#151517" }}
      >
        {backdrop && (
          <img
            src={backdrop}
            alt={cur?.title || ""}
            className={[
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-400",
              fade === "in" ? "opacity-100" : "opacity-0"
            ].join(" ")}
            decoding="async"
            loading="eager"
            draggable={false}
          />
        )}
        {/* Fallback placeholder for slow/no images */}
        {!backdrop && (
          <div className="absolute inset-0 w-full h-full bg-neutral-900/40 flex items-center justify-center">
            <span className="text-3xl text-white/60 font-bold">Featured</span>
          </div>
        )}
        {/* Legibility overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,24,32,0.40)_0%,rgba(22,25,35,0.38)_35%,rgba(20,29,52,0.58)_100%)] pointer-events-none" />
      </div>

      {/* Copy + CTA */}
      <div className="absolute inset-0 flex items-end pb-5 sm:pb-7 md:pb-9">
        <div className="mx-auto w-full max-w-[1680px] px-4 xs:px-6 md:px-10 transition-all">
          <div className="max-w-[700px]">
            <h1 className="text-white font-extrabold tracking-tight leading-tight text-[clamp(1.55rem,4vw,3.1rem)] drop-shadow-[0_3px_16px_rgba(0,0,0,.62)]">
              {cur?.title || "Featured"}
            </h1>
            {!!cur?.overview && (
              <p className="mt-2 text-white/90 text-[clamp(.92rem,1.14vw,1rem)] leading-relaxed line-clamp-4">
                {cur.overview}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-4">
              <button
                onClick={viewDetails}
                className="inline-flex min-h-10 items-center justify-center rounded-[15px] bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 sm:px-7 py-2.5 text-[1.05rem] font-semibold text-white shadow-[0_10px_36px_rgba(0,0,0,.30)] hover:brightness-110 active:brightness-95 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              >
                View details
              </button>
              <button
                aria-label="Next slide"
                onClick={() => {
                  setFade("out");
                  setTimeout(() => {
                    setI((prev) => (prev + 1) % (slides.length || 1));
                    setFade("in");
                  }, 400);
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-[15px] border border-white/25 bg-black/60 px-5 sm:px-7 py-2.5 text-[1.03rem] font-semibold text-white/90 backdrop-blur-sm hover:bg-white/10 active:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dots/pips: visible on all screens, accessible */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20" aria-label="Carousel navigation">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Slide ${idx + 1}`}
            className={[
              "h-2.5 w-2.5 rounded-full transition-colors duration-300",
              idx === i ? "bg-white/90 scale-125 shadow-lg" : "bg-white/50"
            ].join(" ")}
            onClick={() => { setI(idx); setFade("in"); }}
            tabIndex={0}
          />
        ))}
      </div>
    </section>
  );
}
