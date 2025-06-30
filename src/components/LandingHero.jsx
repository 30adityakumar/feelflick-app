// LandingHero.jsx
export default function LandingHero({ onGetStarted }) {
  return (
    <section style={{
      minHeight: "94vh", width: "100vw",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 1, position: "relative", paddingTop: 120, paddingBottom: 36
    }}>
      <div style={{
        textAlign: "center", maxWidth: 900, margin: "0 auto"
      }}>
        <div style={{
          fontWeight: 900, fontSize: "clamp(2.3rem,5vw,3.7rem)", color: "#fff",
          letterSpacing: "-1.2px", marginBottom: 18, textShadow: "0 2px 16px #000b, 0 4px 30px #000a"
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
