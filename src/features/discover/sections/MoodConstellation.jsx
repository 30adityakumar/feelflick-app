// src/features/discover/sections/MoodConstellation.jsx
// The expressive 8-mood constellation in an OPEN field (no enclosing card / border —
// the moods float in the page atmosphere, prototype-faithful). Orbs are real buttons
// with aria-pressed + an accessible name that INCLUDES the mood description (no
// title-only info). Selection order is conveyed by a numbered badge (not colour
// alone). The named constellation sits at the visual centre of the field. The burst
// is DETERMINISTIC (fixed geometry by index), reduced-motion-aware, aria-hidden,
// and absent from the a11y tree — so it never destabilises visual regression.

import DiscoverConstellationCenter from './DiscoverConstellationCenter'

const BURST_DOTS = Array.from({ length: 10 }, (_, i) => ({
  a: (i / 10) * Math.PI * 2,
  r: 54 + (i % 3) * 14,
  s: 2 + (i % 2),
  d: (i % 5) * 12, // staggered delay, deterministic
}))

function DeterministicBurst({ hex }) {
  return (
    <div aria-hidden="true" className="ff-disc-burst">
      {BURST_DOTS.map((dot, i) => (
        <span key={i} className="ff-disc-burst__dot" style={{
          width: dot.s, height: dot.s, background: hex, boxShadow: `0 0 ${dot.s * 2}px ${hex}`,
          animationDelay: `${dot.d}ms`, '--tx': `${Math.cos(dot.a) * dot.r}px`, '--ty': `${Math.sin(dot.a) * dot.r}px`,
        }} />
      ))}
    </div>
  )
}

export default function MoodConstellation({ selected, moods, onToggle, burst, reducedMotion }) {
  const lines = []
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = moods.find((m) => m.id === selected[i])
      const b = moods.find((m) => m.id === selected[j])
      if (a && b) lines.push({ a, b, key: `${a.id}-${b.id}` })
    }
  }
  return (
    <div className="ff-disc-field" role="group" aria-label="Choose one to three moods">
      <svg aria-hidden="true" className="ff-disc-field__lines">
        {lines.map(({ a, b, key }) => (
          <line key={key} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
            className="ff-disc-field__line" />
        ))}
      </svg>
      <DiscoverConstellationCenter selected={selected} />
      {moods.map((m) => {
        const on = selected.includes(m.id)
        const order = selected.indexOf(m.id) + 1
        return (
          <div key={m.id} className="ff-disc-node" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
            {burst && burst.id === m.id && !reducedMotion && <DeterministicBurst key={burst.seq} hex={m.hex} />}
            <button
              type="button"
              onClick={() => onToggle(m)}
              aria-pressed={on}
              aria-label={on ? `${m.label}, selected ${order} of ${selected.length} — ${m.hint}` : `${m.label} — ${m.hint}`}
              className={`ff-disc-orb-btn${on ? ' is-on' : ''}`}
            >
              <span className="ff-disc-orb" data-on={on ? 'true' : 'false'}
                style={{ background: `radial-gradient(circle at 35% 30%, ${m.hex}, ${m.hex}66 60%, ${m.hex}11)`, borderColor: on ? m.hex : 'transparent', boxShadow: on ? `0 0 28px ${m.hex}aa` : `0 0 10px ${m.hex}33` }}>
                {on && <span className="ff-disc-orb__badge" style={{ borderColor: m.hex, color: m.hex }}>{order}</span>}
              </span>
              <span className="ff-disc-orb__label">{m.label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
