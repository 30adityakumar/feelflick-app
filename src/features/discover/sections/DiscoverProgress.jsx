// src/features/discover/sections/DiscoverProgress.jsx
// Two-step progress indicator for the Discover input flow. Decorative dots are
// aria-hidden; an sr-only sentence conveys progress to assistive tech.
export default function DiscoverProgress({ step = 1, total = 2 }) {
  return (
    <div className="ff-disc-progress">
      <span className="sr-only">{`Step ${step} of ${total}`}</span>
      <span className="ff-disc-progress__dots" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`ff-disc-progress__dot${i < step ? ' is-done' : ''}${i + 1 === step ? ' is-current' : ''}`} />
        ))}
      </span>
    </div>
  )
}
