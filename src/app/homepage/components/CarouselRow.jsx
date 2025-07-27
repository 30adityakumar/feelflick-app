import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Fetch movies
async function fetchMovies(endpoint) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}&language=en-US&page=1`
  );
  const data = await res.json();
  return (data.results || []).filter((m) => m.poster_path);
}

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

  // The magic: min-w-0 on parent, flex-nowrap, overflow-x-auto, card min-w, NO w-full
  return (
    <section className="mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 px-3 sm:px-4">
        {title}
      </h2>
      <div
        className="
          flex flex-nowrap gap-3 sm:gap-4 px-3 sm:px-4
          overflow-x-auto overflow-y-hidden
          snap-x snap-mandatory scroll-smooth
        "
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x",
          overscrollBehaviorX: "contain",
          minWidth: 0, // This ensures the flex container doesn't force a scroll on the *page*
        }}
      >
        {(loading ? Array(6).fill(null) : movies).map((m, i) =>
          m ? (
            <div
              key={m.id}
              className="min-w-[120px] w-[28vw] max-w-[160px] aspect-[2/3] flex-shrink-0 snap-start rounded-xl overflow-hidden bg-zinc-900 hover:scale-105 transition"
              onClick={() => nav(`/movie/${m.id}`)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                alt={m.title}
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
              />
            </div>
          ) : (
            <div
              key={i}
              className="min-w-[120px] w-[28vw] max-w-[160px] aspect-[2/3] flex-shrink-0 snap-start rounded-xl bg-zinc-800 animate-pulse"
            />
          )
        )}
      </div>
    </section>
  );
}
