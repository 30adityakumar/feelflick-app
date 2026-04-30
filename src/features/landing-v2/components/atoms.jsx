// src/features/landing-v2/components/atoms.jsx
// Tiny presentational atoms used across all v2 sections.
// Inline-styled (not Tailwind) to keep the design DNA portable from the prototype.
import { BRAND, tmdbImg } from '@/features/landing-v2/theme'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'

export function FFMark({ size = 28 }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%',
        background: BRAND.gradient, color: '#fff',
        fontWeight: 900, fontSize: size * 0.42, letterSpacing: '-0.04em',
        boxShadow: '0 4px 16px rgba(168,85,247,0.4)',
      }}
    >FF</span>
  )
}

export function Wordmark({ size = 22 }) {
  return (
    <span style={{
      fontSize: size, fontWeight: 900, letterSpacing: '-0.02em',
      background: BRAND.gradient, WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    }}>FEELFLICK</span>
  )
}

export function PrimaryCTA({ label, full, size = 'lg', onClick }) {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()
  const padX = size === 'lg' ? 32 : 22
  const padY = size === 'lg' ? 14 : 11
  return (
    <button
      onClick={onClick ?? signInWithGoogle}
      disabled={isAuthenticating}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: `${padY}px ${padX}px`,
        borderRadius: 999,
        background: BRAND.gradient,
        color: '#fff',
        fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em',
        border: 'none',
        boxShadow: '0 10px 30px rgba(168,85,247,0.30), inset 0 1px 0 rgba(255,255,255,0.15)',
        cursor: 'pointer',
        width: full ? '100%' : 'auto',
        fontFamily: 'inherit',
      }}>
      {label}
      <span style={{ fontSize: 14 }}>→</span>
    </button>
  )
}

export function SectionEyebrow({ label, color = 'rgba(192,132,252,0.75)' }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
      textTransform: 'uppercase', color, margin: 0,
    }}>{label}</p>
  )
}

// `data` should be a POSTERS entry: { path, title, year, tag }
export function Poster({ data, w, badge, withTag = false, accent }) {
  return (
    <div style={{
      width: w, aspectRatio: '2/3',
      borderRadius: 14, overflow: 'hidden',
      background: '#0a0a0f',
      border: '1px solid rgba(255,255,255,0.08)',
      position: 'relative',
      flexShrink: 0,
      boxShadow: accent
        ? `0 0 0 1px ${accent}66, 0 12px 40px ${accent}33`
        : '0 12px 32px rgba(0,0,0,0.5)',
    }}>
      <img
        src={tmdbImg('w342', data.path)}
        alt={data.title || ''}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="lazy"
      />
      {withTag && data.tag && (
        <>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 44,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
            pointerEvents: 'none',
          }} />
          <span style={{
            position: 'absolute', top: 8, right: 10,
            fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)',
          }}>{data.tag}</span>
        </>
      )}
      {badge !== undefined && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          padding: '3px 8px', borderRadius: 999,
          background: accent ? `linear-gradient(135deg, ${accent}45, ${accent}22)` : 'rgba(168,85,247,0.25)',
          border: `1px solid ${accent ? accent + '55' : 'rgba(168,85,247,0.45)'}`,
          backdropFilter: 'blur(8px)',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
          color: accent || '#c4b5fd',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <span>{badge}%</span>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>match</span>
        </div>
      )}
    </div>
  )
}
