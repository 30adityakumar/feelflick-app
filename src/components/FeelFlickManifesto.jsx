// components/FeelFlickManifesto.jsx

import { useEffect } from "react"

// Optionally, animate fade-in
function fadeInBlocks() {
  if (typeof window === "undefined") return
  const blocks = document.querySelectorAll(".ff-manifesto-block")
  blocks.forEach((block, idx) => {
    block.style.opacity = 0
    setTimeout(() => {
      block.style.transition = "opacity 0.7s cubic-bezier(.77,.01,.3,1.01)"
      block.style.opacity = 1
    }, 400 + idx * 350)
  })
}
export default function FeelFlickManifesto() {
  useEffect(() => { fadeInBlocks() }, [])

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
        padding: 0,
        background: "radial-gradient(ellipse at 60% 0%, #ffedc2 0%, #23202a 80%)",
        zIndex: 2
      }}
    >
      {/* Soft Film Glow Overlay */}
      <div style={{
        position: "absolute",
        top: "-30%", left: "50%",
        transform: "translate(-50%,0)",
        width: "110vw", height: 300,
        background: "radial-gradient(circle, #ffe4a6 0%, #ffdea3aa 22%, transparent 77%)",
        opacity: 0.44, pointerEvents: "none", zIndex: 1,
        filter: "blur(6px)"
      }} />
      {/* Subtle film grain overlay */}
      <div style={{
        pointerEvents: "none", zIndex: 2,
        position: "absolute", inset: 0,
        background: "url('https://www.transparenttextures.com/patterns/45-degree-fabric-light.png') repeat",
        opacity: 0.18
      }} />
      {/* Manifesto Card */}
      <div style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "70px 26px 65px 26px",
        borderRadius: 30,
        background: "rgba(33, 27, 19, 0.76)", // soft, warm glassy dark
        backdropFilter: "blur(8px) saturate(1.04)",
        boxShadow: "0 8px 42px #eb423b11, 0 1px 80px #fe924517",
        border: "2px solid #ffe4a642",
        position: "relative",
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <div style={{
          fontWeight: 900,
          fontSize: "clamp(1.55rem,4vw,2.2rem)",
          textAlign: "center",
          letterSpacing: "-1.3px",
          color: "#ffe49b",
          textShadow: "0 4px 30px #eb423b24, 0 1px 13px #18406d44"
        }}>
          Why FeelFlick?
        </div>
        {/* Manifesto body: each line a block */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 24,
          fontSize: "clamp(1.04rem,2vw,1.23rem)",
          color: "#fff9e9", fontWeight: 500,
          lineHeight: 1.72, textAlign: "center",
          maxWidth: 620, margin: "38px auto 0 auto"
        }}>
          <div className="ff-manifesto-block" style={{ fontWeight: 800, color: "#ffdfa0", fontSize: "1.1em" }}>
            Ever opened a streaming app and spent 40 minutes just... scrolling?
          </div>
          <div className="ff-manifesto-block" style={{ color: "#f5c078" }}>
            You’re tired. You want to feel something. But nothing feels right.<br />
            <span style={{ color: "#eb423b", fontWeight: 700 }}>That’s the moment FeelFlick was built for.</span>
          </div>
          <div className="ff-manifesto-block">
            We don’t just show you what’s <span style={{ color: "#fdaf41" }}>trending</span>.<br />
            We show you what <span style={{ color: "#f7be70" }}>fits</span> — your mood, your taste, your moment.
          </div>
          <div className="ff-manifesto-block">
            Because you're not just a viewer.<br />
            You're a whole human with emotions, patterns, and preferences.<br />
            <span style={{ color: "#fdaf41" }}>And we believe your next movie should get that.</span>
          </div>
          <div className="ff-manifesto-block" style={{ color: "#fff7e1" }}>
            FeelFlick is your personal movie companion — powered by <span style={{ color: "#eb423b" }}>memory</span>, <span style={{ color: "#fdaf41" }}>mood</span>, and smart AI.<br />
            It learns what you’ve loved before. You tell it how you’re feeling now.<br />
            And in seconds, it suggests something that just clicks.
          </div>
          <div className="ff-manifesto-block" style={{
            fontWeight: 700, color: "#ffe3af",
            background: "rgba(50,42,22,0.45)",
            padding: "14px 24px", borderRadius: 15, marginTop: 12,
            fontSize: "1.07em", boxShadow: "0 1px 12px #fe924522"
          }}>
            No star ratings. No overload. No second-guessing.<br />
            <span style={{ color: "#eb423b" }}>Just films that match your vibe</span> — beautifully, privately, and always free.
          </div>
        </div>
      </div>
      {/* Down arrow scroll cue */}
      <div style={{
        position: "absolute", left: "50%", bottom: 36, transform: "translateX(-50%)", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center"
      }}>
        <span style={{
          fontSize: 32, color: "#fe9245", opacity: 0.6
        }}>▼</span>
        <span style={{
          fontSize: 12, color: "#fff6dd", opacity: 0.48
        }}>Scroll for more</span>
      </div>
    </section>
  )
}
