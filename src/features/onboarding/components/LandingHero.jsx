import { useNavigate } from "react-router-dom";
import heroVideo from "@/assets/videos/hero-bg.mp4";
import backgroundposter from "@/assets/images/background-poster.jpg";

// Change if your nav is taller/shorter
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
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        overflow: "hidden",
        background: "#101015",
        marginTop: HEADER_HEIGHT // ensures it starts after TopNav
      }}
    >
      {/* ---- Right: Video fills right, object-fit: contain (no crop/zoom), left margin pulls it left ---- */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "48%",  // slightly to the left
          width: "52vw",
          height: "100%",
          zIndex: 0,
          overflow: "hidden",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
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
            width: "100%",
            height: "100%",
            objectFit: "contain", // show entire video
            objectPosition: "left center", // pulls video left
            filter: "brightness(1)", // no unnecessary darkening
            background: "#101015",
            transition: "filter 0.16s",
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
        {/* Subtle left-edge black shadow */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "68px",
            pointerEvents: "none",
            background: "linear-gradient(90deg,rgba(14,14,17,0.78) 0%,rgba(14,14,17,0.01) 100%)"
          }}
        />
      </div>

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
          padding: "clamp(30px, 9vw, 76px)",
          color: "#fff",
        }}
      >
        <h1
          style={{
            fontWeight: 900,
            fontSize: "clamp(1.4rem,3vw,2.3rem)", // smaller!
            color: "#fff",
            letterSpacing: "-0.5px",
            marginBottom: 20,
            textShadow: "0 4px 18px #000b, 0 2px 8px #18406d77",
            lineHeight: 1.14,
          }}
        >
          Movies that match your mood.
        </h1>
        <div
          style={{
            fontWeight: 400,
            fontSize: "clamp(1rem,1.05vw,1.21rem)",
            color: "#F6E3D7",
            opacity: 0.97,
            marginBottom: 34,
            lineHeight: 1.58,
            textShadow: "0 2px 8px #0002",
            maxWidth: 590
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
            fontSize: "1rem", // smaller
            padding: "10px 32px", // smaller
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

      {/* ---- Responsive mobile adjustments ---- */}
      <style>{`
        @media (max-width: 900px) {
          section[aria-label="FeelFlick Hero Section"] {
            flex-direction: column !important;
            height: auto !important;
            min-height: 68vh !important;
            margin-top: ${Math.max(HEADER_HEIGHT - 24, 24)}px !important;
          }
          section[aria-label="FeelFlick Hero Section"] > div[style*="z-index: 2"] {
            padding: 22px 5vw !important;
            align-items: flex-start !important;
          }
          section[aria-label="FeelFlick Hero Section"] > div[style*="position: absolute"] {
            position: static !important;
            width: 100vw !important;
            height: 35vw !important;
            min-height: 128px !important;
          }
          section[aria-label="FeelFlick Hero Section"] video {
            width: 100vw !important;
            height: 35vw !important;
            min-height: 128px !important;
            object-fit: contain !important;
            object-position: center 42% !important;
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
            font-size: 1.08rem !important;
          }
          section[aria-label="FeelFlick Hero Section"] video {
            min-height: 80px !important;
            height: 20vw !important;
          }
        }
      `}</style>
    </section>
  );
}
