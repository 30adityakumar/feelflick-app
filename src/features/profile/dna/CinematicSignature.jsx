// src/features/profile/dna/CinematicSignature.jsx
// Three views of the same taste: mood signature (radar), top genre (ranked bars), and
// signature tones (weighted cloud). Fulfills the original, never-shipped "radar" intent left
// in derive.js's own comments (deriveMoods), and finally gives deriveMotifs (tone tags) a home
// — both were already computed but unrendered anywhere on /DNA before this section.
//
// Deliberately three different chart techniques so the section explores different
// visualizations rather than repeating one bar-chart grammar three times. All pure SVG/CSS,
// no charting library, matching this codebase's convention. Colors are a local, muted hue
// cycle (--rose-h/--amber-h/--blue-h/--violet-h/--mint-h) — not the bright MOOD_PALETTE used
// elsewhere in derive.js, and never --accent (coral), which stays reserved for marks/links/
// progress rather than chart-body atmosphere.

import { MIN_GENRED_FILMS_FOR_GENRE_BARS } from '../derive'

const MOOD_RADAR_MAX = 5
const MIN_MOODS_FOR_RADAR = 3
const MIN_TAGS_FOR_CLOUD = 4
const TONE_CLOUD_MAX = 10

const RADAR_PALETTE = ['var(--rose-h)', 'var(--amber-h)', 'var(--blue-h)', 'var(--violet-h)', 'var(--mint-h)']
const GENRE_PALETTE = ['var(--rose-h)', 'var(--blue-h)', 'var(--amber-h)', 'var(--mint-h)', 'var(--violet-h)']
const TONE_PALETTE = ['var(--rose-h)', 'var(--amber-h)', 'var(--blue-h)', 'var(--violet-h)', 'var(--mint-h)']

const moodRank = (i) => (i === 0 ? 'strongest signal' : i < 3 ? 'strong signal' : 'developing signal')

// Fulfills evidence gating for the whole section — exported so TasteProfile.jsx's nav-array
// condition reuses the exact same predicate this component uses for its own render guard.
export function hasSignatureEvidence({ moods, genres, motifs }) {
  return (moods?.length > 0) || Boolean(genres) || (motifs?.length > 0)
}

function radarPoint(i, n, fracR, cx, cy, R) {
  const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
  return { x: cx + R * fracR * Math.cos(angle), y: cy + R * fracR * Math.sin(angle), angle }
}

function polygonPoints(n, fracR, cx, cy, R) {
  return Array.from({ length: n }, (_, i) => {
    const p = radarPoint(i, n, fracR, cx, cy, R)
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')
}

function MoodRadar({ moods, Poss }) {
  const shown = moods.slice(0, MOOD_RADAR_MAX)
  if (shown.length < MIN_MOODS_FOR_RADAR) {
    return (
      <p className="ff-dna-signature__calibrating">
        A shape of {Poss.toLowerCase()} mood signature appears once a few more distinct moods show up. So far: {shown.length} of {MIN_MOODS_FOR_RADAR} moods needed.
      </p>
    )
  }
  const n = shown.length
  const cx = 160, cy = 160, R = 120
  const dataPts = shown.map((m, i) => radarPoint(i, n, Math.max(0.06, Math.min(1, m.weight)), cx, cy, R))
  const top3 = shown.slice(0, 3).map((m) => m.name).join(', ')
  return (
    <>
      <figure className="ff-dna-radar" aria-labelledby="ff-dna-signature-h2" aria-describedby="ff-dna-radar-summary">
        {/* viewBox extends beyond the 320x320 chart geometry (cx/cy stay 160,160) so long axis
            labels — e.g. "Heartwarming" — have room to render without clipping at the card edge. */}
        <svg aria-hidden="true" viewBox="-50 -10 420 340" className="ff-dna-radar__svg">
          <defs>
            <linearGradient id="ffDnaRadarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--violet-h)" stopOpacity=".4" />
              <stop offset="100%" stopColor="var(--rose-h)" stopOpacity=".16" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((frac) => (
            <polygon key={frac} points={polygonPoints(n, frac, cx, cy, R)} className="ff-dna-radar__grid" />
          ))}
          {shown.map((m, i) => {
            const p = radarPoint(i, n, 1, cx, cy, R)
            return <line key={m.name} x1={cx} y1={cy} x2={p.x} y2={p.y} className="ff-dna-radar__spoke" />
          })}
          <polygon points={dataPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} className="ff-dna-radar__shape" />
          {dataPts.map((p, i) => (
            <circle
              key={shown[i].name}
              cx={p.x}
              cy={p.y}
              r={i === 0 ? 7 : 5}
              className="ff-dna-radar__dot-svg"
              style={{ '--c': RADAR_PALETTE[i % RADAR_PALETTE.length] }}
            />
          ))}
          {shown.map((m, i) => {
            const p = radarPoint(i, n, 1, cx, cy, R)
            const labelR = R + 26
            const lx = cx + labelR * Math.cos(p.angle)
            const ly = cy + labelR * Math.sin(p.angle)
            const cos = Math.cos(p.angle), sin = Math.sin(p.angle)
            const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
            const dy = sin > 0.3 ? '.9em' : sin < -0.3 ? '-.3em' : '.35em'
            return (
              <text
                key={m.name}
                x={lx}
                y={ly}
                textAnchor={anchor}
                dy={dy}
                className={i === 0 ? 'ff-dna-radar__label ff-dna-radar__label--top' : 'ff-dna-radar__label'}
              >
                {m.name}
              </text>
            )
          })}
        </svg>
      </figure>
      <p id="ff-dna-radar-summary" className="ff-dna-radar__summary">{Poss} strongest mood signals are {top3}.</p>
      {/* Full per-mood detail (name, film count, rank) stays available to assistive tech — the
          chart + one summary sentence carry the visible surface so the card reads as one clean
          shape instead of a chart followed by a second, redundant list restating it. */}
      <ol className="sr-only">
        {shown.map((m, i) => (
          <li key={m.name}>{m.name} — {moodRank(i)}, {m.count} film{m.count === 1 ? '' : 's'}</li>
        ))}
      </ol>
    </>
  )
}

function GenreBars({ genres, subjectName }) {
  if (!genres || genres.genredTotal < MIN_GENRED_FILMS_FOR_GENRE_BARS) {
    return (
      <p className="ff-dna-signature__calibrating">
        So far: {genres?.genredTotal ?? 0} of {MIN_GENRED_FILMS_FOR_GENRE_BARS} genre-tagged films needed.
      </p>
    )
  }
  if (!genres.eligible && genres.distinctCount === 1) {
    return (
      <p className="ff-dna-signature__calibrating">
        So far, every genre-tagged film {subjectName ? 'they’ve' : 'you’ve'} watched has been {genres.genres[0].genre}.
      </p>
    )
  }
  const maxPct = Math.max(...genres.genres.map((entry) => entry.pct))
  return (
    <div className="ff-dna-genrebar" role="img" aria-label={`Top genres: ${genres.genres.map((g) => `${g.genre} ${g.pct}%`).join(', ')}`}>
      {genres.genres.map((g, i) => (
        <div className="ff-dna-genrebar__col" key={g.genre}>
          <div className="ff-dna-genrebar__value">{g.pct}%</div>
          <div className="ff-dna-genrebar__bar" style={{ '--h': `${Math.max(4, (g.pct / maxPct) * 100)}%`, '--c': GENRE_PALETTE[i % GENRE_PALETTE.length] }} />
          <div className="ff-dna-genrebar__label">{g.genre}<span>{g.count} film{g.count === 1 ? '' : 's'}</span></div>
        </div>
      ))}
    </div>
  )
}

function ToneCloud({ motifs, Poss }) {
  if (motifs.length < MIN_TAGS_FOR_CLOUD) {
    return (
      <p className="ff-dna-signature__calibrating">
        A cloud of {Poss.toLowerCase()} recurring tones appears once a few more tone-tagged films build up. So far: {motifs.length} of {MIN_TAGS_FOR_CLOUD} distinct tones.
      </p>
    )
  }
  const shown = motifs.slice(0, TONE_CLOUD_MAX)
  return (
    <div className="ff-dna-tonecloud" role="img" aria-label={`Signature tones: ${shown.map((m) => `${m.tag} ${Math.round(m.w * 100)}%`).join(', ')}`}>
      {shown.map((m, i) => {
        const hue = TONE_PALETTE[i % TONE_PALETTE.length]
        // Weight is conveyed three ways at once — size, color saturation (vivid hue at high
        // weight fading to muted gray at low weight), and font-weight — never by size alone.
        const tilt = (i % 2 === 0 ? -1 : 1) * (2 + (i % 3) * 2)
        return (
          <span
            key={m.tag}
            className="ff-dna-tonechip"
            style={{
              fontSize: `${(0.78 + m.w * 1.5).toFixed(2)}rem`,
              fontWeight: m.w > 0.66 ? 760 : m.w > 0.33 ? 600 : 500,
              color: `color-mix(in srgb, ${hue} ${Math.round(20 + m.w * 80)}%, var(--text-3))`,
              transform: `rotate(${tilt}deg)`,
            }}
            title={`${m.tag} — ${Math.round(m.w * 100)}% relative weight`}
          >
            {m.tag}
          </span>
        )
      })}
    </div>
  )
}

export default function CinematicSignature({ moods = [], genres = null, motifs = [], subjectName = null }) {
  if (!hasSignatureEvidence({ moods, genres, motifs })) return null
  const Poss = subjectName ? `${subjectName}'s` : 'Your'
  const pronoun = subjectName ? 'they' : 'you'
  return (
    <section className="ff-dna-section" id="dna-signature" aria-labelledby="ff-dna-signature-h2">
      <div className="ff-dna__shell">
        <div className="ff-dna-section__head">
          <div>
            <p className="ff-dna-eyebrow">{Poss} cinematic signature</p>
            <h2 id="ff-dna-signature-h2">What {pronoun} lean into.</h2>
          </div>
          <p>Three views of the same taste — the moods {pronoun} return to, the genres {pronoun} favor, and the tones that recur.</p>
        </div>
        <div className="ff-dna-signature">
          <article className="ff-dna-signature__card ff-dna-signature__mood">
            <div className="ff-dna-signature__head">
              <small>Mood signature</small>
              <h3>The moods {pronoun} return to.</h3>
              <p>Weighted by how often each mood shows up across {Poss.toLowerCase()} history.</p>
            </div>
            <MoodRadar moods={moods} Poss={Poss} />
          </article>
          <article className="ff-dna-signature__card ff-dna-signature__genre">
            <div className="ff-dna-signature__head">
              <small>Top genre</small>
              <h3>What {pronoun} watch most.</h3>
              <p>Ranked by watch count among genre-tagged films.</p>
            </div>
            <GenreBars genres={genres} subjectName={subjectName} />
          </article>
          <article className="ff-dna-signature__card ff-dna-signature__tone">
            <div className="ff-dna-signature__head">
              <small>Signature tones</small>
              <h3>The tones that recur.</h3>
              <p>Sized by how often each tone appears, relative to {Poss.toLowerCase()} strongest one.</p>
            </div>
            <ToneCloud motifs={motifs} Poss={Poss} />
          </article>
        </div>
      </div>
    </section>
  )
}
