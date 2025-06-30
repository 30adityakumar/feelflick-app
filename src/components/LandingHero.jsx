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
        overflow: "hidden"
      }}
    >
      <div style={{
        textAlign: "center", maxWidth: 900, margin: "0 auto"
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: "clamp(2.1rem, 5vw, 3.1rem)",
          color: "#fff",
          letterSpacing: "-1.1px",
          marginBottom: 16,
          textShadow: "0 4px 24px #000c, 0 2px 8px #18406d77, 0 0px 1px #fe924566",
          lineHeight: 1.12,
          filter: "drop-shadow(0 1px 16px #eb423b22)"
        }}>
          Movies that match your mood.
        </div>
        <div style={{
          fontWeight: 400,
          fontSize: "clamp(1rem,1.2vw,1.2rem)",
          color: "#fff", opacity: 0.95, margin: "0 0 30px 0", lineHeight: 1.6,
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
            borderRadius: 8,
            fontWeight: 900,
            fontSize: 17,
            padding: "10px 28px",
            marginTop: 4,
            boxShadow: "0 2px 9px #0003",
            cursor: "pointer"
          }}
        >
          GET STARTED
        </button>
      </div>
    </section>
  )
}
