import React from 'react';

const cards = [
  {
    title: 'Mood-Driven, Personalized Picks',
    description:
      "Get movie recommendations that actually get you. FeelFlick doesn’t just suggest what’s popular — it suggests what fits you. Based on your movie taste and how you’re feeling right now, it serves up titles that match your vibe. The more you use it, the better it gets at recommending films that feel just right.",
  },
  {
    title: 'Fast, Simple & Private',
    description:
      "Say goodbye to endless scrolling and overthinking. FeelFlick is designed to be fast and clutter-free. No ratings rabbit holes, no complex filters — just a clean interface that gives you one simple thing: the right movie, right now. And it’s fully private — your watch history and moods stay yours. Ever.",
  },
  {
    title: 'Track Your Journey — Always Free',
    description:
      "Keep your movie life organized and meaningful. FeelFlick lets you log every movie you’ve watched, how it made you feel, and what you want to see next. Build lists, revisit favorites, and reflect on how your taste evolves. All for free, no paywalls.",
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
};

const boxStyle = {
  background: 'rgba(var(--theme-color-rgb), 0.15)',
  borderRadius: '20px',
  padding: '1rem',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '1200px',
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'stretch',
  gap: '1.2rem',
  flexWrap: 'nowrap',
  width: '100%',
};

const baseCardStyle = {
  flex: '0 1 29%',
  minWidth: '210px',
  maxWidth: '325px',
  height: '59vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '1.4rem 1rem',
  borderRadius: '16px',
  background: 'rgba(34,34,34,0.14)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(var(--theme-color-rgb),0.18)',
  boxShadow: '0 1.5px 6px 0 rgba(40,24,14,0.11)',
  transition: 'transform 0.28s cubic-bezier(.3,.7,.4,1.3), box-shadow 0.26s, outline 0.22s, filter 0.22s',
  position: 'relative',
  cursor: 'default',
};

export default function WhyFeelFlick() {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fflick-box { animation: fadeInUp 0.7s ease both; }
        .fflick-card:hover {
          transform: translateY(-7px) scale(1.03);
          box-shadow: 0 3px 24px 0 rgba(255,96,16,0.17);
          outline: 2.5px solid var(--theme-color, #ff700a);
          outline-offset: 2.5px;
          z-index: 2;
        }
        @media (max-width: 1020px) {
          .fflick-box { flex-direction: column; }
          .fflick-card { width: 90vw; max-width: 99vw; height: auto; margin-bottom: 2rem; }
        }
      `}</style>

      <div style={wrapperStyle}>
        <div className="fflick-box" style={boxStyle}>
          <div style={rowStyle}>
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="fflick-card"
                style={{
                  ...baseCardStyle,
                  animation: `fadeInUp 0.6s ease ${(idx * 0.1).toFixed(1)}s both`,
                }}
                tabIndex={0}
              >
                <h3
                  style={{
                    margin: '0 0 1rem',
                    fontSize: '1.28rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    background: 'linear-gradient(88deg, var(--theme-color,#FF5B2E), var(--theme-color-secondary,#367cff) 80%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 1.5px 4px rgba(0,0,0,0.11)',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.94rem',
                    color: 'rgba(255,255,255,0.81)',
                    lineHeight: '1.55',
                    fontWeight: 400,
                    letterSpacing: '0.01em',
                  }}
                >
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
