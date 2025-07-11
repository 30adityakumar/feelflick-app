import React from 'react';

const cards = [
  {
    title: 'Mood-Driven, Personalized Picks',
    description:
      "FeelFlick learns your movie taste and listens to your current mood. No generic suggestions — just titles that match your vibe. The more you watch and share how you feel, the smarter and more personal your recommendations become.",
  },
  {
    title: 'Fast, Simple, and Private',
    description:
      "Tired of scrolling for something to watch? FeelFlick delivers quick and clutter-free suggestions. No ratings, no filters, no noise — just the right movie when you need it. Your data stays private, always secure and never shared.",
  },
  {
    title: 'Track What You Love For Free',
    description:
      "Keep a personal log of every movie you’ve seen. Build watchlists, revisit past favorites, and reflect on your evolving taste. FeelFlick helps you stay organized, sentimental, and inspired — all in one place. Always free, with no paywalls or limits.",
  },
];

export default function WhyFeelFlick() {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(38px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fflick-box { animation: fadeInUp 0.7s ease both; }

        /* MOBILE STYLES */
        @media (max-width: 1020px) {
          .fflick-box { flex-direction: column !important; padding: 2vw 0 !important; }
          .fflick-card { 
            width: 96vw !important; 
            max-width: 99vw !important; 
            min-width: unset !important; 
            margin-bottom: 1.3rem !important;
            padding: 1.2rem 5vw !important;
          }
          .fflick-title {
            font-size: 1.14rem !important;
          }
          .fflick-desc {
            font-size: 0.97rem !important;
          }
        }
        @media (max-width: 600px) {
          .fflick-section-title {
            font-size: 1.03rem !important;
            margin-bottom: 20px !important;
          }
          .fflick-box { 
            padding: 2vw 0 !important; 
            border-radius: 18px !important; 
          }
        }
      `}</style>
      <div style={{
        width: '100vw',
        background: 'rgba(10,10,10,0.73)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '14px 0 10px 0',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          padding: '0 7vw',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Section Title */}
          <div className="fflick-section-title" style={{
            fontWeight: 900,
            fontSize: "1.37rem",
            color: "#fff",
            letterSpacing: "0.14em",
            marginLeft: 0,
            marginBottom: 28,
            marginTop: 16,
            textAlign: "left",
            textTransform: "uppercase"
          }}>
            More Reasons To Join
          </div>
          <div className="fflick-box" style={{
            background: 'rgba(10,10,10,0.73)',
            borderRadius: '28px',
            padding: '1.2rem 2.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            width: '100%',
            maxWidth: '1450px',
            margin: '0 auto',
            boxShadow: '0 8px 48px 0 rgba(0,0,0,0.12)',
            gap: '2.7rem',
            flexWrap: 'nowrap'
          }}>
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="fflick-card"
                style={{
                  flex: '0 1 34%',
                  minWidth: '335px',
                  maxWidth: '490px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  padding: '2.2rem 1.7rem',
                  borderRadius: '22px',
                  background: 'rgba(22,16,10,0.94)',
                  border: '1.5px solid rgba(255,91,46,0.12)',
                  boxShadow: '0 2.5px 12px 0 rgba(40,24,14,0.11)',
                  transition: 'none',
                  position: 'relative',
                  cursor: 'default',
                  animation: `fadeInUp 0.7s cubic-bezier(.25,.7,.3,1.1) ${(idx * 0.14).toFixed(2)}s both`,
                }}
                tabIndex={0}
              >
                <h3
                  className="fflick-title"
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
                  className="fflick-desc"
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    color: '#c6c7d2',
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
