import { useNavigate } from "react-router-dom";
import heroVideo from "@/assets/videos/hero-bg.mp4";
import backgroundposter from "@/assets/images/background-poster.jpg";

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
        background: "#101015",
        paddingTop: 100,
        paddingBottom: 60,
      }}
      aria-label="FeelFlick Hero Section"
    >
      {/* --- Video background (always fills, right-aligned on desktop) --- */}
      <video
        src={heroVideo}
        autoPlay
        loop
        muted
        playsInline
        poster={backgroundposter}
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center right",
          zIndex: 0,
          filter: "brightness(0.9)", // only slight darkening for clarity, easily tweak
          transition: "filter 0.16s",
          background: "#111",
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* --- Overlay: left gradient only (transparent > dark left) --- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg,rgba(14,14,17,0.93) 0%,rgba(14,14,17,0.18) 38%,rgba(14,14,17,0.0) 68%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* --- Hero Content: Always left-aligned, over the gradient --- */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 680,
          marginLeft: "clamp(7vw, 7%, 90px)",
          marginRight: "clamp(2vw, 4%, 60px)",
          padding: "32px 22px",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          minWidth: 320,
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(1.5rem,4vw,2.2rem)", // smaller, as you asked
            color: "#fff",
            letterSpacing: "-0.5px",
            marginBottom: 18,
            textShadow: "0 4px 24px #000a, 0 2px 8px #18406d77",
            lineHeight: 1.15,
          }}
        >
          Movies that match your mood.
        </h1>
        <div
          style={{
            fontWeight: 400,
            fontSize: "clamp(1rem,1.18vw,1.23rem)",
            color: "#F6E3D7",
            opacity: 0.97,
            marginBottom: 36,
            lineHeight: 1.58,
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
            borderRadius: 15,
            fontWeight: 800,
            fontSize: "1.03rem",
            padding: "14px 40px",
            minWidth: 124,
            minHeight: 44,
            boxShadow: "0 2px 12px #fe924524",
            cursor: "pointer",
            letterSpacing: "0.01em",
            outline: "none",
            transition: "filter .14s, background .13s",
            marginTop: 8,
            marginBottom: 8,
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.09)")}
          onMouseLeave={e => (e.currentTarget.style.filter = "none")}
          tabIndex={0}
          aria-label="Get started with FeelFlick"
        >
          Get Started
        </button>
      </div>

      {/* --- Responsive mobile adjustments --- */}
      <style>{`
        @media (max-width: 900px) {
          section[aria-label="FeelFlick Hero Section"] {
            flex-direction: column !important;
            min-height: 66vh !important;
            padding-top: 72px !important;
            padding-bottom: 38px !important;
          }
          section[aria-label="FeelFlick Hero Section"] > div[style*="z-index: 2"] {
            margin-left: 0 !important;
            margin-right: 0 !important;
            max-width: 98vw !important;
            padding: 22px 5vw !important;
          }
        }
        @media (max-width: 540px) {
          section[aria-label="FeelFlick Hero Section"] {
            padding-top: 52px !important;
            padding-bottom: 26px !important;
            min-height: 47vh !important;
          }
          section[aria-label="FeelFlick Hero Section"] > div[style*="z-index: 2"] {
            padding: 14px 4vw !important;
          }
          section[aria-label="FeelFlick Hero Section"] h1 {
            font-size: 1.13rem !important;
          }
        }
      `}</style>
    </section>
  );
}
