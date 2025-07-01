import React from 'react';

const cards = [
  {
    title: 'Personalized Mood-Based Recommendations',
    description:
      'FeelFlick suggests movies tailored to your current mood, giving you relevant picks every time you want to watch.',
  },
  {
    title: 'Learns Your Unique Taste',
    description:
      'The platform understands your viewing habits and preferences, improving recommendations as you watch more films.',
  },
  {
    title: 'Simple, Fast, and Private',
    description:
      'No endless scrolling or intrusive ratings. FeelFlick delivers quick, private movie suggestions without any pressure.',
  },
  {
    title: 'Track Your Movie Journey',
    description:
      'Keep a personal record of films you’ve watched and how they made you feel, helping you reflect on your cinematic tastes.',
  },
  {
    title: 'Always Free and Accessible',
    description:
      'Enjoy all features without any cost or hidden fees, accessible anytime from any device.',
  },
];

const wrapperStyle = {
  width: '100vw',
  height: '100vh',
  background: 'rgba(30, 30, 30, 0.1)',
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

const cardBaseStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '1.5rem',
  flex: '0 1 18%',
  fontSize: '0.875rem',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease, outline 0.3s ease',
  cursor: 'pointer',
  minWidth: '180px',
};

export default function WhyFeelFlick() {
  return (
    <>
      {/* Animation keyframes */}
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
                ...cardBaseStyle,
                animation: `fadeInUp 0.6s ease ${(idx * 0.1).toFixed(1)}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)';
                e.currentTarget.style.outline = '2px solid var(--theme-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.outline = 'none';
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>{card.title}</h3>
              <p style={{ margin: 0 }}>{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
