// src/app/homepage/components/CarouselRow.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Minimal, production-grade carousel row for TMDB lists.
 * Props:
 *   - title: string
 *   - endpoint: "popular" | "top_rated" | any /movie/:endpoint TMDB path
 */
export default function CarouselRow({ title = "Movies", endpoint = "popular" }) {
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error
  const scrollerRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const apiUrl = useMemo(() => {
    if (!TMDB_KEY) return null;
    return `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${TMDB_KEY}&page=1`;
  }, [TMDB_KEY, endpoint]);

  // Fetch
  useEffect(() => {
    let abort = new AbortController();
    async function run() {
      if (!apiUrl) {
        // Fallback (no key) – show a tiny placeholder list
        setItems([]);
        setState("ready");
        return;
      }
      try {
        setState("loading");
        const r = await fetch(apiUrl, { signal: abort.signal });
        if (!r.ok) throw new Error(`TMDB ${endpoint} ${r.status}`);
        const j = await r.json();
        setItems((j?.results || []).filter(Boolean));
        setState("ready");
      } catch (e) {
        if (abort.signal.aborted) return;
        console.warn("CarouselRow fetch failed:", e);
        setState("error");
      }
    }
    run();
    return () => abort.abort();
  }, [apiUrl, endpoint]);

  // Detect overflow for showing arrows
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.9);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="w-full">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-[clamp(1.05rem,2.2vw,1.35rem)] font-extrabold tracking-tight text-white">
          {title}
        </h2>
        {/* Optional "See all" can go here later */}
      </div>

      <div className="relative group">
        {/* Left arrow */}
        {hasOverflow && (
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/40 ring-1 ring-white/15 text-white/90 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="M15 19 8 12l7-7" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        )}

        {/* Scroller */}
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none pb-1"
          style={{ scrollPaddingLeft: 2 }}
        >
          {state === "loading" &&
            Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}

          {state === "error" && (
            <div className="text-white/75 text-sm px-2 py-6">
              Couldn’t load movies. Please try again later.
            </div>
          )}

          {state === "ready" &&
            items.map((m) => (
              <MovieCard key={m.id} m={m} />
            ))}
        </div>

        {/* Right arrow */}
        {hasOverflow && (
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/40 ring-1 ring-white/15 text-white/90 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        )}
      </div>
    </section>
  );
}

function MovieCard({ m }) {
  const title = m.title || m.name || "Movie";
  const poster = m.poster_path
    ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
    : null;
  const rating = m.vote_average ? Math.round(m.vote_average * 10) / 10 : null;

  return (
    <Link
      to={`/movie/${m.id}`}
      className="group relative w-[38vw] max-w-[180px] sm:w-[160px] sm:max-w-[190px] shrink-0 snap-start"
      aria-label={title}
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-white/10 bg-white/5">
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,#111827_0%,#0b1220_100%)]" />
        )}
        {/* bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
      </div>

      <div className="mt-1">
        <div className="line-clamp-1 text-[13px] font-semibold text-white/95">
          {title}
        </div>
        {rating != null && (
          <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-white/70">
            <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
              <path
                d="m12 2 2.7 6.2 6.8.6-5.1 4.4 1.6 6.8-6-3.5-6 3.5 1.6-6.8-5.1-4.4 6.8-.6L12 2Z"
                fill="currentColor"
              />
            </svg>
            {rating}
          </div>
        )}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="w-[38vw] max-w-[180px] sm:w-[160px] sm:max-w-[190px] shrink-0 snap-start">
      <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 animate-pulse" />
      <div className="mt-1 h-3 w-3/4 rounded bg-white/10 animate-pulse" />
    </div>
  );
}