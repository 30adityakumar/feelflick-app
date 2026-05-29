// src/features/landing/components/MoodDemoPanel.jsx
// Interactive glass panel that demos the mood→film loop on the landing hero.
// Auto-cycles through moods (typing → searching → 3 picks). Mood chips below
// let visitors take over; autoplay resumes 8s after the last interaction.

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { MOODS, WANTS_BY_MOOD } from '@/legacy/landing/data'
import { tmdbImg } from '@/shared/api/tmdb'

const TYPING_TO_RESOLVED_MS = 1100
const MOOD_CYCLE_MS = 4400
const USER_RESUME_MS = 8000

function FFMark({ size = 32 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-black tracking-tight text-white shadow-lg shadow-purple-500/40"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      FF
    </span>
  )
}

function PosterPick({ film, match, isTop, accentColor }) {
  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-white/5"
        style={{
          aspectRatio: '2 / 3',
          // WHY: per-mood accent halo on the top pick is data-driven.
          ...(isTop
            ? { boxShadow: `0 0 0 1px ${accentColor}55, 0 10px 32px ${accentColor}26` }
            : {}),
        }}
      >
        <img
          src={tmdbImg(film.path, 'w342')}
          alt=""
          className="block h-full w-full object-cover"
          loading="lazy"
          aria-hidden="true"
        />
        <div
          className="absolute right-1.5 top-1.5 z-[1] inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-md"
          style={{
            // WHY: badge accent is per-mood, runtime-computed.
            background: isTop
              ? `linear-gradient(135deg, ${accentColor}45, ${accentColor}22)`
              : 'rgba(168,85,247,0.25)',
            borderColor: isTop ? `${accentColor}55` : 'rgba(168,85,247,0.45)',
            color: isTop ? accentColor : '#c4b5fd',
          }}
        >
          <span>{match}%</span>
        </div>
      </div>
      <p className="mt-1.5 truncate text-[12px] font-semibold text-white">{film.title}</p>
      <p className="text-[11px] text-white/40">{film.year}</p>
    </div>
  )
}

export default function MoodDemoPanel({ onMoodChange }) {
  const [moodIdx, setMoodIdx] = useState(0)
  const [phase, setPhase] = useState('typing') // 'typing' | 'resolved'
  const [userTaken, setUserTaken] = useState(false)
  const userResumeRef = useRef(null)

  const mood = MOODS[moodIdx % MOODS.length]
  const accentColor = mood.color
  const wantOptions = WANTS_BY_MOOD[mood.id] || ['interesting']
  const currentWant = wantOptions[0]

  useEffect(() => {
    onMoodChange?.(mood.id)
  }, [mood.id, onMoodChange])

  // Auto-cycle until the user takes over.
  useEffect(() => {
    if (userTaken) return
    setPhase('typing')
    const resolveT = setTimeout(() => setPhase('resolved'), TYPING_TO_RESOLVED_MS)
    const nextT = setTimeout(() => setMoodIdx((i) => i + 1), MOOD_CYCLE_MS)
    return () => {
      clearTimeout(resolveT)
      clearTimeout(nextT)
    }
  }, [moodIdx, userTaken])

  // Resume autoplay 8s after the user picks a mood.
  useEffect(() => {
    if (!userTaken) return
    setPhase('typing')
    const t = setTimeout(() => setPhase('resolved'), 700)
    userResumeRef.current = setTimeout(() => setUserTaken(false), USER_RESUME_MS)
    return () => {
      clearTimeout(t)
      if (userResumeRef.current) clearTimeout(userResumeRef.current)
    }
  }, [moodIdx, userTaken])

  const handlePickMood = (idx) => {
    setUserTaken(true)
    setMoodIdx(idx)
  }

  return (
    <>
      <style>{`
        @keyframes mood-blink {
          0%, 50%   { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes mood-pulse {
          0%, 100% { transform: scale(0.7); opacity: 0.4; }
          50%      { transform: scale(1.2); opacity: 1; }
        }
        .animate-mood-blink { animation: mood-blink 1s steps(2) infinite; }
        .animate-mood-pulse { animation: mood-pulse 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-mood-blink,
          .animate-mood-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[520px]">
        {/* Glass panel */}
        <div
          className="relative rounded-2xl border bg-white/5 px-4 py-4 text-left backdrop-blur-xl transition-[border-color,box-shadow] duration-700 ease-out sm:px-5 sm:py-5"
          style={{
            // WHY: border + glow tighten on the resolved state with the mood's accent.
            borderColor: phase === 'resolved' ? `${accentColor}55` : 'rgba(255,255,255,0.08)',
            boxShadow:
              phase === 'resolved'
                ? `0 16px 50px ${accentColor}1f, inset 0 1px 0 rgba(255,255,255,0.06)`
                : '0 16px 40px rgba(0,0,0,0.4)',
          }}
        >
          {/* Sentence row */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              <FFMark size={30} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                {userTaken ? 'You, right now' : 'You, tonight'}
              </p>
              <p className="m-0 text-[16px] font-semibold leading-snug tracking-tight text-white sm:text-[20px]">
                I feel{' '}
                <span
                  className="inline-block pb-[1px] font-extrabold"
                  // WHY: mood accent is data-driven per active mood.
                  style={{
                    color: accentColor,
                    borderBottom: `2px solid ${accentColor}66`,
                    transition: 'color 500ms ease, border-color 500ms ease',
                  }}
                >
                  {mood.label.toLowerCase()}
                </span>
                {phase === 'typing' && (
                  <span
                    className="animate-mood-blink ml-0.5 inline-block h-[0.9em] w-[2px] align-middle"
                    style={{ background: accentColor }}
                    aria-hidden="true"
                  />
                )}
                <span className="font-normal text-white/40"> tonight, want something </span>
                <span className="font-semibold text-white">{currentWant}</span>
                <span className="font-normal text-white/40">.</span>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 h-px bg-white/[0.06]" />

          {/* Searching or films — height locked so the panel doesn't jump.
              Phases cross-fade for smoothness. */}
          <div className="relative min-h-[270px] sm:min-h-[310px]">
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'typing' ? (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex items-center gap-3 px-1 py-2"
                >
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="animate-mood-pulse h-[7px] w-[7px] rounded-full"
                        style={{ background: accentColor, animationDelay: `${i * 0.15}s` }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <span className="text-[13px] text-white/60">
                    Searching across{' '}
                    <span className="font-semibold text-white">{mood.label.toLowerCase()}</span>
                    …
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key={`resolved-${moodIdx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    {mood.label} picks
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {mood.films.map((film, i) => (
                      <motion.div
                        key={`${film.path}-${moodIdx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          ease: [0.22, 1, 0.36, 1],
                          delay: 0.1 + i * 0.07,
                        }}
                      >
                        <PosterPick
                          film={film}
                          match={mood.matches[i]}
                          isTop={i === 0}
                          accentColor={accentColor}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mood quick-picks — hidden on mobile to keep the surface focused. */}
        <div className="mt-4 hidden flex-wrap justify-center gap-2 sm:flex sm:justify-start">
          {MOODS.map((m, idx) => {
            const active = idx === moodIdx % MOODS.length
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handlePickMood(idx)}
                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-200 ${
                  active
                    ? 'border-white/20 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/5'
                }`}
                // WHY: active chip tint comes from the mood's accent color.
                style={active ? { background: `${m.color}22` } : undefined}
                aria-pressed={active}
                aria-label={`Show picks for ${m.label} mood`}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
