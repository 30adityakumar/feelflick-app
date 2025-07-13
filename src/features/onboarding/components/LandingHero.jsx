import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TMDB_KEY = "YOUR_API_KEY";
const TMDB_API = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`;

export default function LandingHero({ onGetStarted }) {
  const navigate = useNavigate();
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    fetch(TMDB_API)
      .then(res => res.json())
      .then(data =>
        setPosters(data.results.slice(0, 12).map(
          m => `https://image.tmdb.org/t/p/w500${m.poster_path}`
        ))
      );
  }, []);

  return (
    <section
      style={{
        width: "100vw",
        minHeight: "65vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "#16161a",
        padding: "4vw 0",
        flexWrap: "wrap",
      }}
    >
      {/* Left: Text */}
      <div
        style={{
          zIndex: 2,
          maxWidth: 480,
          margin: "0 3vw 0 6vw",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.1rem,6vw,3.4rem)",
            color: "#fff",
            letterSpacing: "-0.7px",
            marginBottom: 16,
            textShadow: "0 4px 24px #000c, 0 2px 8px #18406d77",
            lineHeight: 1.1,
          }}
        >
          Movies that match your mood.
        </h1>
        <div
          style={{
            fontWeight: 400,
            fontSize: "clamp(1rem,1.1vw,1.25rem)",
            color: "#F6E3D7",
            opacity: 0.98,
            marginBottom: 30,
            lineHeight: 1.6,
            textShadow: "0 2px 8px #0002",
          }}
        >
          Get the perfect recommendation based on your taste and how you feel.<br />
          Fast, private, and always free.
        </div>
        <button
          onClick={() => (onGetStarted ? onGetStarted() : navigate("/auth/sign-up"))}
          style={{
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            color: "#fff",
            border: "none",
            borderRadius: 18,
            fontWeight: 900,
            fontSize: "1.09rem",
            padding: "14px 46px",
            boxShadow: "0 5px 24px #eb423b36",
            cursor: "pointer",
            letterSpacing: "0.01em",
            marginTop: 10,
            transition: "transform 0.16s, box-shadow 0.13s, opacity 0.13s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.06)";
            e.currentTarget.style.boxShadow = "0 9px 38px #eb423b62";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 5px 24px #eb423b36";
          }}
        >
          Get Started
        </button>
      </div>

      {/* Right: Poster carousel */}
      <div
        style={{
          flex: 1,
          minWidth: 260,
          maxWidth: 520,
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          gap: 18,
          padding: "6px 0",
          scrollbarWidth: "none",
        }}
      >
        {posters.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt=""
            style={{
              height: 170,
              width: 115,
              borderRadius: 12,
              objectFit: "cover",
              boxShadow: "0 4px 16px #0007",
              flex: "0 0 auto",
              marginRight: idx === posters.length - 1 ? 0 : 12,
            }}
          />
        ))}
      </div>
    </section>
  );
}
