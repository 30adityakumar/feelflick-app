import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Fetch featured “Now Playing” ─────────────────────────
async function fetchFeatured() {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`
  );
  const data = await res.json();
  return (data.results || []).slice(0, 5);
}

// ─── Component ────────────────────────────────────────────
export default function HeroSliderSection() {
  const nav = useNavigate();
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetchFeatured().then(setSlides);
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    const id = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides]);

  if (!slides[idx]) {
    return <div className="h-[350px] bg-zinc-900 animate-pulse w-full" />;
  }

  const m = slides[idx];

  return (
    <section className="w-full select-none">
      <div className="relative w-full overflow-hidden">
        {/* Blurred, darkened backdrop */}
        <img
          src={`https://image.tmdb.org/t/p/w1280${m.backdrop_path}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          draggable={false}
          style={{ filter: "blur(8px) brightness(0.5)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent" />

        {/* CONTENT */}
        <div
          className="
            relative z-10 flex flex-col sm:flex-row
            items-start sm:items-end
            min-h-[350px]
            px-4 py-6 sm:px-10 sm:py-8
          "
        >
          {/* Poster */}
          <img
            src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
            alt={m.title}
            className="
              w-28 h-40 sm:w-36 sm:h-52
              rounded-xl
              drop-shadow-2xl
              flex-shrink-0
            "
            draggable={false}
            style={{ boxShadow: "0 8px 32px #0008", outline: "none", border: "none" }}
          />

          {/* Text block */}
          <div className="flex-1 mt-4 sm:mt-0 sm:ml-6 text-left min-w-0 pr-4">
            <h1 className="text-white text-xl sm:text-3xl font-extrabold mb-2 truncate">
              {m.title}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {m.genre_ids?.slice(0, 2).map(g => (
                <span
                  key={g}
                  className="bg-zinc-800 text-zinc-200 text-xs px-2 py-0.5 rounded"
                >
                  {g}
                </span>
              ))}
              {m.vote_average > 0 && (
                <span className="bg-zinc-700 text-yellow-300 text-xs px-2 py-0.5 rounded font-bold">
                  ★ {m.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            {/* FULL description */}
            <p className="text-sm sm:text-base text-zinc-200 mb-4 leading-relaxed whitespace-normal">
              {m.overview}
            </p>

            {/* Details button, no outline */}
            <button
              onClick={() => nav(`/movie/${m.id}`)}
              className="
                px-4 py-2 bg-orange-500 rounded-lg font-bold text-white
                text-sm sm:text-base shadow hover:scale-105 transition
                outline-none border-none focus:outline-none
              "
            >
              Details
            </button>
          </div>
        </div>

        {/* Pagination dots */}
        <div className="absolute bottom-2 w-full flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-3 h-3 rounded-full ${
                i === idx ? "bg-orange-500" : "bg-white/30"
              } outline-none border-none`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
