import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Fetch movies for hero slider
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

  useEffect(() => {
    fetchFeatured().then(setSlides);
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    const id = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides]);

  if (!slides[idx])
    return <div className="h-[350px] bg-zinc-900 animate-pulse w-full" />;

  const m = slides[idx];

  return (
    <section className="w-full select-none">
      <div className="relative w-full h-[350px] sm:h-[380px] overflow-hidden">
        {/* Backdrop with blur and dark gradient */}
        <img
          src={`https://image.tmdb.org/t/p/w1280${m.backdrop_path}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center blur-sm scale-105"
          draggable={false}
          style={{ filter: "blur(8px) brightness(0.6)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent" />
        {/* Foreground content */}
        <div className="relative z-10 flex flex-row items-end h-full px-4 pb-6 pt-10 sm:px-10 sm:pb-10 sm:pt-14">
          {/* Poster */}
          <img
            src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
            alt={m.title}
            className="w-28 h-40 sm:w-36 sm:h-52 rounded-xl bg-zinc-900 object-cover drop-shadow-xl flex-shrink-0 border-0 outline-none"
            draggable={false}
            style={{ boxShadow: "0 4px 24px #0007" }}
          />
          {/* Text */}
          <div className="flex-1 ml-4 sm:ml-8 text-left min-w-0">
            <h1 className="text-white text-lg sm:text-3xl font-extrabold mb-1 truncate">
              {m.title}
            </h1>
            {/* badges */}
            <div className="flex flex-wrap gap-2 mb-2">
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
            {/* Description, clamped */}
            <p
              className="text-xs sm:text-base text-zinc-200 mb-3 sm:mb-4 leading-snug line-clamp-3 max-w-full break-words"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
              title={m.overview}
            >
              {m.overview}
            </p>
            <button
              onClick={() => nav(`/movie/${m.id}`)}
              className="px-4 py-2 bg-orange-500 rounded-lg font-bold text-white text-sm sm:text-base shadow hover:scale-105 transition outline-none border-none focus:outline-none"
              style={{ boxShadow: "0 2px 12px #0005", outline: "none", border: "none" }}
              tabIndex={0}
            >
              Details
            </button>
          </div>
        </div>
        {/* dots */}
        <div className="absolute bottom-2 w-full flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-3 h-3 rounded-full border-none outline-none ${
                i === idx ? "bg-orange-500" : "bg-white/30"
              }`}
              style={{ outline: "none", border: "none" }}
              tabIndex={0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
