// src/features/landing/sections/HowItWorksSection.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MOODS = [
  { emoji: '☕', label: 'Cozy',       description: 'Warm, comforting films to curl up with' },
  { emoji: '⚡', label: 'Tense',      description: 'Films that grip you from the first scene' },
  { emoji: '🌅', label: 'Nostalgic',  description: 'Stories that take you back to a simpler time' },
  { emoji: '✨', label: 'Euphoric',   description: 'Films that fill you with wonder and joy' },
  { emoji: '🔭', label: 'Curious',   description: 'Mind-expanding films that make you think' },
  { emoji: '🌧', label: 'Melancholy', description: 'Moving, beautiful films that touch the soul' },
]

const GENRES = [
  { name: 'Drama',     pct: 85 },
  { name: 'Sci-Fi',    pct: 72 },
  { name: 'Thriller',  pct: 60 },
  { name: 'Animation', pct: 44 },
  { name: 'Romance',   pct: 37 },
]

const SUGGESTIONS = [
  {
    moodEmoji: '☕', moodLabel: 'Cozy',
    film: 'Spirited Away', year: '2001', genres: ['Animation', 'Fantasy'],
    poster: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
  },
  {
    moodEmoji: '⚡', moodLabel: 'Tense',
    film: 'Parasite', year: '2019', genres: ['Thriller', 'Drama'],
    poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
  },
  {
    moodEmoji: '🌅', moodLabel: 'Nostalgic',
    film: 'Amélie', year: '2001', genres: ['Romance', 'Comedy'],
    poster: '/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg',
  },
]

// ── Mood Selector Visual ────────────────────────────────────────────────────

function MoodVisual() {
  const [active, setActive] = useState(0)
  return (
    <div
      className="relative rounded-2xl border border-white/8 overflow-hidden p-6 sm:p-8"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(139,92,246,0.18)' }}
        aria-hidden="true"
      />
      <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-purple-400/60 mb-6">
        How are you feeling?
      </p>
      <div className="relative flex flex-wrap gap-2 mb-6">
        {MOODS.map((mood, i) => (
          <motion.button
            key={mood.label}
            onClick={() => setActive(i)}
            whileTap={{ scale: 0.93 }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 touch-target ${
              active === i
                ? 'text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/8 text-white/55 hover:bg-white/14 hover:text-white/80'
            }`}
            style={active === i ? {
              background: 'linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153))',
            } : {}}
          >
            <span aria-hidden="true">{mood.emoji}</span>
            <span>{mood.label}</span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="relative text-sm text-white/35 border-t border-white/8 pt-4"
        >
          {MOODS[active].emoji}&nbsp; {MOODS[active].description}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

// ── Taste Profile Visual ────────────────────────────────────────────────────

function TasteVisual() {
  return (
    <div
      className="relative rounded-2xl border border-white/8 overflow-hidden p-6 sm:p-8"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(236,72,153,0.14)' }}
        aria-hidden="true"
      />
      <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-purple-400/60 mb-7">
        Your taste profile
      </p>
      <div className="relative space-y-5">
        {GENRES.map((g, i) => (
          <div key={g.name}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-white/65 font-medium">{g.name}</span>
              <span className="text-xs font-semibold text-white/30">{g.pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(88,28,135,0.25)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, rgb(168,85,247), rgb(236,72,153))',
                  boxShadow: '0 0 10px rgba(168,85,247,0.45)',
                }}
                initial={{ width: 0 }}
                whileInView={{ width: `${g.pct}%` }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.95, delay: i * 0.12, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Result Film Visual ──────────────────────────────────────────────────────

function ResultVisual() {
  return (
    <div className="relative flex justify-center lg:justify-start">
      {/* Pulsing rings */}
      <motion.div
        className="absolute inset-[-10px] rounded-[26px] border border-purple-500/22 pointer-events-none"
        animate={{ scale: [1, 1.05, 1], opacity: [0.22, 0, 0.22] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute inset-[-20px] rounded-[32px] border border-purple-500/10 pointer-events-none"
        animate={{ scale: [1, 1.07, 1], opacity: [0.1, 0, 0.1] }}
        transition={{ duration: 3.2, delay: 0.7, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-2xl blur-2xl scale-110 pointer-events-none"
        style={{ background: 'rgba(168,85,247,0.14)' }}
        aria-hidden="true"
      />

      {/* Poster card */}
      <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 w-full max-w-[230px] sm:max-w-[260px] aspect-[2/3]">
        <img
          src="https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg"
          alt="Interstellar"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)' }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.28), rgba(236,72,153,0.18))',
              border: '1px solid rgba(168,85,247,0.35)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">✦ Perfect match</span>
          </motion.div>
          <p className="text-white font-bold text-xl leading-tight">Interstellar</p>
          <p className="text-white/45 text-sm mt-1.5">2014 · Sci-Fi · Adventure</p>
        </div>
      </div>
    </div>
  )
}

// ── Animated divider ────────────────────────────────────────────────────────

function BeatDivider() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.85, ease: 'easeOut' }}
      className="h-px origin-center"
      style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }}
    />
  )
}

// ── Beat layout ─────────────────────────────────────────────────────────────

function Beat({ number, title, body, children, reverse = false }) {
  const vp = { once: true, margin: '-60px' }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={vp}
      transition={{ duration: 0.35 }}
      className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-10 lg:gap-16 xl:gap-20 py-12 sm:py-16`}
    >
      {/* Visual */}
      <div className="w-full lg:w-1/2">
        {children}
      </div>

      {/* Copy */}
      <div className="relative w-full lg:w-1/2">
        {/* Watermark step number */}
        <div
          className="absolute -top-4 right-0 font-black leading-none select-none pointer-events-none overflow-hidden"
          style={{ fontSize: 'clamp(5rem, 12vw, 9rem)', color: 'rgba(168,85,247,0.06)' }}
          aria-hidden="true"
        >
          {number}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="relative text-xs font-bold uppercase tracking-[0.22em] text-purple-400/75 mb-4"
        >
          {number}
        </motion.p>

        <motion.h3
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="relative text-2xl sm:text-3xl lg:text-[2rem] font-black tracking-tight text-white mb-5 leading-tight"
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="relative text-base sm:text-lg text-white/45 leading-relaxed"
        >
          {body}
        </motion.p>
      </div>
    </motion.div>
  )
}

// ── Section ──────────────────────────────────────────────────────────────────

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative bg-black overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      <div className="absolute top-0 inset-x-0 h-px bg-white/8" aria-hidden="true" />

      {/* Section-level ambient purple glow from top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 90% 40% at 50% 0%, rgba(88,28,135,0.1) 0%, transparent 65%)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-28">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="mb-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-400/70 mb-5">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5"
          >
            <span className="text-white">Two signals.</span>
            <br />
            <span className="gradient-text">One perfect film.</span>
          </h2>
          <p className="text-base sm:text-lg text-white/40 max-w-lg leading-relaxed">
            Most apps show you what&apos;s popular. FeelFlick combines your mood with your taste to find what&apos;s right for{' '}
            <em className="not-italic text-white/70">you</em>, right now.
          </p>
        </motion.div>

        <BeatDivider />

        <Beat
          number="01"
          title="Start with your mood"
          body="Not a search bar. Not a genre filter. Just how you feel — nostalgic, tense, cozy, or one of dozens more. That's where it starts."
        >
          <MoodVisual />
        </Beat>

        <BeatDivider />

        <Beat
          number="02"
          title="We learn your taste"
          body="Rate the films you've seen. FeelFlick builds a personal fingerprint — your favourite genres, the emotions that move you, the directors you keep returning to."
          reverse
        >
          <TasteVisual />
        </Beat>

        <BeatDivider />

        <Beat
          number="03"
          title="Your film. Not the algorithm's."
          body="The result is the intersection of your mood and your taste — not what's trending, not what earns the platform money. The film that's right for you, right now."
        >
          <ResultVisual />
        </Beat>

        <BeatDivider />

        {/* Three suggestions */}
        <div className="pt-14 pb-2 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-400/60 mb-3">
              For example
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Three moods. Three perfect picks.
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUGGESTIONS.map((s, i) => (
              <motion.div
                key={s.film}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative rounded-2xl border border-white/8 overflow-hidden group hover:border-purple-500/25 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(168,85,247,0.1) 0%, transparent 70%)' }}
                  aria-hidden="true"
                />

                <div className="relative flex items-start gap-4 p-5">
                  {/* Poster */}
                  <div className="shrink-0 w-14 rounded-xl overflow-hidden border border-white/10 aspect-[2/3]">
                    <img
                      src={`https://image.tmdb.org/t/p/w92${s.poster}`}
                      alt={s.film}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs">{s.moodEmoji}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/60">{s.moodLabel}</span>
                    </div>
                    <p className="text-white font-bold text-base leading-tight truncate mb-1">{s.film}</p>
                    <p className="text-xs text-white/30 mb-3">
                      {s.year} · {s.genres.join(' · ')}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-purple-300"
                      style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}
                    >
                      ✦ Perfect match
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
