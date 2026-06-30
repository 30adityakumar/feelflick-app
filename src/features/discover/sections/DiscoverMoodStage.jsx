// src/features/discover/sections/DiscoverMoodStage.jsx
// Stage 1 — emotional shape. One to three moods on the constellation; the named
// constellation is presented as expressive flavour, but the SELECTED MOODS remain
// the source of truth (their descriptions are shown accessibly in
// SelectedMoodSummary on desktop AND mobile). Neutral ivory primary action.

import { useReducedMotion } from 'framer-motion'
import { useRef, useState } from 'react'
import { MOODS } from '../derive'
import DiscoverProgress from './DiscoverProgress'
import DiscoverConstellationCenter from './DiscoverConstellationCenter'
import MoodConstellation from './MoodConstellation'
import SelectedMoodSummary from './SelectedMoodSummary'

export default function DiscoverMoodStage({ selected, setSelected, onNext, audioToggle, playMoodCue, playContinueCue }) {
  const reducedMotion = useReducedMotion()
  const [burst, setBurst] = useState(null)
  const seqRef = useRef(0)

  const toggle = (m) => {
    if (selected.includes(m.id)) {
      setSelected(selected.filter((x) => x !== m.id))
    } else if (selected.length < 3) {
      setSelected([...selected, m.id])
      playMoodCue?.(m.id)
      if (!reducedMotion) { seqRef.current += 1; setBurst({ id: m.id, seq: seqRef.current }) }
    }
  }

  return (
    <section className="ff-disc-stage ff-disc-stage--mood" aria-labelledby="ff-disc-mood-h1">
      {audioToggle}
      <DiscoverProgress step={1} />
      <header className="ff-disc-stage__head">
        <h1 id="ff-disc-mood-h1" className="ff-disc-stage__title">How should tonight feel?</h1>
        <p className="ff-disc-stage__sub">Choose up to three moods. FeelFlick will hold the contradiction.</p>
      </header>

      <MoodConstellation selected={selected} moods={MOODS} onToggle={toggle} burst={burst} reducedMotion={reducedMotion} />

      <DiscoverConstellationCenter selected={selected} />

      <SelectedMoodSummary selected={selected} moods={MOODS} />

      <div className="ff-disc-actionbar">
        <span className="ff-disc-actionbar__meta">
          {selected.length === 0 ? 'Pick at least one' : selected.length === 3 ? 'Three is the most' : `${selected.length} chosen`}
        </span>
        <button
          type="button"
          className="ff-disc-btn ff-disc-btn--primary"
          onClick={() => { playContinueCue?.(); onNext() }}
          disabled={selected.length === 0}
        >
          Continue
        </button>
      </div>
    </section>
  )
}
