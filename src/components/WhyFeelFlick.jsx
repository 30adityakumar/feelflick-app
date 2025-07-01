import React from 'react';

const cards = [
  {
    title: 'Mood-Driven, Personalized Picks',
    description:
      "Get movie recommendations that actually feel right. FeelFlick learns your movie taste and listens to your current mood. No generic suggestions — just titles that match your vibe. The more you watch and share how you feel, the smarter and more personal your recommendations become.",
  },
  {
    title: 'Fast, Simple, and Private',
    description:
      "Tired of scrolling for something to watch? FeelFlick delivers quick, clutter-free suggestions based on how you feel and what you love. No ratings, no filters, no noise — just the right movie when you need it. Your data stays private, always secure and never shared.",
  },
  {
    title: 'Track What You Love',
    description:
      "Keep a personal log of every movie you’ve seen — and how it made you feel. Build watchlists, revisit past favorites, and reflect on your evolving taste. FeelFlick helps you stay organized, sentimental, and inspired — all in one place. Always free, with no paywalls or limits.",
  },
];

// Background matches trending section (dark, semi-transparent)
const wrapperStyle = {
  width: '100vw',
  minHeight: 'unset',
  background: 'rgba(10,10,10,0.73)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4vw',
  boxSizing: 'border-box',
};

// Remove excessive top/bottom padding from block
const boxStyle = {
  background: 'rgba(30, 20, 16, 0.44)',
  borderRadius: '28px',
  padding: '1.8rem 2rem 1.5rem 2rem',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '1450px',
  boxShadow: '0 8px 48px 0 rgba(0,0,0,0.13)',
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'stretch',
  gap: '2.4rem',
  flexWrap: 'nowrap',
  width: '100%',
};

const baseCardStyle = {
  flex: '0 1 31%',
  minWidth: '285px',
  maxWidth: '420px',
  minHeight: '360px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '1.5rem 1.3rem 1.2rem',
  borderRadius: '22px',
  // Gradient is dark, but includes a theme-colored glow at one edge
  background: 'linear-gradient(110deg, rgba(18,18,22,0.98) 80%, var(--theme-color,#ff5b2e) 110%)',
  border: '1.5px solid rgba(255,91,46,0.13)',
  boxShadow: '0 1.5px 7px 0 rgba(40,24,14,0.12)',
  position: 'relative',
  cursor: 'default',
  transition: 'none', // No hover effect
};

export default function WhyFeelFlick() {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(34px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fflick-box { animation: fadeInUp 0.7s ease both; }
        /* Removed all hover effect styles for .fflick-card */
        @media (max-width: 1020px) {
          .fflick-box { flex-direction: column; }
          .fflick-card { width: 92vw; max-width: 99vw; min-height: 230px; margin-bottom: 2rem; }
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
                  animation: `fadeInUp 0.7s cubic-bezier(.25,.7,.3,1.1) ${(idx * 0.14).toFixed(2)}s both`,
                }}
                tabIndex={0}
              >
                <h3
                  style={{
                    margin: '0 0 1.1rem',
                    fontSize: '1.55rem',
                    fontWeight: 950,
                    lineHeight: 1.18,
                    background: 'linear-gradient(90deg, var(--theme-color,#FF5B2E) 30%, var(--theme-color-secondary,#367cff) 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 7px rgba(0,0,0,0.13)',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '1.01rem',
                    color: 'rgba(255,255,255,0.88)',
                    lineHeight: '1.66',
                    fontWeight: 200,
                    letterSpacing: '0.012em',
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
