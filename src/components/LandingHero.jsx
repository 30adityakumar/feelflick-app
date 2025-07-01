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
            background: `linear-gradient(90deg,#fe9245 10%,#eb423b 90%)`,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 900,
            fontSize: "1.4rem",
            padding: "18px 56px",
            marginTop: 0, // moved up, right under text
            boxShadow: "0 4px 22px #eb423b30",
            cursor: "pointer",
            letterSpacing: "0.02em",
            transition: "transform 0.16s cubic-bezier(.3,1.1,.3,1.03), box-shadow 0.14s, opacity 0.13s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.07)";
            e.currentTarget.style.boxShadow = "0 8px 32px #eb423b55";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 22px #eb423b30";
          }}
        >
          GET STARTED
        </button>
      </div>
      {/* Bottom Curve Divider with Gradient Stroke */}
      <div style={{
        width: "100vw",
        position: "absolute",
        left: 0,
        bottom: -1, // overlays the next section
        zIndex: 3,
        pointerEvents: "none",
        lineHeight: 0,
      }}>
        <svg
          viewBox="0 0 1920 120"
          width="100%"
          height="72"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          {/* SVG Gradient for Stroke */}
          <defs>
            <linearGradient id="fflick-gradient-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="10%" stopColor="#fe9245" />
              <stop offset="95%" stopColor="#eb423b" />
            </linearGradient>
          </defs>
          {/* Curved Path with THEME GRADIENT stroke */}
          <path
            d="M0,30 Q950,120 1920,30 L1920,120 L0,120 Z"
            fill="#090a14"
            stroke="url(#fflick-gradient-stroke)"
            strokeWidth="6"
            style={{ filter: "drop-shadow(0 1px 16px #eb423b6c)" }}
          />
          {/* Solid fill below the curve */}
          <rect x="0" y="60" width="1920" height="70" fill="#090a14" />
        </svg>
      </div>
    </section>
  );
}
