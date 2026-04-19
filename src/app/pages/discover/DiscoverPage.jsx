import {
  useEffect,
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
import Button from '@/shared/ui/Button'

import { QUESTION_SET } from './questions'
import AIBar from './components/AIBar'
import AnchorSearch from './components/AnchorSearch'
import BriefSynthesis from './components/BriefSynthesis'
import CandidateCounter from './components/CandidateCounter'
import NarratedLoader from './components/NarratedLoader'
import PinnedBrief from './components/PinnedBrief'
import PinnedBriefCollapsible from './components/PinnedBriefCollapsible'
import QuestionSlot from './components/QuestionSlot'
import ResultsList from './components/ResultsList'

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

            {/* Error state */}
            {error && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
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

            {/* Film results list */}
            {!error && recommendations.length > 0 && (
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <ResultsList
                  films={recommendations}
                  brief={{ answers, anchor }}
                  onOpenDetail={(film) => {
                    if (sessionId) {
                      trackRecommendationClicked(sessionId, film.movie_id)
                    }
                    navigate(`/movie/${film.tmdb_id}`, {
                      state: { sessionId, movieId: film.movie_id },
                    })
                  }}
                />
              </div>
            )}

            {/* Post-results CTA */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
              <p className="text-sm text-white/50 mb-4">
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
