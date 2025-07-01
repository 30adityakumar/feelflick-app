import React from 'react';

const cards = [
  {
    title: 'Mood-Driven, Personalized Picks',
    description:
      "Get movie recommendations that feel made for you. FeelFlick learns your taste based on what you’ve watched and how those films made you feel. Then, whenever you're ready to watch, just tell us your mood — and we’ll suggest a film that matches it perfectly. No random trends, no guesswork — just personal, mood-matching picks that actually make sense.",
  },
  {
    title: 'Fast, Simple, and Private',
    description:
      "Say goodbye to endless scrolling and choice overload. FeelFlick gives you quick, focused suggestions based on your emotional vibe and watch habits. No star ratings to obsess over. No clutter. And no one’s watching you — your movie history and moods stay private, always. It’s a calm, stress-free experience that helps you watch more and scroll less — anytime, anywhere, on any device.",
  },
  {
    title: 'Track Your Journey — Always Free',
    description:
      "Log every movie you’ve seen, how it made you feel, and what you want to watch next — all in one place. FeelFlick becomes your personal movie memory bank. Revisit your favorites, build curated lists, and see how your taste evolves over time. It’s simple, sentimental, and always free — designed to celebrate your unique movie journey and keep it organized effortlessly.",
  },
];

const wrapperStyle = {
  width: '100vw',
  minHeight: '100vh',
  background: 'linear-gradient(120deg, rgba(20,16,12,0.97), rgba(30,24,20,1) 85%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4vw',
  boxSizing: 'border-box',
};

const boxStyle = {
  background: 'rgba(30, 20, 16, 0.45)',
  borderRadius: '28px',
  padding: '2.7rem 2rem',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '1450px',
  boxShadow: '0 8px 48px 0 rgba(0,0,0,0.18)',
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
  background: 'linear-gradient(135deg, rgba(30,18,10,0.98) 85%, rgba(255, 91, 46, 0.11) 100%)',
  border: '1.5px solid rgba(255,91,46,0.17)',
  boxShadow: '0 2.5px 12px 0 rgba(40,24,14,0.15)',
  transition: 'transform 0.28s cubic-bezier(.3,.7,.4,1.3), box-shadow 0.26s, outline 0.22s, filter 0.22s',
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
        .fflick-card:hover {
          transform: translateY(-9px) scale(1.045);
          box-shadow: 0 8px 38px 0 rgba(255,96,16,0.17), 0 2px 32px 0 rgba(30,14,8,0.14);
          outline: 2.5px solid #ff5b2e;
          outline-offset: 2.5px;
          z-index: 2;
        }
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
                    fontWeight: 1000,
                    lineHeight: 1.19,
                    background: 'linear-gradient(96deg, #FF5B2E 16%, #FF7B48 60%, #FFD9B7 100%)',
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
                    color: 'rgba(255,255,255,0.88)',
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
