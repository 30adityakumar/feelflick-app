import { useNavigate } from "react-router-dom";

// Replace with your chosen background video URL
const HERO_VIDEO = "https://website-static.plex.tv/videos/home_hero_background_2024.mp4"; // Example from Coverr/Pexels

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        width: "100vw",
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
        overflow: "hidden",
        background: "#101015"
      }}
    >
      {/* ---- Background video (legal stock!) ---- */}
      <video
        src={HERO_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        poster="/background-poster.jpg"
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
      {/* ---- Overlay gradient left-to-right ---- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg,rgba(14,14,17,0.97) 0%,rgba(14,14,17,0.81) 48%,rgba(14,14,17,0.19) 80%,rgba(14,14,17,0.01) 100%)",
          zIndex: 1,
        }}
      />

      {/* ---- Hero content ---- */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 640,
          marginLeft: "clamp(8vw, 7%, 120px)",
          marginRight: "clamp(3vw, 5%, 90px)",
          padding: "0 10px",
          color: "#fff"
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.1rem,6vw,3.8rem)",
            color: "#fff",
            letterSpacing: "-0.7px",
            marginBottom: 20,
            textShadow: "0 4px 24px #000c, 0 2px 8px #18406d77",
            lineHeight: 1.08,
          }}
        >
          Movies that match your mood.
        </h1>
        <div
          style={{
            fontWeight: 400,
            fontSize: "clamp(1rem,1.1vw,1.25rem)",
            color: "#F6E3D7",
            opacity: 0.96,
            marginBottom: 38,
            lineHeight: 1.6,
            textShadow: "0 2px 8px #0002",
          }}
        >
          Get the perfect recommendation based on your taste and how you feel.<br />
          Fast, private, and always free.
        </div>
        <button
          onClick={() => navigate("/auth/sign-up")}
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
    </section>
  );
}
