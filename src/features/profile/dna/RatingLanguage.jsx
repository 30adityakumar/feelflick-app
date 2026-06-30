// src/features/profile/dna/RatingLanguage.jsx
// Response — how strongly you respond. Histogram of the canonical 1–10 ratings rendered as ten
// 0.5★ buckets (the exact stored contract; never nine forced buckets). Below the minimum sample
// it is factual + count-led (no behavioural interpretation); at the established sample it adds the
// deterministic selectivity reading. No LLM, no fabricated metric.

import { MIN_RATINGS_FOR_LANGUAGE } from '../derive/ratingLanguage'

const BUCKET_COLOR = ['#96938c', '#96938c', '#96938c', '#96938c', '#b5a4ec', '#91d2ee', '#eda8cc', '#edc97c', '#edc97c', '#e5636f']

function starString(stars) {
  const full = Math.floor(stars)
  const half = stars - full >= 0.5
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)))
}

export default function RatingLanguage({ ratingLanguage, subjectName = null }) {
  const rl = ratingLanguage
  if (!rl) return null
  const max = Math.max(1, ...rl.buckets.map((b) => b.count))
  // Voice: owner page (no subjectName) → first person; another user's page → third person.
  const Poss = subjectName ? `${subjectName}'s` : 'Your'
  const respond = subjectName ? 'How strongly they respond.' : 'How strongly you respond.'
  const generously = subjectName
    ? 'Based on how generously they rate and how rare their highest ratings are'
    : 'Based on how generously you rate and how rare your highest ratings are'
  const calibrating = subjectName
    ? `A clearer reading of how they respond will appear once they have rated a few more films. So far: ${rl.count} of ${MIN_RATINGS_FOR_LANGUAGE} ratings needed for a confident read.`
    : `Rate a few more films and a clearer reading of how you respond will appear here. So far: ${rl.count} of ${MIN_RATINGS_FOR_LANGUAGE} ratings needed for a confident read.`
  // Two interpretation labels embed a pronoun; render them third-person for another user.
  // (Derived `rl.interpret` is left untouched for the owner page / other consumers.)
  const interpretText = subjectName
    ? ({ warm: 'Warm in their praise.', measured: 'Measured in their praise.' }[rl.languageKey] ?? rl.interpret)
    : rl.interpret
  return (
    <section className="ff-dna-section" id="dna-response" aria-labelledby="ff-dna-response-h2">
      <div className="ff-dna__shell">
        <div className="ff-dna-section__head">
          <div>
            <p className="ff-dna-eyebrow">{Poss} rating language</p>
            <h2 id="ff-dna-response-h2">{respond}</h2>
          </div>
          <p>A familiar distribution of {subjectName ? 'their' : 'your'} {rl.count} rating{rl.count === 1 ? '' : 's'}.</p>
        </div>
        <div className="ff-dna-rating">
          <div className="ff-dna-rating__panel">
            <div className="ff-dna-rating__top">
              <h3>{Poss} {rl.count} rating{rl.count === 1 ? '' : 's'}</h3>
              {rl.eligible ? <span className="ff-dna-rating__summary">{rl.summaryLine}</span> : null}
            </div>
            <div className="ff-dna-hist" role="img" aria-label={`Rating distribution across ${rl.count} ratings; ${rl.summaryLine}`}>
              {rl.buckets.map((b, i) => (
                <div className="ff-dna-hist__col" key={b.rating}>
                  <div className="ff-dna-hist__count">{b.count || ''}</div>
                  <div className="ff-dna-hist__bar" style={{ '--h': `${Math.max(3, (b.count / max) * 100)}%`, '--c': BUCKET_COLOR[i] }} />
                  <div className="ff-dna-hist__label">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
          {rl.eligible ? (
            <aside className="ff-dna-rating__card">
              <div className="ff-dna-rating__big">{rl.averageStars.toFixed(1)}</div>
              <div className="ff-dna-rating__stars" aria-hidden="true">{starString(rl.averageStars)}</div>
              <h3>{interpretText}</h3>
              <p>{generously} — measured across {rl.count} ratings, not from the average alone.</p>
              <div className="ff-dna-rating__facts">
                <div className="ff-dna-rating__fact"><span>Five-star films</span><strong>{rl.fiveStarCount}</strong></div>
                <div className="ff-dna-rating__fact"><span>Most-used rating</span><strong>{rl.modeStars}</strong></div>
              </div>
            </aside>
          ) : (
            <aside className="ff-dna-rating__card">
              <p className="ff-dna-eyebrow">Still calibrating</p>
              <p className="ff-dna-rating__count">{calibrating}</p>
              <div className="ff-dna-rating__facts">
                <div className="ff-dna-rating__fact"><span>Five-star films</span><strong>{rl.fiveStarCount}</strong></div>
                <div className="ff-dna-rating__fact"><span>Most-used rating</span><strong>{rl.modeStars}</strong></div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}
