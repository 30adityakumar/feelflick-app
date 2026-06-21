// src/features/discover/sections/DiscoverDirectionCard.jsx
// A compact alternate-direction card in the dock. It FOCUSES/SELECTS a film onto the
// cinematic stage — it is a single button, not a duplicate action suite (no nested
// interactive elements). It carries a small poster thumbnail, the semantic role
// label, the title, and the honest delta vs the lead; the active card is rendered
// quieter than the alternate choices and marked "Now showing". It deliberately does
// NOT repeat the lead's full metadata.

import { tmdbImg } from '@/shared/api/tmdb'

const TMDB = (p) => (p && p.startsWith('http') ? p : tmdbImg ? tmdbImg(p, 'w185') : p)

export default function DiscoverDirectionCard({ film, label, delta, active, onSelect, cardRef, blendHex }) {
  if (!film) return null
  return (
    <button
      ref={cardRef}
      type="button"
      className={`ff-disc-dir${active ? ' is-active' : ''}`}
      aria-pressed={active}
      aria-label={`${label}: ${film.title}. ${delta || ''}${active ? ' (now showing)' : ''}`}
      onClick={() => onSelect?.(film)}
      style={active ? { borderColor: blendHex } : undefined}
    >
      <span className="ff-disc-dir__poster" aria-hidden="true">
        {film.poster ? <img src={TMDB(film.poster)} alt="" loading="lazy" /> : null}
      </span>
      <span className="ff-disc-dir__body">
        <span className="ff-disc-dir__role" style={{ color: active ? undefined : blendHex }}>{label}</span>
        <span className="ff-disc-dir__title">{film.title}</span>
        {delta ? <span className="ff-disc-dir__delta">{delta}</span> : null}
        <span className="ff-disc-dir__now" aria-hidden="true">{active ? 'Now showing' : 'Bring forward'}</span>
      </span>
    </button>
  )
}
