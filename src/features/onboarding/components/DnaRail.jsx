// src/features/onboarding/components/DnaRail.jsx
// Persistent onboarding "Cinematic DNA" rail — fuses the former Progress
// (identity + progressbar) and TasteStrip (signal tally) into ONE flex-none
// chrome row: FEELFLICK wordmark + a desktop-only "Cinematic DNA" kicker + the
// single brand-gradient progressbar rail + a compact Mood/Genre/Film/Rated tally
// + the 01/04 counter. The rail is the only horizontal rule (no second hairline,
// no panel/chips/card). Wordmark is paper-white, progress is the coral signature
// (the one allowed coral role here); mood stays ambient (AmbientGlow /
// --ob-accent-rgb), never tinting this chrome.

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
      {/* Identity (left) — wordmark (Inter 600, +0.04em, paper-white to match the
          shipped app header) + a desktop-only micro-kicker naming the artifact. */}
      <div className="flex-none flex items-center gap-2.5">
        <span
          className="ob-display text-[13px] sm:text-[15px] font-semibold text-[var(--color-text-primary,#f5f2eb)]"
          style={{ letterSpacing: '0.04em' }}
        >
          FEELFLICK
        </span>
        <span className="hidden sm:inline-flex items-center gap-2.5">
          <span className="h-3 w-px bg-white/12" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/35">
            Cinematic DNA
          </span>
        </span>
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
          className="h-full rounded-full bg-[var(--color-brand-accent,#e5636f)]"
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
