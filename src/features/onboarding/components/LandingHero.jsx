import { useNavigate } from "react-router-dom";
import heroVideo from "@/assets/videos/hero-bg.mp4";
import backgroundposter from "@/assets/images/background-poster.jpg"; // Or use your poster image

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        width: "100vw",
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: "#101015",
        paddingTop: 100,    // ensure it's below your nav/header
        paddingBottom: 60,  // extra breathing space
      }}
      aria-label="FeelFlick Hero Section"
    >
      {/* --- Background Video, aligned right on desktop --- */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          overflow: "hidden",
          zIndex: 0,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "flex-end",
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
            width: "75vw",
            minWidth: 360,
            height: "100%",
            maxHeight: "95vh",
            objectFit: "cover",
            objectPosition: "center right",
            filter: "brightness(0.63) blur(0.3px)",
            borderRadius: "0 0 0 70px",
            background: "#222", // fallback
            transition: "width .3s",
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* --- Black right overlay (fades left) --- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(270deg,rgba(12,12,18,0.97) 38%,rgba(12,12,18,0.55) 68%,rgba(12,12,18,0.00) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* --- Hero Content (on top, left-aligned) --- */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 690,
          marginLeft: "clamp(8vw, 7%, 120px)",
          marginRight: "clamp(3vw, 5%, 90px)",
          padding: "32px 22px",
          color: "#fff",
          background: "rgba(18,18,22,0.69)",
          borderRadius: 30,
          boxShadow: "0 4px 40px #0e0e11aa",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          minWidth: 320,
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(1.6rem,4vw,2.8rem)",
            color: "#fff",
            letterSpacing: "-0.5px",
            marginBottom: 18,
            textShadow: "0 4px 24px #000c, 0 2px 8px #18406d77",
            lineHeight: 1.12,
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

      {/* --- Responsive mobile: stack everything --- */}
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
            border-radius: 18px !important;
          }
          section[aria-label="FeelFlick Hero Section"] video {
            width: 100vw !important;
            min-width: 0 !important;
            border-radius: 0 !important;
            max-height: 64vw !important;
            margin-bottom: 14px !important;
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
            border-radius: 10px !important;
          }
          section[aria-label="FeelFlick Hero Section"] h1 {
            font-size: 1.2rem !important;
          }
        }
      `}</style>
    </section>
  );
}
