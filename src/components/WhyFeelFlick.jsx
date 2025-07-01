// WhyFeelFlick.jsx

// Download your own PNGs and place them in /public/icons, or update these links:
const EMOTION_ICON = "/icons/feelings.png"         // e.g. hand-heart, smiley, etc
const UTILITY_ICON = "/icons/compass.png"          // e.g. compass, magic wand, film slate
const FRIENDLY_ICON = "/icons/friendship.png"      // e.g. coffee cup, chat bubble, friends

const features = [
  {
    img: EMOTION_ICON,
    label: "Emotion-First",
    desc: "Because sometimes you're not in the mood to scroll for 30 minutes.\nFeelFlick learns what you like and how you feel — and gives you the right movie, right away."
  },
  {
    img: UTILITY_ICON,
    label: "Utility-First",
    desc: "Other platforms show you what’s trending.\nFeelFlick shows you what fits. It learns your movie style and listens to your mood — so recommendations actually make sense."
  },
  {
    img: FRIENDLY_ICON,
    label: "Friendly",
    desc: "You know that feeling when you just want the right movie, without overthinking?\nThat’s why we built FeelFlick. It gets smarter every time you watch, and every time you tell us how you’re feeling."
  }
]

// Warm, cozy “creamy” glass background, softly transparent
const COZY_BG = "rgba(253, 246, 233, 0.89)" // Creamy/latte
const BORDER_GRAD = "linear-gradient(100deg,#fe9245,#eb423b,#18406d 90%)"

const FILM_REEL_WATERMARK = encodeURIComponent(`
<svg width="440" height="240" viewBox="0 0 440 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="220" cy="120" rx="200" ry="90" fill="#F6D99822"/>
  <ellipse cx="220" cy="120" rx="146" ry="68" fill="#FEE9B412"/>
  <circle cx="220" cy="120" r="33" fill="#FE924525"/>
  <circle cx="92" cy="120" r="18" fill="#FFD88033"/>
  <circle cx="346" cy="120" r="18" fill="#FFD88033"/>
  <circle cx="220" cy="37" r="13" fill="#fe924524"/>
  <circle cx="220" cy="202" r="13" fill="#fe924524"/>
</svg>
`)

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
        background: "transparent", // background handled by glass below
        zIndex: 2
      }}
    >
      {/* Film Reel Watermark (warm tone, soft blur) */}
      <div style={{
        position: "absolute",
        top: "56%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 0,
        opacity: 0.16,
        background: `url("data:image/svg+xml,${FILM_REEL_WATERMARK}") center/contain no-repeat`,
        width: "72vw", height: "44vw", maxWidth: 440, maxHeight: 240,
        pointerEvents: "none", filter: "blur(1.6px)"
      }} />

      {/* Frosted “cozy” glass card */}
      <div style={{
        width: "100%",
        maxWidth: 1220,
        margin: "0 auto",
        padding: "68px 16px 56px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: 32,
        background: COZY_BG,
        backdropFilter: "blur(5.5px)",
        boxShadow: "0 4px 36px #eb423b17, 0 2px 32px #18406d10",
        border: "1.7px solid #f7d58060",
        position: "relative",
        zIndex: 1
      }}>
        {/* Heading */}
        <h2 style={{
          fontWeight: 900,
          fontSize: "clamp(1.45rem,3.8vw,2.25rem)",
          background: "linear-gradient(90deg,#18406d 20%,#fe9245 70%,#eb423b 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-1.1px",
          marginBottom: 16, marginTop: 0, textAlign: "center", lineHeight: 1.13,
          textShadow: "0 2px 8px #fff5"
        }}>
          Why FeelFlick?
        </h2>
        {/* Subtitle */}
        <div style={{
          color: "#443c2c",
          fontWeight: 500,
          fontSize: "clamp(0.93rem,1.3vw,1.09rem)",
          textAlign: "center",
          marginBottom: 35,
          marginTop: 0,
          lineHeight: 1.7,
          maxWidth: 660,
          opacity: 0.96,
          textShadow: "0 1px 10px #fff3"
        }}>
          FeelFlick is your personal movie companion — powered by mood, memory, and smart AI. It learns your unique taste as you watch, lets you choose how you’re feeling, and recommends films that genuinely match your vibe. No ratings. No pressure. No endless scrolling. Just personal, mood-based suggestions that actually make sense.
        </div>

        {/* Feature Cards */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 38,
          width: "100%",
          justifyContent: "center",
          alignItems: "stretch",
          marginBottom: 8
        }}>
          {features.map((f, i) => (
            <div
              key={f.label}
              tabIndex={0}
              style={{
                flex: "1 1 325px",
                minWidth: 260,
                maxWidth: 360,
                background: "rgba(255,255,255,0.91)",
                borderRadius: 18,
                boxShadow: "0 2px 22px #fe92451c, 0 2px 8px #18406d11",
                padding: "44px 26px 37px 26px",
                color: "#263345",
                textAlign: "center",
                margin: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                border: "2.5px solid transparent",
                outline: "none",
                transition: "transform 0.17s, box-shadow 0.13s, border 0.16s"
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.031)";
                e.currentTarget.style.boxShadow = "0 4px 46px #fe92452d, 0 8px 36px #18406d19";
                e.currentTarget.style.borderImage = `${BORDER_GRAD} 1`;
                e.currentTarget.style.border = "2.5px solid";
                e.currentTarget.style.zIndex = 2;
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 2px 22px #fe92451c, 0 2px 8px #18406d11";
                e.currentTarget.style.borderImage = "";
                e.currentTarget.style.border = "2.5px solid transparent";
                e.currentTarget.style.zIndex = 1;
              }}
              onFocus={e => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.031)";
                e.currentTarget.style.boxShadow = "0 4px 46px #fe92452d, 0 8px 36px #18406d19";
                e.currentTarget.style.borderImage = `${BORDER_GRAD} 1`;
                e.currentTarget.style.border = "2.5px solid";
                e.currentTarget.style.zIndex = 2;
              }}
              onBlur={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 2px 22px #fe92451c, 0 2px 8px #18406d11";
                e.currentTarget.style.borderImage = "";
                e.currentTarget.style.border = "2.5px solid transparent";
                e.currentTarget.style.zIndex = 1;
              }}
            >
              <img
                src={f.img}
                alt={f.label}
                style={{
                  width: 56, height: 56, marginBottom: 18, objectFit: "contain", borderRadius: 15,
                  filter: "drop-shadow(0 3px 16px #fe924527)"
                }}
              />
              <div style={{
                fontWeight: 800,
                fontSize: "1.19rem",
                marginBottom: 10,
                color: "#22282e",
                letterSpacing: "-0.01em"
              }}>{f.label}</div>
              <div style={{
                fontSize: 15.6,
                color: "#736b5d",
                opacity: 0.97,
                lineHeight: 1.55,
                whiteSpace: "pre-line"
              }}>{f.desc}</div>
            </div>
          ))}
        </div>
        {/* Soft transition */}
        <div style={{
          width: "100%",
          height: 42,
          margin: "0 auto -32px auto",
          pointerEvents: "none",
          background: "linear-gradient(to bottom,rgba(255,247,222,0.0) 10%,rgba(254,146,69,0.11) 90%,rgba(255,247,222,0.01) 100%)"
        }} />
      </div>
    </section>
  )
}
