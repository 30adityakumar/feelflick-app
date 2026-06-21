// src/features/discover/sections/DiscoverDirectionDock.jsx
// The finite-direction dock beneath the lead. Renders the (up to three) semantic
// roles as cards; the currently-focused film is a quiet "now showing" marker
// while the other directions are the prominent choices. Selecting a card changes
// FOCUS (the cinematic stage) — it never changes the films' roles. The dock may
// scroll horizontally on mobile; the page itself never does. Non-focused alternate
// cards carry the IntersectionObserver ref so an offscreen card only logs an
// impression once it is genuinely visible.

import { DIRECTION_LABEL } from '../discoverDirections'
import DiscoverDirectionCard from './DiscoverDirectionCard'

const ORDER = ['closest', 'gentler', 'bolder']

export default function DiscoverDirectionDock({ roles, focusId, onSelect, observe, blendHex, deltaCopyByRole = {} }) {
  const cards = ORDER.map((r) => (roles[r] ? { role: r, film: roles[r] } : null)).filter(Boolean)
  if (cards.length <= 1) return null // only the lead exists → nothing to switch to

  return (
    <section className="ff-disc-dock" aria-label="Tonight’s directions">
      <p className="ff-disc-dock__label">Two more directions, held in reserve</p>
      <div className="ff-disc-dock__cards">
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
      </div>
    </section>
  )
}
