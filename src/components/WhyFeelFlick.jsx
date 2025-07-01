// WhyFeelFlick.jsx
const features = [
  { icon: "🔒", label: "Private & Secure", desc: "Your data is always yours—never sold or shared." },
  { icon: "🤖", label: "Smart AI Recs", desc: "AI-powered movie suggestions for your unique taste and mood." },
  { icon: "🧘‍♂️", label: "Mood Matching", desc: "Pick your mood, get the right film. It’s that simple." },
  { icon: "🎬", label: "Personal Tracker", desc: "Effortlessly log every movie you watch, forever." },
  { icon: "🪄", label: "Clean & Minimal UI", desc: "No distractions. Just you, your movies, and pure discovery." }
];

const ACCENT_GRADIENT = "linear-gradient(120deg, #18406d 55%, #fe9245 100%)";

export default function WhyFeelFlick() {
  return (
    <section
      id="why-feelflick"
      style={{
        width: "100vw",
        background: "#f9fafb",
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div style={{
        maxWidth: 1240,
        margin: "0 auto",
        width: "100%",
        padding: "72px 20px 62px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {/* Title */}
        <h2 style={{
          fontWeight: 900,
          fontSize: "clamp(2.0rem,4vw,2.9rem)",
          background: ACCENT_GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-1.5px",
          marginBottom: 42,
          textAlign: "center",
          lineHeight: 1.11,
        }}>
          Why FeelFlick?
        </h2>

        {/* Feature Cards */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "34px",
          width: "100%",
          justifyContent: "center"
        }}>
          {features.map((f, i) => (
            <div
              key={f.label}
              style={{
                flex: "1 1 210px",
                minWidth: 200,
                maxWidth: 245,
                background: "#fff",
                borderRadius: 19,
                boxShadow: "0 4px 24px #18406d12, 0 1.5px 8px #fe924519",
                padding: "38px 19px 32px 19px",
                color: "#222",
                textAlign: "center",
                position: "relative",
                transition: "box-shadow 0.17s",
                cursor: "pointer",
                border: `2.5px solid ${i === 1 ? "#fe9245" : i === 2 ? "#eb423b" : "#18406d18"}`,
                backgroundImage: i === 1 ? "linear-gradient(90deg,#fff,#fe924510 60%)"
                  : i === 2 ? "linear-gradient(90deg,#fff,#eb423b0a 60%)"
                  : "linear-gradient(90deg,#fff,#18406d06 60%)"
              }}
            >
              <div style={{
                fontSize: 38,
                marginBottom: 16,
                filter: i === 1 ? "drop-shadow(0 2px 8px #fe9245bb)" : i === 2 ? "drop-shadow(0 2px 8px #eb423bbb)" : "none"
              }}>{f.icon}</div>
              <div style={{
                fontWeight: 700,
                fontSize: "1.21rem",
                marginBottom: 10,
                color: "#161827",
                letterSpacing: "-0.01em"
              }}>{f.label}</div>
              <div style={{
                fontSize: 15,
                color: "#636980",
                opacity: 0.95,
                lineHeight: 1.55
              }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
