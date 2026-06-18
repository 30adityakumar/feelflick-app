// src/shared/ui/BrandSplash.jsx
import { useEffect, useState } from 'react'
import Button from '@/shared/ui/Button'

/**
 * Full-screen branded splash — replaces every spinner and duplicate splash in the app.
 *
 * Delays visibility by 200ms so fast loads never flash the splash.
 * Error state is always immediate — errors must never be delayed.
 *
 * @param {{ label?: string, error?: string | null }} props
 */
export default function BrandSplash({ label, error = null }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200)
    return () => clearTimeout(t)
  }, [])
  if (!visible && !error) return null

  return (
    <div className="fixed inset-0 z-9999 grid place-items-center bg-[var(--color-canvas,#15120f)]">
      {/* Ambient glow — faint ivory wash */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(243,236,223,0.05) 0%, transparent 65%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(243,236,223,0.03) 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-4 text-center">
        {/* Wordmark */}
        <span className="text-3xl font-black tracking-tight text-[var(--color-text-primary,#f3ecdf)]">
          FEELFLICK
        </span>

        {error ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">{error}</p>
            <Button variant="secondary" onClick={() => { window.location.href = '/' }}>
              Return home
            </Button>
          </>
        ) : (
          <>
            {/* 1px shimmer line — animation defined in animations.css */}
            <div className="w-20 h-px overflow-hidden bg-white/5 rounded-full">
              <div className="h-full w-full bg-linear-to-r from-transparent via-[var(--color-text-primary,#f3ecdf)] to-transparent brand-shimmer" />
            </div>
            {label && (
              <p className="text-sm text-white/35">{label}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
