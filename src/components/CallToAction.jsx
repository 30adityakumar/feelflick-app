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
      background: "linear-gradient(120deg, rgba(15,11,8,0.92) 80%, rgba(28, 21, 15, 0.95) 100%)",
      borderRadius: 0,
      boxShadow: "0 -1.5px 24px 0 #000a",
      paddingTop: "28px",
      paddingBottom: "26px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 85,
      zIndex: 12,
    }}>
      <div style={{
        fontWeight: 1000,
        color: "#fff",
        fontSize: "1.28rem",
        marginBottom: 12,
        letterSpacing: "-0.6px",
        whiteSpace: "nowrap",
        textAlign: "center",
        textShadow: "0 2.5px 10px #191a2085",
        maxWidth: "96vw",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        Ready to get started?{" "}
        <span style={{
          color: "var(--theme-color, #FF5B2E)",
          fontWeight: 1000,
          letterSpacing: "-0.5px",
        }}>Create your free account.</span>
      </div>
      <button
        onClick={onSignUp}
        style={{
          marginTop: 3,
          background: "linear-gradient(93deg, #FF5B2E 64%, #FFD9B7 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 9,
          fontWeight: 900,
          fontSize: "1.08rem",
          padding: "9px 26px",
          boxShadow: "0 2.5px 14px #0a0a0a14",
          cursor: "pointer",
          transition: "background 0.19s, box-shadow 0.19s, transform 0.13s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "linear-gradient(91deg, #FF7B48 54%, #FF5B2E 100%)";
          e.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
          e.currentTarget.style.boxShadow = "0 7px 32px #FF5B2E44";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "linear-gradient(93deg, #FF5B2E 64%, #FFD9B7 100%)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 2.5px 14px #0a0a0a14";
        }}
      >
        Create your free account
      </button>
    </section>
  )
}
