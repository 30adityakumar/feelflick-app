import { useNavigate } from "react-router-dom";

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <section
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        position: "relative",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        overflow: "hidden",
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <style>{`
        @media (max-width: 700px) {
          .fflick-landing-content {
            padding: 0 6vw !important;
          }
          .fflick-landing-heading {
            font-size: 6vw !important;
            margin-bottom: 15px !important;
          }
          .fflick-landing-desc {
            font-size: 1.12rem !important;
            margin-bottom: 22px !important;
          }
          .fflick-landing-btn {
            font-size: 1.02rem !important;
            padding: 10px 15vw !important;
          }
        }
        @media (max-width: 420px) {
          .fflick-landing-content {
            padding: 0 2vw !important;
          }
          .fflick-landing-heading {
            font-size: 7vw !important;
          }
          .fflick-landing-desc {
            font-size: 0.97rem !important;
          }
          .fflick-landing-btn {
            font-size: 0.98rem !important;
            padding: 10px 6vw !important;
          }
        }
      `}</style>
      <div
        className="fflick-landing-content"
        style={{
          textAlign: "center",
          maxWidth: 900,
          margin: "0 auto",
          zIndex: 2,
          position: "relative",
          padding: "0 18px",
        }}
      >
        <div
          className="fflick-landing-heading"
          style={{
            fontWeight: 900,
            fontSize: "clamp(2.2rem, 6vw, 3.3rem)",
            color: "#fff",
            letterSpacing: "-1.1px",
            marginBottom: 18,
            textShadow:
              "0 4px 24px #000c, 0 2px 8px #18406d77, 0 0px 1px #fe924566",
            lineHeight: 1.11,
            filter: "drop-shadow(0 1px 16px #eb423b22)",
            transition: "font-size 0.23s",
          }}
        >
          Movies that match your mood.
        </div>
        <div
          className="fflick-landing-desc"
          style={{
            fontWeight: 400,
            fontSize: "clamp(1rem,1.2vw,1.25rem)",
            color: "#fff",
            opacity: 0.95,
            margin: "0 0 32px 0",
            lineHeight: 1.6,
            textShadow: "0 2px 8px #0002",
            transition: "font-size 0.18s",
          }}
        >
          Get the perfect recommendation based on your taste and how you feel.
          <br />
          Fast, private, and always free.
        </div>
        <button
          className="fflick-landing-btn"
          onClick={() => navigate("/auth/sign-up")}
          style={{
            background: `linear-gradient(90deg,#fe9245 10%,#eb423b 90%)`,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 900,
            fontSize: "1.07rem",
            padding: "11px 35px",
            marginTop: 0,
            boxShadow: "0 3px 16px #eb423b28",
            cursor: "pointer",
            letterSpacing: "0.02em",
            transition:
              "transform 0.16s cubic-bezier(.3,1.1,.3,1.03), box-shadow 0.14s, opacity 0.13s, font-size 0.16s, padding 0.13s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 9px 26px #eb423b52";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 3px 16px #eb423b28";
          }}
        >
          GET STARTED
        </button>
      </div>
      {/* SVG curve at the bottom */}
      <div
        style={{
          width: "100vw",
          position: "absolute",
          left: 0,
          bottom: 0,
          zIndex: 3,
          pointerEvents: "none",
          lineHeight: 0,
        }}
      >
        <svg
          viewBox="0 0 1920 140"
          width="100%"
          height="140"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient
              id="fflick-gradient-stroke"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#367cff" stopOpacity="0" />
              <stop offset="10%" stopColor="#367cff" stopOpacity="1" />
              <stop offset="50%" stopColor="#eb423b" />
              <stop offset="90%" stopColor="#fe9245" stopOpacity="1" />
              <stop offset="100%" stopColor="#fe9245" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="fflick-fade"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="7%" stopColor="white" stopOpacity="1" />
              <stop offset="93%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="fflick-gradient-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="rgba(20,16,12,0.99)" />
              <stop offset="70%" stopColor="rgba(20,16,12,0.99)" />
              <stop offset="100%" stopColor="rgba(15,12,8,1)" />
            </linearGradient>
            <mask id="fflick-fade-mask">
              <rect
                x="0"
                y="0"
                width="1920"
                height="140"
                fill="url(#fflick-fade)"
              />
            </mask>
          </defs>
          {/* Very low, bold, faded curve */}
          <path
            d="M0,136 Q960,85 1920,136"
            fill="none"
            stroke="url(#fflick-gradient-stroke)"
            strokeWidth="13"
            style={{ filter: "drop-shadow(0 3px 14px #eb423b33)" }}
            mask="url(#fflick-fade-mask)"
          />
          {/* Under-curve dark fill */}
          <path
            d="M0,136 Q960,85 1920,136 L1920,140 L0,140 Z"
            fill="url(#fflick-gradient-fill)"
            stroke="none"
            mask="url(#fflick-fade-mask)"
          />
        </svg>
      </div>
    </section>
  );
}
