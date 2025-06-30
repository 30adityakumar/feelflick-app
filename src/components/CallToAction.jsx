// CallToAction.jsx
export default function CallToAction({ onSignUp }) {
  return (
    <section style={{
      maxWidth: 540, margin: "38px auto 0 auto",
      background: `linear-gradient(96deg, #fe9245 40%, #eb423b 100%)`,
      borderRadius: 15, boxShadow: "0 2px 12px #0002",
      padding: "20px 18px 20px 18px", textAlign: "center"
    }}>
      <div style={{
        fontWeight: 900, color: "#fff", fontSize: 18, marginBottom: 10,
        letterSpacing: "-0.5px"
      }}>
        Ready to get started? <span style={{ color: "#fff" }}>Create your free account.</span>
      </div>
      <button
        onClick={onSignUp}
        style={{
          marginTop: 3,
          background: "#fff",
          color: "#eb423b",
          border: "none",
          borderRadius: 7,
          fontWeight: 900,
          fontSize: 15,
          padding: "7px 18px",
          boxShadow: "0 1.5px 7px #0002",
          cursor: "pointer"
        }}
      >
        Create your free account
      </button>
    </section>
  )
}
