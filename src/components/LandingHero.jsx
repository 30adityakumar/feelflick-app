export default function LandingHero({ onGetStarted }) {
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
        background: "rgba(0,0,0,0.18)"
      }}
    >
      <div style={{
        textAlign: "center",
        maxWidth: 900,
        margin: "0 auto",
        zIndex: 2,
        position: "relative"
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: "clamp(2.2rem, 6vw, 3.3rem)",
          color: "#fff",
          letterSpacing: "-1.1px",
          marginBottom: 18,
          textShadow: "0 4px 24px #000c, 0 2px 8px #18406d77, 0 0px 1px #fe924566",
          lineHeight: 1.11,
          filter: "drop-shadow(0 1px 16px #eb423b22)"
        }}>
          Movies that match your mood.
        </div>
        <div style={{
          fontWeight: 400,
          fontSize: "clamp(1rem,1.2vw,1.25rem)",
          color: "#fff",
          opacity: 0.95,
          margin: "0 0 32px 0",
          lineHeight: 1.6,
          textShadow: "0 2px 8px #0002"
        }}>
          Get the perfect recommendation based on your taste and how you feel.<br />
          Fast, private, and always free.
        </div>
        <button
          onClick={onGetStarted}
          style={{
            background: `linear-gradient(90deg,#367cff 0%,#eb423b 40%,#fe9245 90%)`,
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
            transition: "transform 0.16s cubic-bezier(.3,1.1,.3,1.03), box-shadow 0.14s, opacity 0.13s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 9px 26px #eb423b52";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 3px 16px #eb423b28";
          }}
        >
          GET STARTED
        </button>
      </div>
      <div style={{
          width: "100vw",
          position: "absolute",
          left: 0,
          bottom: 0,
          zIndex: 3,
          pointerEvents: "none",
          lineHeight: 0,
        }}>
          <svg
            viewBox="0 0 1920 110"
            width="100%"
            height="70"
            preserveAspectRatio="none"
            style={{ display: "block" }}
          >
            <defs>
              {/* THEME GRADIENT for stroke */}
              <linearGradient id="fflick-gradient-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#367cff" />
                <stop offset="50%" stopColor="#eb423b" />
                <stop offset="100%" stopColor="#fe9245" />
              </linearGradient>
              {/* Transparent black to transparent gradient for fill */}
              <linearGradient id="fflick-curve-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(14,16,22,0.82)" />
                <stop offset="70%" stopColor="rgba(14,16,22,0.06)" />
                <stop offset="100%" stopColor="rgba(14,16,22,0)" />
              </linearGradient>
              {/* Fading corners mask */}
              <linearGradient id="fflick-curve-mask" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0"/>
                <stop offset="7%" stopColor="white" stopOpacity="1"/>
                <stop offset="93%" stopColor="white" stopOpacity="1"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <g mask="url(#fflick-curve-fade)">
              {/* Subtle single curve */}
              <path
                d="M0,30 Q960,80 1920,30 L1920,110 L0,110 Z"
                fill="url(#fflick-curve-fill)"
                stroke="url(#fflick-gradient-stroke)"
                strokeWidth="5"
                style={{ filter: "drop-shadow(0 2px 8px #eb423b55)" }}
              />
            </g>
            {/* Apply mask for faded sides */}
            <mask id="fflick-curve-fade">
              <rect x="0" y="0" width="1920" height="110" fill="url(#fflick-curve-mask)" />
            </mask>
          </svg>
        </div>
    </section>
  );
}
