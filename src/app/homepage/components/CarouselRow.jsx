import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Pure CSS-in-JS styles ---
const rowStyle = {
  display: "flex",
  flexWrap: "nowrap",
  gap: "12px",
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",    // iOS scroll momentum
  scrollSnapType: "x mandatory",
  padding: "0 12px",
  marginBottom: "32px",
  minWidth: 0,
  maxWidth: "100vw",
  touchAction: "pan-x",
};

const cardStyle = {
  minWidth: "120px",
  width: "28vw",
  maxWidth: "160px",
  aspectRatio: "2/3",
  flexShrink: 0,
  borderRadius: "16px",
  overflow: "hidden",
  background: "#18181b",
  boxShadow: "0 2px 8px #0006",
  cursor: "pointer",
  scrollSnapAlign: "start",
  transition: "transform 0.18s",
  border: "none",
};

const loadingStyle = {
  ...cardStyle,
  background: "#262626",
  animation: "pulse 1.1s infinite alternate",
};

const h2Style = {
  fontSize: "1.28rem",
  fontWeight: 700,
  margin: "0 0 12px 12px",
  color: "#fff",
  letterSpacing: "0.01em",
};

const imgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const pulseKeyframes = `
@keyframes pulse {
  0% { opacity: 0.65; }
  100% { opacity: 1; }
}
`;

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

  return (
    <section>
      <style>{pulseKeyframes}</style>
      <h2 style={h2Style}>{title}</h2>
      <div style={rowStyle}>
        {(loading ? Array(6).fill(null) : movies).map((m, i) =>
          m ? (
            <div
              key={m.id}
              style={cardStyle}
              onClick={() => nav(`/movie/${m.id}`)}
              tabIndex={0}
              aria-label={`Open ${m.title}`}
              onTouchStart={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                alt={m.title}
                style={imgStyle}
                draggable={false}
                loading="lazy"
              />
            </div>
          ) : (
            <div key={i} style={loadingStyle} />
          )
        )}
      </div>
    </section>
  );
}
