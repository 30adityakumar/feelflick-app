// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const TMDB = "https://image.tmdb.org/t/p";

export default function HeroSliderSection({ items = [], loading }) {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % items.length), 6000);
    return () => clearInterval(timer.current);
  }, [items.length]);

  if (loading) {
    return <div className="w-full h-[58svh] bg-white/[.02] animate-pulse" />;
  }
  if (!items.length) return null;

  const cur = items[idx];

  return (
    <div className="relative w-full h-[58svh] overflow-hidden">
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
      />

      {/* Overlays for cinematic effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />
      <div className="absolute inset-y-0 left-0 w-[10vw] bg-gradient-to-r from-black/80 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-[10vw] bg-gradient-to-l from-black/80 to-transparent" />

      {/* Dots */}
      <div className="absolute top-6 right-8 flex gap-1 opacity-80">
        {items.slice(0, 6).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>

      {/* Hero text */}
      <div className="relative z-10 h-full flex items-end pb-[6vh] px-[5vw]">
        <div className="max-w-[min(85ch,70vw)]">
          <h1 className="text-white font-black text-[clamp(1.6rem,3.4vw,2.8rem)] leading-tight drop-shadow">
            {cur.title}
          </h1>
          {cur.overview && (
            <p className="mt-2 text-white/85 text-[clamp(.9rem,1.3vw,1.05rem)] line-clamp-3">
              {cur.overview}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => nav(`/movie/${cur.id}`)}
              className="rounded-full px-6 py-2.5 text-[15px] font-bold text-white
                         bg-[linear-gradient(90deg,#fe9245,#eb423b)] shadow-lg"
            >
              View details
            </button>
            <button
              onClick={() => setIdx((idx + 1) % items.length)}
              className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white/90
                         border border-white/20 bg-white/5 hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}