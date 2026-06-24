import { motion, useReducedMotion } from 'framer-motion'

const TOTAL = 4

export default function DnaRail({ step, moods, genres, films, ratings }) {
  const reduced = useReducedMotion()
  const current = step + 1
  const fraction = current / TOTAL

  const counts = [
    { label: 'Mood', n: moods.length },
    { label: 'Genre', n: genres.length },
    { label: 'Film', n: films.length },
    { label: 'Rated', n: Object.keys(ratings || {}).length },
  ].filter(item => item.n > 0)

  const showTally = step !== 3 && counts.length > 0

  return (
    <header className="ob-dna-rail">
      <div className="ob-dna-identity">
        <span className="ob-wordmark">FEELFLICK</span>
        <span className="ob-dna-name">Cinematic DNA</span>
      </div>

      <div
        className="ob-progress-track"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL}
        aria-valuenow={current}
        aria-label="Onboarding progress"
      >
        <motion.div
          className="ob-progress-fill"
          initial={false}
          animate={{ width: `${fraction * 100}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      <div className="ob-dna-status">
        <span aria-live="polite" className="ob-signal-tally">
          {showTally && counts.map(item => (
            <span key={item.label}>
              <span>{item.label}</span>
              <strong>{item.n}</strong>
            </span>
          ))}
        </span>
        <span className="ob-step-count">
          {String(current).padStart(2, '0')} / 0{TOTAL}
        </span>
      </div>
    </header>
  )
}
