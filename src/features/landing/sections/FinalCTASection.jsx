// src/features/landing/sections/FinalCTASection.jsx
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import googleSvg from '@/assets/icons/google.svg'
import { useGoogleAuth } from '@/features/landing/utils/useGoogleAuth'

const TRUST = [
  { icon: Sparkles, text: 'Free forever' },
  { icon: Shield,   text: 'Privacy-first' },
  { icon: Zap,      text: 'Ready in seconds' },
]

// Blurred poster silhouettes — barely visible, just enough for depth
const BG_POSTERS = [
  { src: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg', style: { top: '8%',  left: '-4%',  rotate: '-12deg', opacity: 0.07 } },
  { src: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', style: { top: '5%',  right: '-2%', rotate: '10deg',  opacity: 0.07 } },
  { src: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', style: { bottom: '6%', left: '2%',  rotate: '8deg',   opacity: 0.06 } },
  { src: '/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg', style: { bottom: '4%', right: '-3%', rotate: '-9deg', opacity: 0.06 } },
]

const vp = { once: true, margin: '-60px' }

export default function FinalCTASection() {
  const { signInWithGoogle, isAuthenticating } = useGoogleAuth()

  return (
    <section
      className="relative bg-black overflow-hidden pt-24 pb-28 sm:pt-28 sm:pb-32"
      aria-labelledby="final-cta-heading"
    >
      {/* Top border */}
      <div className="absolute top-0 inset-x-0 h-px bg-white/8" aria-hidden="true" />

      {/* ── Cinematic atmosphere ─────────────────────────────────────── */}

      {/* Purple bloom from top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 100% 55% at 50% -5%, rgba(88,28,135,0.55) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Pink bloom from bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 45% at 50% 110%, rgba(168,85,247,0.2) 0%, transparent 65%)' }}
        aria-hidden="true"
      />

      {/* Centre vignette — keeps focus on the text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)' }}
        aria-hidden="true"
      />

      {/* Blurred poster silhouettes */}
      {BG_POSTERS.map((p, i) => (
        <div
          key={i}
          className="absolute w-32 sm:w-40 aspect-[2/3] rounded-xl overflow-hidden pointer-events-none select-none"
          style={{
            ...p.style,
            filter: 'blur(12px) saturate(0.4)',
            transform: `rotate(${p.style.rotate}) scale(1.1)`,
          }}
          aria-hidden="true"
        >
          <img
            src={`https://image.tmdb.org/t/p/w300${p.src}`}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: p.style.opacity }}
          />
        </div>
      ))}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.4 }}
          className="text-xs font-bold uppercase tracking-[0.22em] text-purple-400/70 mb-6"
        >
          Your next film awaits
        </motion.p>

        {/* Headline */}
        <motion.h2
          id="final-cta-heading"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="font-black tracking-tight leading-[1.02] mb-6"
          style={{ fontSize: 'clamp(2.75rem, 7vw, 6rem)' }}
        >
          <span className="text-white">Stop scrolling.</span>
          <br />
          <span className="gradient-text">Start feeling.</span>
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="text-base sm:text-lg text-white/45 leading-relaxed max-w-md mx-auto mb-12"
        >
          Tell FeelFlick how you feel. Get the right film in seconds — not after an hour of browsing.
        </motion.p>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={vp}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="flex justify-center mb-5"
        >
          <motion.button
            onClick={signInWithGoogle}
            disabled={isAuthenticating}
            animate={isAuthenticating ? {} : {
              boxShadow: [
                '0 0 24px rgba(168,85,247,0.35)',
                '0 0 42px rgba(168,85,247,0.55)',
                '0 0 24px rgba(168,85,247,0.35)',
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.03, transition: { duration: 0.18 } }}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            aria-label={isAuthenticating ? 'Signing in' : 'Get started free with Google'}
          >
            {isAuthenticating ? (
              <>
                <svg className="animate-spin h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <img src={googleSvg} alt="" className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Micro copy */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={vp}
          transition={{ duration: 0.4, delay: 0.32 }}
          className="text-sm text-white/25 mb-12"
        >
          No credit card · Free forever · Takes 10 seconds
        </motion.p>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          role="list"
          aria-label="Why FeelFlick"
        >
          {TRUST.map(({ icon: Icon, text }) => (
            <div
              key={text}
              role="listitem"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/8 text-sm text-white/45 font-medium"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <Icon className="w-3.5 h-3.5 text-purple-400/80 flex-shrink-0" aria-hidden="true" />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
