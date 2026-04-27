import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { useBriefCandidateCount } from '@/shared/hooks/useBriefCandidateCount'
import { useMoodBrief } from '@/shared/hooks/useMoodBrief'
import { useMoodSession } from '@/shared/hooks/useMoodSession'
import { useRecommendationTracking } from '@/shared/hooks/useRecommendationTracking'
import { useRecommendations } from '@/shared/hooks/useRecommendations'
import { useNLMoodParse } from '@/shared/hooks/useNLMoodParse'
import { unpackVibe } from '@/shared/services/brief-scoring'
import { track } from '@/shared/services/analytics'
import Button from '@/shared/ui/Button'

import { useDiscoverTracking } from './hooks/useDiscoverTracking'
import { QUESTION_SET } from './questions'
import AIBar from './components/AIBar'
import AnchorSearch from './components/AnchorSearch'
import BriefSynthesis from './components/BriefSynthesis'
import CandidateCounter from './components/CandidateCounter'
import DiscoverEmptyState from './components/DiscoverEmptyState'
import NarratedLoader from './components/NarratedLoader'
import PinnedBrief from './components/PinnedBrief'
import PinnedBriefCollapsible from './components/PinnedBriefCollapsible'
import QuestionSlot from './components/QuestionSlot'
import ResultsList from './components/ResultsList'

// ─── Vibe → moodId mapping (for loadMoodData compatibility) ──────────────────

const FEELING_TO_MOOD_ID = {
  cozy: 1, adventurous: 2, heartbroken: 3, curious: 4,
  dark: 11, silly: 10, inspired: 9,
}

// ─── Company → viewingContext ID mapping ──────────────────────────────────────

const COMPANY_TO_CONTEXT = { alone: 1, partner: 2, friends: 3, family: 4 }

// ─── Attention → experienceType mapping ──────────────────────────────────────

const ATTENTION_TO_EXPERIENCE = {
  lean_in: 4,   // Think
  lean_back: 1, // Escape
}

function getDefaultTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 22) return 'evening'
  return 'latenight'
}

// ─── Mood visual map (for aurora background) ─────────────────────────────────

const MOOD_VISUAL_MAP = {
  1:  { orbColor: '#ff6b35', color1: '#ff6b35', color2: '#f59e0b', rgb: '255,107,53' },
  2:  { orbColor: '#0ea5e9', color1: '#0ea5e9', color2: '#06b6d4', rgb: '14,165,233' },
  3:  { orbColor: '#ec4899', color1: '#ec4899', color2: '#f43f5e', rgb: '236,72,153' },
  4:  { orbColor: '#a855f7', color1: '#a855f7', color2: '#8b5cf6', rgb: '168,85,247' },
  9:  { orbColor: '#f59e0b', color1: '#f59e0b', color2: '#fbbf24', rgb: '245,158,11' },
  10: { orbColor: '#84cc16', color1: '#84cc16', color2: '#22c55e', rgb: '132,204,22' },
  11: { orbColor: '#4338ca', color1: '#1e1b4b', color2: '#0f172a', rgb: '67,56,202' },
  DEFAULT: { orbColor: '#4f46e5', color1: '#4f46e5', color2: '#7c3aed', rgb: '79,70,229' },
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
    const vis = moodId ? (MOOD_VISUAL_MAP[moodId] || MOOD_VISUAL_MAP.DEFAULT) : MOOD_VISUAL_MAP.DEFAULT
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
  const [refineOpen, setRefineOpen] = useState(false)

  // === ENGINE PARAMS (derived from brief answers) ===
  const [triggerMood, setTriggerMood] = useState(null)
  const [parsedTags, setParsedTags] = useState(null)
  const [isSurpriseMe, setIsSurpriseMe] = useState(false)

  const trackedResultsKeyRef = useRef('')
  const abandonmentStateRef = useRef({ phase: 'briefing', moodId: null })

  const { userId } = useAuthSession()
  const { parse: parseMoodText } = useNLMoodParse()
  const { sessionId, createMoodSession, endMoodSession } = useMoodSession()
  const { trackRecommendationShown, trackRecommendationClicked } = useRecommendationTracking()
  const { trackShown: trackDiscoverShown, trackWatchlist, trackSeen, trackDismiss } = useDiscoverTracking()

  // Unpack vibe → feeling + tone for engine params
  const { feeling } = unpackVibe(answers)
  const moodId = feeling ? (FEELING_TO_MOOD_ID[feeling] ?? 4) : null
  const viewingContextId = COMPANY_TO_CONTEXT[answers.company] ?? 1
  const experienceTypeId = ATTENTION_TO_EXPERIENCE[answers.attention] ?? 1
  const energyLevel = 3 // Default medium — inferred from vibe in scoring
  const timeOfDay = getDefaultTimeOfDay()

  // Build brief object for v3 scoring engine (answers + anchor + surprise flag)
  const briefForEngine = useMemo(() => ({
    ...answers,
    anchor: anchor || null,
    ...(isSurpriseMe ? { surpriseMe: true } : {}),
  }), [answers, anchor, isSurpriseMe])

  const { recommendations, loading, error } = useRecommendations(
    triggerMood,
    viewingContextId,
    experienceTypeId,
    energyLevel,
    energyLevel,
    timeOfDay,
    20,
    parsedTags,
    briefForEngine,
  )

  // Terminal conditions for NarratedLoader — mutually exclusive once loading settles
  const resultsReady = !loading && recommendations.length > 0
  const errorReady = !loading && Boolean(error)
  const exhausted = !loading && !error && recommendations.length === 0

  // Track discover_started when the user first picks a feeling
  const prevFeelingRef = useRef(null)
  useEffect(() => {
    if (feeling && !prevFeelingRef.current) {
      track('discover_started', { feeling, mood_id: moodId })
    }
    prevFeelingRef.current = feeling
  }, [feeling, moodId])

  // Track discover_completed when results phase begins
  const prevPhaseRef = useRef('briefing')
  useEffect(() => {
    if (phase === 'results' && prevPhaseRef.current !== 'results') {
      track('discover_completed', {
        feeling,
        mood_id: moodId,
        is_surprise_me: isSurpriseMe,
        result_count: recommendations.length,
      })
    }
    prevPhaseRef.current = phase
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep abandonment ref in sync
  useEffect(() => {
    abandonmentStateRef.current = { phase, moodId }
  }, [phase, moodId])

  // Abandonment signal on unmount
  useEffect(() => {
    return () => {
      const { phase: p, moodId: m } = abandonmentStateRef.current
      if (p === 'results') return
      track('discover_abandoned', { mood_id: m, reached_stage: p })
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

  // Track discover-specific impressions (placement='discover')
  useEffect(() => {
    if (phase !== 'results' || recommendations.length === 0) return
    trackDiscoverShown(recommendations)
  }, [phase, recommendations, trackDiscoverShown])

  // === HANDLERS ===

  /** Submit the completed brief and trigger recommendations. */
  async function handleSubmitBrief() {
    if (!moodId) return

    setPhase('loading')

    // Parse notes into tags if present
    if (notes.length > 0) {
      const freeText = notes.join(' | ')
      const result = await parseMoodText(feeling ?? 'curious', freeText)
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

  /** "Surprise me" — bypass brief, day-rotated profile-driven picks. */
  function handleSurpriseMe() {
    track('surprise_me_clicked')
    setPhase('loading')
    setIsSurpriseMe(true)
    startTransition(() => {
      setTriggerMood(4)
    })
  }

  function handleReset() {
    startTransition(() => {
      reset()
      setTriggerMood(null)
      setPhase('briefing')
      setParsedTags(null)
      setIsSurpriseMe(false)
      trackedResultsKeyRef.current = ''
    })
  }

  // === RENDER ===

  // Active question object
  const activeQuestion = brief.activeQuestionId
    ? QUESTION_SET.find((q) => q.id === brief.activeQuestionId)
    : null

  // Show anchor step when all questions are answered but anchor hasn't been handled
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

              {/* Progress dots */}
              <div className="mb-6 flex items-center gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/60">
                  Your brief
                </p>
                <div className="flex gap-1.5">
                  {Array.from({ length: progress.total }, (_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                        i < progress.answered ? 'bg-purple-400' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
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

              {/* AI bar inline above question 1 + "Surprise me" */}
              {progress.answered === 0 && activeQuestion && (
                <>
                  <AIBar
                    addNote={addNote}
                    onSubmitDirect={(text) => {
                      addNote(text)
                      handleSubmitBrief()
                    }}
                    inline
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="mt-4 text-center"
                  >
                    <button
                      onClick={handleSurpriseMe}
                      className="text-sm text-purple-400/70 hover:text-purple-300 transition-colors underline underline-offset-4 decoration-purple-400/30"
                      aria-label="Surprise me — skip the brief"
                    >
                      Surprise me
                    </button>
                  </motion.div>
                </>
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
                  className="py-16 flex flex-col items-center gap-3"
                >
                  <motion.button
                    onClick={handleSubmitBrief}
                    aria-label="Find my films"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative px-10 py-[0.875rem] rounded-full font-semibold text-[0.9375rem] text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20 hover:brightness-110 transition-all duration-200"
                  >
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse opacity-30 blur-md" aria-hidden="true" />
                    <span className="relative">Find my films</span>
                  </motion.button>

                  {candidateCount === 0 && !countLoading && progress.answered > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-white/40 italic"
                    >
                      No exact matches — try loosening your vibe or time.
                    </motion.p>
                  )}
                </motion.div>
              )}

            </div>

            {/* Compact AI bar after engagement */}
            {progress.answered > 0 && <AIBar addNote={addNote} />}
          </div>
        )}

        {/* === LOADING PHASE === */}
        {phase === 'loading' && (
          <NarratedLoader
            resultsReady={resultsReady}
            errorReady={errorReady}
            exhausted={exhausted}
            onComplete={() => {
              if (exhausted) setPhase('empty')
              else setPhase('results')
            }}
          />
        )}

        {/* Error — outside phase switch, reachable from any phase where a fetch error fires */}
        {error && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
            <div
              className="rounded-xl p-4 mb-6"
              style={{ border: '1px solid rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.08)' }}
            >
              <p className="font-medium text-red-300">We couldn&apos;t load recommendations right now.</p>
              <p className="mt-1 text-sm text-red-200/80">
                Try switching mood filters or refreshing the page. Details: {error}
              </p>
            </div>
          </div>
        )}

        {/* === EMPTY PHASE — pool exhausted, zero results === */}
        {phase === 'empty' && (
          <DiscoverEmptyState
            onTryAnotherMood={handleReset}
            onBrowseAll={() => navigate('/movies')}
          />
        )}

        {/* === RESULTS PHASE === */}
        {phase === 'results' && (
          <div className="min-h-screen pb-16">
            {/* Collapsible brief */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
              <PinnedBriefCollapsible
                answers={answers}
                notes={notes}
                anchor={anchor}
                expanded={refineOpen}
                onToggle={() => setRefineOpen((v) => !v)}
                onEdit={(id) => {
                  editAnswer(id)
                  setRefineOpen(false)
                  setPhase('briefing')
                }}
                onRemoveNote={removeNote}
                onClearAnchor={clearAnchor}
              />
            </div>

            {/* Brief synthesis sentence */}
            <BriefSynthesis answers={answers} notes={notes} />

            {/* Film results list */}
            {!error && recommendations.length > 0 && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <ResultsList
                  films={recommendations}
                  onOpenDetail={(film) => {
                    if (sessionId) {
                      trackRecommendationClicked(sessionId, film.movie_id)
                    }
                    navigate(`/movie/${film.tmdb_id}`, {
                      state: { sessionId, movieId: film.movie_id },
                    })
                  }}
                  onTrackWatchlist={trackWatchlist}
                  onTrackSeen={trackSeen}
                  onTrackDismiss={trackDismiss}
                />
              </div>
            )}

            {/* Post-results CTA */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
              <p className="text-sm text-white/60 mb-4">
                None of these hit the spot?
              </p>
              <Button variant="secondary" onClick={handleReset}>
                Start a new brief
              </Button>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
