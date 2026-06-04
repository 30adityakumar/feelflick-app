// src/features/share/ShareCard.jsx
// FeelFlick — Share Studio. A shareable, downloadable "Tonight's Pick" card.
//
// The wedge, made postable: one film, its mood, and the line that makes its case
// — rendered as a Criterion/A24-style editorial object the user can drop into a
// story or feed. Atmosphere over flatness: mood-tinted gradient mesh, film grain,
// a dramatic poster halo, Outfit display + the italic "because" payload.
//
// Pure on-brand: ink #06060a, Outfit/Inter (loaded globally), purple→pink, and
// the pick's own mood hex as the single tint that ties the whole card together.
// Export via html-to-image → a real PNG at 2× for crisp social crops.

import { useCallback, useMemo, useRef, useState } from 'react'
import { Download, Loader2, Check } from 'lucide-react'
import { toPng } from 'html-to-image'
import { HP } from '@/shared/lib/tokens'

// === Demo pick — the same Past Lives the landing leads with ===================
const DEMO_PICK = {
  title: 'Past Lives',
  year: 2023,
  director: 'Celine Song',
  runtime: '1h 45m',
  poster: 'https://image.tmdb.org/t/p/w780/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
  mood: 'Tender',
  moodHex: '#F472B6',
  matchPct: 94,
  because: 'A slow ache that lives in glances — two strangers in a New York bar who were children once, in Seoul.',
}

// Three share crops. Each renders at full export resolution; the studio scales
// the preview down with a CSS transform (html-to-image still captures full-size).
const FORMATS = {
  portrait: { id: 'portrait', label: '4:5 · Feed',  w: 1080, h: 1350 },
  story:    { id: 'story',    label: '9:16 · Story', w: 1080, h: 1920 },
  square:   { id: 'square',   label: '1:1 · Square', w: 1080, h: 1080 },
}

// Film grain — fractal-noise SVG as a data URI, blended over the card so the void
// reads as a screen, not a flat fill. The fingerprint of every FeelFlick surface.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'

/**
 * The card artifact itself — fixed-pixel so html-to-image captures it cleanly.
 * @param {{ pick: object, format: {w:number,h:number}, cardRef?: object }} props
 */
function PickCard({ pick, format, cardRef }) {
  const { w, h } = format
  const tint = pick.moodHex
  // Scale a few key sizes with the canvas height so the story crop doesn't look
  // sparse and the square doesn't crowd — one composition, three honest fits.
  const tall = h >= 1900
  const sq = h <= 1080

  return (
    <div
      ref={cardRef}
      style={{
        width: w, height: h, position: 'relative', overflow: 'hidden',
        background: '#06060a', color: '#FAFAFA',
        fontFamily: 'Inter, sans-serif',
        display: 'flex', flexDirection: 'column',
        padding: sq ? '64px 72px' : '84px 84px 76px',
      }}
    >
      {/* ── Atmosphere: mood-tinted gradient mesh ─────────────────────────── */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(120% 70% at 12% -8%, ${tint}3a 0%, transparent 52%),
          radial-gradient(90% 60% at 100% 8%, ${tint}1c 0%, transparent 55%),
          radial-gradient(140% 80% at 88% 112%, #ec48991f 0%, transparent 58%),
          radial-gradient(100% 60% at 50% 50%, #9333ea12 0%, transparent 70%)
        `,
      }} />
      {/* Vignette — pulls the eye in, frames the poster */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(120% 100% at 50% 38%, transparent 46%, rgba(0,0,0,0.55) 100%)',
      }} />
      {/* Film grain */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: GRAIN, backgroundSize: '200px 200px',
        opacity: 0.05, mixBlendMode: 'overlay',
      }} />

      {/* ── Eyebrow: wordmark · mood kicker ───────────────────────────────── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 700,
          letterSpacing: '-0.01em',
          background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>FEELFLICK</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 700,
          letterSpacing: '0.30em', textTransform: 'uppercase', color: tint,
        }}>
          <span aria-hidden style={{ width: 26, height: 2, borderRadius: 2, background: tint, opacity: 0.7 }} />
          Tonight’s Pick
        </div>
      </div>

      {/* ── Poster, haloed ────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', display: 'flex', justifyContent: 'center',
        marginTop: tall ? 96 : sq ? 28 : 64,
        marginBottom: tall ? 84 : sq ? 28 : 56,
        flex: sq ? '0 0 auto' : '0 1 auto',
      }}>
        {/* Mood halo behind the poster */}
        <div aria-hidden style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: sq ? 360 : 560, height: sq ? 360 : 560, borderRadius: '50%',
          background: `radial-gradient(circle, ${tint}55 0%, transparent 68%)`,
          filter: 'blur(46px)',
        }} />
        <div style={{ position: 'relative', width: sq ? 300 : 460 }}>
          <img
            src={pick.poster}
            alt={pick.title}
            crossOrigin="anonymous"
            style={{
              width: '100%', aspectRatio: '2/3', objectFit: 'cover',
              borderRadius: 8, display: 'block',
              boxShadow: `0 50px 110px -30px rgba(0,0,0,0.92), 0 0 0 1px ${tint}33, inset 0 0 0 1px rgba(255,255,255,0.05)`,
            }}
          />
          {/* Match medallion — bottom-right, mood-tinted glass */}
          <div style={{
            position: 'absolute', bottom: -22, right: -22,
            width: 96, height: 96, borderRadius: '50%',
            background: 'rgba(6,6,10,0.82)', backdropFilter: 'blur(10px)',
            border: `1px solid ${tint}55`,
            boxShadow: `0 18px 40px -12px rgba(0,0,0,0.7), 0 0 30px -6px ${tint}66`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1, color: '#FAFAFA' }}>
              {pick.matchPct}<span style={{ fontSize: 15, color: tint }}>%</span>
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: tint, marginTop: 3 }}>Match</div>
          </div>
        </div>
      </div>

      {/* ── Editorial block: mood · title · meta · the case ───────────────── */}
      <div style={{ position: 'relative', marginTop: 'auto' }}>
        {/* Mood chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 9,
          padding: '7px 15px', borderRadius: 999, marginBottom: 22,
          background: `${tint}1c`, border: `1px solid ${tint}55`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: tint, boxShadow: `0 0 10px ${tint}` }} />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#FAFAFA', letterSpacing: '0.01em' }}>{pick.mood}</span>
        </div>

        {/* Title — Outfit display, the hero scale */}
        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontSize: sq ? 64 : 92, fontWeight: 300,
          letterSpacing: '-0.05em', lineHeight: 0.94, margin: 0, color: '#FAFAFA',
          textWrap: 'balance',
        }}>{pick.title}</h1>

        {/* Meta */}
        <div style={{
          marginTop: 18, fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 500,
          letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(250,250,250,0.55)',
          display: 'flex', flexWrap: 'wrap', gap: 12,
        }}>
          <span>{pick.year}</span>
          <span style={{ color: `${tint}99` }}>·</span>
          <span>{pick.director}</span>
          <span style={{ color: `${tint}99` }}>·</span>
          <span>{pick.runtime}</span>
        </div>

        {/* The case — the emotional payload, italic, mood-hex rule */}
        <p style={{
          margin: '30px 0 0 0', paddingLeft: 22, borderLeft: `2px solid ${tint}`,
          fontFamily: 'Inter, sans-serif', fontStyle: 'italic', fontWeight: 400,
          fontSize: sq ? 21 : 26, lineHeight: 1.5, color: 'rgba(250,250,250,0.82)',
          maxWidth: 760, textWrap: 'pretty',
        }}>“{pick.because}”</p>

        {/* Footer: tagline + gradient signature */}
        <div style={{ marginTop: tall ? 72 : 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 400, color: 'rgba(250,250,250,0.7)' }}>
            The right film. <span style={{ fontStyle: 'italic', color: tint }}>Right now.</span>
          </div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(250,250,250,0.32)' }}>
            feelflick.com
          </div>
        </div>
      </div>

      {/* Brand gradient bar — the signature seal */}
      <div aria-hidden style={{ position: 'absolute', left: 0, bottom: 0, height: 8, width: '100%', background: GRAD }} />
    </div>
  )
}

// === Studio — preview + format toggle + download =============================
export default function ShareStudio({ pick = DEMO_PICK }) {
  const cardRef = useRef(null)
  const [formatId, setFormatId] = useState('portrait')
  const [status, setStatus] = useState('idle') // idle | working | done | error
  const format = FORMATS[formatId]

  // Fit the (up to 1080×1920) card into the viewport preview column.
  const previewScale = useMemo(() => {
    const maxW = 360, maxH = 560
    return Math.min(maxW / format.w, maxH / format.h)
  }, [format])

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    setStatus('working')
    try {
      // 2× for crisp social crops. cacheBust avoids stale poster fetches; the
      // pixelRatio is applied on top of the card's true pixel size.
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2, cacheBust: true, backgroundColor: '#06060a',
      })
      const a = document.createElement('a')
      a.download = `feelflick-${pick.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${format.id}.png`
      a.href = dataUrl
      a.click()
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2200)
    } catch (err) {
      // Most common cause: the cross-origin TMDB poster tainting the canvas.
      // In-product this card is fed a proxied/same-origin poster, so it's clean.
      console.warn('[ShareStudio] export failed:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3200)
    }
  }, [pick.title, format.id])

  return (
    <div style={{
      minHeight: '100vh', background: '#06060a', color: '#FAFAFA',
      fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '64px 24px 96px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Studio ambient */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(90% 50% at 50% -5%, ${pick.moodHex}14 0%, transparent 55%), radial-gradient(70% 50% at 100% 100%, #9333ea10 0%, transparent 60%)`,
      }} />

      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.30em', textTransform: 'uppercase', color: HP.purple, marginBottom: 14 }}>
          Share Studio
        </div>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 300, letterSpacing: '-0.045em', lineHeight: 1, margin: 0 }}>
          Post your <em style={{ fontStyle: 'italic', color: pick.moodHex }}>pick.</em>
        </h1>
        <p style={{ marginTop: 16, fontFamily: 'Inter, sans-serif', fontSize: 15, color: 'rgba(250,250,250,0.6)', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          One film, its mood, and the line that makes its case — as a card built for a story or feed.
        </p>
      </div>

      {/* Preview — the card at true resolution, scaled to fit */}
      <div style={{
        position: 'relative',
        width: format.w * previewScale, height: format.h * previewScale,
        marginBottom: 36,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
          <PickCard pick={pick} format={format} cardRef={cardRef} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div role="tablist" aria-label="Card format" style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {Object.values(FORMATS).map(f => {
            const active = f.id === formatId
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFormatId(f.id)}
                style={{
                  padding: '9px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
                  background: active ? GRAD : 'transparent',
                  color: active ? '#fff' : 'rgba(250,250,250,0.6)',
                  transition: 'all 0.2s ease',
                }}
              >{f.label}</button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={status === 'working'}
          aria-label="Download share card as PNG"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: '12px 22px', borderRadius: 999, border: 'none',
            background: status === 'done' ? 'rgba(16,185,129,0.18)' : GRAD,
            color: status === 'done' ? '#34d399' : '#fff',
            fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
            cursor: status === 'working' ? 'progress' : 'pointer',
            boxShadow: '0 14px 32px -10px rgba(236,72,153,0.5)',
            transition: 'all 0.2s ease',
          }}
        >
          {status === 'working' ? <><Loader2 className="h-4 w-4 animate-spin" /> Rendering…</>
            : status === 'done' ? <><Check className="h-4 w-4" /> Saved</>
            : status === 'error' ? <>Couldn’t export — retry</>
            : <><Download className="h-4 w-4" /> Download PNG</>}
        </button>
      </div>
    </div>
  )
}

export { PickCard }
