import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Fetch helper ───────────────────────────────────────── */
async function fetchMovies(endpoint) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=1`
  );
  const data = await res.json();
  return (data.results || []).filter((m) => m.poster_path);
}

/* ─── Component ─────────────────────────────────────────── */
export default function CarouselRow({ title, endpoint }) {
  const nav = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMovies(endpoint)
      .then(setMovies)
      .finally(() => setLoading(false));
  }, [endpoint]);

  // **Smaller cards**: 32vw on mobile, 28vw on small tablets, 9rem on desktop
  const cardClass =
    "w-[32vw] sm:w-[28vw] md:w-36 aspect-[2/3] flex-shrink-0 snap-start rounded-xl overflow-hidden bg-zinc-900";

  return (
    <section className="mt-8 sm:mt-14">
      <h3 className="text-lg sm:text-2xl font-bold px-4 sm:px-0 mb-2">
        {title}
      </h3>
      <div
        className={`
          flex gap-3 px-4 sm:px-0
          overflow-x-auto overflow-y-hidden
          snap-x snap-mandatory scroll-smooth
        `}
        style={{
          WebkitOverflowScrolling: "touch",   // iOS momentum
          touchAction: "pan-x",               // instant pan
          overscrollBehaviorX: "contain",     // no rubber-band
        }}
        aria-label={`${title} carousel`}
      >
        {(loading ? Array(6).fill(null) : movies).map((m, i) =>
          m ? (
            <div
              key={m.id}
              className={cardClass + " hover:scale-105 transition"}
              onClick={() => nav(`/movie/${m.id}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                alt={m.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ) : (
            <div
              key={i}
              className={cardClass + " animate-pulse"}
            />
          )
        )}
      </div>
    </section>
  );
}
