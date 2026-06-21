// src/features/discover/sections/DiscoverDirectionDock.jsx
// The finite-direction dock attached to the bottom of the cinematic result — a
// translucent, blurred shell holding a small "complete shortlist" meta cell + the
// (up to three) semantic role cards. The currently-focused film is a quiet
// "now showing" marker; the other directions are the prominent choices. Selecting a
// card changes FOCUS (the cinematic stage) — it never changes the films' roles. The
// shell scrolls horizontally on mobile; the page itself never does. Non-focused
// alternate cards carry the IntersectionObserver ref so an offscreen card only logs
// an impression once it is genuinely visible. No invented controls — adjust/start
// over live in the result footer + chips, which already have real handlers.

import { RotateCcw } from 'lucide-react'
import { DIRECTION_LABEL } from '../discoverDirections'
import DiscoverDirectionCard from './DiscoverDirectionCard'

const ORDER = ['closest', 'gentler', 'bolder']
const COUNT_WORD = { 2: 'Two directions', 3: 'Three directions' }

export default function DiscoverDirectionDock({ roles, focusId, onSelect, observe, blendHex, deltaCopyByRole = {}, onRestart }) {
  const cards = ORDER.map((r) => (roles[r] ? { role: r, film: roles[r] } : null)).filter(Boolean)
  if (cards.length <= 1) return null // only the lead exists → nothing to switch to

  return (
    <section className="ff-disc-dock" aria-label="Tonight’s directions">
      <div className="ff-disc-dock__shell" style={{ '--ff-dock-cols': cards.length }}>
        <div className="ff-disc-dock__meta">
          <strong>{COUNT_WORD[cards.length] || `${cards.length} directions`}</strong>
          <span>Complete shortlist. It won’t refill itself.</span>
        </div>
        {cards.map(({ role, film }) => (
          <DiscoverDirectionCard
            key={role}
            film={film}
            label={DIRECTION_LABEL[role]}
            delta={role === 'closest' ? null : deltaCopyByRole[role]}
            active={film.id === focusId}
            onSelect={onSelect}
            cardRef={role !== 'closest' ? observe(film) : undefined}
            blendHex={blendHex}
          />
        ))}
        {onRestart ? (
          <div className="ff-disc-dock__tools">
            <button type="button" className="ff-disc-dock__tool" aria-label="Start over" onClick={onRestart}>
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
