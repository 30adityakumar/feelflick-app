// src/features/movie/ViewerNotes.jsx
// Honestly-reframed "critic quotes" (F6B). These come from `overlay.critic_quotes`,
// which the generate-movie-overlay edge function produces as INVENTED friend-voice
// personas (its prompt: "friend-voice not critic-voice… invent a persona… No real
// critic names"). They are NOT real reviews from real critics/outlets — so this
// section must never imply that.
//
// Reframed from the old "CriticQuotes / Voices" section: a "Viewer notes" label +
// an explicit disclaimer that these are FeelFlick-generated impressions, not real
// reviews. Content is kept (it captures the vibe); only the misleading framing is
// removed. Extracted to its own file so the honest framing is unit-testable.

import Eyebrow from '@/shared/ui/Eyebrow'
import { FILM_PALETTE, HP } from './data'

/**
 * @param {object} props
 * @param {Array<{quote:string, author?:string, outlet?:string}>|null} props.notes
 * @returns {JSX.Element|null}
 */
export default function ViewerNotes({ notes }) {
  if (!notes || notes.length === 0) return null
  return (
    <section className="ff-movie-section" style={{ padding: '48px 88px', borderTop: `1px solid ${HP.border}`, background: 'rgba(255,255,255,0.012)' }}>
      <Eyebrow rule color={HP.purple} style={{ marginBottom: 10 }}>Viewer notes</Eyebrow>
      {/* The honesty line — these are generated, not real reviews. */}
      <p style={{ margin: '0 0 24px 0', fontSize: 12, lineHeight: 1.5, color: HP.textMuted, fontFamily: 'Outfit, Inter, sans-serif', maxWidth: 560 }}>
        Illustrative impressions FeelFlick generated to capture how the film feels —
        not real reviews or quotes from real critics.
      </p>
      <div className="ff-movie-critic-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }}>
        {notes.map((q, i) => (
          <blockquote key={i} style={{ margin: 0, paddingLeft: 22, borderLeft: `2px solid ${i === 0 ? FILM_PALETTE.primary : HP.purple}` }}>
            <p style={{ margin: 0, fontFamily: 'Outfit, Inter, sans-serif', fontSize: 18, lineHeight: 1.5, color: HP.text, fontStyle: 'italic', letterSpacing: '-0.012em', textWrap: 'pretty' }}>
              “{q.quote}”
            </p>
            {(q.author || q.outlet) && (
              <footer style={{ marginTop: 14, fontSize: 11, color: HP.textMuted, fontFamily: 'Outfit', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <span style={{ color: HP.textSoft, fontWeight: 600 }}>{q.author || 'A viewer'}</span>
                {q.outlet ? <> · {q.outlet}</> : null}
              </footer>
            )}
          </blockquote>
        ))}
      </div>
    </section>
  )
}
