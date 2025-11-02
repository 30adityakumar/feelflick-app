// src/app/homepage/components/HeroSliderSection.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/shared/lib/supabase/client";

const TMDB_IMG = "https://image.tmdb.org/t/p/original";

export default function HeroSliderSection() {
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("homepage_hero")
        .select("movie_id,backdrop_path,title,overview")
        .order("rank", { ascending: true });
      if (!error) setSlides(data || []);
    })();
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const s = slides[idx];
  if (!s) return null;

  return (
    /* full-bleed + no-header-gap so it tucks right under the sticky header */
    <section className="full-bleed no-header-gap m-0 p-0">
      <div className="relative aspect-[16/7] w-screen overflow-hidden">
        {/* Backdrop */}
        <img
          src={`${TMDB_IMG}${s.backdrop_path}`}
          alt={s.title}
          className="h-full w-full object-cover"
          draggable={false}
        />

        {/* Vignette + copy */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10 lg:p-14">
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {s.title}
          </h2>
          <p className="mt-3 max-w-3xl text-white/85 text-base sm:text-lg leading-relaxed line-clamp-4">
            {s.overview}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Link
              to={`/movie/${s.movie_id}`}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-4 py-2.5 text-white font-semibold"
            >
              View details
            </Link>
            <button
              type="button"
              onClick={() => setIdx(i => (i + 1) % slides.length)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/30 px-4 py-2.5 text-white/90"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dots (top-right) */}
        <div className="pointer-events-none absolute right-6 top-6 flex gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}