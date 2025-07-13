import { useNavigate } from "react-router-dom";
import HERO_VIDEO from '@/assets/videos/background.mp4'

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @media (max-width: 1050px) {
          .fflick-hero-section { flex-direction: column !important; min-height: 68vh !important; }
          .fflick-hero-left { width: 100vw !important; max-width: 100vw !important; padding: 50px 6vw 32px 6vw !important; align-items: center !important; text-align: center !important;}
          .fflick-hero-title { font-size: 2.2rem !important;}
        }
        @media (max-width: 700px) {
          .fflick-hero-section { min-height: 52vh !important; }
          .fflick-hero-title { font-size: 1.12rem !important;}
        }
        @media (max-width: 420px) {
          .fflick-hero-section { min-height: 34vh !important;}
          .fflick-hero-title { font-size: 0.94rem !important;}
        }
      `}</style>

      <section
        className="fflick-hero-section"
        style={{
          position: "relative",
          width: "100vw",
          minHeight: "82vh", // Fills nearly all of the viewport
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          background: "#101015",
          padding: 0,
          overflow: "hidden",
          zIndex: 3,
        }}
        aria-label="Main hero section"
      >
        {/* ---- Text/content left (desktop) ---- */}
        <div
          className="fflick-hero-left"
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            width: "41vw",
            maxWidth: 570,
            padding: "0 0 0 5vw", // leaves blank space on the left for video
            color: "#fff",
            minHeight: "82vh",
          }}
        >
          <h1
            className="fflick-hero-title"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.4rem,6vw,4rem)",
              color: "#fff",
              letterSpacing: "-0.7px",
              marginBottom: 18,
              textShadow: "0 4px 24px #000c, 0 2px 8px #18406d77",
              lineHeight: 1.07,
              outline: "none",
            }}
            tabIndex={0}
            aria-label="Movies that match your mood"
          >
            Movies that match your mood.
          </h1>
          <div
            style={{
              fontWeight: 400,
              fontSize: "clamp(1.08rem,1.14vw,1.22rem)",
              color: "#F6E3D7",
              opacity: 0.96,
              marginBottom: 38,
              lineHeight: 1.6,
              textShadow: "0 2px 8px #0002",
              outline: "none",
            }}
            tabIndex={0}
            aria-label="Get the perfect recommendation based on your taste and how you feel. Fast, private, and always free."
          >
            Get the perfect recommendation based on your taste and how you feel.<br />
            Fast, private, and always free.
          </div>
          <button
            tabIndex={0}
            aria-label="Get started with FeelFlick"
            onClick={() => navigate("/auth/sign-up")}
            style={{
              background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontWeight: 900,
              fontSize: "1.14rem",
              padding: "14px 48px",
              minWidth: 140,
              minHeight: 44,
              boxShadow: "0 5px 20px #eb423b2c",
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "filter 0.13s, transform 0.13s, box-shadow 0.13s, opacity 0.13s",
              outline: "none",
            }}
            onFocus={e => (e.currentTarget.style.filter = "brightness(1.11)")}
            onBlur={e => (e.currentTarget.style.filter = "none")}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") navigate("/auth/sign-up");
            }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
            onMouseEnter={e => {
              e.currentTarget.style.filter = "brightness(1.10)";
              e.currentTarget.style.boxShadow = "0 8px 36px #eb423b58";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.boxShadow = "0 5px 20px #eb423b2c";
            }}
          >
            Get started
          </button>
        </div>

        {/* ---- Video right ---- */}
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            minHeight: "82vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          <video
            src={HERO_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            poster="/background-poster.jpg"
            inert
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.70) blur(0.1px)",
            }}
          />
          {/* ---- Optional: gradient overlay for right edge fade ---- */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "35vw",
              pointerEvents: "none",
              background:
                "linear-gradient(90deg,rgba(14,14,17,0.98) 0%,rgba(14,14,17,0.68) 58%,rgba(14,14,17,0.12) 95%,rgba(14,14,17,0.01) 100%)",
              zIndex: 2,
            }}
          />
        </div>
      </section>
    </>
  );
}
