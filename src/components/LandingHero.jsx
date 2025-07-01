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
    viewBox="0 0 1920 140"
    width="100%"
    height="120"
    preserveAspectRatio="none"
    style={{ display: "block" }}
  >
    <defs>
      {/* Theme gradient for the "stroke" */}
      <linearGradient id="fflick-gradient-stroke" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#367cff" stopOpacity="0" />
        <stop offset="10%" stopColor="#367cff" stopOpacity="1" />
        <stop offset="50%" stopColor="#eb423b" />
        <stop offset="90%" stopColor="#fe9245" stopOpacity="1" />
        <stop offset="100%" stopColor="#fe9245" stopOpacity="0" />
      </linearGradient>
      {/* Fade-out mask for the ends */}
      <linearGradient id="fflick-fade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="white" stopOpacity="0"/>
        <stop offset="7%" stopColor="white" stopOpacity="1"/>
        <stop offset="93%" stopColor="white" stopOpacity="1"/>
        <stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      {/* Tapered stroke mask: fat in center, thin at ends */}
      <radialGradient id="tapered-mask" cx="0.5" cy="0" r="0.6">
        <stop offset="0%" stopColor="white" stopOpacity="1" />
        <stop offset="67%" stopColor="white" stopOpacity="1" />
        <stop offset="100%" stopColor="white" stopOpacity="0.01" />
      </radialGradient>
      {/* Dark fill under the curve */}
      <linearGradient id="fflick-gradient-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(20,16,12,0.99)" />
        <stop offset="60%" stopColor="rgba(20,16,12,0.99)" />
        <stop offset="100%" stopColor="rgba(15,12,8,1)" />
      </linearGradient>
      {/* Mask for faded sides */}
      <mask id="fflick-fade-mask">
        <rect x="0" y="0" width="1920" height="140" fill="url(#fflick-fade)" />
      </mask>
      {/* Mask for center thickness taper */}
      <mask id="tapered-center-mask">
        <ellipse cx="960" cy="82" rx="850" ry="38" fill="url(#tapered-mask)" />
      </mask>
    </defs>
    {/* Tapered colored curve: filled shape, not a stroke */}
    <path
      d="M0,125 Q960,50 1920,125"
      fill="none"
      stroke="url(#fflick-gradient-stroke)"
      strokeWidth="30"
      strokeLinecap="round"
      mask="url(#tapered-center-mask)"
      style={{ filter: "drop-shadow(0 3px 16px #eb423b33)" }}
    />
    {/* Under-curve dark fill, with faded sides */}
    <path
      d="M0,125 Q960,50 1920,125 L1920,140 L0,140 Z"
      fill="url(#fflick-gradient-fill)"
      stroke="none"
      mask="url(#fflick-fade-mask)"
    />
  </svg>
</div>



    </section>
  );
}
