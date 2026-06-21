// src/features/discover/sections/DiscoverContextStage.jsx
// Stage 2 — tonight's context, as ONE integrated card (prototype-faithful): a tinted
// constellation hero (Your constellation + the named constellation + a live context
// sentence) above compact accordion rows that share the card — NOT four standalone
// cards. The four predicted values are an editable STARTING POINT (never an
// authoritative claim about the user). One row open at a time. Editing marks context
// as user-touched so the parent freezes predictions. Neutral ivory primary action.

import { useState } from 'react'
import { TIME_OPTIONS, WHO_OPTIONS, ENERGY_OPTIONS, INTENTIONS } from '../constants'
import { constellationName } from '../derive'
import DiscoverProgress from './DiscoverProgress'
import ContextEditor from './ContextEditor'

export default function DiscoverContextStage({
  selected = [], time, setTime, who, setWho, energy, setEnergy, intention, setIntention,
  onUserEdit, onNext, onBack, playOptionCue, playContinueCue,
}) {
  const [openId, setOpenId] = useState(null)
  const groups = [
    { id: 'intention', legend: 'Intention', options: INTENTIONS, value: intention, setValue: setIntention },
    { id: 'time', legend: 'Time', options: TIME_OPTIONS, value: time, setValue: setTime },
    { id: 'who', legend: 'Watching', options: WHO_OPTIONS, value: who, setValue: setWho },
    { id: 'energy', legend: 'Energy', options: ENERGY_OPTIONS, value: energy, setValue: setEnergy },
  ]
  const onPick = (group, optId) => { onUserEdit?.(); group.setValue(optId); playOptionCue?.() }

  // Live context sentence — recomputes on every value change (immediate feedback).
  const labelOf = (opts, v) => opts.find((o) => o.id === v)?.label || '—'
  const sentence = `${labelOf(INTENTIONS, intention)} · ${labelOf(TIME_OPTIONS, time)} · ${labelOf(WHO_OPTIONS, who)} · ${labelOf(ENERGY_OPTIONS, energy)}.`
  const cName = constellationName(selected)

  return (
    <section className="ff-disc-stage ff-disc-stage--ctx" aria-labelledby="ff-disc-ctx-h1">
      <DiscoverProgress step={2} />
      <header className="ff-disc-stage__head">
        <h1 id="ff-disc-ctx-h1" className="ff-disc-stage__title">This is tonight.</h1>
        <p className="ff-disc-stage__sub">FeelFlick filled in a starting point. Tap only what needs changing.</p>
      </header>

      <div className="ff-disc-ctx-card">
        <div className="ff-disc-ctx-hero">
          <div className="ff-disc-ctx-hero__kicker">Your constellation</div>
          <div className="ff-disc-ctx-hero__name">{cName}</div>
          <p className="ff-disc-ctx-hero__sentence">{sentence}</p>
        </div>
        <ContextEditor groups={groups} openId={openId} setOpenId={setOpenId} onPick={onPick} />
      </div>

      <div className="ff-disc-actionbar ff-disc-actionbar--split ff-disc-actionbar--ctx">
        <button type="button" className="ff-disc-btn ff-disc-btn--ghost" onClick={onBack}>Back</button>
        <span className="ff-disc-actionbar__meta">A starting point — change anything.</span>
        <button type="button" className="ff-disc-btn ff-disc-btn--primary" onClick={() => { playContinueCue?.(); onNext() }}>Find tonight’s film</button>
      </div>
    </section>
  )
}
