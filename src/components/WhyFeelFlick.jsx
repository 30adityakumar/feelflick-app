// components/WhyFeelFlick.jsx
import { useEffect } from "react"

// List of card content
const CARDS = [
  {
    emoji: "😩",
    title: "Tired of Scrolling?",
    desc: (
      <>
        Ever opened a streaming app and spent 40 minutes just… scrolling?<br />
        You’re not alone. FeelFlick was made for that exact moment —<br />
        when you just want something that feels right.
      </>
    ),
  },
  {
    emoji: "🧠",
    title: "Forget the Algorithms.",
    desc: (
      <>
        Most platforms show you what’s trending.<br />
        <span style={{ color: "#fe9245", fontWeight: 600 }}>
          FeelFlick shows you what fits</span> — based on your unique movie taste and current mood.
      </>
    ),
  },
  {
    emoji: "🧑‍🎤",
    title: "Because You’re Not Just a Viewer.",
    desc: (
      <>
        You’re a whole human — with moods, patterns, and preferences.<br />
        <span style={{ color: "#18406d", fontWeight: 600 }}>
          FeelFlick learns from your history and listens to how you feel right now.
        </span>
      </>
    ),
  },
  {
    emoji: "🎬",
    title: "Your Movie Companion.",
    desc: (
      <>
        FeelFlick uses mood, memory, and smart AI to recommend something that just clicks.<br />
        No star ratings. No pressure. Just the right film — fast.
      </>
    ),
  },
  {
    emoji: "🌗",
    title: "Movies That Match Your Mood.",
    desc: (
      <>
        Tell us how you’re feeling.<br />
        <span style={{ color: "#eb423b", fontWeight: 600 }}>
          We’ll suggest something that matches the vibe
        </span> — beautifully, privately, and always free.
      </>
    ),
  },
]

// Fade-in effect on mount
useEffectFadeIn()
function useEffectFadeIn() {
  useEffect(() => {
    const cards = document.querySelectorAll(".ff-wff-card")
    cards.forEach((card, i) => {
      card.style.opacity = 0
      card.style.transform = "translateY(26px)"
      setTimeout(() => {
        card.style.transition = "opacity 0.8s cubic-bezier(.8,.15,.2,1.01), transform 0.85s cubic-bezier(.6,.15,.2,1.04)"
        card.style.opacity = 1
        card.style.transform = "translateY(0)"
      }, 250 + i * 160)
    })
  }, [])
}

export default function WhyFeelFlick() {
  return (
    <section
      id="why-feelflick"
      style={{
        width: "100vw",
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 70% 0%, #fffbe6 0%, #fde2b1 34%, #1b253b 120%)",
        padding: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Warm lamp-like glow */}
      <div style={{
        position: "absolute",
        top: 0, left: "44vw",
        width: 320, height: 120,
        background: "radial-gradient(circle, #ffd466 0%, #fdaf41 60%, transparent 100%)",
        filter: "blur(32px)", opacity: 0.33, zIndex: 1,
        pointerEvents: "none"
      }} />
      {/* Film grain overlay (subtle) */}
      <div style={{
        pointerEvents: "none", zIndex: 2,
        position: "absolute", inset: 0,
        background: "url('https://www.transparenttextures.com/patterns/45-degree-fabric-light.png') repeat",
        opacity: 0.10
      }} />
      <div style={{
        width: "100%", maxWidth: 1280,
        margin: "0 auto", padding: "82px 6vw 68px 6vw",
        zIndex: 5, position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center"
      }}>
        {/* Heading */}
        <h2 style={{
          fontWeight: 900,
          fontSize: "clamp(1.7rem,3.9vw,2.35rem)",
          color: "#18406d",
          marginBottom: 44,
          letterSpacing: "-1.3px",
          textAlign: "center",
          textShadow: "0 1px 18px #fff3, 0 1px 12px #fe924514"
        }}>
          Why FeelFlick?
        </h2>
        {/* Cards grid */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 30,
          justifyContent: "center",
          width: "100%",
        }}>
          {CARDS.map((c, i) => (
            <div
              key={i}
              className="ff-wff-card"
              style={{
                flex: "1 1 225px",
                minWidth: 225, maxWidth: 265,
                background: "rgba(255, 245, 221, 0.92)",
                borderRadius: 24,
                boxShadow: "0 6px 28px #1b253b22, 0 1.5px 24px #fdaf4121",
                padding: "36px 20px 30px 20px",
                margin: "0",
                display: "flex", flexDirection: "column", alignItems: "center",
                border: "2px solid transparent",
                transition: "box-shadow 0.18s, border 0.2s, transform 0.18s",
                position: "relative",
                cursor: "pointer",
                // Hover: Soft glow and outline
                ...(i === 1
                  ? { background: "rgba(254,146,69,0.12)" }
                  : i === 4
                    ? { background: "rgba(235,66,59,0.13)" }
                    : {}
                )
              }}
              onMouseOver={e => {
                e.currentTarget.style.border = "2.2px solid #fdaf41"
                e.currentTarget.style.boxShadow = "0 9px 32px #eb423b22, 0 3px 24px #fdaf4129"
                e.currentTarget.style.transform = "scale(1.022)"
              }}
              onMouseOut={e => {
                e.currentTarget.style.border = "2px solid transparent"
                e.currentTarget.style.boxShadow = "0 6px 28px #1b253b22, 0 1.5px 24px #fdaf4121"
                e.currentTarget.style.transform = "scale(1)"
              }}
            >
              <div style={{
                fontSize: 38, marginBottom: 10,
                filter: "drop-shadow(0 2px 8px #fdaf4121)"
              }}>{c.emoji}</div>
              <div style={{
                fontWeight: 800,
                fontSize: "1.19rem",
                marginBottom: 8,
                color: "#18406d",
                letterSpacing: "-.5px"
              }}>{c.title}</div>
              <div style={{
                fontWeight: 400, fontSize: 15.5,
                color: "#412b1d", opacity: 0.93,
                lineHeight: 1.52,
                textAlign: "center"
              }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
