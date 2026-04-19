import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAIMoodContext } from '@/shared/hooks/useAIMoodContext'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { useMovieExplanation } from '@/shared/hooks/useMovieExplanation'
import { useMoodSession } from '@/shared/hooks/useMoodSession'
import { useRecommendationTracking } from '@/shared/hooks/useRecommendationTracking'
import { useRecommendations } from '@/shared/hooks/useRecommendations'
import { useSuggestedMoods } from '@/shared/hooks/useSuggestedMoods'
import { useNLMoodParse } from '@/shared/hooks/useNLMoodParse'

// ─── Data constants ───────────────────────────────────────────────────────────

const MOODS = [
  { id: 1,  name: 'Cozy',        emoji: '☕',  description: 'Warm and comforting',    color: 'from-orange-500 to-amber-600' },
  { id: 2,  name: 'Adventurous', emoji: '🗺️', description: 'Bold and exciting',      color: 'from-blue-500 to-cyan-600' },
  { id: 3,  name: 'Heartbroken', emoji: '💔',  description: 'Emotionally raw',        color: 'from-pink-500 to-rose-600' },
  { id: 4,  name: 'Curious',     emoji: '🔍',  description: 'Mind-expanding',         color: 'from-purple-500 to-violet-600' },
  { id: 5,  name: 'Nostalgic',   emoji: '🎞️', description: 'Classic favorites',      color: 'from-yellow-500 to-orange-600' },
  { id: 6,  name: 'Energized',   emoji: '⚡',  description: 'High-energy fun',        color: 'from-green-500 to-emerald-600' },
  { id: 7,  name: 'Anxious',     emoji: '😰',  description: 'Need something calming', color: 'from-indigo-500 to-blue-600' },
  { id: 8,  name: 'Romantic',    emoji: '💕',  description: 'Love and connection',    color: 'from-red-500 to-pink-600' },
  { id: 9,  name: 'Inspired',    emoji: '✨',  description: 'Uplifting stories',      color: 'from-amber-500 to-yellow-600' },
  { id: 10, name: 'Silly',       emoji: '🤪',  description: 'Light and funny',        color: 'from-lime-500 to-green-600' },
  { id: 11, name: 'Dark',        emoji: '🌑',  description: 'Gritty and intense',     color: 'from-gray-700 to-gray-900' },
  { id: 12, name: 'Overwhelmed', emoji: '😵',  description: 'Complete escape',        color: 'from-teal-500 to-cyan-600' },
]

const VIEWING_CONTEXTS = [
  { id: 1, name: 'Alone',          icon: '🧘' },
  { id: 2, name: 'With a partner', icon: '💑' },
  { id: 3, name: 'Friend group',   icon: '👥' },
  { id: 4, name: 'Family',         icon: '👨‍👩‍👧‍👦' },
  { id: 5, name: 'Kids night',     icon: '👶' },
]

const EXPERIENCE_TYPES = [
  { id: 1, name: 'Escape' },
  { id: 2, name: 'Laugh' },
  { id: 3, name: 'Cry' },
  { id: 4, name: 'Think' },
  { id: 5, name: 'Zone Out' },
]

const EXPERIENCE_LABELS = {
  1: { label: 'Disappear completely', emoji: '🌊', preview: "Sci-fi, fantasy, and worlds you've never seen" },
  2: { label: 'Ugly-laugh',           emoji: '😂', preview: 'Comedy that actually makes you snort' },
  3: { label: 'Full emotional release', emoji: '😭', preview: 'Dramas that earn every tear' },
  4: { label: 'Slow-burn revelation', emoji: '🔦', preview: 'Films that change how you see things' },
  5: { label: 'Pure vibe, no effort', emoji: '😌', preview: 'Beautiful, easy, satisfying' },
}

const TIME_OF_DAY = [
  { id: 'morning',   label: 'Morning',    icon: '🌞' },
  { id: 'afternoon', label: 'Afternoon',  icon: '🌅' },
  { id: 'evening',   label: 'Evening',    icon: '🌆' },
  { id: 'latenight', label: 'Late night', icon: '🌙' },
]

function getDefaultTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'latenight'
}

const MOOD_VISUAL_MAP = {
  1:  { orbColor: '#ff6b35', color1: '#ff6b35', color2: '#f59e0b', rgb: '255,107,53' },
  2:  { orbColor: '#0ea5e9', color1: '#0ea5e9', color2: '#06b6d4', rgb: '14,165,233' },
  3:  { orbColor: '#ec4899', color1: '#ec4899', color2: '#f43f5e', rgb: '236,72,153' },
  4:  { orbColor: '#a855f7', color1: '#a855f7', color2: '#8b5cf6', rgb: '168,85,247' },
  5:  { orbColor: '#f59e0b', color1: '#f59e0b', color2: '#d97706', rgb: '245,158,11' },
  6:  { orbColor: '#10b981', color1: '#10b981', color2: '#22c55e', rgb: '16,185,129' },
  7:  { orbColor: '#6366f1', color1: '#6366f1', color2: '#4338ca', rgb: '99,102,241' },
  8:  { orbColor: '#ef4444', color1: '#ef4444', color2: '#ec4899', rgb: '239,68,68' },
  9:  { orbColor: '#f59e0b', color1: '#f59e0b', color2: '#fbbf24', rgb: '245,158,11' },
  10: { orbColor: '#84cc16', color1: '#84cc16', color2: '#22c55e', rgb: '132,204,22' },
  11: { orbColor: '#4338ca', color1: '#1e1b4b', color2: '#0f172a', rgb: '67,56,202' },
  12: { orbColor: '#0d9488', color1: '#0d9488', color2: '#0891b2', rgb: '13,148,136' },
  DEFAULT: { orbColor: '#4f46e5', color1: '#4f46e5', color2: '#7c3aed', rgb: '79,70,229' },
}

// ─── Framer Motion variants ───────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const stageTransition = {
  initial:    { opacity: 0, y: 32 },
  animate:    { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:       { opacity: 0, y: -16, transition: { duration: 0.3, ease: 'easeIn' } },
}

// ─── Particle burst ───────────────────────────────────────────────────────────

function fireParticleBurst(x, y, color) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315]
  angles.forEach((angle) => {
    const span = document.createElement('span')
    const distance = 40 + Math.random() * 40
    const rad = (angle * Math.PI) / 180
    const tx = Math.cos(rad) * distance
    const ty = Math.sin(rad) * distance

    Object.assign(span.style, {
      position:      'fixed',
      left:          `${x}px`,
      top:           `${y}px`,
      width:         '6px',
      height:        '6px',
      borderRadius:  '50%',
      background:    color,
      pointerEvents: 'none',
      zIndex:        '9999',
    })
    document.body.appendChild(span)

    const anim = span.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${tx * 0.4}px),calc(-50% + ${ty * 0.4}px)) scale(1)`,
          opacity: 1,
          offset: 0.3,
        },
        {
          transform: `translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px)) scale(0)`,
          opacity: 0,
        },
      ],
      { duration: 600, easing: 'ease-out', fill: 'forwards' },
    )
    anim.onfinish = () => span.remove()
  })
}

// ─── Aurora Background ────────────────────────────────────────────────────────

function AuroraBackground({ moodId }) {
  const orb1Ref = useRef(null)
  const orb2Ref = useRef(null)
  const orb3Ref = useRef(null)

  // Inject @property CSS once for true gradient morph
  useEffect(() => {
    const styleId = 'feelflick-aurora-props'
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @property --orb1-color { syntax: '<color>'; inherits: false; initial-value: #4f46e5; }
      @property --orb2-color { syntax: '<color>'; inherits: false; initial-value: #7c3aed; }
      @property --orb3-color { syntax: '<color>'; inherits: false; initial-value: #0ea5e9; }
      .aurora-orb-1 { background: var(--orb1-color); transition: --orb1-color 1.2s ease; }
      .aurora-orb-2 { background: var(--orb2-color); transition: --orb2-color 1.2s ease; }
      .aurora-orb-3 { background: var(--orb3-color); transition: --orb3-color 1.2s ease; }
    `
    document.head.appendChild(style)
  }, [])

  // Update CSS custom properties when mood changes for true color morphing
  useEffect(() => {
    const vis = moodId ? MOOD_VISUAL_MAP[moodId] : MOOD_VISUAL_MAP.DEFAULT
    orb1Ref.current?.style.setProperty('--orb1-color', vis.color1)
    orb2Ref.current?.style.setProperty('--orb2-color', vis.color2)
    orb3Ref.current?.style.setProperty('--orb3-color', vis.orbColor)
  }, [moodId])

  const baseOrb = {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundColor: '#050508', overflow: 'hidden' }}
      aria-hidden="true"
    >
      <div
        ref={orb1Ref}
        className="aurora-orb-1"
        style={{ ...baseOrb, width: '600px', height: '600px', top: '-100px', left: '-150px', opacity: 0.18, filter: 'blur(120px)', animation: 'float-orb 8s ease-in-out infinite' }}
      />
      <div
        ref={orb2Ref}
        className="aurora-orb-2"
        style={{ ...baseOrb, width: '800px', height: '800px', bottom: '-200px', right: '-200px', opacity: 0.14, filter: 'blur(160px)', animation: 'float-orb 8s ease-in-out 2.7s infinite' }}
      />
      <div
        ref={orb3Ref}
        className="aurora-orb-3"
        style={{ ...baseOrb, width: '400px', height: '400px', top: '40%', left: '40%', transform: 'translate(-50%,-50%)', opacity: 0.10, filter: 'blur(80px)', animation: 'float-orb 8s ease-in-out 5.1s infinite' }}
      />
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}
        aria-hidden="true"
      >
        <filter id="aurora-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#aurora-grain)" />
      </svg>
    </div>
  )
}

// ─── Stage Progress ───────────────────────────────────────────────────────────

const STAGE_LABELS = ['Mood', 'Results']

function StageProgress({ currentStage, moodId }) {
  const vis = moodId ? MOOD_VISUAL_MAP[moodId] : MOOD_VISUAL_MAP.DEFAULT
  if (currentStage === 0) return null

  return (
    <div className="mb-10 flex items-center justify-center">
      {STAGE_LABELS.map((label, i) => {
        const isCompleted = i < currentStage
        const isActive    = i === currentStage

        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div
                className="h-px w-8 sm:w-12 transition-colors duration-500"
                style={{ backgroundColor: isCompleted ? `${vis.orbColor}60` : 'rgba(255,255,255,0.10)' }}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className="relative flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                style={
                  isCompleted
                    ? { backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }
                    : { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)' }
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="stage-active-dot"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: vis.orbColor, boxShadow: `0 0 12px ${vis.orbColor}80` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10" style={{ color: isActive ? '#fff' : undefined }}>
                  {isCompleted ? '✓' : i + 1}
                </span>
              </div>
              {(isActive || isCompleted) && (
                <span
                  className="text-[10px] tracking-wide"
                  style={{ color: isActive ? '#f8fafc' : 'rgba(255,255,255,0.35)' }}
                >
                  {label}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Pip Dial ─────────────────────────────────────────────────────────────────

function PipDial({ label, icon, leftAnchor, rightAnchor, value, onChange, orbColor }) {
  const [ripplePip, setRipplePip] = useState(null)

  function handlePipClick(pip) {
    onChange(pip)
    setRipplePip(pip)
    setTimeout(() => setRipplePip(null), 400)
  }

  const fillPct = ((value - 1) / 4) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <span className="text-sm font-semibold text-white/90">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-right text-xs text-white/40">{leftAnchor}</span>
        <div className="relative flex flex-1 items-center justify-between">
          {/* Background track */}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
          />
          {/* Animated fill */}
          <motion.div
            className="pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full"
            animate={{ width: `${fillPct}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ backgroundColor: orbColor }}
          />
          {[1, 2, 3, 4, 5].map((pip) => (
            <button
              key={pip}
              type="button"
              aria-pressed={value >= pip}
              aria-label={`${label} ${pip} of 5`}
              onClick={() => handlePipClick(pip)}
              className="relative z-10 h-3.5 w-3.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{
                backgroundColor: value >= pip ? orbColor : 'rgba(255,255,255,0.15)',
                boxShadow:        value >= pip ? `0 0 8px ${orbColor}80` : 'none',
                transform:        value === pip ? 'scale(1.4)' : 'scale(1)',
                transition:       'transform 200ms, background-color 200ms, box-shadow 200ms',
              }}
            >
              {ripplePip === pip && (
                <motion.span
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ backgroundColor: orbColor }}
                />
              )}
            </button>
          ))}
        </div>
        <span className="w-20 text-xs text-white/40">{rightAnchor}</span>
      </div>
    </div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        backdropFilter:  'blur(20px)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border:          '1px solid rgba(255,255,255,0.08)',
        animation:       'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      }}
    >
      <div
        className="aspect-[2/3] w-full"
        style={{
          background:     'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.04) 100%)',
          backgroundSize: '200% 100%',
          animation:      'shimmer 1.8s ease-in-out infinite',
        }}
      />
      <div className="space-y-2 p-3">
        <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div className="h-2 w-1/2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  )
}

// ─── Fallback explanation (used when AI explanation unavailable) ───────────────

function RecommendationExplanation({ movie, moodName }) {
  const { explanation } = useMovieExplanation(movie, moodName, movie.match_percentage)
  return <p className="mt-1 line-clamp-1 text-xs text-purple-300/80">{explanation}</p>
}

// ─── Animated score badge ─────────────────────────────────────────────────────

function AnimatedScore({ score, color1, color2 }) {
  const count   = useMotionValue(0)
  const rounded = useTransform(count, Math.round)
  const [display, setDisplay] = useState(0)

  useMotionValueEvent(rounded, 'change', (v) => setDisplay(v))

  useEffect(() => {
    const controls = animate(count, score, { duration: 1.2, ease: 'easeOut' })
    return () => controls.stop()
  }, [count, score])

  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
      style={{ background: `linear-gradient(135deg,${color1},${color2})` }}
    >
      {display}%
    </span>
  )
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecommendationCard({ movie, index, moodName, moodId, onOpenMovie, aiExplanation, aiScore, aiLoading }) {
  const [isHovered, setIsHovered] = useState(false)
  const vis        = moodId ? MOOD_VISUAL_MAP[moodId] : MOOD_VISUAL_MAP.DEFAULT
  const finalScore = aiScore ?? movie.match_percentage
  // Show pulse skeleton on the score badge while AI is loading and no score has arrived yet
  const showScoreSkeleton = aiLoading && aiScore == null

  return (
    <motion.div
      variants={cardVariant}
      layout
      layoutId={`movie-card-${movie.movie_id}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="overflow-hidden rounded-2xl"
      style={{
        backdropFilter:  'blur(20px)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border:          `1px solid ${isHovered ? `${vis.orbColor}55` : 'rgba(255,255,255,0.08)'}`,
        boxShadow:        isHovered ? `0 0 40px ${vis.orbColor}22` : 'none',
        transition:      'border-color 300ms ease, box-shadow 300ms ease',
      }}
    >
      <button
        type="button"
        onClick={onOpenMovie}
        aria-label={`Open ${movie.title}`}
        className="w-full text-left"
      >
        {/* Poster + overlay */}
        <div className="relative overflow-hidden">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              width="300"
              height="450"
              loading="lazy"
              className="aspect-[2/3] w-full object-cover"
              style={{
                transform:  isHovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center bg-neutral-900">
              <span className="text-4xl" aria-hidden="true">🎬</span>
            </div>
          )}

          {/* Rank badge */}
          <div
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}
          >
            #{index + 1}
          </div>

          {/* Match % badge — skeleton while AI loads, animated counter once ready */}
          <div className="absolute right-2 top-2">
            {showScoreSkeleton
              ? <span className="block h-5 w-9 animate-pulse rounded-full bg-purple-500/20" aria-hidden="true" />
              : <AnimatedScore score={finalScore} color1={vis.color1} color2={vis.color2} />
            }
          </div>

          {/* Cinematic hover overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col justify-end p-3"
                style={{
                  background: 'linear-gradient(0deg,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.7) 60%,transparent 100%)',
                }}
              >
                <h3 className="line-clamp-2 text-sm font-bold text-white">{movie.title}</h3>
                {movie.release_date && (
                  <p className="mt-0.5 text-xs text-white/60">{String(movie.release_date).slice(0, 4)}</p>
                )}
                {aiExplanation && (
                  <p className="mt-1 line-clamp-2 text-xs text-purple-300/90">{aiExplanation}</p>
                )}
                <span className="mt-2 self-start rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
                  Watch tonight →
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card footer */}
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium text-white/90">{movie.title}</h3>
          {aiExplanation
            ? <p className="mt-1 line-clamp-1 text-xs text-purple-300/80">{aiExplanation}</p>
            : <RecommendationExplanation movie={movie} moodName={moodName} />
          }
        </div>
      </button>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [selectedMood,  setSelectedMood]  = useState(null)
  const [viewingContext, setViewingContext] = useState(1)
  const [experienceType, setExperienceType] = useState(1)
  const [isPending, startTransition] = useTransition()

  // 0=mood, 1=results (with inline Refine drawer)
  const [currentStage, setCurrentStage] = useState(0)
  const [refineOpen, setRefineOpen] = useState(false)

  const [intensity,  setIntensity]  = useState(3)
  const [pacing,     setPacing]     = useState(3)
  const [timeOfDay,  setTimeOfDay]  = useState(getDefaultTimeOfDay)

  // Separate trigger so recommendations only fire when user clicks "Find my movies"
  const [triggerMood, setTriggerMood] = useState(null)

  // NL mood input
  const [freeText, setFreeText]       = useState('')
  const [dialsParsing, setDialsParsing] = useState(false)
  const [parsedTags, setParsedTags]   = useState(null)

  // Narration fallback: show static text after 2s if AI narration hasn't arrived
  const [showNarrationFallback, setShowNarrationFallback] = useState(false)

  const trackedResultsKeyRef  = useRef('')
  const autoAdvanceTimerRef  = useRef(null)
  // Refs for abandonment tracking — always reflect latest state values
  const abandonmentStateRef  = useRef({ stage: 0, moodId: null, hasFreeText: false })

  const { userId } = useAuthSession()
  const { suggestedMoodIds } = useSuggestedMoods(userId, timeOfDay, new Date().getDay())
  const { parse: parseMoodText } = useNLMoodParse()

  const { sessionId, createMoodSession, endMoodSession } = useMoodSession()
  const { trackRecommendationShown, trackRecommendationClicked } = useRecommendationTracking()

  const { recommendations, loading, error } = useRecommendations(
    triggerMood,
    viewingContext,
    experienceType,
    intensity,
    pacing,
    timeOfDay,
    20,
    parsedTags,
  )

  const selectedMoodOption = useMemo(
    () => MOODS.find((m) => m.id === selectedMood) ?? null,
    [selectedMood],
  )

  const moodVis = selectedMood ? MOOD_VISUAL_MAP[selectedMood] : MOOD_VISUAL_MAP.DEFAULT

  // Memoize movies array passed to AI hook to avoid spurious re-triggers
  const aiMovies = useMemo(
    () => recommendations.map((m) => ({ tmdbId: m.tmdb_id, title: m.title, vote_average: m.vote_average, mood_tags: m.mood_tags, tone_tags: m.tone_tags, fit_profile: m.fit_profile })),
    [recommendations],
  )

  const {
    narration,
    narrationDone,
    explanations,
  } = useAIMoodContext({
    mood:       selectedMoodOption?.name ?? null,
    context:    VIEWING_CONTEXTS.find((c) => c.id === viewingContext)?.name ?? null,
    experience: EXPERIENCE_TYPES.find((e) => e.id === experienceType)?.name ?? null,
    intensity,
    pacing,
    timeOfDay,
    movies:     aiMovies,
    top3Genres: [],
    enabled:    recommendations.length > 0,
  })

  const isLoading = loading || isPending

  // Narration fallback timer
  useEffect(() => {
    if (!isLoading) { setShowNarrationFallback(false); return }
    const t = setTimeout(() => { if (!narration) setShowNarrationFallback(true) }, 3000)
    return () => clearTimeout(t)
  }, [isLoading, narration])

  const narrationDisplay = narration
    || (showNarrationFallback ? `Finding the perfect ${selectedMoodOption?.name?.toLowerCase() ?? ''} films for your night…` : '')

  // Clean up auto-advance timer on unmount
  useEffect(() => () => clearTimeout(autoAdvanceTimerRef.current), [])

  // Keep abandonment ref in sync with latest state values
  useEffect(() => {
    abandonmentStateRef.current = {
      stage:       currentStage,
      moodId:      selectedMood,
      hasFreeText: freeText.trim().length > 0,
    }
  }, [currentStage, selectedMood, freeText])

  // Wizard abandonment signal — fires on unmount if user leaves before results
  useEffect(() => {
    return () => {
      const { stage, moodId, hasFreeText } = abandonmentStateRef.current
      if (stage >= 1) return // reached results — not an abandonment
      supabase.from('mood_session_abandoned').insert({
        user_id:         userId ?? null,
        selected_mood_id: moodId ?? null,
        reached_stage:   stage,
        had_free_text:   hasFreeText,
      }).then()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — reads from ref at unmount time

  // createMoodSession fires when mood is confirmed and results trigger
  useEffect(() => {
    if (!triggerMood) return
    createMoodSession(triggerMood, viewingContext, experienceType, pacing, intensity)
  }, [createMoodSession, experienceType, intensity, pacing, triggerMood, viewingContext])

  useEffect(() => {
    return () => { endMoodSession() }
  }, [endMoodSession])

  // Clean up auto-advance timer on unmount
  useEffect(() => () => clearTimeout(autoAdvanceTimerRef.current), [])

  // Keep abandonment ref in sync with latest state values
  useEffect(() => {
    abandonmentStateRef.current = {
      stage:       currentStage,
      moodId:      selectedMood,
      hasFreeText: freeText.trim().length > 0,
    }
  }, [currentStage, selectedMood, freeText])

  useEffect(() => {
    if (!sessionId || recommendations.length === 0) return
    const trackingKey = `${sessionId}:${recommendations.map((m) => `${m.movie_id}:${m.final_score}`).join('|')}`
    if (trackedResultsKeyRef.current === trackingKey) return
    trackedResultsKeyRef.current = trackingKey
    recommendations.forEach((movie, i) => {
      trackRecommendationShown(sessionId, movie.movie_id, i + 1, movie.final_score)
    })
  }, [recommendations, sessionId, trackRecommendationShown])

  // Runtime scoreMoodAffinity is the single source of ranking truth
  const displayedRecommendations = recommendations

  // Handlers
  function handleMoodSelect(moodId, clientX, clientY) {
    const vis = MOOD_VISUAL_MAP[moodId]
    fireParticleBurst(clientX, clientY, vis.orbColor)
    clearTimeout(autoAdvanceTimerRef.current)
    startTransition(() => setSelectedMood(moodId))

    // Auto-advance to results after 400ms ONLY if the user hasn't typed anything.
    // Re-checks freeText at execution time so typing during the window cancels it.
    autoAdvanceTimerRef.current = setTimeout(() => {
      setFreeText(prev => {
        if (!prev.trim()) {
          setTriggerMood(moodId)
          setCurrentStage(1)
        }
        return prev
      })
    }, 400)
  }

  async function handleNext() {
    // Cancel any pending auto-advance
    clearTimeout(autoAdvanceTimerRef.current)

    if (!freeText.trim()) {
      startTransition(() => {
        setTriggerMood(selectedMood)
        setCurrentStage(1)
      })
      return
    }
    setDialsParsing(true)
    const moodName = MOODS.find((m) => m.id === selectedMood)?.name ?? ''
    const result = await parseMoodText(moodName, freeText)
    if (result) {
      if (result.intensity)      setIntensity(result.intensity)
      if (result.pacing)         setPacing(result.pacing)
      if (result.viewingContext) setViewingContext(result.viewingContext)
      if (result.experienceType) setExperienceType(result.experienceType)
      // Store parsed tag preferences for recommendation scoring
      if (result.preferredMoodTags?.length || result.avoidedMoodTags?.length || result.preferredToneTags?.length) {
        setParsedTags({
          preferredMoodTags: result.preferredMoodTags,
          avoidedMoodTags:   result.avoidedMoodTags,
          preferredToneTags: result.preferredToneTags,
        })
      }
    }
    setDialsParsing(false)
    startTransition(() => {
      setTriggerMood(selectedMood)
      setCurrentStage(1)
    })
  }

  function handleReset() {
    clearTimeout(autoAdvanceTimerRef.current)
    startTransition(() => {
      setSelectedMood(null)
      setTriggerMood(null)
      setCurrentStage(0)
      setIntensity(3)
      setPacing(3)
      setTimeOfDay(getDefaultTimeOfDay())
      setViewingContext(1)
      setExperienceType(1)
      setFreeText('')
      setDialsParsing(false)
      setParsedTags(null)
      setRefineOpen(false)
      trackedResultsKeyRef.current = ''
      setShowNarrationFallback(false)
    })
  }

  // Derived labels for results header
  const contextLabel = VIEWING_CONTEXTS.find((c) => c.id === viewingContext)?.name?.toLowerCase() ?? ''
  const expLabel     = EXPERIENCE_LABELS[experienceType]?.label?.toLowerCase() ?? ''
  const todLabel     = TIME_OF_DAY.find((t) => t.id === timeOfDay)?.label?.toLowerCase() ?? ''
  const resultsHeader = selectedMoodOption
    ? `${selectedMoodOption.name} for a ${contextLabel} — ${expLabel}, ${todLabel}`
    : ''

  return (
    <>
      <AuroraBackground moodId={selectedMood} />

      <div className="relative min-h-screen text-white" style={{ zIndex: 1 }}>
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
          <StageProgress currentStage={currentStage} moodId={selectedMood} />

          <AnimatePresence mode="wait">

            {/* ── Stage 0: Mood Selector ───────────────────────────────────── */}
            {currentStage === 0 && (
              <motion.div key="stage-0" {...stageTransition}>
                <div className="mb-12 text-center">
                  <h1
                    className="mb-3 font-black leading-tight"
                    style={{
                      fontSize:            'clamp(2.5rem,5vw,4rem)',
                      background:          'linear-gradient(135deg,#e2d9f3 0%,#a78bfa 50%,#67e8f9 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip:      'text',
                    }}
                  >
                    How are you feeling?
                  </h1>
                  <p className="text-sm tracking-widest" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                    FeelFlick reads the room.
                  </p>
                </div>

                {suggestedMoodIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex flex-wrap items-center gap-2"
                  >
                    <span className="text-xs text-white/40 tracking-wide uppercase">Suggested for you</span>
                    {suggestedMoodIds.map((id) => {
                      const mood = MOODS.find((m) => m.id === id)
                      const vis  = MOOD_VISUAL_MAP[id]
                      if (!mood || !vis) return null
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={(e) => handleMoodSelect(id, e.clientX, e.clientY)}
                          aria-label={`Suggested mood: ${mood.name}`}
                          className="rounded-full border px-3 py-1 text-xs font-semibold text-white transition-all duration-200 hover:opacity-80 active:scale-95"
                          style={{
                            backgroundColor: `rgba(${vis.rgb}, 0.12)`,
                            borderColor: `${vis.orbColor}66`,
                          }}
                        >
                          {mood.emoji} {mood.name}
                        </button>
                      )
                    })}
                  </motion.div>
                )}

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
                >
                  {MOODS.map((mood) => {
                    const vis        = MOOD_VISUAL_MAP[mood.id]
                    const isSelected = selectedMood === mood.id
                    const hasSelection = selectedMood !== null
                    const isDimmed   = hasSelection && !isSelected

                    return (
                      <motion.button
                        key={mood.id}
                        type="button"
                        variants={cardVariant}
                        whileHover={isDimmed ? undefined : { scale: isSelected ? 1.06 : 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => handleMoodSelect(mood.id, e.clientX, e.clientY)}
                        aria-pressed={isSelected}
                        className="relative flex flex-col items-center justify-center p-5 text-center"
                        style={{
                          aspectRatio:    '1/1.1',
                          background:     isSelected ? `rgba(${vis.rgb},0.12)` : 'rgba(255,255,255,0.04)',
                          border:         isSelected ? `1px solid ${vis.orbColor}99` : '1px solid rgba(255,255,255,0.07)',
                          borderRadius:   '20px',
                          backdropFilter: 'blur(16px)',
                          opacity:        isDimmed ? 0.45 : 1,
                          boxShadow:      isSelected ? `0 0 48px ${vis.orbColor}66,0 0 96px ${vis.orbColor}33` : 'none',
                          transition:     'opacity 280ms,border-color 280ms,box-shadow 280ms,background 280ms',
                        }}
                      >
                        <div className="mb-3 text-[48px] leading-none" aria-hidden="true">{mood.emoji}</div>
                        <div className="text-lg font-semibold text-white">{mood.name}</div>
                        <div className="mt-1 text-xs" style={{ color: '#94a3b8' }}>{mood.description}</div>
                        {/* Accent bar */}
                        <div
                          className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full"
                          style={{
                            background: `linear-gradient(90deg,${vis.color1},${vis.color2})`,
                            opacity:    isSelected ? 1 : 0.4,
                          }}
                        />
                      </motion.button>
                    )
                  })}
                </motion.div>

                {selectedMood && (
                  <motion.div
                    key="nl-input"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value.slice(0, 200))}
                      placeholder="Describe your vibe — e.g. 'something cozy, not too intense, just want to zone out' (optional)"
                      rows={2}
                      aria-label="Describe your mood in your own words"
                      className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={dialsParsing}
                      className="w-full rounded-2xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all"
                    >
                      {dialsParsing ? 'Reading your vibe…' : 'Next →'}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Stage 1: Results + Refine Drawer ────────────────────────── */}
            {currentStage === 1 && (
              <motion.div key="stage-1" {...stageTransition}>
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <h2
                      className="mb-1 text-2xl font-bold capitalize"
                      style={{
                        background:          `linear-gradient(135deg,${moodVis.color1},${moodVis.color2})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip:      'text',
                      }}
                    >
                      {resultsHeader}
                    </h2>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                      5 picks curated for this exact feeling
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRefineOpen(prev => !prev)}
                    className="flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 hover:bg-white/10"
                    style={{
                      border: `1px solid ${refineOpen ? moodVis.orbColor + '80' : 'rgba(255,255,255,0.15)'}`,
                      color: refineOpen ? moodVis.orbColor : 'rgba(255,255,255,0.60)',
                      backgroundColor: refineOpen ? `${moodVis.orbColor}15` : 'transparent',
                    }}
                    aria-expanded={refineOpen}
                    aria-controls="refine-drawer"
                  >
                    {refineOpen ? '✕ Close' : '⚙ Refine'}
                  </button>
                </div>

                {/* Refine drawer */}
                <AnimatePresence>
                  {refineOpen && (
                    <motion.div
                      id="refine-drawer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mb-8 space-y-6 rounded-2xl p-5 sm:p-6"
                        style={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {/* Dials */}
                        <div className="grid gap-6 sm:grid-cols-2">
                          <PipDial
                            label="Intensity"
                            icon="🔥"
                            leftAnchor="Gentle"
                            rightAnchor="Intense"
                            value={intensity}
                            onChange={setIntensity}
                            orbColor={moodVis.orbColor}
                          />
                          <PipDial
                            label="Pacing"
                            icon="⏱️"
                            leftAnchor="Slow burn"
                            rightAnchor="Fast & punchy"
                            value={pacing}
                            onChange={setPacing}
                            orbColor={moodVis.orbColor}
                          />
                        </div>

                        {/* Time of day */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">When</span>
                          <div className="flex flex-wrap gap-2">
                            {TIME_OF_DAY.map((t) => {
                              const isActive = timeOfDay === t.id
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  aria-pressed={isActive}
                                  onClick={() => setTimeOfDay(t.id)}
                                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200"
                                  style={{
                                    backgroundColor: isActive ? moodVis.orbColor : 'rgba(255,255,255,0.08)',
                                    color:           isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                                  }}
                                >
                                  {t.icon} {t.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Who's watching */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">Who&apos;s watching</span>
                          <div className="flex flex-wrap gap-2">
                            {VIEWING_CONTEXTS.map((ctx) => {
                              const isActive = viewingContext === ctx.id
                              return (
                                <button
                                  key={ctx.id}
                                  type="button"
                                  aria-pressed={isActive}
                                  onClick={() => startTransition(() => setViewingContext(ctx.id))}
                                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200"
                                  style={{
                                    backgroundColor: isActive ? moodVis.orbColor : 'rgba(255,255,255,0.07)',
                                    border:          isActive ? `1px solid ${moodVis.orbColor}` : '1px solid rgba(255,255,255,0.10)',
                                    color:           isActive ? '#fff' : 'rgba(255,255,255,0.60)',
                                  }}
                                >
                                  {ctx.icon} {ctx.name}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Experience type */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">What you want</span>
                          <div className="flex flex-wrap gap-2">
                            {EXPERIENCE_TYPES.map((exp) => {
                              const isActive = experienceType === exp.id
                              const { label, emoji } = EXPERIENCE_LABELS[exp.id]
                              return (
                                <button
                                  key={exp.id}
                                  type="button"
                                  aria-pressed={isActive}
                                  onClick={() => startTransition(() => setExperienceType(exp.id))}
                                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200"
                                  style={{
                                    backgroundColor: isActive ? `rgba(${moodVis.rgb},0.18)` : 'rgba(255,255,255,0.04)',
                                    border:          isActive ? `1px solid ${moodVis.orbColor}80` : '1px solid rgba(255,255,255,0.08)',
                                    color:           isActive ? '#fff' : 'rgba(255,255,255,0.60)',
                                  }}
                                >
                                  {emoji} {label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLoading && (
                  <div aria-live="polite">
                    {narrationDisplay && (
                      <div className="mb-6 text-center">
                        <p className="mx-auto max-w-md text-sm text-white/70">
                          {narrationDisplay}
                          {!narrationDone && narration && (
                            <span
                              className="ml-0.5 inline-block animate-pulse"
                              style={{ width: '2px', height: '14px', backgroundColor: moodVis.orbColor, verticalAlign: 'text-bottom' }}
                              aria-hidden="true"
                            />
                          )}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                      {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                  </div>
                )}

                {error && !isLoading && (
                  <div
                    className="rounded-xl p-4"
                    style={{ border: '1px solid rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.08)' }}
                  >
                    <p className="font-medium text-red-300">We couldn&apos;t load recommendations right now.</p>
                    <p className="mt-1 text-sm text-red-200/80">
                      Try switching mood filters or refreshing the page. Details: {error}
                    </p>
                  </div>
                )}

                {!isLoading && !error && recommendations.length > 0 && (
                  <LayoutGroup>
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
                    >
                      {displayedRecommendations.map((movie, index) => (
                        <RecommendationCard
                          key={movie.movie_id}
                          movie={movie}
                          index={index}
                          moodName={selectedMoodOption?.name}
                          moodId={selectedMood}
                          aiExplanation={explanations.get(movie.tmdb_id)?.explanation ?? null}
                          aiScore={explanations.get(movie.tmdb_id)?.score ?? null}
                          aiLoading={!narrationDone}
                          onOpenMovie={() => {
                            if (sessionId) {
                              trackRecommendationClicked(sessionId, movie.movie_id)
                            }
                            navigate(`/movie/${movie.tmdb_id}`, {
                              state: { sessionId, movieId: movie.movie_id },
                            })
                          }}
                        />
                      ))}
                    </motion.div>
                  </LayoutGroup>
                )}

                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full px-6 py-2 text-sm transition-all duration-200 hover:bg-white/10"
                    style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.60)' }}
                  >
                    Try a different mood
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
