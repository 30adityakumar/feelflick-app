// src/features/discover/sections/DiscoverExhaustedState.jsx
// Honest finite-session end. Two DISTINCT reasons with distinct copy:
//   • 'pool' — no remaining candidate clears the thresholds (the shortlist is
//              genuinely empty for these details).
//   • 'cap'  — the bounded decision set is full; more catalogue films may exist,
//              but FeelFlick intentionally stops after a finite set of directions.
// Never implies the catalogue is empty. No auto-refill.

export default function DiscoverExhaustedState({ reason = 'pool', onAdjust, onRestart, blendHex }) {
  const isCap = reason === 'cap'
  return (
    <section className="ff-disc-exhausted" aria-labelledby="ff-disc-exhausted-h1">
      <p className="ff-disc-exhausted__eyebrow" style={{ color: blendHex }}>The honest edge</p>
      <h1 id="ff-disc-exhausted-h1" className="ff-disc-exhausted__title">
        {isCap ? 'That’s enough directions for one decision.' : 'Nothing left in this shortlist.'}
      </h1>
      <p className="ff-disc-exhausted__sub">
        {isCap
          ? 'You’ve seen a full set of directions for tonight. Adjust the details or begin again.'
          : 'You’ve ruled out the strong directions for this moment. Adjust tonight, or start over.'}
      </p>
      <div className="ff-disc-exhausted__actions">
        <button type="button" className="ff-disc-btn ff-disc-btn--primary" onClick={onAdjust}>Adjust tonight</button>
        <button type="button" className="ff-disc-btn ff-disc-btn--ghost" onClick={onRestart}>Start over</button>
      </div>
    </section>
  )
}
