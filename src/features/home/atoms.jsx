// FeelFlick — Home atoms / primitives.
// SmartImg now takes a film object (not a key) since runtime films come
// from useHomeData. HPNav is removed — AppShell owns the global TopNav.

import { useState } from 'react'
import { HP } from './data'
import { tmdbImg, posterSrcSet } from '@/shared/api/tmdb'

export function FFMark({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: '#DD4E83', color: '#fff',
      fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: size * 0.5,
      letterSpacing: '-0.02em',
      boxShadow: '0 4px 18px -2px rgba(221,78,131,0.35)',
    }}>FF</div>
  )
}

// `film` is now an object: { id, tmdbId, title, year, poster, ... } — the
// shape useHomeData.shapeFilm returns. Pass that directly.
//
// Responsive serving: each <img> emits a srcSet with TMDB poster widths
// (w154/w342/w500). The browser picks the right one based on the rendered
// width × device pixel ratio. Pass `sizes` to tell the browser what width
// the image renders at — defaults assume a poster-card-in-a-3-col-grid:
// full width on mobile, half on tablet, ~260px on desktop. Callers
// rendering smaller thumbnails should override `sizes`.
export function SmartImg({
  film,
  alt,
  style,
  big = false,
  sizes = '(min-width: 1024px) 260px, (min-width: 640px) 50vw, 100vw',
}) {
  const [failed, setFailed] = useState(false)
  if (!film) return <div style={{ ...style, background: 'rgba(255,255,255,0.04)' }} />
  const path = film.poster
  if (failed || !path) {
    // Stage 2 — neutral graphite missing-poster placeholder (was a per-film
    // purple/pink gradient). No contextual/legacy colour; the title carries identity.
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'flex-end', padding: big ? 28 : 14, background: 'var(--ts-surface-2, #241e19)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), transparent 50%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.4), transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: big ? 42 : 18, lineHeight: 1, letterSpacing: '-0.02em', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>{film.title}</div>
          <div style={{ fontSize: big ? 13 : 10, color: 'rgba(255,255,255,0.75)', marginTop: big ? 8 : 4, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>{film.year}</div>
        </div>
      </div>
    )
  }
  return (
    <img
      src={tmdbImg(path, 'w342')}
      srcSet={posterSrcSet(path)}
      sizes={sizes}
      alt={alt || film.title}
      style={style}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}

export function Stars({ value, size = 12 }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < value ? HP.amber : 'transparent'} stroke={i < value ? HP.amber : HP.textFaint} strokeWidth="2">
          <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
        </svg>
      ))}
    </div>
  )
}
