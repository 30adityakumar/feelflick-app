import { useNavigate } from "react-router-dom";
import heroVideo from "@/assets/videos/hero-bg.mp4";
import backgroundposter from "@/assets/images/background-poster.jpg";

const HEADER_HEIGHT = 84; // px

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section
      aria-label="FeelFlick Hero Section"
      style={{
        width: "100vw",
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        minHeight: 400,
        position: "relative",
        overflow: "hidden",
        background: "#101015",
        marginTop: HEADER_HEIGHT
      }}
    >
      {/* --- Video is always the background --- */}
      <video
        src={heroVideo}
        autoPlay
        loop
        muted
        playsInline
        poster={backgroundposter}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          zIndex: 0,
          filter: "brightness(0.98)",
          background: "#101015",
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* --- Wide black-to-transparent overlay for blended text area --- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            // Nearly all black on left, fades out to transparent after 55%
            "linear-gradient(90deg,rgba(14,14,17,1) 0%,rgba(14,14,17,0.93) 30%,rgba(14,14,17,0.6) 48%,rgba(14,14,17,0.18) 65%,rgba(14,14,17,0.00) 80%,rgba(14,14,17,0.0) 100%)",
        }}
        aria-hidden="true"
      />

      {/* --- Text Content absolutely positioned (so it sits over gradient, not a black div) --- */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 640,
          padding: "clamp(34px, 9vw, 80px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          height: "100%",
          minHeight: 320,
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(1.5rem,3.5vw,2.6rem)",
            color: "#fff",
            letterSpacing: "-0.5px",
            marginBottom: 20,
            textShadow: "0 4px 18px #000a, 0 2px 8px #18406d77",
            lineHeight: 1.14,
          }}
        >
          Movies that match your mood.
        </h1>
        <div
          style={{
            fontWeight: 400,
            fontSize: "clamp(1rem,1.15vw,1.2rem)",
            color: "#F6E3D7",
            opacity: 0.97,
            marginBottom: 34,
            lineHeight: 1.55,
            textShadow: "0 2px 8px #0002",
            maxWidth: 590,
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
            borderRadius: 14,
            fontWeight: 800,
            fontSize: "1rem",
            padding: "10px 32px",
            minWidth: 100,
            minHeight: 40,
            boxShadow: "0 2px 8px #fe92451a",
            cursor: "pointer",
            letterSpacing: "0.01em",
            outline: "none",
            transition: "filter .13s, background .13s",
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.09)")}
          onMouseLeave={e => (e.currentTarget.style.filter = "none")}
          tabIndex={0}
          aria-label="Get started with FeelFlick"
        >
          GET STARTED
        </button>
      </div>

      {/* --- Responsive for mobile/tablet --- */}
      <style>{`
        @media (max-width: 900px) {
          section[aria-label="FeelFlick Hero Section"] {
            height: auto !important;
            min-height: 60vh !important;
            margin-top: ${Math.max(HEADER_HEIGHT - 24, 24)}px !important;
          }
          section[aria-label="FeelFlick Hero Section"] > div[style*="z-index: 2"] {
            padding: 22px 5vw !important;
            max-width: 100vw !important;
            min-width: 0 !important;
          }
        }
        @media (max-width: 540px) {
          section[aria-label="FeelFlick Hero Section"] {
            padding-top: 18px !important;
            min-height: 42vh !important;
          }
          section[aria-label="FeelFlick Hero Section"] > div[style*="z-index: 2"] {
            padding: 11px 3vw !important;
          }
          section[aria-label="FeelFlick Hero Section"] h1 {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </section>
  );
}
