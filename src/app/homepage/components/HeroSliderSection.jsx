import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── API helper ───────────────────────────────────────── */
async function fetchFeatured() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`
  );
  const data = await res.json();
  return (data.results || []).slice(0, 5);
}

export default function HeroSliderSection() {
  const nav = useNavigate();
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);

  /* fetch once on mount */
  useEffect(() => {
    fetchFeatured().then(setSlides);
  }, []);

  /* auto-rotate every 5 s */
  useEffect(() => {
    if (!slides.length) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides]);

  /* placeholder skeleton while loading */
  if (!slides[idx])
    return <div className="h-[430px] bg-zinc-900 animate-pulse w-full" />;

  const m = slides[idx];

  return (
    <section className="w-full">
      {/* backdrop */}
      <div className="relative w-full h-[480px] md:h-[380px] overflow-hidden">
        <img
          src={`https://image.tmdb.org/t/p/w1280${m.backdrop_path}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/80 to-transparent" />

        {/* foreground content */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end
                        h-full px-4 md:px-14 py-10 md:py-0 space-y-4 md:space-y-0">
          {/* poster */}
          <img
            src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
            alt={m.title}
            className="w-36 h-52 md:w-40 md:h-56 rounded-xl border-4 border-white/10 bg-zinc-900 object-cover drop-shadow-2xl"
          />

          {/* text */}
          <div className="flex-1 md:ml-8 text-left">
            <h1 className="text-white text-2xl md:text-3xl font-extrabold mb-2 line-clamp-2">
              {m.title}
            </h1>

            {/* badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {m.genre_ids?.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="bg-zinc-800 text-zinc-200 text-xs md:text-sm px-2 py-0.5 rounded"
                >
                  {g}
                </span>
              ))}
              {m.vote_average > 0 && (
                <span className="bg-zinc-700 text-yellow-300 text-xs md:text-sm px-2 py-0.5 rounded font-bold">
                  ★ {m.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            <p className="text-xs md:text-base text-zinc-200 mb-4 md:mb-6 line-clamp-3">
              {m.overview}
            </p>

            <button
              onClick={() => nav(`/movie/${m.id}`)}
              className="px-5 py-2 bg-orange-500 rounded-lg font-bold text-white text-sm md:text-base shadow hover:scale-105 transition"
            >
              Details
            </button>
          </div>
        </div>

        {/* dots */}
        <div className="absolute bottom-4 w-full flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-3 h-3 rounded-full ${
                i === idx ? "bg-orange-500" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
