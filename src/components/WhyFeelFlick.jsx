// WhyFeelFlick.jsx

// Film reel SVG watermark (low opacity, not distracting)
const FILM_REEL_WATERMARK = encodeURIComponent(`
<svg width="380" height="220" viewBox="0 0 380 220" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="190" cy="110" rx="170" ry="90" fill="#18406d0a"/>
  <ellipse cx="190" cy="110" rx="138" ry="65" fill="#fe924514"/>
  <circle cx="190" cy="110" r="34" fill="#eb423b17"/>
  <circle cx="75" cy="110" r="15" fill="#18406d22"/>
  <circle cx="305" cy="110" r="15" fill="#18406d22"/>
  <circle cx="190" cy="35" r="12" fill="#fe924522"/>
  <circle cx="190" cy="185" r="12" fill="#fe924522"/>
</svg>
`)

const features = [
  {
    icon: "🤖",
    label: "Smart AI Recs",
    desc: "AI-powered movie suggestions for your unique taste. It learns as you watch!"
  },
  {
    icon: "🧘‍♂️",
    label: "Mood Matching",
    desc: "Pick your mood and instantly get films that truly fit how you feel, right now."
  },
  {
    icon: "🎬",
    label: "Personal Tracker",
    desc: "Log every movie you watch and how it made you feel—forever, for free."
  }
]

const CARD_BG_GRAD = "linear-gradient(115deg,rgba(250,251,255,0.89) 70%,rgba(254,146,69,0.13) 100%)"
const SECTION_BG = "rgba(250,251,255,0.83)" // frosted near-white
const BORDER = "1.5px solid #e8eaf3"

export default function WhyFeelFlick() {
  return (
    <section
      id="why-feelflick"
      style={{
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: "0",
        // Section transitions
        boxShadow: "0 0 36px 0 #18406d13, 0 -1px 48px #eb423b14",
        zIndex: 2
      }}
    >
      {/* Subtle FILM REEL watermark (centered, behind everything) */}
      <div style={{
        position: "absolute",
        top: "52%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.21,
        background: `url("data:image/svg+xml,${FILM_REEL_WATERMARK}") center/contain no-repeat`,
        width: "66vw",
        height: "44vw",
        maxWidth: 420,
        maxHeight: 240,
        filter: "blur(0.6px)"
      }} />
      {/* Frosted white glass background */}
      <div style={{
        width: "100%",
        maxWidth: 1220,
        margin: "0 auto",
        padding: "72px 16px 54px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: 26,
        background: SECTION_BG,
        backdropFilter: "blur(4.5px)",
        boxShadow: "0 4px 32px #18406d15",
        position: "relative",
        zIndex: 1,
        border: "1.5px solid #dde4f9"
      }}>
        {/* Main Heading */}
        <h2 style={{
          fontWeight: 900,
          fontSize: "clamp(1.5rem,4vw,2.3rem)",
          background: "linear-gradient(90deg,#18406d 20%,#fe9245 70%,#eb423b 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-1.1px",
          marginBottom: 18,
          marginTop: 0,
          textAlign: "center",
          lineHeight: 1.12,
          textShadow: "0 1.5px 10px #fff5"
        }}>
          Why FeelFlick?
        </h2>
        {/* Subtitle */}
        <div style={{
          color: "#2d3757",
          fontWeight: 500,
          fontSize: "clamp(0.93rem,1.6vw,1.05rem)",
          textAlign: "center",
          marginBottom: 35,
          marginTop: 0,
          lineHeight: 1.7,
          maxWidth: 640,
          opacity: 0.92,
          textShadow: "0 1px 10px #fff"
        }}>
          FeelFlick understands your unique movie taste and your current mood, combining both to recommend films that truly fit how you feel — every time.<br />
          It’s simple, private, and free. No algorithms pushing what’s popular. Just personalized, mood-matched movie picks made for you.
        </div>
        {/* Feature Cards */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 34,
          width: "100%",
          justifyContent: "center",
          alignItems: "stretch"
        }}>
          {features.map((f, i) => (
            <div
              key={f.label}
              tabIndex={0}
              style={{
                flex: "1 1 310px",
                minWidth: 240,
                maxWidth: 340,
                background: CARD_BG_GRAD,
                border: BORDER,
                borderRadius: 19,
                boxShadow: "0 2px 18px #18406d13, 0 4px 38px #eb423b11",
                padding: "38px 24px 32px 24px",
                color: "#263345",
                textAlign: "center",
                margin: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                transition: "transform 0.19s, box-shadow 0.18s",
                outline: "none",
                cursor: "pointer"
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.034)";
                e.currentTarget.style.boxShadow = "0 4px 44px #18406d23, 0 10px 38px #eb423b18";
                e.currentTarget.style.zIndex = 3;
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 2px 18px #18406d13, 0 4px 38px #eb423b11";
                e.currentTarget.style.zIndex = 1;
              }}
              onFocus={e => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.034)";
                e.currentTarget.style.boxShadow = "0 4px 44px #18406d23, 0 10px 38px #eb423b18";
                e.currentTarget.style.zIndex = 3;
              }}
              onBlur={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 2px 18px #18406d13, 0 4px 38px #eb423b11";
                e.currentTarget.style.zIndex = 1;
              }}
            >
              <div style={{
                fontSize: 42,
                marginBottom: 16,
                filter: i === 1
                  ? "drop-shadow(0 2px 12px #eb423b19)"
                  : (i === 0 ? "drop-shadow(0 2px 10px #fe92451a)" : "none")
              }}>{f.icon}</div>
              <div style={{
                fontWeight: 800,
                fontSize: "1.22rem",
                marginBottom: 10,
                color: "#263345",
                letterSpacing: "-0.01em"
              }}>{f.label}</div>
              <div style={{
                fontSize: 15.3,
                color: "#57607c",
                opacity: 0.98,
                lineHeight: 1.58
              }}>{f.desc}</div>
            </div>
          ))}
        </div>
        {/* Section transitions: soft gradient shadow at bottom */}
        <div style={{
          width: "100%",
          height: 42,
          margin: "0 auto -42px auto",
          pointerEvents: "none",
          background: "linear-gradient(to bottom,rgba(250,251,255,0.0) 10%,rgba(24,64,109,0.12) 80%,rgba(250,251,255,0.01) 100%)"
        }} />
      </div>
    </section>
  )
}
