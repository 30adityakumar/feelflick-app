import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────────────────
   Fetch helper
   ───────────────────────────────────────────────────────── */
async function fetchMovies(endpoint) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=1`
  );
  const data = await res.json();
  return (data.results || []).filter((m) => m.poster_path);
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */
export default function CarouselRow({ title, endpoint }) {
  const nav = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMovies(endpoint).then(setMovies).finally(() => setLoading(false));
  }, [endpoint]);

  /* Card width -- wide enough that total row exceeds viewport so mobile must scroll */
  const card = "w-[48vw] sm:w-[38vw] md:w-40 aspect-[2/3] flex-shrink-0";

  return (
    <section className="mt-8 md:mt-14">
      <h3 className="text-lg md:text-2xl font-bold px-4 md:px-0 mb-2">
        {title}
      </h3>

      {/* horizontal scroller */}
      <div
        className="flex flex-nowrap gap-3 md:gap-6 px-4 md:px-0
                   overflow-x-auto overflow-y-hidden
                   snap-x snap-mandatory scroll-smooth
                   scrollbar-none"              /* hide scrollbar, keeps look clean */
        style={{
          WebkitOverflowScrolling: "touch",      /* iOS momentum */
          touchAction: "pan-x",                  /* dramatically improves swipe */
        }}
      >
        {(loading ? [...Array(5)] : movies).map((m, i) =>
          m ? (
            <div
              key={m.id}
              className={`${card} snap-start rounded-xl bg-zinc-900 overflow-hidden hover:scale-105 transition`}
              onClick={() => nav(`/movie/${m.id}`)}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                alt={m.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div key={i} className={`${card} rounded-xl bg-zinc-800 animate-pulse`} />
          )
        )}
      </div>
    </section>
  );
}
