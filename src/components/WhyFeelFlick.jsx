// WhyFeelFlick.jsx
const features = [
  { icon: "🔒", label: "Private & Secure", desc: "Your data is safe. We never sell or share." },
  { icon: "🤖", label: "Smart Recs", desc: "AI-powered picks based on your taste and mood." },
  { icon: "🧘", label: "Mood Matching", desc: "Discover films that match your current mood." },
  { icon: "🎬", label: "Personal Tracker", desc: "Log everything you watch. Forever free." },
  { icon: "🪄", label: "Clean UI", desc: "Minimal, beautiful, distraction-free design." }
]
export default function WhyFeelFlick() {
  return (
    <section style={{
      width: "100vw", background: "rgba(23,25,38,0.98)", padding: "50px 0 30px 0"
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 22px"
      }}>
        <div style={{
          fontWeight: 800, fontSize: "2.0rem", color: "#fe9245",
          letterSpacing: "-1px", textAlign: "center", marginBottom: 30
        }}>Why FeelFlick?</div>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between"
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              flex: "1 1 180px", minWidth: 175, maxWidth: 220,
              background: i === 1 ? "#fe9245" : (i === 2 ? "#eb423b" : "#18406d"),
              borderRadius: 16,
              boxShadow: "0 2px 16px #0003",
              padding: "22px 16px 19px 16px",
              color: "#fff",
              textAlign: "center",
              margin: 0,
              display: "flex", flexDirection: "column", alignItems: "center"
            }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>{f.icon}</div>
              <div style={{
                fontWeight: 700, fontSize: "1.09rem", marginBottom: 8,
                color: "#fff", letterSpacing: "-0.02em"
              }}>{f.label}</div>
              <div style={{
                fontSize: 14, color: "#eef", opacity: 0.91, lineHeight: 1.38
              }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
