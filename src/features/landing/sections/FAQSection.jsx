// src/features/landing/sections/FAQSection.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// === CONSTANTS ===

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Is FeelFlick really free?',
    answer: 'Yes. No trials, no tiers, no credit card. Free forever is the plan — not a marketing hook.',
  },
  {
    id: 'faq-2',
    question: 'Do I need an account to use it?',
    answer: "You can browse public lists without an account. For personalised recommendations and your Cinematic DNA, you'll need to sign in with Google — it takes about 10 seconds.",
  },
  {
    id: 'faq-3',
    question: 'How does the recommendation engine work?',
    answer: "It combines what you watch, rate, and skip with semantic similarity between films. The more you use it, the more accurate it gets. Five films in, it's decent. Fifty films in, it starts to feel uncanny.",
  },
  {
    id: 'faq-4',
    question: "What's Cinematic DNA?",
    answer: 'A living profile of your taste — your top genres, directors, mood patterns, and the emotional fingerprint of the films you love. It updates with every film you log.',
  },
  {
    id: 'faq-5',
    question: 'Is my data used for ads or sold to third parties?',
    answer: 'No. Your taste data has one job: improving your recommendations. That\'s it.',
  },
  {
    id: 'faq-6',
    question: 'How many films are in the catalogue?',
    answer: '6,700+ curated and scored films, each with pre-computed semantic embeddings so recommendations match at a depth no human curator can reach.',
  },
]

const vp = { once: true, margin: '-60px' }

// Checked once at module load — stable for the session.
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

// === SUB-COMPONENTS ===

/**
 * A single accordion row — + / − toggle, purple active state, animated answer.
 * @param {{ item: object, isOpen: boolean, onToggle: () => void }} props
 */
function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div
      className="border-b transition-colors duration-300"
      style={{ borderColor: isOpen ? 'rgba(168,85,247,0.20)' : 'rgba(255,255,255,0.07)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={item.id}
        className="w-full flex justify-between items-center py-5 lg:py-6 text-left gap-6 group"
      >
        <span
          className="text-[15px] lg:text-[17px] font-medium leading-snug transition-colors duration-200"
          style={{ color: isOpen ? 'rgba(216,180,254,1)' : 'rgba(255,255,255,0.85)' }}
        >
          {item.question}
        </span>

        {/* + / − toggle */}
        <span
          className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center rounded-full border transition-all duration-200 text-sm font-light select-none"
          style={isOpen ? {
            borderColor: 'rgba(168,85,247,0.50)',
            color: 'rgba(216,180,254,1)',
            background: 'rgba(168,85,247,0.12)',
          } : {
            borderColor: 'rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.35)',
            background: 'transparent',
          }}
          aria-hidden="true"
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={item.id}
            key="answer"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
            role="region"
            aria-labelledby={`${item.id}-btn`}
          >
            {/* Left rail accent + answer text */}
            <div
              className="flex gap-4 pb-5"
            >
              <div
                className="flex-shrink-0 w-0.5 rounded-full self-stretch"
                style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.50) 0%, rgba(168,85,247,0.05) 100%)' }}
                aria-hidden="true"
              />
              <p className="text-sm lg:text-[15px] text-white/60 leading-relaxed">
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// === MAIN COMPONENT ===

/**
 * FAQSection — two-column layout on desktop, accordion with purple active state.
 *
 * Addresses common objections before the final CTA.
 */
export default function FAQSection() {
  const [openId, setOpenId] = useState(null)

  const handleToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <section
      id="faq"
      className="relative bg-black overflow-hidden"
      aria-labelledby="faq-heading"
    >
      {/* Top border */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.2) 50%, transparent 100%)' }}
        aria-hidden="true"
      />

      {/* Orb A — behind the heading (left) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '0%', left: '-10%',
          width: '50%', height: '100%',
          background: 'radial-gradient(ellipse 60% 55% at 25% 50%, rgba(88,28,135,0.14) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Orb B — behind the accordion (right) */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%', right: '-5%',
          width: '45%', height: '80%',
          background: 'radial-gradient(ellipse 55% 50% at 75% 50%, rgba(88,28,135,0.09) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:gap-14">

          {/* ── LEFT: HEADING (sticky on desktop) ──────────────────────── */}
          <div className="lg:w-[38%] flex-shrink-0 mb-10 lg:mb-0">
            <div className="lg:sticky lg:top-28">

              <motion.p
                className="text-xs font-semibold uppercase tracking-widest text-purple-400/60 mb-3"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
              >
                FAQ
              </motion.p>

              <motion.h2
                id="faq-heading"
                className="font-black tracking-tight leading-[1.05] text-white mb-4"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.1 }}
              >
                Questions<br />answered.
              </motion.h2>

              <motion.p
                className="text-sm lg:text-base text-white/40 leading-relaxed max-w-xs"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4, delay: prefersReducedMotion ? 0 : 0.2 }}
              >
                Anything else? The app speaks for itself — sign in and see.
              </motion.p>

            </div>
          </div>

          {/* ── RIGHT: ACCORDION ────────────────────────────────────────── */}
          <motion.div
            className="lg:w-[62%]"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45, delay: prefersReducedMotion ? 0 : 0.15 }}
            role="list"
            aria-label="Frequently asked questions"
          >
            {/* Top border of the first item */}
            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                onToggle={() => handleToggle(item.id)}
              />
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
