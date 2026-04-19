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
import { useBriefCandidateCount } from '@/shared/hooks/useBriefCandidateCount'
import { useMovieExplanation } from '@/shared/hooks/useMovieExplanation'
import { useMoodBrief } from '@/shared/hooks/useMoodBrief'
import { useMoodSession } from '@/shared/hooks/useMoodSession'
import { useRecommendationTracking } from '@/shared/hooks/useRecommendationTracking'
import { useRecommendations } from '@/shared/hooks/useRecommendations'
import { useNLMoodParse } from '@/shared/hooks/useNLMoodParse'
import Button from '@/shared/ui/Button'

import { QUESTION_SET } from './questions'
import AIBar from './components/AIBar'
import AnchorSearch from './components/AnchorSearch'
import CandidateCounter from './components/CandidateCounter'
import NarratedLoader from './components/NarratedLoader'
import PinnedBrief from './components/PinnedBrief'
import QuestionSlot from './components/QuestionSlot'

// ─── Data constants ───────────────────────────────────────────────────────────

const MOODS = [
  { id: 1,  name: 'Cozy' },
  { id: 2,  name: 'Adventurous' },
  { id: 3,  name: 'Heartbroken' },
  { id: 4,  name: 'Curious' },
  { id: 5,  name: 'Nostalgic' },
  { id: 6,  name: 'Energized' },
  { id: 7,  name: 'Anxious' },
  { id: 8,  name: 'Romantic' },
  { id: 9,  name: 'Inspired' },
  { id: 10, name: 'Silly' },
  { id: 11, name: 'Dark' },
  { id: 12, name: 'Overwhelmed' },
]

const VIEWING_CONTEXTS = [
  { id: 1, name: 'Alone' },
  { id: 2, name: 'With a partner' },
  { id: 3, name: 'Friend group' },
  { id: 4, name: 'Family' },
  { id: 5, name: 'Kids night' },
]

const EXPERIENCE_TYPES = [
  { id: 1, name: 'Escape' },
  { id: 2, name: 'Laugh' },
  { id: 3, name: 'Cry' },
  { id: 4, name: 'Think' },
  { id: 5, name: 'Zone Out' },
]

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

const EMPTY_GENRES = []

// ─── Company → viewingContext ID mapping ──────────────────────────────────────

const COMPANY_TO_CONTEXT = { alone: 1, partner: 2, friends: 3, family: 4 }

// ─── Attention + Familiarity → experienceType lookup ─────────────────────────

const EXPERIENCE_LOOKUP = {
  'lean-back|comfort':  5, // Zone Out
  'lean-back|new':      1, // Escape
  'lean-back|surprise': 1, // Escape
  'lean-in|comfort':    4, // Think
  'lean-in|new':        4, // Think
  'lean-in|surprise':   4, // Think
  'either|comfort':     5, // Zone Out
  'either|new':         1, // Escape
  'either|surprise':    1, // Escape
}

function getDefaultTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'latenight'
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

// ─── Aurora Background ────────────────────────────────────────────────────────

function AuroraBackground({ moodId }) {
  const orb1Ref = useRef(null)
  const orb2Ref = useRef(null)
  const orb3Ref = useRef(null)

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

// ─── Fallback explanation ─────────────────────────────────────────────────────

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

          <div
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}
          >
            #{index + 1}
          </div>

          <div className="absolute right-2 top-2">
            {showScoreSkeleton
              ? <span className="block h-5 w-9 animate-pulse rounded-full bg-purple-500/20" aria-hidden="true" />
              : <AnimatedScore score={finalScore} color1={vis.color1} color2={vis.color2} />
            }
          </div>

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
  const [, startTransition] = useTransition()

  // === BRIEF STATE ===
  const {
    brief,
    answers,
    notes,
    anchor,
    anchorSkipped,
    answer,
    editAnswer,
    addNote,
    removeNote,
    setAnchor,
    clearAnchor,
    skipAnchor,
    isComplete,
    progress,
    reset,
  } = useMoodBrief()

  // === LIVE CANDIDATE COUNT ===
  const { count: candidateCount, previousCount: prevCandidateCount, loading: countLoading } = useBriefCandidateCount(brief)

  // === PHASE: briefing → loading → results ===
  const [phase, setPhase] = useState('briefing')

  // === ENGINE PARAMS (derived from brief answers) ===
  const [triggerMood, setTriggerMood] = useState(null)
  const [parsedTags, setParsedTags] = useState(null)

  const trackedResultsKeyRef = useRef('')
  const abandonmentStateRef = useRef({ phase: 'briefing', moodId: null })

  const { userId } = useAuthSession()
  const { parse: parseMoodText } = useNLMoodParse()
  const { sessionId, createMoodSession, endMoodSession } = useMoodSession()
  const { trackRecommendationShown, trackRecommendationClicked } = useRecommendationTracking()

  // Map brief answers → engine params
  const moodId = answers.feeling ?? null
  const energyLevel = answers.energy ?? 3
  const viewingContextId = COMPANY_TO_CONTEXT[answers.company] ?? 1
  const experienceTypeId = EXPERIENCE_LOOKUP[`${answers.attention ?? 'either'}|${answers.familiarity ?? 'new'}`] ?? 1
  const timeOfDay = getDefaultTimeOfDay()

  const { recommendations, loading, error } = useRecommendations(
    triggerMood,
    viewingContextId,
    experienceTypeId,
    energyLevel,  // intensity
    energyLevel,  // pacing (energy maps to both)
    timeOfDay,
    20,
    parsedTags,
  )

  const selectedMoodOption = useMemo(
    () => MOODS.find((m) => m.id === moodId) ?? null,
    [moodId],
  )

  const moodVis = moodId ? MOOD_VISUAL_MAP[moodId] : MOOD_VISUAL_MAP.DEFAULT

  // Memoize movies array for AI hook stability
  const aiMovies = useMemo(
    () => recommendations.map((m) => ({ tmdbId: m.tmdb_id, title: m.title, vote_average: m.vote_average, mood_tags: m.mood_tags, tone_tags: m.tone_tags, fit_profile: m.fit_profile })),
    [recommendations],
  )

  const {
    narrationDone,
    explanations,
  } = useAIMoodContext({
    mood:       selectedMoodOption?.name ?? null,
    context:    VIEWING_CONTEXTS.find((c) => c.id === viewingContextId)?.name ?? null,
    experience: EXPERIENCE_TYPES.find((e) => e.id === experienceTypeId)?.name ?? null,
    intensity:  energyLevel,
    pacing:     energyLevel,
    timeOfDay,
    movies:     aiMovies,
    top3Genres: EMPTY_GENRES,
    enabled:    recommendations.length > 0,
  })

  // Keep abandonment ref in sync
  useEffect(() => {
    abandonmentStateRef.current = { phase, moodId }
  }, [phase, moodId])

  // Abandonment signal on unmount
  useEffect(() => {
    return () => {
      const { phase: p, moodId: m } = abandonmentStateRef.current
      if (p === 'results') return
      supabase.from('mood_session_abandoned').insert({
        user_id:          userId ?? null,
        selected_mood_id: m ?? null,
        reached_stage:    p === 'briefing' ? 0 : 1,
        had_free_text:    false,
      }).then()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Create mood session when engine fires
  useEffect(() => {
    if (!triggerMood) return
    createMoodSession(triggerMood, viewingContextId, experienceTypeId, energyLevel, energyLevel)
  }, [createMoodSession, experienceTypeId, energyLevel, triggerMood, viewingContextId])

  useEffect(() => {
    return () => { endMoodSession() }
  }, [endMoodSession])

  // Track recommendation impressions
  useEffect(() => {
    if (!sessionId || recommendations.length === 0) return
    const trackingKey = `${sessionId}:${recommendations.map((m) => `${m.movie_id}:${m.final_score}`).join('|')}`
    if (trackedResultsKeyRef.current === trackingKey) return
    trackedResultsKeyRef.current = trackingKey
    recommendations.forEach((movie, i) => {
      trackRecommendationShown(sessionId, movie.movie_id, i + 1, movie.final_score)
    })
  }, [recommendations, sessionId, trackRecommendationShown])

  // WHY: NarratedLoader's onComplete handles the loading→results transition.
  // It waits for both (a) all narration lines shown AND (b) results ready.

  // === HANDLERS ===

  /** Submit the completed brief and trigger recommendations. */
  async function handleSubmitBrief() {
    if (!moodId) return

    console.log('[Discover] brief submitted', answers)

    setPhase('loading')

    // Parse notes into tags if present
    if (notes.length > 0) {
      const moodName = MOODS.find((m) => m.id === moodId)?.name ?? ''
      const freeText = notes.join(' | ')
      const result = await parseMoodText(moodName, freeText)
      if (result?.preferredMoodTags?.length || result?.avoidedMoodTags?.length || result?.preferredToneTags?.length) {
        setParsedTags({
          preferredMoodTags: result.preferredMoodTags,
          avoidedMoodTags:   result.avoidedMoodTags,
          preferredToneTags: result.preferredToneTags,
        })
      }
    }

    startTransition(() => {
      setTriggerMood(moodId)
    })
  }

  function handleReset() {
    startTransition(() => {
      reset()
      setTriggerMood(null)
      setPhase('briefing')
      setParsedTags(null)
      trackedResultsKeyRef.current = ''
    })
  }

  // === RENDER ===

  // Active question object
  const activeQuestion = brief.activeQuestionId
    ? QUESTION_SET.find((q) => q.id === brief.activeQuestionId)
    : null

  // Show anchor step when all 8 questions are answered but anchor hasn't been handled
  const showAnchorStep = isComplete && !anchor && !anchorSkipped && phase === 'briefing'

  // Show ready CTA when complete + anchor handled
  const showReadyCTA = isComplete && (anchor || anchorSkipped) && phase === 'briefing'

  return (
    <>
      <AuroraBackground moodId={moodId} />

      <div className="relative min-h-screen text-white" style={{ zIndex: 1 }}>

        {/* === BRIEFING PHASE === */}
        {phase === 'briefing' && (
          <div className="min-h-screen bg-transparent pb-24">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">

              {/* Eyebrow */}
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/60">
                  Your brief — {progress.answered} of {progress.total}
                </p>
              </div>

              {/* Pinned brief */}
              {progress.answered > 0 && (
                <PinnedBrief
                  answers={answers}
                  notes={notes}
                  anchor={anchor}
                  onEdit={editAnswer}
                  onRemoveNote={removeNote}
                  onClearAnchor={clearAnchor}
                />
              )}

              {/* Live candidate counter */}
              {progress.answered >= 1 && (
                <CandidateCounter
                  count={candidateCount}
                  previousCount={prevCandidateCount}
                  loading={countLoading}
                />
              )}

              {/* Active question */}
              {activeQuestion && (
                <QuestionSlot
                  question={activeQuestion}
                  currentValue={answers[activeQuestion.id]}
                  onAnswer={answer}
                />
              )}

              {/* Anchor step */}
              {showAnchorStep && (
                <AnchorSearch
                  onSelect={setAnchor}
                  onSkip={skipAnchor}
                />
              )}

              {/* Ready CTA */}
              {showReadyCTA && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="py-16 flex flex-col items-center"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmitBrief}
                    aria-label="Find my 10 films"
                  >
                    Find my 10 films
                  </Button>
                </motion.div>
              )}

            </div>

            <AIBar addNote={addNote} />
          </div>
        )}

        {/* === LOADING PHASE === */}
        {phase === 'loading' && (
          <NarratedLoader
            totalCount={candidateCount}
            tagDim={45}
            hasTasteProfile={!!userId}
            resultsReady={!loading && recommendations.length > 0}
            onComplete={() => setPhase('results')}
          />
        )}

        {/* === RESULTS PHASE === */}
        {phase === 'results' && (
          <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
            <div className="mb-8">
              <h2
                className="mb-1 text-2xl font-bold capitalize"
                style={{
                  background:          `linear-gradient(135deg,${moodVis.color1},${moodVis.color2})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip:      'text',
                }}
              >
                {selectedMoodOption?.name ?? 'Your'} picks
              </h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                {recommendations.length} films curated for this exact feeling
              </p>
            </div>

            {error && (
              <div
                className="rounded-xl p-4 mb-6"
                style={{ border: '1px solid rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.08)' }}
              >
                <p className="font-medium text-red-300">We couldn&apos;t load recommendations right now.</p>
                <p className="mt-1 text-sm text-red-200/80">
                  Try switching mood filters or refreshing the page. Details: {error}
                </p>
              </div>
            )}

            {!error && recommendations.length > 0 && (
              <LayoutGroup>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
                >
                  {recommendations.map((movie, index) => (
                    <RecommendationCard
                      key={movie.movie_id}
                      movie={movie}
                      index={index}
                      moodName={selectedMoodOption?.name}
                      moodId={moodId}
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
          </div>
        )}

      </div>
    </>
  )
}
