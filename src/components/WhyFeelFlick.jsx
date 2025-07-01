import React from 'react';

const cards = [
  {
    title: 'Mood-Driven, Personalized Picks',
    description:
      "Get movie recommendations that actually get you. FeelFlick doesn’t just suggest what’s popular — it suggests what fits you. Based on your movie taste and how you’re feeling right now, it serves up titles that match your vibe. The more you use it, the better it gets at recommending films that feel just right — whether you’re in the mood for a tearjerker, a comfort comedy, or something totally unexpected.",
  },
  {
    title: 'Fast, Simple & Private',
    description:
      "Say goodbye to endless scrolling and overthinking. FeelFlick is designed to be fast and clutter-free. No ratings rabbit holes, no complex filters — just a clean, intuitive interface that gives you one simple thing: the right movie, right now. And it’s fully private — your watch history and moods stay yours. We don’t track, sell, or share your data. Ever.",
  },
  {
    title: 'Track Your Journey — Always Free',
    description:
      "Keep your movie life organized and meaningful. FeelFlick lets you log every movie you’ve watched, how it made you feel, and what you want to see next. Build your own lists, revisit past favorites, and reflect on how your film taste evolves. All of this is completely free — no subscriptions, no paywalls, just pure movie joy at your fingertips.",
  },
];

const wrapperStyle = {
  width: '100vw',
  height: '100vh',
  background: 'linear-gradient(120deg, rgba(20,16,12,0.9), rgba(40,32,24,0.93) 80%)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '13vh 4vw 5vh',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'stretch',
  gap: '2.5rem',
  flexWrap: 'nowrap',
  width: '100%',
  maxWidth: '1400px',
};

const baseCardStyle = {
  background: 'rgba(var(--theme-color-rgb), 0.30)', // Radish, but with more pop
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '20px',
  boxShadow: '0 10px 36px 0 rgba(20,16,12,0.20), 0 1.5px 12px 0 rgba(var(--theme-color-rgb), 0.10)',
  padding: '2.5rem 2rem 2rem',
  flex: '0 1 29%',
  minWidth: '270px',
  height: '73vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  transition: 'transform 0.33s cubic-bezier(.3,.7,.4,1.5), box-shadow 0.33s, outline 0.28s',
  cursor: 'default',
  position: 'relative',
  border: '1.5px solid rgba(var(--theme-color-rgb),0.22)',
  outline: 'none',
};

export default function WhyFeelFlick() {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .fflick-card {
          animation: fadeInUp 0.7s cubic-bezier(.2,.7,.4,1.1) both;
        }
        .fflick-card:hover, .fflick-card:focus {
          transform: translateY(-14px) scale(1.04);
          box-shadow: 0 8px 36px 0 rgba(var(--theme-color-rgb), 0.13), 0 0 0 3px var(--theme-color), 0 0 0 8px var(--theme-color-secondary, #54aaff33);
          outline: 2px solid var(--theme-color);
          outline-offset: 0.5px;
          z-index: 2;
        }
        @media (max-width: 1020px) {
          .fflick-row { flex-direction: column; gap: 2.5rem; align-items: center;}
          .fflick-card { height: auto; min-height: 300px; width: 95vw; max-width: 500px;}
        }
      `}</style>
      <div style={wrapperStyle}>
        <div className="fflick-row" style={rowStyle}>
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="fflick-card"
              tabIndex={0}
              style={{
                ...baseCardStyle,
                animationDelay: `${0.12 * idx}s`,
              }}
            >
              <h3
                style={{
                  margin: '0 0 1.4rem',
                  fontSize: '2.45rem',
                  fontWeight: 800,
                  lineHeight: 1.18,
                  color: 'var(--theme-color)',
                  letterSpacing: '-1px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.18)',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'rgba(255,255,255,0.93)',
                  fontSize: '1.19rem',
                  lineHeight: '1.75',
                  fontWeight: 400,
                  textShadow: '0 2px 6px rgba(0,0,0,0.12)',
                }}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
