import { useNavigate } from "react-router-dom";
import HERO_VIDEO from '@/assets/videos/background.mp4'

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <>
    <style>{`
      .fflick-hero-section { background: #000 !important; }
      .fflick-hero-left {
        position: absolute !important;
        left: clamp(7vw, 7%, 32px);
        top: 50%;
        transform: translateY(-50%);
        z-index: 3;
        max-width: 590px;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
      .fflick-hero-title {
        font-size: clamp(2.4rem, 5.5vw, 3.7rem) !important;
      }
      .fflick-hero-desc {
        font-size: clamp(0.9rem, 1.7vw, 1.1rem) !important;
      }
      .fflick-hero-btn {
        font-size: clamp(0.92rem, 2.4vw, 1.08rem) !important;
        padding: clamp(8px, 2vw, 13px) clamp(16px, 6vw, 44px) !important;
        min-width: clamp(80px, 23vw, 140px) !important;
        min-height: clamp(38px, 8.2vw, 44px) !important;
        border-radius: 14px !important;
      }
      @media (max-width: 1050px) {
        .fflick-hero-left { left: 5vw !important; max-width: 96vw !important; }
      }
      @media (max-width: 700px) {
        .fflick-hero-left { left: 2vw !important; max-width: 96vw !important; padding-right: 2vw !important;}
      }
      @media (max-width: 420px) {
        .fflick-hero-left { left: 1vw !important; max-width: 98vw !important; padding-right: 1vw !important;}
      }
    `}</style>


      <section
        className="fflick-hero-section"
        style={{
          position: "relative",
          width: "100vw",
          minHeight: "98vh",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "flex-end",
          background: "#000",
          padding: 0,
          overflow: "hidden",
          zIndex: 2,
        }}
        aria-label="Main hero section"
      >
        {/* ---- Video as background, starts right of the text ---- */}
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
            left: "24vw",
            top: 0,
            width: "76vw",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
            transition: "left 0.18s",
          }}
        />

        {/* ---- Black to transparent overlay (on top of video, under text) ---- */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100%",
            zIndex: 2,
            pointerEvents: "none",
            background: "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.64) 52%, rgba(0,0,0,0.13) 88%, rgba(0,0,0,0) 100%)"
          }}
        />

        {/* ---- Hero content overlays on left ---- */}
        <div className="fflick-hero-left" tabIndex={0}>
        <h1
          className="fflick-hero-title"
          style={{
            fontWeight: 900,
            // REMOVE fontSize
            color: "#fff",
            letterSpacing: "-0.3px",
            marginBottom: 18,
            textShadow: "0 4px 22px #000c, 0 2px 8px #18406d77",
            lineHeight: 1.09,
            outline: "none",
          }}
          tabIndex={0}
          aria-label="Movies that match your mood"
        >
          Movies that match your mood.
        </h1>
        <div
          className="fflick-hero-desc"
          style={{
            fontWeight: 400,
            // REMOVE fontSize
            color: "#F6E3D7",
            opacity: 0.97,
            marginBottom: 30,
            lineHeight: 1.57,
            textShadow: "0 2px 8px #0003",
            outline: "none",
          }}
          tabIndex={0}
          aria-label="Get the perfect recommendation based on your taste and how you feel. Fast, private, and always free."
        >
          Get the perfect recommendation based on your taste and how you feel.<br />
          Fast, private, and always free.
        </div>
        <button
          className="fflick-hero-btn"
          tabIndex={0}
          aria-label="Get started with FeelFlick"
          onClick={() => navigate("/auth/sign-up")}
          style={{
            background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontWeight: 900,
            // REMOVE fontSize, padding, minWidth, minHeight
            cursor: "pointer",
            letterSpacing: "0.01em",
            transition: "filter 0.12s, transform 0.12s, opacity 0.12s",
            outline: "none",
          }}
          onFocus={e => (e.currentTarget.style.filter = "brightness(1.09)")}
          onBlur={e => (e.currentTarget.style.filter = "none")}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") navigate("/auth/sign-up");
          }}
          onMouseDown={e => (e.currentTarget.style.transform = "scale(.97)")}
          onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
          onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.06)")}
          onMouseLeave={e => (e.currentTarget.style.filter = "none")}
        >
          Get started
        </button>
      </div>

      </section>
    </>
  );
}
