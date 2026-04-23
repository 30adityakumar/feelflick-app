// src/features/landing/sections/FinalCTASection.jsx
import { motion } from 'framer-motion'
import { LogIn, Loader2 } from 'lucide-react'

import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'
import Button from '@/shared/ui/Button'

const vp = { once: true, margin: '-60px' }

// Checked once at module load — stable for the session.
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

/**
 * FinalCTASection — emotional closer for the FeelFlick landing page.
 *
 * Uses the approved "Tonight." headline (Blueprint §Approved Copy).
 * The white-pill CTA matches the hero for visual bookending.
 * Generous padding (py-20→py-32) gives the section breathing room as a finale.
 */
export default function FinalCTASection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()

  return (
    <section
      className="relative bg-black overflow-hidden min-h-[100svh] flex flex-col justify-center"
      aria-labelledby="final-cta-heading"
    >
      {/* Top border */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
        aria-hidden="true"
      />

      {/* Strong purple bloom from top — cinematic atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(88,28,135,0.50) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Warm centre glow — the subtle "warmth" feeling for the emotional closer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Bottom fade — keeps it grounded against the footer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 110%, rgba(168,85,247,0.15) 0%, transparent 65%)' }}
        aria-hidden="true"
      />

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">

        {/* Headline — "Tonight." on its own line in gradient for the Apple punch */}
        <motion.h2
          id="final-cta-heading"
          className="font-black tracking-tight leading-[1.05] mb-10"
          style={{ fontSize: 'clamp(2.25rem, 6vw, 3.75rem)' }}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.08 }}
        >
          <span className="text-white">Somewhere in 6,700 films is one made for you.</span>
          <span className="block gradient-text">Tonight.</span>
        </motion.h2>

        {/* CTA button — white pill, dark text, mirrors Hero for visual bookending */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={vp}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.2 }}
          className="flex justify-center mb-6"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={signInWithGoogle}
            disabled={isAuthenticating}
            className="touch-target"
            aria-label={isAuthenticating ? 'Signing in' : 'Find tonight\'s film on FeelFlick'}
          >
            {isAuthenticating ? (
              <><Loader2 className="h-4 w-4 animate-spin flex-shrink-0" aria-hidden="true" /> Signing in...</>
            ) : (
              <>
                Find Tonight&apos;s Film
                <LogIn className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Micro copy */}
        <motion.p
          className="text-xs text-white/20"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={vp}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.38 }}
        >
          Free forever · No credit card · No ads
        </motion.p>

      </div>
    </section>
  )
}
