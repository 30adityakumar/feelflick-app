const features = [
  { icon: "🔒", label: "Private & Secure", desc: "Your data is safe. We never sell or share." },
  { icon: "🤖", label: "Smart Recs", desc: "AI-powered picks based on your taste and mood." },
  { icon: "🧘", label: "Mood Matching", desc: "Discover films that match your current mood." },
  { icon: "🎬", label: "Personal Tracker", desc: "Log everything you watch. Forever free." },
  { icon: "🪄", label: "Clean UI", desc: "Minimal, beautiful, distraction-free design." }
];

export default function WhyFeelFlick() {
  return (
    <section
      id="why-feelflick"
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(115deg, #182040 55%, #232a3e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px"
      }}
    >
      <div style={{
        width: "100%",
        maxWidth: 1220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: "clamp(2.0rem, 5vw, 2.7rem)",
          color: "#fff",
          letterSpacing: "-1px",
          textAlign: "center",
          marginBottom: 40,
          textShadow: "0 2px 18px #0008"
        }}>
          Why FeelFlick?
        </div>
        <div style={{
          display: "flex",
          gap: 34,
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "stretch",
          width: "100%"
        }}>
          {features.map((f, i) => (
            <div key={i}
              style={{
                flex: "1 1 200px",
                minWidth: 190,
                maxWidth: 230,
                background: "rgba(26,32,54,0.70)",
                borderRadius: 22,
                boxShadow: "0 3px 32px #10182228, 0 0px 1px #fff0",
                padding: "36px 22px 30px 22px",
                margin: "0 0 12px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(7px)",
                border: "1.2px solid rgba(255,255,255,0.05)",
                transition: "transform 0.16s, box-shadow 0.16s",
                cursor: "default"
              }}
            >
              <div style={{
                fontSize: 38,
                marginBottom: 17,
                background: "rgba(255,255,255,0.12)",
                borderRadius: "50%",
                width: 54,
                height: 54,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px #0003"
              }}>{f.icon}</div>
              <div style={{
                fontWeight: 700,
                fontSize: "1.10rem",
                marginBottom: 9,
                color: "#fdaf41",
                letterSpacing: "-0.01em",
                textShadow: "0 1px 4px #0002"
              }}>{f.label}</div>
              <div style={{
                fontSize: 15,
                color: "#eef",
                opacity: 0.85,
                lineHeight: 1.43,
                textAlign: "center"
              }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
