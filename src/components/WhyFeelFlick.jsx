import React from 'react';

// Each card now has its own theme accent color (defined as CSS variables in your global styles)
const cards = [
  {
    icon: '🎭',
    title: 'Mood-Driven, Personalized Picks',
    description:
      "Get movie recommendations that actually get you. FeelFlick doesn’t just suggest what’s popular — it suggests what fits you. Based on your movie taste and how you’re feeling right now, it serves up titles that match your vibe. The more you use it, the better it gets at recommending films that feel just right — whether you’re in the mood for a tearjerker, a comfort comedy, or something totally unexpected.",
    color: 'var(--theme-color-1)',
  },
  {
    icon: '⚡',
    title: 'Fast, Simple & Private',
    description:
      "Say goodbye to endless scrolling and overthinking. FeelFlick is designed to be fast and clutter-free. No ratings rabbit holes, no complex filters — just a clean, intuitive interface that gives you one simple thing: the right movie, right now. And it’s fully private — your watch history and moods stay yours. We don’t track, sell, or share your data. Ever.",
    color: 'var(--theme-color-2)',
  },
  {
    icon: '📚',
    title: 'Track Your Journey — Always Free',
    description:
      "Keep your movie life organized and meaningful. FeelFlick lets you log every movie you’ve watched, how it made you feel, and what you want to see next. Build your own lists, revisit past favorites, and reflect on how your film taste evolves. All of this is completely free — no subscriptions, no paywalls, just pure movie joy at your fingertips.",
    color: 'var(--theme-color-3)',
  },
];

const wrapperStyle = {
  width: '100vw',
  height: '100vh',
  background: 'rgba(30, 36, 50, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 5%',
  boxSizing: 'border-box',
};

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  gap: '1rem',
  flexWrap: 'nowrap',
  width: '100%',
};

const baseCardStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '1.5rem',
  flex: '0 1 28%',
  fontSize: '0.875rem',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease, outline 0.3s ease',
  cursor: 'pointer',
  minWidth: '220px',
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
                borderLeft: `4px solid ${card.color}`,
                animation: `fadeInUp 0.6s ease ${(idx * 0.1).toFixed(1)}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 24px ${card.color}33`;
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)';
                e.currentTarget.style.outline = `2px solid ${card.color}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.outline = 'none';
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', color: card.color }}>
                <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>{card.icon}</span>
                {card.title}
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
