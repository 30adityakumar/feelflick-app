// src/features/onboarding/components/DnaRail.jsx
// Persistent onboarding "Cinematic DNA" rail — fuses the former Progress
// (identity + progressbar) and TasteStrip (signal tally) into ONE flex-none
// chrome row: FEELFLICK wordmark + a desktop-only "Cinematic DNA" kicker + the
// single brand-gradient progressbar rail + a compact Mood/Genre/Film/Rated tally
// + the 01/04 counter. The rail is the only horizontal rule (no second hairline,
// no panel/chips/card). Brand gradient stays on the foreground; mood stays
// ambient (AmbientGlow / --ob-accent-rgb), never tinting this chrome.

import { motion, useReducedMotion } from 'framer-motion'

const TOTAL = 4

export default function DnaRail({ step, moods, genres, films, ratings }) {
  const reduced = useReducedMotion()
  const current = step + 1            // 1..TOTAL
  const fraction = current / TOTAL    // 0.25..1 — honestly represents 4 steps

  const counts = [
    { label: 'Mood',  n: moods.length },
    { label: 'Genre', n: genres.length },
    { label: 'Film',  n: films.length },
    { label: 'Rated', n: Object.keys(ratings || {}).length },
  ].filter(c => c.n > 0)

  // The tally hides on the rating step (RatingStep has its own "X TO GO" eyebrow,
  // and the tally is noise over the card on mobile) and before any signal exists.
  // The rail/progressbar ALWAYS renders, on all four steps.
  const showChips = step !== 3 && counts.length > 0

  return (
    <div className="flex-none px-5 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-3 flex items-center gap-3 sm:gap-4">
      {/* Identity (left) — wordmark verbatim (Outfit 600, +0.04em, brand gradient,
          no font-extrabold/black) + a desktop-only micro-kicker naming the artifact. */}
      <div className="flex-none flex items-center gap-2.5">
        <span
          className="ob-display text-[13px] sm:text-[15px] font-semibold bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent"
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

      {/* The single progressbar rail (center) — the only horizontal rule. */}
      <div
        className="flex-1 h-[3px] rounded-full bg-white/8 overflow-hidden"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL}
        aria-valuenow={current}
        aria-label="Onboarding progress"
      >
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-purple-600 to-pink-500"
          initial={false}
          animate={{ width: `${fraction * 100}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      {/* Signals + counter (right). The tally lives in an always-present
          aria-live region so a captured signal is announced ("Mood 1"); the four
          label WORDS are the non-color affordance carried over from TasteStrip. */}
      <div className="flex-none flex items-center gap-2.5 sm:gap-3">
        <span
          aria-live="polite"
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] whitespace-nowrap"
        >
          {showChips && counts.map(c => (
            <span key={c.label} className="flex items-center gap-1">
              <span className="text-white/45">{c.label}</span>
              <span className="text-white/75 tabular-nums">{c.n}</span>
            </span>
          ))}
        </span>
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white/40 tabular-nums whitespace-nowrap">
          {String(current).padStart(2, '0')} / 0{TOTAL}
        </span>
      </div>
    </div>
  )
}
