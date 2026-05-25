// src/features/landing/sections/FinalCTASection.jsx
// Emotional closer for the landing page. Centered, single radial bloom.
// Copy sourced from landing/data.js TONE_COPY.confident.

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { useGoogleAuth } from '@/features/landing-v2/utils/useGoogleAuth'
import { TONE_COPY } from '@/features/landing-v2/data'
import Button from '@/shared/ui/Button'

const TONE = TONE_COPY.confident
const VIEWPORT = { once: true, margin: '-60px' }

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

export default function FinalCTASection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()

  return (
    <section
      className="relative overflow-hidden border-t border-white/[0.08] bg-black px-6 py-20 text-center sm:px-20 sm:py-40"
      aria-labelledby="final-cta-heading"
    >
      {/* Centered radial bloom — purple → pink fade */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(168,85,247,0.18), rgba(236,72,153,0.10) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[800px]">
        <motion.h2
          id="final-cta-heading"
          className="m-0 mb-5 whitespace-pre-line text-balance font-black text-white"
          style={{
            fontSize: 'clamp(2.375rem, 7vw, 4.75rem)',
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
          }}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.08 }}
        >
          {TONE.finalH}
        </motion.h2>

        <motion.p
          className="mx-auto mb-9 max-w-[520px] text-sm leading-relaxed text-white/60 sm:text-[17px]"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.16 }}
        >
          {TONE.finalSub}
        </motion.p>

        <motion.div
          className="flex justify-center"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.24 }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={signInWithGoogle}
            disabled={isAuthenticating}
            className="touch-target"
            aria-label={isAuthenticating ? 'Signing in' : 'Get started free with FeelFlick'}
          >
            {isAuthenticating ? (
              <><Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" aria-hidden="true" /> Signing in…</>
            ) : (
              <>
                Get Started Free
                <span aria-hidden="true">→</span>
              </>
            )}
          </Button>
        </motion.div>

        <motion.p
          className="m-0 mt-4 text-xs text-white/40"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.36 }}
        >
          47 seconds to your first pick. Free forever.
        </motion.p>
      </div>
    </section>
  )
}
