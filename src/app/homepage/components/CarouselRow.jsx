import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* Fetch movies */
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

  /* Minimum width: on mobile 65vw, on tablet 40vw, on desktop 9rem */
  const card =
    "w-[65vw] sm:w-[40vw] md:w-36 aspect-[2/3] flex-shrink-0 snap-start rounded-xl overflow-hidden bg-zinc-900";

  return (
    <section className="mt-8 sm:mt-14">
      <h3 className="text-lg sm:text-2xl font-bold px-4 sm:px-0 mb-2">{title}</h3>
      <div
        className="
          flex flex-nowrap gap-3 sm:gap-6 px-4 sm:px-0
          overflow-x-auto overflow-y-hidden
          snap-x snap-mandatory scroll-smooth
          scrollbar-thin scrollbar-thumb-transparent scrollbar-track-transparent
          "
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x",
          overscrollBehaviorX: "contain", // prevent iOS bounce
          msOverflowStyle: "none", // IE/Edge scrollbar
          scrollbarWidth: "none", // Firefox scrollbar
        }}
        tabIndex={0}
        aria-label={`${title} movies`}
      >
        {(loading ? [...Array(6)] : movies).map((m, i) =>
          m ? (
            <div
              key={m.id}
              className={card + " hover:scale-105 transition"}
              onClick={() => nav(`/movie/${m.id}`)}
              style={{ cursor: "pointer" }}
              tabIndex={0}
              aria-label={`Movie: ${m.title}`}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                alt={m.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ) : (
            <div key={i} className={card + " animate-pulse"} />
          )
        )}
      </div>
    </section>
  );
}
