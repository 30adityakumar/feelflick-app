import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

async function fetchMovies(endpoint) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=1`
  );
  const data = await res.json();
  return (data.results || []).filter(m => m.poster_path);
}

export default function CarouselRow({ title, endpoint }) {
  const nav = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchMovies(endpoint).then(setMovies).finally(() => setLoading(false));
  }, [endpoint]);

  // Cards small enough to show multiple items—scrollable on desktop & mobile
  const cardClass =
    "w-[28vw] min-w-[120px] sm:w-[24vw] sm:min-w-[140px] sm:max-w-[160px] md:w-36 aspect-[2/3] flex-shrink-0 snap-start rounded-xl overflow-hidden bg-zinc-900";

  return (
    <section className="mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 px-3 sm:px-4">{title}</h2>

      <div
        className="
          flex gap-3 sm:gap-4 px-3 sm:px-4
          overflow-x-auto overflow-y-hidden
          snap-x snap-mandatory scroll-smooth
          scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent
        "
        style={{
          WebkitOverflowScrolling: "touch",   // iOS momentum
          touchAction: "pan-x",               // allow swipe
          overscrollBehaviorX: "contain",     // no edge bounce
        }}
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
                loading="lazy"
              />
            </div>
          ) : (
            <div key={i} className={cardClass + " animate-pulse"} />
          )
        )}
      </div>
    </section>
  );
}
