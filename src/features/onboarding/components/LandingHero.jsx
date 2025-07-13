import { useNavigate } from "react-router-dom";

// Example video: use your favorite copyright-free stock video
const HERO_VIDEO = "https://website-static.plex.tv/videos/home_hero_background_2024.mp4"; // Replace with your video link!

export default function LandingHero() {
  const navigate = useNavigate();

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
        justifyContent: "flex-start",
        position: "relative",
        overflow: "hidden",
        background: "#101015",
        padding: "max(68px, 7vh) 0", // Large vertical padding for hero!
        boxSizing: "border-box"
      }}
    >
      {/* ---- Background video (stock, muted) ---- */}
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

      {/* ---- Overlay gradient left-to-right for readability ---- */}
      <div
        aria-hidden="true"
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
            padding: "10px 32px", // Smaller button, but still big target!
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
    </section>
  );
}
