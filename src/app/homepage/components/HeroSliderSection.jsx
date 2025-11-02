// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const TMDB = "https://image.tmdb.org/t/p";

export default function HeroSliderSection({ items = [], loading }) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  // autoplay
  useEffect(() => {
    if (!items.length) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % items.length), 6000);
    return () => clearInterval(timer.current);
  }, [items.length]);

  if (loading) {
    return (
      <div className="w-full h-[42svh] md:h-[58svh] bg-white/[.02] animate-pulse" />
    );
  }
  if (!items.length) return null;

  const cur = items[idx];

  return (
    <div className="relative w-full h-[42svh] md:h-[58svh]">
      {/* image */}
      <img
        src={
          cur.backdrop_path
            ? `${TMDB}/w1280${cur.backdrop_path}`
            : cur.poster_path
            ? `${TMDB}/w780${cur.poster_path}`
            : ""
        }
        alt={cur.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />

      {/* overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,.3)_40%,rgba(0,0,0,.75))]" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-6 right-6 flex gap-1 opacity-70">
          {items.slice(0, 6).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </div>

      {/* content */}
      <div className="relative z-10 h-full w-full px-4 sm:px-6 lg:px-10 flex items-end pb-8">
        <div className="max-w-3xl">
          <h1 className="text-white font-black tracking-tight text-[clamp(1.3rem,2.8vw,2.4rem)]">
            {cur.title}
          </h1>
          {cur.overview && (
            <p className="mt-2 text-white/85 text-[clamp(.9rem,1.4vw,1.05rem)] line-clamp-3">
              {cur.overview}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => nav(`/movie/${cur.id}`)}
              className="rounded-2xl px-5 py-2.5 text-[15px] font-extrabold text-white shadow
                         bg-[linear-gradient(90deg,#fe9245,#eb423b)]"
            >
              View details
            </button>
            <button
              onClick={() => setIdx((idx + 1) % items.length)}
              className="rounded-2xl px-4 py-2.5 text-[14px] font-semibold text-white/90
                         border border-white/15 bg-white/5 hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}