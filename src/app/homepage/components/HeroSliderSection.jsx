// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Lightweight hero slider that auto-rotates trending backdrops.
 * - Abortable fetch
 * - Pause on hover
 * - Safe fallbacks when TMDB key missing
 */
export default function HeroSliderSection() {
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const [slides, setSlides] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [i, setI] = useState(0);
  const hoverRef = useRef(false);
  const timerRef = useRef(null);

  const apiUrl = useMemo(() => {
    if (!TMDB_KEY) return null;
    return `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_KEY}`;
  }, [TMDB_KEY]);

  useEffect(() => {
    const abort = new AbortController();
    async function run() {
      if (!apiUrl) {
        setSlides([]); // no key → blank hero
        setState("ready");
        return;
      }
      try {
        setState("loading");
        const r = await fetch(apiUrl, { signal: abort.signal });
        if (!r.ok) throw new Error(`TMDB trending ${r.status}`);
        const j = await r.json();
        const top = (j?.results || []).filter(m => m.backdrop_path).slice(0, 6);
        setSlides(top);
        setState("ready");
      } catch (e) {
        if (!abort.signal.aborted) {
          console.warn("Hero fetch failed:", e);
          setState("error");
        }
      }
    }
    run();
    return () => abort.abort();
  }, [apiUrl]);

  // auto-rotate every 6s, paused while hovering
  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (hoverRef.current) return;
      setI(p => (p + 1) % Math.max(slides.length || 1, 1));
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const current = slides[i];

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
      {/* Media */}
      <div className="relative aspect-[16/7] sm:aspect-[16/6] md:aspect-[16/5] w-full">
        {state === "loading" && <div className="h-full w-full animate-pulse bg-white/5" />}

        {state === "error" && (
          <div className="flex h-full w-full items-center justify-center text-white/75">
            Couldn’t load spotlight.
          </div>
        )}

        {state === "ready" && current ? (
          <>
            <img
              src={`https://image.tmdb.org/t/p/w1280${current.backdrop_path}`}
              alt={current.title || "Featured movie"}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
            {/* overlays */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
          </>
        ) : null}

        {/* Copy */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-6 sm:right-6">
          <div className="max-w-[820px]">
            <h3 className="text-[clamp(1.1rem,3.5vw,2rem)] font-extrabold leading-tight tracking-tight text-white drop-shadow">
              {current?.title || "Discover something you’ll love"}
            </h3>
            {current?.overview && (
              <p className="mt-1 line-clamp-2 text-[clamp(.8rem,1.8vw,.95rem)] text-white/85">
                {current.overview}
              </p>
            )}
            {current?.id && (
              <div className="mt-3">
                <Link
                  to={`/movie/${current.id}`}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-5 text-[0.95rem] font-semibold text-white shadow-lift hover:opacity-95 active:scale-[.99] focus:outline-none"
                >
                  View details
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute right-3 top-3 flex gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  idx === i ? "bg-white/90" : "bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}