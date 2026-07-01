// src/features/profile/useProfileData.jsx
// FeelFlick — Profile v2 data layer. Single hook that fetches everything
// (user_history with joined movies + user_ratings + taste_fingerprint + users
// row + editorial cache) in parallel and returns derived shapes that the
// section components consume. Each section hides when its data source is
// empty.

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { getTasteFingerprint } from '@/shared/services/tasteCache'
import { dedupeHistoryByMovie } from '@/shared/lib/canonicalHistory'
import { classifyProfileMaturity, MATURITY } from './derive/profilePresentation'
import { trackEvent, EVENTS, errorKind } from '@/shared/services/betaEvents'
import { isEnabled, isProfileAutoRefreshEnabled } from '@/shared/config/betaFlags'
import { PROFILE_EVIDENCE_VERSION, isEditorialVersionCurrent } from '@/shared/lib/profileEvidenceVersion'
import { computeMaterialSignature } from './editorialSignature'

import {
  deriveUser, deriveStats, deriveMoods, deriveDirectors, deriveMotifs,
  deriveMixtape, deriveTrajectory, deriveTrajectoryAllTime, deriveTrajectoryYear,
  deriveDecades, deriveRuntime, deriveDaypart,
  deriveFriends, deriveSkews, deriveYIR, deriveCommunityMood,
} from './derive'
// Cinematic DNA redesign — pure, read-only derivations from the already-fetched canonical rows
// (no new data source, no fetch change). Rating language + journey segmentation; the barcode
// seed is built in the passport component from non-identifying DNA inputs.
import { deriveRatingLanguage } from './derive/ratingLanguage'
import { deriveTasteJourney } from './derive/tasteJourney'
import { archetypeForFingerprint } from './archetype'
import { aggregateWatchHistorySignals, buildSummaryRequestBody } from './buildSummaryRequest'

const ProfileDataContext = createContext(null)

const HISTORY_COLS = `
  movie_id,
  watched_at,
  movies!inner (
    id,
    tmdb_id,
    title,
    director_name,
    release_date,
    runtime,
    mood_tags,
    tone_tags,
    fit_profile,
    poster_path
  )
`

const EDITORIAL_TTL_MS = 24 * 60 * 60 * 1000  // 24 h
// Client-side courtesy cooldown for AUTO-refresh: even when taste has materially changed, don't
// auto-regenerate if the current reflection was written within this window. A safety net against a
// reload hot-loop — the authoritative per-user cooldown/quota lives in the server RPC.
const AUTO_REFRESH_COOLDOWN_MS = 60 * 60 * 1000  // 1 h

const INITIAL_STATE = {
  user: null,
  stats: null,
  moods: [],
  directors: [],
  motifs: [],
  mixtape: [],
  trajectory: [],
  trajectoryAllTime: [],
  trajectoryYear: [],
  reviewsCount: 0,
  decades: [],
  runtime: null,
  daypart: [],
  editorial: null,
  editorialStatus: 'forming',
  editorialMaterialStale: false,
  ratingLanguage: null,
  journey: [],
  evidenceVersion: PROFILE_EVIDENCE_VERSION,
  friends: [],
  skews: [],
  communityMood: null,
  yir: null,
  loading: true,
  error: null,
}

export function useProfileDataFetch({ userId, authUser, isSelf = false }) {
  const [state, setState] = useState(INITIAL_STATE)
  // F7.3: in-SPA retry for the error state — bumping reloadKey re-runs the fetch effect
  // (the existing refetch path), so the safe error UI can offer a real "Try again".
  const [reloadKey, setReloadKey] = useState(0)
  const retry = useCallback(() => setReloadKey(k => k + 1), [])

  // F7.6: explicit editorial refresh. idle | generating | success | error. The inputs the
  // refresh needs are stashed by the fetch effect (no fetch is repeated); inFlightRef guards
  // duplicate concurrent calls; mountedRef prevents late-completion state updates after unmount.
  const [refreshStatus, setRefreshStatus] = useState('idle')
  const regenInputsRef = useRef(null)
  const inFlightRef = useRef(false)
  const mountedRef = useRef(true)
  // "Living DNA" auto-refresh fires at most ONCE per load (reset when the fetch effect re-runs).
  const autoFiredRef = useRef(false)
  // Set true on (re)mount, false on unmount — the body MUST set true so StrictMode's dev
  // mount→unmount→remount double-invoke doesn't leave it permanently false (which would silently
  // swallow the refresh settlement). (F7.7: exposed by the intercepted browser refresh test.)
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const refreshEditorial = useCallback(async () => {
    const inputs = regenInputsRef.current
    // Eligible only for the signed-in user with a non-forming profile — never from forming,
    // never from a non-self/private view. Duplicate rapid clicks collapse to one call.
    if (!inputs || !inputs.isSelf || inputs.maturity === MATURITY.FORMING) return
    // B1.3 kill-switch: when reflection refresh is disabled for beta, surface the honest
    // "couldn't refresh" state instead of calling the Edge function (safe fallback, no crash).
    if (!isEnabled('profileRefresh')) { if (mountedRef.current) setRefreshStatus('error'); return }
    if (inFlightRef.current) return
    inFlightRef.current = true
    setRefreshStatus('generating')
    trackEvent(EVENTS.profile_reflection_refresh_started, { surface: 'profile' })
    try {
      const updated = await regenerateEditorial(inputs)
      if (!updated) throw new Error('refresh_failed')
      // Success — replace the reflection and mark it current. Prior editorial is only ever
      // overwritten on success (a failed refresh leaves the last valid reflection intact).
      if (mountedRef.current) {
        setState(s => ({ ...s, editorial: { ...s.editorial, ...updated }, editorialStatus: 'current', editorialMaterialStale: false }))
        setRefreshStatus('success')
      }
      trackEvent(EVENTS.profile_reflection_refresh_succeeded, { surface: 'profile' })
    } catch (e) {
      if (mountedRef.current) setRefreshStatus('error')   // raw backend text never surfaced
      trackEvent(EVENTS.profile_reflection_refresh_failed, { surface: 'profile', error_kind: errorKind(e) })
    } finally {
      inFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    let abort = false
    autoFiredRef.current = false   // a fresh load may auto-refresh once
    setState(INITIAL_STATE)

    ;(async () => {
      try {
        // The material-signature column only exists once the guardrails migration is applied, so
        // only SELECT it when the hardened pipeline is enabled — otherwise the read 400s against the
        // current (un-migrated) table and the reflection vanishes.
        const editorialCols = isProfileAutoRefreshEnabled()
          ? 'editorial_summary, editorial_signature, editorial_archetype, editorial_generated_at, editorial_material_sig'
          : 'editorial_summary, editorial_signature, editorial_archetype, editorial_generated_at'
        const [historyRes, ratingsRes, fingerprint, userRes, editorialRes, simARes, simBRes, ffStatsRes] = await Promise.all([
          supabase
            .from('user_history')
            .select(HISTORY_COLS)
            .eq('user_id', userId),
          supabase
            .from('user_ratings')
            .select('movie_id, rating, review_text, rated_at')
            .eq('user_id', userId),
          getTasteFingerprint(userId).catch(() => null),
          supabase
            .from('users')
            .select('id, name, avatar_url, joined_at, total_movies_watched')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('user_profiles_computed')
            .select(editorialCols)
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_similarity')
            .select('user_b_id, overall_similarity, users!user_similarity_user_b_fkey(id, name)')
            .eq('user_a_id', userId)
            .order('overall_similarity', { ascending: false })
            .limit(4),
          supabase
            .from('user_similarity')
            .select('user_a_id, overall_similarity, users!user_similarity_user_a_fkey(id, name)')
            .eq('user_b_id', userId)
            .order('overall_similarity', { ascending: false })
            .limit(4),
          supabase
            .from('feelflick_stats')
            .select('stat_key, stat_value, computed_at'),
        ])
        if (abort) return

        if (historyRes.error) throw historyRes.error

        const history = historyRes.data || []
        // F7.3: canonicalise the owner's history ONCE at the Profile boundary — one row per
        // film (latest valid watched_at) — and feed it to EVERY Profile-owned derivation,
        // the fingerprint inputs (via getTasteFingerprint, canonicalised there), and the
        // generated-summary evidence, so duplicate watch events can't inflate any visible
        // identity number. Raw `history` is not read by any downstream derivation below.
        const canonicalHistory = dedupeHistoryByMovie(history)
        const ratings = ratingsRes.data || []
        const ratingsByMovieId = new Map(ratings.map(r => [r.movie_id, r]))
        const dbUser = userRes.data || null
        const feelflickStats = ffStatsRes?.data || []

        const archetypeFromFp = archetypeForFingerprint(fingerprint)
        const storedEditorial = editorialRes?.data || null
        const editorial = {
          summary:   storedEditorial?.editorial_summary   || null,
          signature: storedEditorial?.editorial_signature || null,
          archetype: Array.isArray(storedEditorial?.editorial_archetype) && storedEditorial.editorial_archetype.length === 3
            ? storedEditorial.editorial_archetype
            : archetypeFromFp,
          generatedAt: storedEditorial?.editorial_generated_at || null,
        }

        // F7.6: classify the cached editorial. It is "current" ONLY when maturity is not forming,
        // it is within TTL, AND its evidence version matches (stored on taste_fingerprint by the
        // explicit refresh). A pre-F7.6 editorial has no version → "stale" (kept in memory as a
        // rollback value, but never presented as the current reflection). No generation happens
        // here — generation is an explicit user action only.
        const profileMaturity = classifyProfileMaturity({ watchedCount: canonicalHistory.length, ratedCount: ratings.length })
        const editorialTtlFresh = editorial.generatedAt && (Date.now() - new Date(editorial.generatedAt).getTime()) < EDITORIAL_TTL_MS
        // "Living DNA": a reflection is materially stale when the taste fingerprint's top-tag identity
        // has shifted since it was written. Computed purely client-side — both the live signature
        // (here) and the stored one (written by regenerateEditorial) come from this fingerprint. A
        // legacy reflection with NO stored signature is NOT treated as material-stale (we can't know
        // it changed, and we don't want to invalidate every existing reflection or stampede refresh);
        // it simply gets a signature stamped on its next natural regeneration.
        const liveMaterialSig = computeMaterialSignature(fingerprint)
        const storedMaterialSig = storedEditorial?.editorial_material_sig || null
        const materialStale = Boolean(storedMaterialSig && liveMaterialSig && storedMaterialSig !== liveMaterialSig)
        const versionCurrent = editorial.summary && editorialTtlFresh && isEditorialVersionCurrent(fingerprint)
        const editorialStatus = profileMaturity === MATURITY.FORMING ? 'forming'
          : (versionCurrent && !materialStale) ? 'current'
          : editorial.summary ? 'stale'
          : 'none'
        // Stash exactly what an explicit refresh needs — no fetch is repeated on refresh. materialSig
        // is the signature regenerateEditorial persists alongside the reflection it produces.
        regenInputsRef.current = { userId, history: canonicalHistory, archetypeFromFp, maturity: profileMaturity, isSelf, materialSig: liveMaterialSig }

        // === Friend films count =================================
        // Need per-friend totals for the "X films logged" caption — one
        // grouped query after the similarity results resolve.
        const friendIds = [
          ...(simARes?.data || []).map(r => r.user_b_id),
          ...(simBRes?.data || []).map(r => r.user_a_id),
        ].filter(Boolean)

        const filmsByFriendId = new Map()
        if (friendIds.length > 0) {
          const { data: friendHistory } = await supabase
            .from('user_history')
            .select('user_id')
            .in('user_id', friendIds)
          if (abort) return
          for (const row of friendHistory || []) {
            filmsByFriendId.set(row.user_id, (filmsByFriendId.get(row.user_id) || 0) + 1)
          }
        }

        const statsDerived = deriveStats({ history: canonicalHistory, ratings, fingerprint })
        setState({
          user: deriveUser({ authUser, dbUser, history: canonicalHistory }),
          stats: statsDerived,
          moods: deriveMoods(fingerprint),
          directors: deriveDirectors({ history: canonicalHistory, ratingsByMovieId }),
          motifs: deriveMotifs({ history: canonicalHistory }),
          mixtape: deriveMixtape({ history: canonicalHistory, ratingsByMovieId }),
          trajectory: deriveTrajectory({ history: canonicalHistory }),
          trajectoryAllTime: deriveTrajectoryAllTime({ history: canonicalHistory }),
          trajectoryYear: deriveTrajectoryYear({ history: canonicalHistory }),
          reviewsCount: ratings.filter(r => r.review_text && r.review_text.trim()).length,
          decades: deriveDecades({ history: canonicalHistory }),
          runtime: deriveRuntime({ history: canonicalHistory }),
          daypart: deriveDaypart({ history: canonicalHistory }),
          editorial,
          editorialStatus,
          editorialMaterialStale: materialStale,
          ratingLanguage: deriveRatingLanguage({ ratings }),
          journey: deriveTasteJourney({ history: canonicalHistory }),
          evidenceVersion: PROFILE_EVIDENCE_VERSION,
          friends: deriveFriends({
            simARows: simARes?.data || [],
            simBRows: simBRes?.data || [],
            filmsByFriendId,
          }),
          skews: deriveSkews({ stats: statsDerived, history: canonicalHistory, ratings, feelflickStats }),
          communityMood: deriveCommunityMood(feelflickStats),
          yir: deriveYIR({ history: canonicalHistory }),
          loading: false,
          error: null,
        })

        // F7.6: NO editorial generation on render. Mounting/rerendering the Profile makes ZERO
        // Edge Function calls and ZERO cache writes — the editorial is (re)generated ONLY by the
        // explicit refreshEditorial() action below. Structured metrics render independently.
      } catch (e) {
        if (abort) return
        // F7.3: never surface raw backend text to the UI. Diagnostics stay in the console;
        // the page renders fixed, safe copy off this stable classification.
        console.error('[useProfileDataFetch]', e)
        setState(s => ({ ...s, loading: false, error: 'load_error' }))
      }
    })()

    return () => { abort = true }
  }, [userId, authUser, isSelf, reloadKey])

  // "Living DNA" auto-refresh (default-OFF flag `profileAutoRefresh`). When the owner's taste has
  // MATERIALLY changed since the reflection was written, regenerate it automatically — at most once
  // per load. This is the ONLY code path that can make an editorial Edge call on render, and only
  // for the owner, only when the flag is on, and only outside the courtesy cooldown; every other
  // state still makes zero calls on mount (preserves the F7.6 contract). The server RPC remains the
  // authoritative per-user cooldown/quota — this gate is a courtesy to avoid a reload hot-loop.
  useEffect(() => {
    if (!isProfileAutoRefreshEnabled()) return
    if (autoFiredRef.current) return
    if (!state.editorialMaterialStale) return
    const inputs = regenInputsRef.current
    if (!inputs || !inputs.isSelf || inputs.maturity === MATURITY.FORMING) return
    if (refreshStatus === 'generating' || inFlightRef.current) return
    const genAt = state.editorial?.generatedAt
    if (genAt && (Date.now() - new Date(genAt).getTime()) < AUTO_REFRESH_COOLDOWN_MS) return
    autoFiredRef.current = true
    refreshEditorial()
  }, [state.editorialMaterialStale, state.editorial, refreshStatus, refreshEditorial])

  return { ...state, retry, refreshStatus, refreshEditorial }
}

export function ProfileDataProvider({ value, children }) {
  return <ProfileDataContext.Provider value={value}>{children}</ProfileDataContext.Provider>
}

export function useProfileData() {
  const ctx = useContext(ProfileDataContext)
  if (!ctx) throw new Error('useProfileData must be used inside ProfileDataProvider')
  return ctx
}

// === INTERNAL ===

async function regenerateEditorial({ userId, history, archetypeFromFp, materialSig = null }) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  // Auth is DEPLOY-GATED. The hardened edge function verifies the real user JWT, but until the
  // guardrails are deployed (isProfileAutoRefreshEnabled) we send the anon key so the reflection keeps
  // working against the currently-deployed edge function (which still expects the anon key).
  const hardened = isProfileAutoRefreshEnabled()
  let authToken = SUPABASE_ANON_KEY
  if (hardened) {
    const { data: { session } = {} } = await supabase.auth.getSession()
    if (!session?.access_token) return null
    authToken = session.access_token
  }

  const { watchedFilms, topDirectors, taggedTasteSignature } = aggregateWatchHistorySignals(history)
  if (!watchedFilms.length) return null

  const body = buildSummaryRequestBody({
    // profile-v2 doesn't derive v1-style top-genres; watchedFilms is the primary signal. Real
    // director names are included as prompt context AND grounding evidence (edge side).
    stats: { topDirectors },
    watchedFilms,
    taggedTasteSignature,
  })

  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-taste-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    // targetUserId lets the server RPC enforce uid == profile; materialSig is recorded for audit.
    // Only sent on the hardened path — the current deployed edge function ignores unknown fields,
    // but we keep the pre-deploy body identical to the original to be safe.
    body: JSON.stringify(hardened ? { ...body, targetUserId: userId, materialSig } : body),
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  const summary = (data?.summary || '').trim() || null
  const signature = (data?.signature || '').trim() || null
  if (!summary && !signature) return null

  const generatedAt = new Date().toISOString()

  // Preserve any existing user_profiles_computed.profile row (NOT NULL with no default — bare
  // upsert 400s when no recommendation profile has been built yet). Also read the existing
  // taste_fingerprint so we can stamp editorialVersion onto it WITHOUT dropping the fingerprint
  // data (F7.6: the editorial's evidence version lives on the same row, set only here).
  const { data: existing } = await supabase
    .from('user_profiles_computed')
    .select('user_id, taste_fingerprint')
    .eq('user_id', userId)
    .maybeSingle()

  const nextFingerprint = { ...(existing?.taste_fingerprint || {}), editorialVersion: PROFILE_EVIDENCE_VERSION }
  const fields = {
    editorial_summary: summary,
    editorial_signature: signature,
    editorial_archetype: archetypeFromFp,
    editorial_generated_at: generatedAt,
    taste_fingerprint: nextFingerprint,
  }
  // The material signature (living-DNA change detector) lives in a column that only exists once the
  // guardrails migration is applied — gate the write so we don't 400 against an un-migrated table.
  if (hardened) fields.editorial_material_sig = materialSig

  // F7.9: the editorial result is only durable if the cache write SUCCEEDS. The Supabase client
  // RESOLVES (does not reject) on a DB-level error, so we MUST inspect { error } and throw —
  // otherwise refreshEditorial would announce "updated" + mark the reflection current on a write
  // that silently failed (it would then revert on reload). Throwing here settles the refresh to
  // 'error', leaving the prior valid reflection intact and the action retryable.
  if (existing) {
    const { error } = await supabase.from('user_profiles_computed').update(fields).eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('user_profiles_computed').insert({ user_id: userId, profile: {}, ...fields })
    if (error) throw error
  }

  return { summary, signature, archetype: archetypeFromFp, generatedAt }
}
