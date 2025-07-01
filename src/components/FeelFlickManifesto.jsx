// FeelFlickManifesto.jsx

export default function FeelFlickManifesto() {
  return (
    <section
      id="why-feelflick"
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "linear-gradient(108deg, #1a2232 50%, #fff8e5 150%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: "0",
        zIndex: 2
      }}
    >
      <div style={{
        width: "100%",
        maxWidth: 880,
        margin: "0 auto",
        padding: "90px 6vw 80px 6vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center"
      }}>
        <h2 style={{
          fontWeight: 900,
          fontSize: "clamp(2.0rem,4vw,2.7rem)",
          color: "#18406d",
          marginBottom: 28,
          textAlign: "left"
        }}>
          Why FeelFlick?
        </h2>
        <p style={{
          fontSize: "clamp(1.13rem,2.3vw,1.25rem)",
          color: "#232228",
          fontWeight: 500,
          lineHeight: 1.7,
          maxWidth: 700,
          margin: "0 0 16px 0",
          textAlign: "left"
        }}>
          <span style={{ fontWeight: 800, color: "#fe9245" }}>
            Ever opened a streaming app and spent 40 minutes just... scrolling?
          </span><br /><br />
          You’re tired. You want to feel something. But nothing feels right.
          <span style={{ color: "#eb423b", fontWeight: 700 }}> That’s the moment FeelFlick was built for.</span>
          <br /><br />
          We don’t just show you what’s <span style={{ color: "#fe9245" }}>trending</span>.<br />
          We show you what <span style={{ color: "#18406d" }}>fits</span> — your mood, your taste, your moment.<br /><br />
          Because you're not just a viewer. You're a whole human with emotions, patterns, and preferences.
          <span style={{ color: "#fe9245" }}> And we believe your next movie should get that.</span>
          <br /><br />
          FeelFlick is your personal movie companion — powered by <span style={{ color: "#eb423b" }}>memory</span>, <span style={{ color: "#fe9245" }}>mood</span>, and smart AI.
          <br />
          It learns what you’ve loved before. You tell it how you’re feeling now.
          And in seconds, it suggests something that just clicks.
          <br /><br />
          <span style={{
            fontWeight: 700,
            background: "linear-gradient(96deg,#fe9245 10%,#eb423b 70%)",
            color: "#fff",
            borderRadius: 10,
            padding: "4px 12px"
          }}>
            No star ratings. No overload. No second-guessing.
          </span>
          <br />
          <span style={{ color: "#eb423b", fontWeight: 700 }}>
            Just films that match your vibe — beautifully, privately, and always free.
          </span>
        </p>
      </div>
      {/* Soft lamp glow at top for cozy effect */}
      <div style={{
        position: "absolute",
        top: 0, left: "44vw",
        width: 350, height: 160,
        background: "radial-gradient(circle, #ffe5a5 0%, #fff8e5 60%, transparent 100%)",
        filter: "blur(30px)", opacity: 0.5, zIndex: 1
      }} />
    </section>
  )
}
