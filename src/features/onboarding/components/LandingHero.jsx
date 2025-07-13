import { useNavigate } from "react-router-dom";

// Swap in any stock or legal background video you want!
const HERO_VIDEO =
  "https://videos.pexels.com/video-files/7991369/7991369-hd_1280_720_30fps.mp4"; // Example, replace with your favorite

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .fflick-hero-wrap { flex-direction: column !important; min-height: 66vh !important; padding: 36px 0 0 0 !important;}
          .fflick-hero-left { align-items: center !important; text-align: center !important; max-width: 96vw !important;}
          .fflick-hero-title { font-size: 2rem !important;}
          .fflick-hero-desc { font-size: 1.08rem !important;}
        }
        @media (max-width: 700px) {
          .fflick-hero-wrap { min-height: 56vh !important; padding: 22px 0 0 0 !important;}
          .fflick-hero-title { font-size: 1.17rem !important;}
          .fflick-hero-desc { font-size: 0.98rem !important;}
          .fflick-hero-btn   { font-size: 1.01rem !important; padding: 11px 18vw !important; min-width: 140px !important;}
        }
        @media (max-width: 420px) {
          .fflick-hero-wrap { min-height: 36vh !important; }
          .fflick-hero-title { font-size: 1.04rem !important;}
          .fflick-hero-desc { font-size: 0.85rem !important;}
          .fflick-hero-btn   { font-size: 0.97rem !important; padding: 10px 14vw !important; min-width: 100px !important;}
        }
      `}</style>

      <section
        className="fflick-hero-wrap"
        style={{
          position: "relative",
          width: "100vw",
          minHeight: "75vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          background: "#101015",
          padding: "60px 0 0 0",
          overflow: "hidden",
          zIndex: 3,
        }}
        aria-label="Main hero section"
      >
        {/* ---- Video background (right side, covers full area) ---- */}
        <video
          src={HERO_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          poster="/background-poster.jpg"
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            width: "100vw",
            objectFit: "cover",
            zIndex: 0,
            filter: "brightness(0.64) blur(0.3px)",
          }}
        />
        {/* ---- Overlay gradient for readability ---- */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(90deg,rgba(14,14,17,0.98) 0%,rgba(14,14,17,0.81) 48%,rgba(14,14,17,0.19) 80%,rgba(14,14,17,0.01) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* ---- Hero content (left side) ---- */}
        <div
          className="fflick-hero-left"
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: 580,
            marginLeft: "clamp(7vw, 7%, 110px)",
            marginRight: "clamp(3vw, 4%, 70px)",
            color: "#fff",
          }}
        >
          <h1
            className="fflick-hero-title"
            style={{
              fontWeight: 900,
              fontSize: "clamp(2.4rem,6vw,4rem)",
              color: "#fff",
              letterSpacing: "-0.7px",
              marginBottom: 16,
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
            className="fflick-hero-desc"
            style={{
              fontWeight: 400,
              fontSize: "clamp(1.05rem,1.14vw,1.2rem)",
              color: "#F6E3D7",
              opacity: 0.96,
              marginBottom: 36,
              lineHeight: 1.57,
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
              fontSize: "1.13rem",
              padding: "13px 44px",
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
      </section>
    </>
  );
}
