// src/legacy/landing/sections/HowItWorksSection.jsx
// Three-step explainer that follows the hero. Mood → matching → pick.
// Cards entrance-animate on scroll, respecting prefers-reduced-motion.

import { motion } from 'framer-motion'

const STEPS = [
  {
    n: '01',
    h: 'Say how you feel',
    b: 'A pill, a word, or a sentence. The vague "I want something good" is fine — we can disambiguate.',
  },
  {
    n: '02',
    h: 'We read the room',
    b: 'Mood + your taste graph + time-of-day + history. Not just "what people watched."',
  },
  {
    n: '03',
    h: 'One pick wins',
    b: 'Plus 2 alternates with a one-line reason each. Pick fast, or pick well — your call.',
  },
]

const VIEWPORT = { once: true, margin: '-60px' }

export default function HowItWorksSection() {
  return (
    <section
      id="how"
      className="relative border-t border-white/8 bg-black px-6 py-20 md:px-20 md:py-32"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-[1180px]">
        {/* Header */}
        <motion.div
          className="mx-auto mb-14 max-w-[720px] text-center"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.5 }}
        >
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.18em] text-purple-400/75">
            How it works
          </p>
          <h2
            id="how-heading"
            className="mb-4 mt-3.5 text-balance font-black leading-[1.04] tracking-tight text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
          >
            Three steps.<br />Forty-seven seconds.
          </h2>
          <p className="m-0 text-sm leading-relaxed text-white/60 sm:text-base">
            Faster than picking a meal at a restaurant. Sharper than asking a friend.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-b from-white/4.5 to-white/1 p-6 sm:p-8"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.5, delay: 0.08 * i }}
            >
              {/* Watermark step number */}
              <span
                className="pointer-events-none absolute -right-2 -top-3 select-none text-[110px] font-black italic leading-none tracking-tighter text-white/4"
                aria-hidden="true"
              >
                {s.n}
              </span>
              <div className="relative">
                <p className="m-0 mb-3.5 text-[11px] tracking-[0.16em] text-purple-400/70 font-['JetBrains_Mono',monospace]">
                  STEP {s.n}
                </p>
                <h3 className="mb-2.5 text-[21px] font-extrabold tracking-tight text-white sm:text-[23px]">
                  {s.h}
                </h3>
                <p className="m-0 text-sm leading-relaxed text-white/60 sm:text-[14.5px]">
                  {s.b}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
