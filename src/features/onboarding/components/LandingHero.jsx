import { useNavigate } from "react-router-dom";
import heroVideo from "@/assets/videos/hero-bg.mp4";
import backgroundposter from "@/assets/images/background-poster.jpg";

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section
      aria-label="FeelFlick Hero Section"
      style={{
        width: "100vw",
        height: "100vh",      // Fills the entire first screen
        minHeight: 400,
        position: "relative",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        overflow: "hidden",
        background: "#101015"
      }}
    >
      {/* ---- Left: Text Block ---- */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: "1 1 0%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "clamp(36px, 10vw, 80px)",
          color: "#fff",
          background: "transparent",
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.1rem,5vw,3.8rem)",
            color: "#fff",
            letterSpacing: "-0.5px",
            marginBottom: 26,
            textShadow: "0 4px 24px #000b, 0 2px 8px #18406d77",
            lineHeight: 1.09,
          }}
        >
          Movies that match your mood.
        </h1>
        <div
          style={{
            fontWeight: 400,
            fontSize: "clamp(1.12rem,1.5vw,1.45rem)",
            color: "#F6E3D7",
            opacity: 0.97,
            marginBottom: 48,
            lineHeight: 1.56,
            textShadow: "0 2px 8px #0002",
            maxWidth: 620
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
            borderRadius: 19,
            fontWeight: 800,
            fontSize: "1.12rem",
            padding: "16px 52px",
            minWidth: 128,
            minHeight: 46,
            boxShadow: "0 2px 12px #fe924524",
            cursor: "pointer",
            letterSpacing: "0.01em",
            outline: "none",
            transition: "filter .13s, background .13s",
            marginTop: 12,
            marginBottom: 12,
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.09)")}
          onMouseLeave={e => (e.currentTarget.style.filter = "none")}
          tabIndex={0}
          aria-label="Get started with FeelFlick"
        >
          Get Started
        </button>
      </div>

      {/* ---- Right: Video fills right half ---- */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: "50vw",
          height: "100vh",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <video
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          poster={backgroundposter}
          style={{
            width: "100vw",   // Makes sure video covers fully (for cropping)
            height: "100vh",
            objectFit: "cover",
            objectPosition: "center right",
            background: "#101015",
            filter: "brightness(0.88)", // brighten/darken as you want
            transition: "filter 0.16s",
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* ---- Overlay: left gradient (readable text), fades out before video ---- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg,rgba(14,14,17,0.98) 0%,rgba(14,14,17,0.76) 42%,rgba(14,14,17,0.02) 80%,rgba(14,14,17,0.0) 100%)",
        }}
        aria-hidden="true"
      />

      {/* ---- Responsive: Stack on mobile ---- */}
      <style>{`
        @media (max-width: 900px) {
          section[aria-label="FeelFlick Hero Section"] {
            flex-direction: column !important;
            height: auto !important;
            min-height: 78vh !important;
          }
          section[aria-label="FeelFlick Hero Section"] > div[style*="z-index: 2"] {
            padding: 30px 5vw !important;
            align-items: flex-start !important;
          }
          section[aria-label="FeelFlick Hero Section"] > div[style*="position: absolute"] {
            position: static !important;
            width: 100vw !important;
            height: 38vw !important;
            min-height: 164px !important;
          }
          section[aria-label="FeelFlick Hero Section"] video {
            width: 100vw !important;
            height: 38vw !important;
            min-height: 164px !important;
            object-position: center 40% !important;
          }
        }
        @media (max-width: 500px) {
          section[aria-label="FeelFlick Hero Section"] > div[style*="z-index: 2"] {
            padding: 20px 3vw !important;
          }
          section[aria-label="FeelFlick Hero Section"] h1 {
            font-size: 1.18rem !important;
          }
          section[aria-label="FeelFlick Hero Section"] video {
            min-height: 108px !important;
            height: 25vw !important;
          }
        }
      `}</style>
    </section>
  );
}
