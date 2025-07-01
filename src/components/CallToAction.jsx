export default function CallToAction({ onSignUp }) {
  return (
    <section style={{
      width: "100vw",
      minHeight: 64,
      margin: "52px 0 0 0",   // Space only at the top!
      padding: "0",
      background: "linear-gradient(120deg, rgba(18,13,10,0.99) 80%, rgba(34, 24, 20, 1) 100%)",
      borderRadius: 0,
      boxShadow: "0 -1.5px 24px 0 #000a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 22,
      position: "relative",
      zIndex: 12,
      borderTop: "1px solid rgba(255,91,46,0.09)",
    }}>
      <div style={{
        fontWeight: 400,
        color: "#fff",
        fontSize: "1.17rem",
        letterSpacing: "-0.4px",
        textAlign: "center",
        textShadow: "0 2.5px 10px #191a2085",
        whiteSpace: "nowrap",
        margin: 0,
        padding: "0",
      }}>
        Ready to get started?
      </div>
      <button
        onClick={onSignUp}
        style={{
          background: "linear-gradient(91deg, #FF5B2E 54%, #FF7B48 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: "1rem",
          padding: "7px 18px",
          boxShadow: "0 1.5px 7px #0a0a0a19",
          cursor: "pointer",
          transition: "background 0.15s, box-shadow 0.13s, transform 0.11s",
          margin: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "linear-gradient(91deg, #FF7B48 64%, #FF5B2E 100%)";
          e.currentTarget.style.transform = "translateY(-1px) scale(1.03)";
          e.currentTarget.style.boxShadow = "0 7px 22px #FF5B2E2e";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "linear-gradient(91deg, #FF5B2E 54%, #FF7B48 100%)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 1.5px 7px #0a0a0a19";
        }}
      >
        Create your free account
      </button>
    </section>
  )
}
