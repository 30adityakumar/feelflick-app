// src/features/landing/sections/FindYourPeopleSection.jsx
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// === CONSTANTS ===

const MATCH_SCORE = 87
const COUNT_DURATION_MS = 1200

// Aditya K. — founder profile, matches CinematicDNASection for narrative continuity
const PROFILE_LEFT = {
  initials: 'AK',
  name: 'Aditya K.',
  subtitle: '42 films · Sci-fi thriller obsessed',
  // Matches the avatar gradient from CinematicDNASection exactly
  avatarGradient: 'linear-gradient(135deg, rgba(168,85,247,0.85), rgba(236,72,153,0.85))',
}

// Marco R. — distinct gradient so the two avatars read as different people at a glance
const PROFILE_RIGHT = {
  initials: 'MR',
  name: 'Marco R.',
  subtitle: '83 films · Arthouse obsessive',
  avatarGradient: 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(6,182,212,0.85))',
}

const EXPLANATION =
  "You both love Nolan, gravitate toward slow-burn sci-fi, and rewatch the same ambiguous endings."

const vp = { once: true, margin: '-60px' }

// Checked once at module load — stable for the session.
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

// === SUB-COMPONENTS ===

/**
 * A single mini profile avatar + label block.
 * @param {{ profile: object }} props
 */
function MiniProfile({ profile }) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white select-none flex-shrink-0"
        style={{ background: profile.avatarGradient }}
        aria-hidden="true"
      >
        {profile.initials}
      </div>
      <div>
        <p className="text-sm font-semibold text-white leading-none mb-1">{profile.name}</p>
        <p className="text-[11px] text-white/40">{profile.subtitle}</p>
      </div>
    </div>
  )
}

/**
 * Animated taste match score — counts up from 0 to MATCH_SCORE when scrolled into view.
 * Renders at MATCH_SCORE immediately if prefers-reduced-motion is set.
 */
function TasteMatchScore() {
  const [count, setCount] = useState(prefersReducedMotion ? MATCH_SCORE : 0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (prefersReducedMotion || !ref.current) return

    const el = ref.current
    let raf

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          observer.disconnect()

          const start = performance.now()
          function tick(now) {
            const elapsed = now - start
            const progress = Math.min(elapsed / COUNT_DURATION_MS, 1)
            // Ease-out quadratic so the number decelerates into the target
            const eased = 1 - Math.pow(1 - progress, 2)
            setCount(Math.round(eased * MATCH_SCORE))
            if (progress < 1) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3, rootMargin: '-60px' },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className="flex flex-col items-center gap-1" aria-label={`${MATCH_SCORE}% Taste Match`}>
      <span
        className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tabular-nums"
        aria-hidden="true"
      >
        {count}%
      </span>
      <span className="text-[10px] uppercase tracking-widest text-white/40">Taste Match</span>
    </div>
  )
}

// === MAIN COMPONENT ===

/**
 * FindYourPeopleSection — social hook for the FeelFlick landing page.
 *
 * Shows two user profiles with a taste compatibility score to
 * communicate that FeelFlick surfaces genuine taste alignment, not social follows.
 * PROFILE_LEFT is the founder's real profile (Aditya K.); Marco R. is illustrative.
 *
 * Layout is REVERSED from ItLearnsYouSection (visual left, copy right on desktop)
 * for visual rhythm across the page.
 */
export default function FindYourPeopleSection() {
  return (
    <section
      id="find-people"
      className="relative bg-black overflow-hidden"
      aria-labelledby="people-heading"
    >
      {/* Top border */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
        aria-hidden="true"
      />

      {/* Orb A — left-leaning to frame the card on its side */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 35% 50%, rgba(88,28,135,0.12) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Orb B — softer bloom on the right side */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%', right: '-5%',
          width: '45%', height: '80%',
          background: 'radial-gradient(ellipse 55% 50% at 70% 50%, rgba(88,28,135,0.08) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-16">
        {/*
          Layout: mobile = flex-col (copy top, visual bottom)
                  desktop = flex-row-reverse (visual left, copy right)
          DOM order is [copy, visual] so reading order is always copy-first.
        */}
        <div className="flex flex-col lg:flex-row-reverse lg:items-center gap-10 lg:gap-20">

          {/* ── RIGHT (desktop) / TOP (mobile): COPY BLOCK ───────────────── */}
          <div className="lg:w-[45%] flex-shrink-0">

            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-2"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
            >
              Taste Match
            </motion.p>

            <motion.h2
              id="people-heading"
              className="font-black tracking-tight leading-[1.05] text-white mb-3"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)' }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.1 }}
            >
              Find people who<br />actually get your taste.
            </motion.h2>

            <motion.p
              className="text-sm sm:text-base text-white/60 leading-relaxed max-w-md"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.2 }}
            >
              Not followers. Compatibility. See who shares your directors, your moods, and your taste in endings — and why their picks actually mean something.
            </motion.p>

          </div>

          {/* ── LEFT (desktop) / BOTTOM (mobile): TASTE MATCH CARD ───────── */}
          <div className="lg:w-[55%] relative">

            {/* Soft ambient glow behind the card */}
            <div
              className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(88,28,135,0.22) 0%, transparent 70%)',
                filter: 'blur(36px)',
              }}
              aria-hidden="true"
            />

            <motion.div
              className="relative rounded-2xl border p-4 sm:p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
              whileHover={prefersReducedMotion ? undefined : {
                scale: 1.01,
                borderColor: 'rgba(255,255,255,0.12)',
                transition: { duration: 0.3 },
              }}
              {...(!prefersReducedMotion && {
                initial: { opacity: 0, y: 24 },
                whileInView: { opacity: 1, y: 0 },
                viewport: vp,
                transition: { duration: 0.5, delay: 0.2 },
              })}
            >

              {/* Two profiles flanking the match score */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <MiniProfile profile={PROFILE_LEFT} />
                <TasteMatchScore />
                <MiniProfile profile={PROFILE_RIGHT} />
              </div>

              {/* Explanation line — ties back to Sarah K.'s DNA from CinematicDNASection */}
              <div
                className="pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-xs text-white/20 italic text-center">{EXPLANATION}</p>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
