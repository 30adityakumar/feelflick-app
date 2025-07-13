import { useNavigate } from "react-router-dom";
import HERO_VIDEO from '@/assets/videos/background.mp4'

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .fflick-hero-section {
          background: #000 !important;
        }
        .fflick-hero-left {
          /* Always overlay, never stacks below on mobile */
          position: absolute !important;
          left: clamp(7vw, 7%, 32px);
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          max-width: 580px;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        @media (max-width: 1050px) {
          .fflick-hero-left {
            left: 6vw !important;
            max-width: 95vw !important;
          }
        }
        @media (max-width: 700px) {
          .fflick-hero-left {
            left: 3vw !important;
            max-width: 94vw !important;
            padding-right: 3vw !important;
          }
          .fflick-hero-title { font-size: 1.07rem !important; }
        }
        @media (max-width: 420px) {
          .fflick-hero-left {
            left: 1vw !important;
            max-width: 98vw !important;
            padding-right: 2vw !important;
          }
          .fflick-hero-title { font-size: 0.89rem !important;}
        }
      `}</style>

      <section
        className="fflick-hero-section"
        style={{
          position: "relative",
          width: "100vw",
          minHeight: "83vh",
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
        {/* ---- Video as background ---- */}
        <video
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          poster="/background-poster.jpg"
          aria-hidden="true"
          style={{
            width: "100vw",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.72) blur(0.2px)",
            position: "absolute",
            inset: 0,
            zIndex: 1,
          }}
        />
        {/* ---- Dark left-right gradient for text readability ---- */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(90deg,rgba(0,0,0,0.97) 0%,rgba(0,0,0,0.68) 54%,rgba(0,0,0,0.16) 88%,rgba(0,0,0,0.01) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* ---- Hero content overlays video at all sizes ---- */}
        <div
          className="fflick-hero-left"
          tabIndex={0}
        >
          <h1
            className="fflick-hero-title"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.3rem,6vw,3.7rem)",
              color: "#fff",
              letterSpacing: "-0.7px",
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
            style={{
              fontWeight: 400,
              fontSize: "clamp(1.01rem,1.11vw,1.15rem)",
              color: "#F6E3D7",
              opacity: 0.97,
              marginBottom: 31,
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
            tabIndex={0}
            aria-label="Get started with FeelFlick"
            onClick={() => navigate("/auth/sign-up")}
            style={{
              background: "linear-gradient(90deg,#fe9245 10%,#eb423b 90%)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontWeight: 900,
              fontSize: "1rem",
              padding: "10px 28px", // smaller button
              minWidth: 100,
              minHeight: 40,
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
