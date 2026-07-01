// "{firstName} by the numbers" — real charts from existing derivations. No chart dependency
// (SVG/CSS only). Every chart has visible labels + a text alternative; no meaning by color alone.
// Faithful to the prototype: 12-col grid (trend 8 / ratings 4 / eras 7 / rhythm 5) + the rhythm
// conic-gradient ring + legend + runtime band. Honest deviations: "countries"→Decades (no country
// data), KPIs films/avg/reviews/hours (no "rewatches" model).
import { useState } from 'react'

const RATING_LABELS = ['½', '1', '1½', '2', '2½', '3', '3½', '4', '4½', '5']
const DAYPART_COLOR = { Evening: 'var(--dna-coral)', Afternoon: 'var(--dna-gold)', Late: 'var(--dna-blue)', Morning: '#4d5052' }

function TrendChart({ points, label }) {
  if (!points.length) return <p className="dna-empty">Not enough history yet.</p>
  const W = 720, H = 250, L = 34, R = 18, T = 18, B = 35
  const max = Math.max(...points.map((p) => p.count), 5)
  const iw = W - L - R, ih = H - T - B
  const xs = points.map((p, i) => L + (points.length === 1 ? iw / 2 : (i * iw) / (points.length - 1)))
  const ys = points.map((p) => T + ih - (p.count / max) * ih)
  const line = points.map((p, i) => `${i ? 'L' : 'M'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  const area = `${line} L ${xs[xs.length - 1].toFixed(1)} ${(H - B).toFixed(1)} L ${xs[0].toFixed(1)} ${(H - B).toFixed(1)} Z`
  return (
    <div className="dna-trend" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs><linearGradient id="dnaTrendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--dna-coral)" stopOpacity=".24" /><stop offset="1" stopColor="var(--dna-coral)" stopOpacity="0" /></linearGradient></defs>
        {[0, 0.5, 1].map((t) => { const y = T + ih - t * ih; return <line key={t} x1={L} y1={y} x2={W - R} y2={y} stroke="rgba(245,242,235,.075)" strokeWidth="1" /> })}
        <path d={area} fill="url(#dnaTrendFill)" />
        <path d={line} fill="none" stroke="var(--dna-coral-2)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => <circle key={i} cx={xs[i]} cy={ys[i]} r="4.5" fill={i === points.length - 1 ? 'var(--dna-coral-2)' : 'var(--color-text-primary,#f5f2eb)'}><title>{p.label}: {p.count}</title></circle>)}
        {points.map((p, i) => <text key={i} x={xs[i]} y={H - 9} textAnchor="middle" fill="var(--color-text-muted,#a5a198)" fontSize="10">{p.label}</text>)}
      </svg>
    </div>
  )
}

function RatingBars({ buckets }) {
  if (!buckets.length) return <p className="dna-empty">No ratings yet.</p>
  const max = Math.max(...buckets.map((b) => b.count), 1)
  return (
    <div className="dna-bars" role="img" aria-label={`Ratings distribution across ${buckets.reduce((s, b) => s + b.count, 0)} ratings.`}>
      {buckets.map((b, i) => (
        <div className="dna-bar" key={i}>
          <span className="dna-bar__count">{b.count || ''}</span>
          <div className="dna-bar__track"><div className="dna-bar__fill" style={{ height: `${b.count ? Math.max(4, (b.count / max) * 100) : 0}%` }} /></div>
          <span className="dna-bar__label">{RATING_LABELS[i]}</span>
        </div>
      ))}
    </div>
  )
}

function DecadeBars({ decades }) {
  if (!decades.length) return <p className="dna-empty">Not enough films with release dates yet.</p>
  const max = Math.max(...decades.map((d) => d.pct), 1)
  return (
    <div className="dna-hbars" role="img" aria-label={`Films by decade: ${decades.map((d) => `${d.d} ${d.pct}%`).join(', ')}`}>
      {decades.map((d) => (
        <div className="dna-hbar" key={d.d}>
          <span className="dna-hbar__name">{d.d}</span>
          <div className="dna-hbar__track"><div className="dna-hbar__fill" style={{ width: `${(d.pct / max) * 100}%` }} /></div>
          <span className="dna-hbar__val">{d.pct}%</span>
        </div>
      ))}
    </div>
  )
}

function RhythmRing({ daypart }) {
  // Build a conic-gradient from the four daypart percentages (order: Morning/Afternoon/Evening/Late).
  const order = ['Evening', 'Afternoon', 'Late', 'Morning']
  const byLabel = Object.fromEntries(daypart.map((d) => [d.label, d.pct]))
  let acc = 0
  const stops = order.map((label) => { const from = acc; acc += byLabel[label] || 0; return `${DAYPART_COLOR[label]} ${from}% ${acc}%` })
  const top = [...daypart].sort((a, b) => b.pct - a.pct)[0]
  return (
    <div className="dna-rhythm">
      <div className="dna-rhythm__ring" style={{ '--_ring': `conic-gradient(${stops.join(', ')})` }} aria-hidden="true">
        <div className="dna-rhythm__center"><strong>{top ? `${top.pct}%` : '—'}</strong><span>{top ? top.label.toLowerCase() : ''}</span></div>
      </div>
      <div className="dna-rhythm__legend" role="img" aria-label={`Viewing time: ${daypart.map((d) => `${d.label} ${d.pct}%`).join(', ')}`}>
        {order.map((label) => (
          <div className="dna-rhythm__item" key={label}><i style={{ '--_c': DAYPART_COLOR[label] }} /><span>{label === 'Late' ? 'Late night' : label}</span><b>{byLabel[label] || 0}%</b></div>
        ))}
      </div>
    </div>
  )
}

export default function DnaStats({ firstName, stats, charts, isOwner, sections, defaultPeriod = 'all' }) {
  const [period, setPeriod] = useState(defaultPeriod === 'year' ? 'year' : 'all')
  const trendPoints = period === 'all' ? charts.trendAll : charts.trendYear
  const trendLabel = period === 'all'
    ? `Films watched per year: ${charts.trendAll.map((p) => `${p.label} ${p.count}`).join(', ') || 'none'}`
    : `Films watched per month this year: ${charts.trendYear.map((p) => `${p.label} ${p.count}`).join(', ') || 'none'}`
  const rt = charts.runtime
  const showRhythm = isOwner || sections.viewingRhythm

  return (
    <section className="dna__section" aria-label="Statistics">
      <div className="dna__shell">
        <div className="dna__section-head">
          <div><p className="dna__eyebrow">{firstName || 'Member'} by the numbers</p><h2>A pattern only {isOwner ? 'you' : 'they'} could make.</h2></div>
          <div style={{ display: 'grid', gap: 14 }}>
            <p>Each chart answers one question about this film life. Nothing here is a ranking against other people.</p>
            <div className="dna-period" role="group" aria-label="Watch-history period">
              <button type="button" className={period === 'all' ? 'is-active' : ''} onClick={() => setPeriod('all')} aria-pressed={period === 'all'}>All time</button>
              <button type="button" className={period === 'year' ? 'is-active' : ''} onClick={() => setPeriod('year')} aria-pressed={period === 'year'}>{new Date().getFullYear()}</button>
            </div>
          </div>
        </div>

        <div className="dna-kpis">
          <div className="dna-kpi"><strong>{stats.filmsWatched}</strong><span>films watched</span></div>
          <div className="dna-kpi"><strong>{stats.avgStars != null ? stats.avgStars.toFixed(1) : '—'}</strong><span>average rating out of five</span></div>
          <div className="dna-kpi"><strong>{stats.reviews}</strong><span>reviews written</span></div>
          <div className="dna-kpi"><strong>{stats.hoursWatched}</strong><span>hours watched</span></div>
        </div>

        <div className="dna-charts">
          <article className="dna-chart dna-chart--trend">
            <div className="dna-chart__head"><div><small>Watch history</small><h3>{period === 'all' ? 'A film life over time.' : 'This year, month by month.'}</h3><p>{period === 'all' ? 'Films completed each year.' : 'Films completed each month, through the current month.'}</p></div><div className="dna-chart__num"><strong>{Math.max(0, ...trendPoints.map((p) => p.count))}</strong><span>peak</span></div></div>
            <TrendChart points={trendPoints} label={trendLabel} />
          </article>

          <article className="dna-chart dna-chart--ratings">
            <div className="dna-chart__head"><div><small>Rating language</small><h3>How strongly they respond.</h3><p>Every half-star rating given.</p></div><div className="dna-chart__num"><strong>{stats.avgStars != null ? stats.avgStars.toFixed(1) : '—'}</strong><span>average</span></div></div>
            <RatingBars buckets={charts.ratingBuckets} />
          </article>

          <article className="dna-chart dna-chart--geo">
            <div className="dna-chart__head"><div><small>Cinematic eras</small><h3>The decades {isOwner ? 'you' : 'they'} travel.</h3><p>Share of watched films by release decade.</p></div></div>
            <DecadeBars decades={charts.decades} />
          </article>

          <article className="dna-chart dna-chart--rhythm">
            <div className="dna-chart__head"><div><small>Viewing rhythm</small><h3>When they settle into a film.</h3><p>Time of day + preferred runtime.</p></div></div>
            {showRhythm && charts.daypart.length ? <RhythmRing daypart={charts.daypart} />
              : <p className="dna-empty">{showRhythm ? 'Time-of-day pattern isn’t available (looks like a bulk import).' : (isOwner ? 'Viewing rhythm is private by default — enable it in Edit profile.' : 'Viewing rhythm is private.')}</p>}
            {rt ? (
              <div className="dna-runtime">
                <div className="dna-runtime__top"><span>Preferred runtime</span><strong>{rt.band} min · median {rt.median}</strong></div>
                <div className="dna-runtime__track" role="img" aria-label={`Runtime: median ${rt.median} minutes, typical range ${rt.band} minutes.`}>
                  <div className="dna-runtime__range" style={{ left: '20%', right: '18%' }} /><div className="dna-runtime__dot" style={{ left: '52%' }} />
                </div>
              </div>
            ) : null}
          </article>
        </div>
        <p className="dna-stats-note">Every public statistic respects this member’s section-level visibility choices.</p>
      </div>
    </section>
  )
}
