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

        .fflick-card:focus-visible {
          outline: 2.5px solid #fe9245;
          outline-offset: 2px;
        }

        .fflick-section-title {
          font-size: clamp(1.09rem, 3vw, 1.37rem) !important;
          margin-bottom: clamp(16px, 3vw, 22px) !important;
          margin-top: 10px !important;
          letter-spacing: 0.14em !important;
          font-weight: 900 !important;
          color: #fff !important;
          text-transform: uppercase;
        }
        .fflick-box {
          padding: clamp(0.3rem, 2.5vw, 0.7rem) clamp(0.7rem, 7vw, 2.5rem) !important;
          border-radius: clamp(16px, 2vw, 28px) !important;
          gap: clamp(1.1rem, 3vw, 2rem) !important;
        }
        .fflick-card {
          padding: clamp(1rem, 3vw, 1.6rem) clamp(1rem, 4vw, 1.4rem) !important;
          border-radius: clamp(13px, 2vw, 22px) !important;
          min-width: clamp(210px, 29vw, 335px) !important;
          max-width: clamp(99vw, 33vw, 480px) !important;
          background: rgba(12, 8, 4, 0.98) !important;  /* darker */
          border: 1.5px solid rgba(255,91,46,0.13);
          box-shadow: 0 2.5px 12px 0 rgba(40,24,14,0.10);
          transition: none;
          position: relative;
          cursor: default;
        }
        .fflick-title {
          font-size: clamp(1.14rem, 3.5vw, 1.85rem) !important;
          background: linear-gradient(92deg, #ffd7b0 0%, #fe9245 77%);
          WebkitBackgroundClip: text;
          WebkitTextFillColor: transparent;
          text-shadow: 0 3px 16px #fe924561, 0 2.5px 8px rgba(0,0,0,0.18);
          font-weight: 950;
        }
        .fflick-desc {
          font-size: clamp(0.87rem, 2vw, 0.99rem) !important;
          color: #fff !important;        /* lighter, more visible */
          opacity: 0.97 !important;
        }
        @media (max-width: 1020px) {
          .fflick-box { flex-direction: column !important; align-items: center !important; }
          .fflick-card { width: 96vw !important; max-width: 99vw !important; margin-bottom: 1rem !important;}
        }
        @media (max-width: 600px) {
          .fflick-section-title {
            font-size: 1.03rem !important;
            margin-bottom: 14px !important;
            margin-top: 6px !important;
          }
          .fflick-box {
            padding: 14px 8vw !important;    /* EVEN padding on mobile */
            border-radius: 18px !important;
          }
          .fflick-desc {
            display: none !important;
          }
        }
      `}</style>

      <section
        role="region"
        aria-labelledby="whyfeelflick-heading"
        style={{
          width: '100vw',
          background: 'rgba(10,10,10,0.73)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '14px 0 10px 0',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          width: '100%',
          padding: '0 7vw',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Section Title */}
          <h2 id="whyfeelflick-heading" className="fflick-section-title">
            More Reasons To Join
          </h2>
          <div
            className="fflick-box"
            style={{
              background: 'rgba(12, 11, 10, 0.80)',
              borderRadius: '28px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',
              width: '100%',
              maxWidth: '1450px',
              margin: '0 auto',
              boxShadow: '0 8px 48px 0 rgba(0,0,0,0.12)',
              flexWrap: 'nowrap',
            }}
          >
            {cards.map((card, idx) => (
              <article
                key={idx}
                className="fflick-card"
                style={{
                  flex: '0 1 34%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  background: 'rgba(22,16,10,0.94)',
                  border: '1.5px solid rgba(255,91,46,0.12)',
                  boxShadow: '0 2.5px 12px 0 rgba(40,24,14,0.11)',
                  transition: 'none',
                  position: 'relative',
                  cursor: 'default',
                  animation: `fadeInUp 0.7s cubic-bezier(.25,.7,.3,1.1) ${(idx * 0.14).toFixed(2)}s both`,
                }}
                tabIndex={0}
                aria-labelledby={`whyfeelflick-card-title-${idx}`}
                aria-describedby={`whyfeelflick-card-desc-${idx}`}
              >
                <h3
                  id={`whyfeelflick-card-title-${idx}`}
                  className="fflick-title"
                  style={{
                    margin: '0 0 1.2rem',
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
                  id={`whyfeelflick-card-desc-${idx}`}
                  className="fflick-desc"
                  style={{
                    margin: 0,
                    color: '#ffffffff',
                    lineHeight: '1.72',
                    fontWeight: 200,
                    letterSpacing: '0.013em',
                  }}
                >
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
