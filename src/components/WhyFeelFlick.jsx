// WhyFeelFlick.jsx
const features = [
  {
    icon: "🔒",
    label: "Private & Secure",
    desc: "Your data is always yours—never sold or shared.",
  },
  {
    icon: "🤖",
    label: "Smart AI Recs",
    desc: "AI-powered movie suggestions for your unique taste and mood.",
  },
  {
    icon: "🧘",
    label: "Mood Matching",
    desc: "Pick your mood, get the right film. It’s that simple.",
  },
  {
    icon: "🎬",
    label: "Personal Tracker",
    desc: "Effortlessly log every movie you watch, forever.",
  },
  {
    icon: "🪄",
    label: "Clean & Minimal UI",
    desc: "No distractions. Just you, your movies, and pure discovery.",
  },
]

const BG_GRADIENT = "linear-gradient(120deg, #161d2d 60%, #232330 100%)"
const ACCENT_GRAD = "linear-gradient(100deg, #fe9245 35%, #18406d 85%)"

export default function WhyFeelFlick() {
  return (
    <section
      id="why-feelflick"
      style={{
        width: "100vw",
        background: BG_GRADIENT,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 74px)",
        borderTop: "1.5px solid #252a36",
        boxShadow: "0 8px 24px #10101515"
      }}
    >
      <div style={{
        maxWidth: 1240,
        width: "100%",
        padding: "54px 16px 38px 16px",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h2 style={{
          fontWeight: 900,
          fontSize: "clamp(1.8rem,4vw,2.6rem)",
          background: ACCENT_GRAD,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-1.2px",
          marginBottom: 36,
          marginTop: 0,
          textAlign: "center",
          lineHeight: 1.09
        }}>
          Why FeelFlick?
        </h2>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 26,
          width: "100%",
          justifyContent: "center"
        }}>
          {features.map((f, i) => (
            <div key={f.label} style={{
              flex: "1 1 220px",
              minWidth: 185,
              maxWidth: 240,
              background: "rgba(24, 26, 35, 0.91)",
              borderRadius: 18,
              boxShadow: "0 3px 24px #0009",
              padding: "30px 17px 28px 17px",
              color: "#f9fafb",
              textAlign: "center",
              position: "relative",
              border: i === 2
                ? "2.6px solid #eb423b"
                : (i === 1 ? "2.5px solid #fe9245" : "2.5px solid #202234"),
              backgroundImage: i === 2
                ? "linear-gradient(120deg,#292129 45%,#eb423b1a 100%)"
                : i === 1
                  ? "linear-gradient(120deg,#232330 60%,#fe924510 100%)"
                  : "linear-gradient(120deg,#232330 70%,#18406d09 100%)",
              transition: "transform 0.18s, box-shadow 0.17s",
              cursor: "pointer"
            }}>
              <div style={{
                fontSize: 36, marginBottom: 14,
                filter: i === 2 ? "drop-shadow(0 2px 10px #eb423b33)" : i === 1 ? "drop-shadow(0 2px 10px #fe924542)" : "none"
              }}>{f.icon}</div>
              <div style={{
                fontWeight: 800,
                fontSize: "1.14rem",
                marginBottom: 10,
                color: "#fff",
                letterSpacing: "-0.01em"
              }}>{f.label}</div>
              <div style={{
                fontSize: 15.2,
                color: "#d0dae8",
                opacity: 0.93,
                lineHeight: 1.58
              }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
