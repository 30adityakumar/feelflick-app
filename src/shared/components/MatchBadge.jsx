// src/shared/components/MatchBadge.jsx
import { useEffect, useId, useState } from 'react'
import { HP } from '@/shared/lib/tokens'

/**
 * Canonical "% match" indicator — ONE source of truth for what was previously
 * reimplemented as two near-identical `MatchRing` copies (home + movie) plus
 * inline "X% MATCH" overlay pills (landing + movie/similar). Extracted in the
 * consistency refactor so the match indicator can be perfected in one place.
 *
 * Variants:
 *   • `ring`  — animated SVG progress ring (the corner medallion on a poster).
 *   • `pill`  — compact "X% MATCH" overlay chip (top-left of a poster).
 *
 * The accent stays a prop because it's legitimately contextual (brand purple on
 * /movie + /home; the mood hex on the landing's mood-tinted example cards).
 *
 * @param {object}  props
 * @param {number}  props.pct      0–100 match percentage.
 * @param {'ring'|'pill'} [props.variant='ring']
 * @param {number}  [props.size=72]        Ring diameter in px (ring only).
 * @param {string}  [props.accent]         Primary accent (gradient start + label / pill text+border).
 * @param {string}  [props.accent2]        Gradient end (ring only).
 * @param {object}  [props.style]          Merged onto the root — use for positioning + shadow overrides.
 * @param {object}  [props.classes]        Optional { root, num, pct, label } class hooks for responsive CSS (ring only).
 * @returns {JSX.Element|null}
 */
export default function MatchBadge({ variant = 'ring', ...props }) {
  if (variant === 'pill') return <MatchPill {...props} />
  return <MatchRing {...props} />
}

function MatchRing({
  pct,
  size = 72,
  accent = HP.purple,
  accent2 = HP.pink,
  style,
  classes = {},
}) {
  const id = useId()
  const gradId = `match-ring-${id.replace(/:/g, '')}` // unique per instance — no #ring collisions
  const [v, setV] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setV(pct || 0), 250)
    return () => clearTimeout(t)
  }, [pct])
  const dash = v * 0.943 // 0..100 → 0..94.3, matching the SVG circle r=15 circumference

  return (
    <div
      className={classes.root}
      style={{
        position: 'absolute', width: size, height: size, borderRadius: 999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 28px -6px rgba(0,0,0,0.6)',
        ...style,
      }}
    >
      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeDasharray={`${dash} 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.2,0.8,0.2,1)' }} />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor={accent2} />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className={classes.num} style={{ fontFamily: 'Outfit', fontSize: Math.round(size * 0.31), fontWeight: 300, color: HP.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {v}<span className={classes.pct} style={{ fontSize: Math.round(size * 0.16), color: HP.textMuted, marginLeft: 1 }}>%</span>
        </span>
        <span className={classes.label} style={{ fontSize: Math.round(size * 0.095), fontWeight: 700, color: accent, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>Match</span>
      </div>
    </div>
  )
}

function MatchPill({ pct, accent = HP.purple, style }) {
  return (
    <div
      style={{
        position: 'absolute', top: 10, left: 10,
        padding: '4px 8px', borderRadius: 3,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
        border: `1px solid ${accent}44`,
        fontFamily: 'Outfit', fontSize: 9.5, fontWeight: 700,
        color: accent, letterSpacing: '0.06em',
        ...style,
      }}
    >
      {pct}% MATCH
    </div>
  )
}
