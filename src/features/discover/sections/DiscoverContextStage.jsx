// src/features/discover/sections/DiscoverContextStage.jsx
// Stage 2 — tonight's context. The four predicted values are shown as an editable
// STARTING POINT (never an authoritative claim about the user). One accordion row
// per dimension; one open at a time. Editing marks context as user-touched so the
// parent freezes predictions. Neutral ivory primary action.

import { useState } from 'react'
import { TIME_OPTIONS, WHO_OPTIONS, ENERGY_OPTIONS, INTENTIONS } from '../constants'
import DiscoverProgress from './DiscoverProgress'
import ContextEditor from './ContextEditor'

export default function DiscoverContextStage({
  time, setTime, who, setWho, energy, setEnergy, intention, setIntention,
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

  return (
    <section className="ff-disc-stage ff-disc-stage--ctx" aria-labelledby="ff-disc-ctx-h1">
      <DiscoverProgress step={2} />
      <header className="ff-disc-stage__head">
        <h1 id="ff-disc-ctx-h1" className="ff-disc-stage__title">This is tonight.</h1>
        <p className="ff-disc-stage__sub">FeelFlick filled in a starting point. Tap only what needs changing.</p>
      </header>

      <ContextEditor groups={groups} openId={openId} setOpenId={setOpenId} onPick={onPick} />

      <div className="ff-disc-actionbar ff-disc-actionbar--split">
        <button type="button" className="ff-disc-btn ff-disc-btn--ghost" onClick={onBack}>Back</button>
        <span className="ff-disc-actionbar__meta">A starting point — change anything.</span>
        <button type="button" className="ff-disc-btn ff-disc-btn--primary" onClick={() => { playContinueCue?.(); onNext() }}>Find tonight’s film</button>
      </div>
    </section>
  )
}
