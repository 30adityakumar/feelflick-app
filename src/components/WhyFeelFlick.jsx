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
  borderRadius: '24px',
  padding: '1.5rem',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '1400px',
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'stretch',
  gap: '2rem',
  flexWrap: 'nowrap',
  width: '100%',
};

const baseCardStyle = {
  flex: '0 1 29%',
  minWidth: '260px',
  height: '73vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '2rem 1.5rem',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(var(--theme-color-rgb),0.2)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease, outline 0.2s',
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
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 12px 24px rgba(var(--theme-color-rgb),0.2);
          outline: 3px solid var(--theme-color);
          outline-offset: 2px;
          z-index: 2;
        }
        @media (max-width: 1020px) {
          .fflick-box { flex-direction: column; }
          .fflick-card { width: 90vw; height: auto; margin-bottom: 2rem; }
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
                    fontSize: '1.9rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    background: 'linear-gradient(90deg, var(--theme-color), var(--theme-color-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: '1.6',
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