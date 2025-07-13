import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const HERO_VIDEO = "https://cdn.coverr.co/videos/coverr-watching-movie-at-home-1631115289067?token=eyJhbGci..."; // Or any legal stock video
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export default function LandingHero() {
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);

  // Fetch trending movies (TMDb)
  useEffect(() => {
    fetch(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}&language=en-US`
    )
      .then(res => res.json())
      .then(data => setTrending(data.results?.slice(0, 7) || []));
  }, []);

  return (
    <section
      aria-label="Landing Hero"
      role="region"
      tabIndex={-1}
      style={{
        width: "100vw",
        minHeight: "min(100vh, 720px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        background: "#101015",
        padding: "max(68px, 7vh) 0",
        boxSizing: "border-box"
      }}
    >
      {/* ---- Background video ---- */}
      <video
        src={HERO_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        poster="/background-poster.jpg"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          filter: "brightness(0.65) blur(0.2px)",
        }}
      />
      {/* ---- Overlay gradient ---- */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg,rgba(14,14,17,0.97) 0%,rgba(14,14,17,0.81) 46%,rgba(14,14,17,0.19) 80%,rgba(14,14,17,0.01) 100%)",
          zIndex: 1,
        }}
      />

      {/* ---- Hero left ---- */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 640,
          marginLeft: "clamp(8vw, 7%, 120px)",
          marginRight: "clamp(3vw, 5%, 90px)",
          padding: "0 10px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1
          tabIndex={0}
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.3rem,7vw,4.1rem)",
            color: "#fff",
            letterSpacing: "-0.7px",
            marginBottom: 24,
            textShadow: "0 4px 24px #000c, 0 2px 8px #18406d77",
            lineHeight: 1.08,
          }}
        >
          Movies that match your mood.
        </h1>
        <div
          style={{
            fontWeight: 400,
            fontSize: "clamp(1.04rem,1.1vw,1.35rem)",
            color: "#F6E3D7",
            opacity: 0.96,
            marginBottom: 38,
            lineHeight: 1.6,
            textShadow: "0 2px 8px #0002",
            maxWidth: 520,
          }}
        >
          Get the perfect recommendation based on your taste and how you feel.<br />
          Fast, private, and always free.
        </div>
        <button
          onClick={() => navigate("/auth/sign-up")}
          className="fflick-landinghero-getstarted"
          aria-label="Get Started with FeelFlick"
          style={{
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontWeight: 700,
            fontSize: "1.05rem",
            padding: "10px 32px",
            minWidth: 130,
            minHeight: 40,
            boxShadow: "0 2px 8px #fe92451a",
            cursor: "pointer",
            letterSpacing: "0.01em",
            transition: "filter 0.15s, transform 0.15s, box-shadow 0.13s",
            outline: "none",
          }}
          tabIndex={0}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(.97)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          onFocus={e => (e.currentTarget.style.filter = "brightness(1.13)")}
          onBlur={e => (e.currentTarget.style.filter = "none")}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate("/auth/sign-up"); }}
        >
          Get Started
        </button>
      </div>

      {/* ---- Hero right: trending movies carousel ---- */}
      <div
        aria-label="Trending Movies"
        style={{
          position: "relative",
          zIndex: 3,
          minWidth: 270,
          maxWidth: 400,
          display: "flex",
          alignItems: "center",
          gap: "13px",
          overflowX: "auto",
          marginRight: "clamp(2vw, 4%, 40px)",
        }}
        tabIndex={0}
      >
        {trending.length === 0 && (
          <div style={{
            color: "#fff",
            opacity: 0.7,
            fontSize: 18,
            fontWeight: 700,
            padding: "44px 12px"
          }}>
            Loading movies...
          </div>
        )}
        {trending.map(movie =>
          <div
            key={movie.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              width: 86,
              minWidth: 68,
              maxWidth: 120,
              cursor: "pointer",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 18px #10101570",
              background: "#1a1a23",
              margin: "2px 0"
            }}
            tabIndex={0}
            aria-label={movie.title}
            title={movie.title}
            onClick={() => navigate(`/movie/${movie.id}`)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigate(`/movie/${movie.id}`); }}
          >
            <img
              src={movie.poster_path
                ? `https://image.tmdb.org/t/p/w300/${movie.poster_path}`
                : "/poster-placeholder.png"}
              alt={movie.title}
              style={{
                width: "100%",
                height: 110,
                objectFit: "cover",
                borderRadius: 12,
                border: "2.2px solid #191925"
              }}
              loading="lazy"
            />
            <div style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: 12,
              marginTop: 7,
              marginBottom: 8,
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "94%",
              textShadow: "0 2px 8px #101015ee"
            }}>
              {movie.title}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
