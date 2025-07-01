// components/FeelFlickManifesto.jsx

// Warm semi-transparent "glass" background color:
const COZY_BG = "rgba(252, 245, 227, 0.89)" // creamy, warm white

const FILM_REEL_WATERMARK = encodeURIComponent(`
<svg width="600" height="300" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="300" cy="150" rx="240" ry="96" fill="#F6D99822"/>
  <ellipse cx="300" cy="150" rx="120" ry="56" fill="#FEE9B418"/>
  <circle cx="300" cy="150" r="32" fill="#FE924525"/>
  <circle cx="90" cy="150" r="14" fill="#FFD88033"/>
  <circle cx="510" cy="150" r="14" fill="#FFD88033"/>
  <circle cx="300" cy="54" r="10" fill="#fe924522"/>
  <circle cx="300" cy="246" r="10" fill="#fe924522"/>
</svg>
`);

export default function FeelFlickManifesto() {
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
        background: "transparent",
        zIndex: 2,
        padding: "0"
      }}
    >
      {/* Film Reel Watermark (background) */}
      <div style={{
        position: "absolute",
        top: "52%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 0,
        opacity: 0.11,
        background: `url("data:image/svg+xml,${FILM_REEL_WATERMARK}") center/contain no-repeat`,
        width: "88vw", height: "54vw", maxWidth: 650, maxHeight: 300,
        pointerEvents: "none", filter: "blur(1.7px)"
      }} />

      {/* Main Card */}
      <div style={{
        width: "100%",
        maxWidth: 760,
        margin: "0 auto",
        padding: "68px 28px 72px 28px",
        borderRadius: 32,
        background: COZY_BG,
        backdropFilter: "blur(6.5px)",
        boxShadow: "0 4px 38px #eb423b17, 0 2px 36px #18406d13",
        border: "1.6px solid #f7d5804c",
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {/* Title (gently gradient) */}
        <div style={{
          fontWeight: 900,
          fontSize: "clamp(1.55rem,4vw,2.6rem)",
          textAlign: "center",
          letterSpacing: "-1.2px",
          background: "linear-gradient(90deg,#18406d 10%,#fe9245 80%,#eb423b 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 26,
          lineHeight: 1.12,
          textShadow: "0 1px 10px #fff3"
        }}>
          Why FeelFlick?
        </div>
        {/* Manifesto body */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 22,
          fontSize: "clamp(1.1rem,1.85vw,1.22rem)", color: "#302520",
          fontWeight: 500, lineHeight: 1.65, textAlign: "center",
          maxWidth: 680
        }}>
          <span style={{opacity:0.98, fontWeight:700, fontSize:"1.13em"}}>
            Ever opened a streaming app and spent 40 minutes just... scrolling?
          </span>
          <span style={{opacity:0.97}}>
            You’re tired. You want to feel something. But nothing feels right.
            <br />
            <span style={{color: "#eb423b", fontWeight:600}}>That’s the moment FeelFlick was built for.</span>
          </span>
          <span>
            We don’t just show you what’s <span style={{color:"#fe9245", fontWeight:600}}>trending</span>.
            <br />
            We show you what <span style={{color:"#18406d", fontWeight:600}}>fits</span> — your mood, your taste, your moment.
          </span>
          <span style={{opacity: 0.94}}>
            Because you're not just a viewer.<br />
            You're a whole human with emotions, patterns, and preferences.<br />
            <span style={{color:"#fe9245", fontWeight:600}}>And we believe your next movie should get that.</span>
          </span>
          <span>
            FeelFlick is your personal movie companion — powered by <span style={{color:"#eb423b", fontWeight:600}}>memory</span>, <span style={{color:"#fe9245", fontWeight:600}}>mood</span>, and smart AI.
            <br />
            It learns what you’ve loved before. You tell it how you’re feeling now.
            <br />
            And in seconds, it suggests something that just clicks.
          </span>
          <span style={{
            fontWeight: 600,
            color: "#18406d",
            opacity: 0.96,
            background: "linear-gradient(94deg,#ffe2b1 40%, #fff8e2 100%)",
            padding: "9px 20px",
            borderRadius: 15,
            margin: "18px 0 0 0",
            boxShadow: "0 1.5px 16px #fe92451a",
            display: "inline-block"
          }}>
            No star ratings. No overload. No second-guessing.<br />
            <span style={{color:"#eb423b"}}>Just films that match your vibe</span> — beautifully, privately, and always free.
          </span>
        </div>
        {/* Down arrow scroll cue */}
        <div style={{
          margin: "48px 0 0 0", display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          <span style={{
            fontSize: 26, color: "#eb423b", opacity: 0.66, marginBottom: 2
          }}>▼</span>
          <span style={{
            fontSize: 13, color: "#776e5f", opacity: 0.56
          }}>Scroll for more</span>
        </div>
      </div>
    </section>
  )
}
