// src/features/discover/Discover.jsx — "Tuned to the moment".
//
// Shape the moment → receive one confident film, with two meaningful directions
// held quietly in reserve. Distinct from Home (Made for you) and Browse (Yours to
// explore). Adaptive Editorial Cinema: flat Ink canvas, Inter, neutral ivory
// primary actions; mood colour is local accent only (orbs, constellation,
// atmosphere, the explanation rule, the active-direction border) — never a theme.
//
// Canonical ranking pipeline (single source of truth):
//   1. score the candidate pool (scoreMovieForUser + the moment's mood/intention/
//      energy/time modifiers) → _rankScore + moodFitRaw
//   2. demote films already shown earlier this visit (diversifyTop3 session penalty)
//   3. → a stable ranked pool
//   4. DiscoverResultStage derives Closest/Gentler/Bolder roles from that pool
//      (buildDiscoverDirections) and uses the same unseen pool for bounded reserves.

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { scoreMovieForUser } from '@/shared/services/recommendations'
import { computeMatchPercent } from '@/shared/services/matchScore'
import { ThoughtfulRoot } from '@/shared/ui/thoughtful-seatmate'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'
import { isEnabled } from '@/shared/config/betaFlags'
import { DiscoverDataProvider, useDiscoverData } from './useDiscoverData'
import { MOODS, ONBOARDING_TO_DISCOVER, diversifyTop3, predictDiscoverDefaults } from './derive'
import { TIME_OPTIONS } from './constants'
import { ROSE } from '@/shared/lib/tokens'
import DiscoverMoodStage from './sections/DiscoverMoodStage'
import DiscoverContextStage from './sections/DiscoverContextStage'
import DiscoverResolveStage from './sections/DiscoverResolveStage'
import DiscoverResultStage from './sections/DiscoverResultStage'
import './discover.css'

// ── Web Audio cue layer (opt-in, default MUTED, persisted, no autoplay) ─────────
const FFAudio = (() => {
  let ctx = null, masterGain = null
  const MUTED_KEY = 'ff_discover_muted'
  const readMuted = () => { try { const v = localStorage.getItem(MUTED_KEY); return v === null ? true : v === '1' } catch { return true } }
  let muted = readMuted()
  function ensure() {
    if (ctx) return ctx
    try { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); masterGain = ctx.createGain(); masterGain.gain.value = muted ? 0 : 0.4; masterGain.connect(ctx.destination) } catch { ctx = null }
    return ctx
  }
  const FREQ = { tender: 392, tense: 493.88, slow: 329.63, cerebral: 587.33, cozy: 440, bittersweet: 369.99, mythic: 523.25, restless: 659.25 }
  function pluck(id) {
    const c = ensure(); if (!c || muted) return
    const f = FREQ[id] || 440, t = c.currentTime
    const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(f, t)
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.14, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85)
    osc.connect(g); g.connect(masterGain); osc.start(t); osc.stop(t + 0.9)
  }
  function whoom() {
    const c = ensure(); if (!c || muted) return
    const t = c.currentTime, osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(120, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.6)
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    osc.connect(g); g.connect(masterGain); osc.start(t); osc.stop(t + 0.65)
  }
  function setMuted(v) { muted = v; if (masterGain) masterGain.gain.value = v ? 0 : 0.4; try { localStorage.setItem(MUTED_KEY, v ? '1' : '0') } catch { /* private mode */ } }
  return { pluck, whoom, setMuted, isMuted: () => muted }
})()

function AudioToggle() {
  const [muted, setMuted] = useState(FFAudio.isMuted())
  return (
    <button type="button" className="ff-disc-audio" onClick={() => { const n = !muted; FFAudio.setMuted(n); setMuted(n) }}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!muted}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        {!muted && <><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>}
        {muted && <><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" /></>}
      </svg>
    </button>
  )
}

// Deterministic, reduced-motion-aware starfield (seeded PRNG → identical every
// render/mount, so visual baselines stay stable). Subordinate + aria-hidden.
function mulberry32(seed) { return function () { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function Starfield({ tint, reduced }) {
  const stars = useMemo(() => { const r = mulberry32(20260621); const out = []; for (let i = 0; i < 80; i++) out.push({ x: r() * 100, y: r() * 100, size: r() * 1.4 + 0.4, delay: r() * 8, dur: 6 + r() * 8, op: 0.18 + r() * 0.4 }); return out }, [])
  return (
    <div aria-hidden="true" className="ff-disc-starfield">
      <div className="ff-disc-starfield__tint" style={{ background: `radial-gradient(ellipse 90% 55% at 50% 0%, ${tint}1c, transparent 60%)` }} />
      {stars.map((s, i) => (
        <span key={i} className="ff-disc-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: s.op, animation: reduced ? 'none' : `ff-disc-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite` }} />
      ))}
    </div>
  )
}

async function commitDiscoverPreferences({ userId, intention, time, who, energy }) {
  if (!userId) return
  try {
    const { data: existing } = await supabase.from('user_discover_preferences')
      .select('intention_counts, time_counts, who_counts, energy_counts, total_commits').eq('user_id', userId).maybeSingle()
    const bump = (counts, key) => { const next = { ...(counts || {}) }; next[key] = (next[key] || 0) + 1; return next }
    const row = {
      user_id: userId,
      intention_counts: bump(existing?.intention_counts, intention),
      time_counts: bump(existing?.time_counts, time),
      who_counts: bump(existing?.who_counts, who),
      energy_counts: bump(existing?.energy_counts, energy),
      total_commits: (existing?.total_commits || 0) + 1,
    }
    const { error } = await supabase.from('user_discover_preferences').upsert(row, { onConflict: 'user_id' })
    if (error) throw error
  } catch (e) { console.error('[Discover.commitDiscoverPreferences]', e) }
}

// Existing approved fallback set — used ONLY when the live query returns nothing
// (offline / empty / error). These carry a mood `fit` vector (cold-start scoring)
// but no `_raw`/llm_* fields, so the result is honestly LEAD-ONLY (no fabricated
// directions) and the result stage labels it "Example pick" + suppresses any
// personal reason. No twin/diary/critic prose is rendered.
const TMDB = (p) => `https://image.tmdb.org/t/p/w500${p}`
const FILMS_FALLBACK = [
  { id: 1, tmdbId: 496243, title: 'Parasite', year: 2019, runtime: 132, dir: 'Bong Joon-ho', genre: 'Thriller', poster: TMDB('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'), ff: 97, critic: 96, audience: 90, fit: { tense: 0.94, slow: 0.78, tender: 0.20, cerebral: 0.70, cozy: 0.05, bittersweet: 0.50, mythic: 0.10, restless: 0.78 }, trailerKey: null },
  { id: 2, tmdbId: 666277, title: 'Past Lives', year: 2023, runtime: 105, dir: 'Celine Song', genre: 'Drama', poster: TMDB('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg'), ff: 94, critic: 96, audience: 84, fit: { tense: 0.10, slow: 0.86, tender: 0.94, cerebral: 0.40, cozy: 0.20, bittersweet: 0.92, mythic: 0.20, restless: 0.55 }, trailerKey: null },
  { id: 4, tmdbId: 329865, title: 'Arrival', year: 2016, runtime: 116, dir: 'Denis Villeneuve', genre: 'Sci-Fi', poster: TMDB('/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg'), ff: 90, critic: 94, audience: 82, fit: { tense: 0.30, slow: 0.82, tender: 0.40, cerebral: 0.95, cozy: 0.10, bittersweet: 0.78, mythic: 0.85, restless: 0.42 }, trailerKey: null },
  { id: 6, tmdbId: 152601, title: 'Her', year: 2013, runtime: 126, dir: 'Spike Jonze', genre: 'Romance', poster: TMDB('/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg'), ff: 86, critic: 94, audience: 81, fit: { tense: 0.15, slow: 0.78, tender: 0.86, cerebral: 0.62, cozy: 0.45, bittersweet: 0.88, mythic: 0.45, restless: 0.55 }, trailerKey: null },
  { id: 7, tmdbId: 129, title: 'Spirited Away', year: 2001, runtime: 125, dir: 'Hayao Miyazaki', genre: 'Animation', poster: TMDB('/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'), ff: 91, critic: 97, audience: 97, fit: { tense: 0.20, slow: 0.55, tender: 0.70, cerebral: 0.45, cozy: 0.92, bittersweet: 0.40, mythic: 0.95, restless: 0.30 }, trailerKey: null },
  { id: 9, tmdbId: 843, title: 'In the Mood for Love', year: 2000, runtime: 98, dir: 'Wong Kar-wai', genre: 'Romance', poster: TMDB('/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg'), ff: 93, critic: 92, audience: 87, fit: { tense: 0.12, slow: 0.92, tender: 0.92, cerebral: 0.55, cozy: 0.30, bittersweet: 0.95, mythic: 0.25, restless: 0.40 }, trailerKey: null },
]

function DiscoverPaused({ onRestart }) {
  return (
    <section className="ff-disc-stage ff-disc-paused">
      <h1 className="ff-disc-paused__title">Tonight’s pick is paused</h1>
      <p className="ff-disc-paused__sub">Recommendations are taking a short break during beta. Please check back soon.</p>
      <button type="button" className="ff-disc-btn ff-disc-btn--ghost" onClick={onRestart}>Start over</button>
    </section>
  )
}

function DiscoverBody() {
  const [stage, setStage] = useState(1)
  const [selected, setSelected] = useState([])
  const [time, setTime] = useState('std')
  const [who, setWho] = useState('alone')
  const [energy, setEnergy] = useState('steady')
  const [intention, setIntention] = useState('move')
  const reduced = useReducedMotion()
  const sessionShownIds = useRef(new Set())

  const { films: liveFilms, profile, baselineMoods, learnedPrefs, recentSaves, dataSource, loading } = useDiscoverData()
  const { user } = useAuthSession()
  const location = useLocation()
  const fromOnboardingRef = useRef(location.state?.fromOnboarding === true)

  // First-visit onboarding handoff — seed up to three moods from the baseline.
  const didPreSelectRef = useRef(false)
  useEffect(() => {
    if (didPreSelectRef.current || !fromOnboardingRef.current || selected.length > 0) return
    if (!baselineMoods || baselineMoods.length === 0) return
    const mapped = baselineMoods.map((k) => ONBOARDING_TO_DISCOVER[k]).filter(Boolean)
    if (mapped.length === 0) return
    setSelected([...new Set(mapped)].slice(0, 3)); didPreSelectRef.current = true
  }, [baselineMoods, selected.length])

  // Predicted context defaults — a starting point only (validated logic + neutral).
  const didPredictRef = useRef(false)
  const contextTouchedRef = useRef(false)
  useEffect(() => { if (stage === 1) didPredictRef.current = false }, [stage])
  useEffect(() => { if (!contextTouchedRef.current) didPredictRef.current = false }, [selected])
  useEffect(() => {
    if (contextTouchedRef.current || didPredictRef.current || !profile || selected.length === 0) return
    const p = predictDiscoverDefaults({ selected, profile, hourOfDay: new Date().getHours(), learnedPrefs })
    setIntention(p.intention); setTime(p.time); setEnergy(p.energy); setWho(p.who); didPredictRef.current = true
  }, [profile, selected, learnedPrefs])

  const handleCommitStage2 = useCallback(() => {
    if (user?.id) commitDiscoverPreferences({ userId: user.id, intention, time, who, energy })
  }, [user?.id, intention, time, who, energy])

  const usingLiveFilms = !!(liveFilms && liveFilms.length > 0)
  const isFallback = dataSource ? dataSource.movies === 'fallback' : !usingLiveFilms
  const fallbackReason = dataSource?.reason
  const blendHex = useMemo(() => (selected.length === 0 ? ROSE : (MOODS.find((m) => m.id === selected[0])?.hex || ROSE)), [selected])

  const recsEnabled = isEnabled('discoverRecommendations')

  // Canonical ranked pool (step 1–3). Roles (step 4) are derived in the result stage.
  const ranked = useMemo(() => {
    if (!recsEnabled) return []
    // Live candidates when present; otherwise the existing approved fallback set
    // (honestly labelled + lead-only downstream because it carries no llm_* fields).
    const films = usingLiveFilms ? liveFilms : FILMS_FALLBACK
    if (!films || films.length === 0) return []
    const runtimeBand = TIME_OPTIONS.find((t) => t.id === time)?.v || [0, 300]
    const savedDirs = new Set((recentSaves || []).map((s) => s.director).filter(Boolean))
    const savedGenres = new Set((recentSaves || []).map((s) => s.genre).filter(Boolean))
    const moodIds = selected.length > 0 ? selected : ['slow', 'tender']
    const scored = films.map((f) => {
      const engineScored = (profile && f._raw) ? scoreMovieForUser(f._raw, profile, 'default') : null
      const baseScore = engineScored ? engineScored.score : (moodIds.reduce((a, id) => a + (f.fit[id] || 0), 0) / moodIds.length) * 100
      const moodFitRaw = moodIds.reduce((a, id) => a + (f.fit[id] || 0), 0) / moodIds.length
      const moodBoost = moodFitRaw * 40
      const inBand = f.runtime >= runtimeBand[0] && f.runtime <= runtimeBand[1]
      const runtimePenalty = inBand ? 0 : Math.min(Math.abs(f.runtime - (runtimeBand[0] + runtimeBand[1]) / 2) / 4, 25)
      let intMod = 0
      if (intention === 'move') intMod = (Math.max(f.fit.tender, f.fit.bittersweet) - 0.3) * 18
      if (intention === 'think') intMod = (f.fit.cerebral - 0.3) * 18
      if (intention === 'distract') intMod = (Math.max(f.fit.tense, f.fit.restless) - 0.3) * 15
      if (intention === 'comfort') intMod = (f.fit.cozy - 0.3) * 18
      if (intention === 'laugh') intMod = (f.fit.cozy - 0.3) * 15 - (f.fit.tense * 10)
      if (intention === 'surprise') intMod = ((100 - f.ff) / 100) * 14
      let energyMod = 0
      if (energy === 'wiped') energyMod = (1 - (f.fit.cozy || 0.3)) * -12
      if (energy === 'wired') energyMod = (1 - (f.fit.restless || f.fit.tense || 0.3)) * -12
      let audMod = 0
      if (who === 'friends' && f.fit.tense > 0.8 && f.fit.cozy < 0.2) audMod = -10
      let saveBoost = 0
      if (f.dir && savedDirs.has(f.dir)) saveBoost += 12
      if (f.genre && savedGenres.has(f.genre)) saveBoost += 6
      if (saveBoost > 18) saveBoost = 18
      const finalScore = baseScore + moodBoost + saveBoost - runtimePenalty + energyMod + audMod + intMod
      // match% is kept for the impression engineScore ONLY — never displayed.
      const calibrated = computeMatchPercent({ engineScore: baseScore, profile })
      const match = calibrated ?? Math.max(0, Math.min(99, Math.round(finalScore)))
      return { ...f, match, _rankScore: finalScore, moodFitRaw }
    })
    scored.sort((a, b) => b._rankScore - a._rankScore)
    // Demote films already shown earlier this visit; produces the stable pool.
    return diversifyTop3(scored, sessionShownIds.current)
  }, [recsEnabled, selected, time, who, energy, intention, liveFilms, profile, recentSaves, usingLiveFilms])

  // A changed input set begins a fresh finite session (and records the prior
  // closest as "shown" so the next scenario surfaces fresh films).
  const sessionKey = useMemo(() => `${selected.join(',')}|${intention}|${time}|${who}|${energy}|${dataSource?.reason || ''}`, [selected, intention, time, who, energy, dataSource])
  useEffect(() => {
    if (stage !== 3) return
    const lead = ranked[0]
    if (lead?.id) sessionShownIds.current.add(lead.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, stage])

  // Privacy-safe funnel (additive; no raw mood/context/title text).
  useEffect(() => { trackEvent(EVENTS.discover_opened, { surface: 'discover' }) }, [])
  useEffect(() => { if (stage === 2.3) trackEvent(EVENTS.recommendation_requested, { surface: 'discover' }) }, [stage])

  const restart = useCallback(() => {
    setStage(1); setSelected([]); contextTouchedRef.current = false; didPredictRef.current = false
    setIntention('move'); setTime('std'); setWho('alone'); setEnergy('steady')
  }, [])

  const moodsForResult = selected.length > 0 ? selected : ['slow', 'tender']

  return (
    <ThoughtfulRoot className="ff-discover">
      <Starfield tint={blendHex} reduced={reduced} />
      <div className="ff-discover__inner">
        {stage === 1 && (
          <DiscoverMoodStage
            selected={selected} setSelected={setSelected}
            onNext={() => setStage(2)}
            audioToggle={<AudioToggle />} playMoodCue={(id) => FFAudio.pluck(id)} playContinueCue={() => FFAudio.whoom()}
          />
        )}
        {stage === 2 && (
          <DiscoverContextStage
            time={time} setTime={setTime} who={who} setWho={setWho} energy={energy} setEnergy={setEnergy} intention={intention} setIntention={setIntention}
            onUserEdit={() => { contextTouchedRef.current = true }}
            onNext={() => { handleCommitStage2(); setStage(2.3) }}
            onBack={() => setStage(1)}
            playOptionCue={() => FFAudio.pluck('cozy')} playContinueCue={() => FFAudio.whoom()}
          />
        )}
        {stage === 2.3 && (
          <DiscoverResolveStage ready={!loading} error={false} blendHex={blendHex} onDone={() => setStage(3)} />
        )}
        {stage === 3 && (recsEnabled ? (
          <DiscoverResultStage
            ranked={ranked} selected={moodsForResult} profile={profile} blendHex={blendHex}
            isFallback={isFallback} fallbackReason={fallbackReason}
            intention={intention} energy={energy} who={who} time={time}
            user={user} sessionKey={sessionKey}
            onAdjust={() => setStage(2)} onRestart={restart}
            audioToggle={<AudioToggle />}
          />
        ) : <DiscoverPaused onRestart={restart} />)}
      </div>
    </ThoughtfulRoot>
  )
}

export default function Discover() {
  usePageMeta({ title: 'Discover — FeelFlick' })
  return (
    <DiscoverDataProvider>
      <DiscoverBody />
    </DiscoverDataProvider>
  )
}
