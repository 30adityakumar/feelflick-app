import React from 'react';

// Three core cards for WhyFeelFlick section
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

// Wrapper covers full viewport, cards lowered
const wrapperStyle = {
  width: '100vw',
  height: '100vh',
  background: 'rgba(30, 36, 50, 0.1)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '10vh 5%',
  boxSizing: 'border-box',
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'stretch',
  gap: '1rem',
  flexWrap: 'nowrap',
  width: '100%',
};

// Card background uses theme radish color; no icons, default cursor
const baseCardStyle = {
  background: 'rgba(var(--theme-color-rgb), 0.25)', // thematic radish from theme
  borderRadius: '12px',
  padding: '2rem',
  flex: '0 1 28%',
  minWidth: '240px',
  height: '80vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'default',
  position: 'relative',
};

export default function WhyFeelFlick() {
  return (
    <>
      {/* Fade-in-up keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={wrapperStyle}>
        <div style={rowStyle}>
          {cards.map((card, idx) => (
            <div
              key={idx}
              style={{
                ...baseCardStyle,
                animation: `fadeInUp 0.6s ease ${(idx * 0.1).toFixed(1)}s both`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.zIndex = '1';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px var(--theme-color), 0 0 0 6px var(--theme-color-secondary)';
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.zIndex = 'auto';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              <h3
                style={{
                  margin: '0 0 1rem',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'var(--theme-color)',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
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
