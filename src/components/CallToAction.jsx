// CallToAction.jsx
export default function CallToAction({ onSignUp }) {
  return (
    <section style={{
      width: "100vw",
      margin: "0",
      padding: "0",
      position: "relative",
      left: "50%",
      right: "50%",
      transform: "translate(-50%, 0)",
      background: "linear-gradient(120deg, rgba(15,11,8,0.97) 80%, rgba(30, 20, 16, 0.98) 100%)",
      borderRadius: 0,
      boxShadow: "0 -1.5px 24px 0 #000a",
      paddingTop: "30px",
      paddingBottom: "24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 75,
      zIndex: 12,
    }}>
      <div style={{
        fontWeight: 1000,
        color: "#fff",
        fontSize: "1.33rem",
        letterSpacing: "-0.7px",
        textAlign: "center",
        textShadow: "0 2.5px 10px #191a2085",
        marginBottom: "10px",
        whiteSpace: "nowrap"
      }}>
        Ready to get started?
      </div>
      <button
        onClick={onSignUp}
        style={{
          marginTop: 0,
          background: "linear-gradient(91deg, #FF5B2E 54%, #FF7B48 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 9,
          fontWeight: 900,
          fontSize: "1.09rem",
          padding: "12px 34px",
          boxShadow: "0 2.5px 14px #0a0a0a14",
          cursor: "pointer",
          transition: "background 0.17s, box-shadow 0.17s, transform 0.12s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "linear-gradient(91deg, #FF7B48 64%, #FF5B2E 100%)";
          e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
          e.currentTarget.style.boxShadow = "0 8px 32px #FF5B2E33";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "linear-gradient(91deg, #FF5B2E 54%, #FF7B48 100%)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 2.5px 14px #0a0a0a14";
        }}
      >
        Create your free account
      </button>
    </section>
  )
}
