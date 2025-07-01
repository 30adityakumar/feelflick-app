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

const wrapperStyle = {
  width: '100vw',
  minHeight: '100vh',
  background: 'rgba(10,10,10,0.73)', // match TrendingNow
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 0vw', // remove vertical padding
  boxSizing: 'border-box',
};

const boxStyle = {
  background: 'rgba(10,10,10,0.73)', // match TrendingNow
  borderRadius: '28px',
  padding: '0.7rem 2rem', // less vertical padding
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '1450px',
  boxShadow: '0 8px 48px 0 rgba(0,0,0,0.12)',
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'stretch',
  gap: '2.7rem',
  flexWrap: 'nowrap',
  width: '100%',
};

const baseCardStyle = {
  flex: '0 1 31%',
  minWidth: '285px',
  maxWidth: '420px',
  minHeight: '410px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: '2.4rem 1.7rem 2.1rem',
  borderRadius: '22px',
  background: 'rgba(22,16,10,0.94)',
  border: '1.5px solid rgba(255,91,46,0.12)',
  boxShadow: '0 2.5px 12px 0 rgba(40,24,14,0.11)',
  transition: 'none',
  position: 'relative',
  cursor: 'default',
};

export default function WhyFeelFlick() {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(38px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fflick-box { animation: fadeInUp 0.7s ease both; }
        /* Hover effect removed */
        @media (max-width: 1020px) {
          .fflick-box { flex-direction: column; }
          .fflick-card { width: 92vw; max-width: 99vw; min-height: 250px; margin-bottom: 2rem; }
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
                    margin: '0 0 1.2rem',
                    fontSize: '1.75rem',
                    fontWeight: 950,
                    lineHeight: 1.19,
                    background: 'linear-gradient(88deg, var(--theme-color,#FF5B2E), var(--theme-color-secondary,#367cff) 80%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2.5px 8px rgba(0,0,0,0.16)',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    color: '#c6c7d2', // softer grey
                    lineHeight: '1.72',
                    fontWeight: 200,
                    letterSpacing: '0.013em',
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
