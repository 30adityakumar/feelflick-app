// WhyFeelFlick.jsx
const features = [
  {
    icon: "🤖",
    label: "Smart AI Recs",
    desc: "AI-powered movie suggestions for your unique taste. It learns as you watch!",
  },
  {
    icon: "🧘‍♂️",
    label: "Mood Matching",
    desc: "Pick your mood and instantly get films that truly fit how you feel, right now.",
  },
  {
    icon: "🎬",
    label: "Personal Tracker",
    desc: "Log every movie you watch and how it made you feel—forever, for free.",
  },
]

const ACCENT_GRAD = "linear-gradient(95deg,#fe9245 25%,#18406d 90%)"
const CARD_BG_GRAD = "linear-gradient(117deg,rgba(32,38,57,0.92) 80%,rgba(254,146,69,0.11) 100%)"

export default function WhyFeelFlick() {
  return (
    <section
      id="why-feelflick"
      style={{
        width: "100vw",
        background: "rgba(23,25,38,0.93)",
        backdropFilter: "blur(0.7px)",
        boxShadow: "0 8px 24px #1a1a2c18",
        padding: "0",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}
    >
      <div style={{
        maxWidth: 1180,
        width: "100%",
        margin: "0 auto",
        padding: "62px 14px 40px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {/* Main Heading */}
        <h2 style={{
          fontWeight: 900,
          fontSize: "clamp(1.7rem,4vw,2.6rem)",
          background: ACCENT_GRAD,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-1.2px",
          marginBottom: 22,
          marginTop: 0,
          textAlign: "center",
          lineHeight: 1.12,
        }}>
          Why FeelFlick?
        </h2>
        {/* Subtitle / Selling Copy */}
        <div style={{
          color: "#e7e9ef",
          fontWeight: 500,
          fontSize: "1.13rem",
          textAlign: "center",
          marginBottom: 45,
          lineHeight: 1.75,
          maxWidth: 670,
          opacity: 0.91,
          textShadow: "0 1px 10px #0008"
        }}>
          FeelFlick understands your unique movie taste and your current mood, combining both to recommend films that truly fit how you feel — every time.<br />
          It’s simple, private, and free. No algorithms pushing what’s popular. Just personalized, mood-matched movie picks made for you.
        </div>
        {/* Feature Cards */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          width: "100%",
          justifyContent: "center",
          alignItems: "stretch",
        }}>
          {features.map((f, i) => (
            <div key={f.label} style={{
              flex: "1 1 300px",
              minWidth: 270,
              maxWidth: 390,
              background: CARD_BG_GRAD,
              borderRadius: 22,
              boxShadow: "0 3px 28px #0007",
              padding: "38px 28px 34px 28px",
              color: "#fff",
              textAlign: "center",
              margin: "0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: i === 1
                ? "2.7px solid #eb423b"
                : (i === 0 ? "2.5px solid #fe9245" : "2.2px solid #283047"),
              backgroundImage: i === 1
                ? "linear-gradient(120deg,#292129 35%,#eb423b29 100%)"
                : i === 0
                  ? "linear-gradient(120deg,#232330 60%,#fe924521 100%)"
                  : CARD_BG_GRAD,
              transition: "transform 0.16s, box-shadow 0.18s",
              cursor: "pointer"
            }}>
              <div style={{
                fontSize: 44,
                marginBottom: 16,
                filter: i === 1
                  ? "drop-shadow(0 2px 10px #eb423b22)"
                  : i === 0
                    ? "drop-shadow(0 2px 9px #fe924532)"
                    : "none"
              }}>{f.icon}</div>
              <div style={{
                fontWeight: 800,
                fontSize: "1.3rem",
                marginBottom: 12,
                color: "#fff",
                letterSpacing: "-0.01em"
              }}>{f.label}</div>
              <div style={{
                fontSize: 16,
                color: "#dde3ef",
                opacity: 0.95,
                lineHeight: 1.58
              }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
