// src/features/home/useHomeData.jsx
// FeelFlick — Home Cinematic-DNA data layer (slimmed for the bounded-discovery redesign).
//
// SCOPE CHANGE — Home redesign ("redesign Home around bounded personal discovery"):
//   The redesigned Home gets its hero + bounded recommendation rows from the
//   dedicated, tier-aware row engine (useHomepageRows / homepageRows.js). This
//   provider's ONLY remaining responsibility is the compact Cinematic DNA strip
//   and the user greeting:
//
//     user.name     ← auth session
//     user.watched  ← count of user_history rows
//     dna           ← taste fingerprint (motifs / moods) + history count + runtime median
//
//   REMOVED here (so the legacy recommendation pipeline no longer runs alongside
//   the new one — it was consumed ONLY by the retired single-pick Briefing + its
//   supporting-tail sections, which this redesign replaces):
//     • the mood-scored candidate pool query + scoreMovieForUser(V2) mood pools
//     • computeUserProfile(V2)
//     • friends / taste-twins (user_similarity)
//     • curated / personal lists (buildPersonalLists)
//     • taste-twin pulse (getTasteTwinPulse)
//     • seen-candidates (getSeenCandidates)
//     • the prefetch candidate cache + MOOD_BRIDGE + resolveEngineReason
//
//   The hero's grounded reason now comes from the engine's generateHeroReason
//   (via homepageRows), NOT the old resolveEngineReason label-mapper.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { computeUserProfileV3 } from '@/shared/services/recommendations'
import { getTasteFingerprint } from '@/shared/services/tasteCache'

const HomeDataContext = createContext(null)

const INITIAL = {
  user: { name: 'You', watched: 0 },
  dna: null,
  loading: true,
  error: null,
}

/**
 * Pre-warm the heaviest query the redesigned /home depends on — the v3 user
 * profile that the homepage row engine (useHomepageRows) builds every row from.
 * Safe to call from anywhere (e.g. the onboarding completion screen); failures
 * are swallowed since this is a perf hint, not a correctness requirement.
 *
 * (Previously warmed the legacy Briefing candidate pool; repointed to the v3
 * profile so the new pipeline — not the retired one — is the thing primed.)
 */
export async function prefetchHomeData(userId) {
  if (!userId) return
  await computeUserProfileV3(userId).catch(() => { /* perf hint only — non-fatal */ })
}

// === Shape the Cinematic-DNA portrait from the taste fingerprint =============
// Behavior-identical to the prior derivation (same fields, same honest empty
// states), just isolated from the removed recommendation machinery.
function deriveDna(fingerprint, filmsLogged, ratingsRows) {
  const progress = Math.min(1, filmsLogged / 30)            // confidence ramps 0→100% over 30 films
  const filmsToNext = Math.max(0, 10 - filmsLogged)         // next confidence milestone
  const topMoods = (fingerprint?.topMoodTags || [])
    .slice(0, 6)
    .map(t => ({ label: capitalize(t.key), weight: t.share }))
  const motifs = (fingerprint?.topToneTags || []).slice(0, 3).map(t => capitalize(t.key))
  const topFit = fingerprint?.topFitProfiles?.[0]?.key || null
  const runtimeMedian = computeRuntimeMedian(ratingsRows) || null
  return {
    progress,
    filmsLogged,
    filmsToNext,
    topMoods: topMoods.length > 0 ? topMoods : null,
    // Honest empty state — never fabricate tone patterns the user hasn't earned.
    motifs: motifs.length > 0 ? motifs : ['Patterns forming…'],
    topFit,
    runtime: runtimeMedian
      ? { value: String(runtimeMedian), unit: 'min', note: runtimeMedian < 120 ? 'shorter than average' : 'patient runtimes' }
      : { value: '—', unit: '', note: 'rate more films' },
  }
}

export function HomeDataProvider({ children }) {
  const { user, session } = useAuthSession()
  const userId = user?.id
  const [state, setState] = useState(INITIAL)

  useEffect(() => {
    if (!userId) {
      setState({ ...INITIAL, loading: false })
      return
    }
    let abort = false
    setState(s => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        // One light round-trip: watch-history count + recent runtimes + the
        // (24h-cached) taste fingerprint. No candidate pool, no engine scoring.
        const [historyRes, ratingsRes, fingerprint] = await Promise.all([
          supabase.from('user_history').select('movie_id').eq('user_id', userId),
          supabase
            .from('user_ratings')
            .select('movies!inner(runtime)')
            .eq('user_id', userId)
            .order('rated_at', { ascending: false })
            .limit(4),
          getTasteFingerprint(userId),
        ])
        if (abort) return

        // Surface a real read failure as the honest top-level error rather than
        // silently treating it as "0 films logged" (supabase-js resolves with
        // { data: null, error } instead of throwing). user_history is the load-
        // bearing read; a failed runtimes/fingerprint read is non-fatal (the DNA
        // strip degrades to its forming/"—" states).
        if (historyRes.error) throw historyRes.error

        const filmsLogged = (historyRes.data || []).length
        const dna = deriveDna(fingerprint, filmsLogged, ratingsRes.data)

        const name = session?.user?.user_metadata?.full_name?.split(' ')[0]
          || session?.user?.user_metadata?.name?.split(' ')[0]
          || session?.user?.email?.split('@')[0]
          || 'You'

        setState({ user: { name, watched: filmsLogged }, dna, loading: false, error: null })
      } catch (e) {
        if (abort) return
        console.error('[useHomeData]', e)
        setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
      }
    })()
    return () => { abort = true }
  }, [userId, session])

  const value = useMemo(() => state, [state])
  return <HomeDataContext.Provider value={value}>{children}</HomeDataContext.Provider>
}

export function useHomeData() {
  const ctx = useContext(HomeDataContext)
  if (!ctx) throw new Error('useHomeData must be inside HomeDataProvider')
  return ctx
}

// === Helpers =================================================================

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ').replace(/-/g, ' ') : ''
}

function computeRuntimeMedian(rows) {
  const runtimes = (rows || []).map(r => r.movies?.runtime).filter(Boolean).sort((a, b) => a - b)
  if (runtimes.length === 0) return null
  const mid = Math.floor(runtimes.length / 2)
  return runtimes.length % 2 === 0 ? Math.round((runtimes[mid - 1] + runtimes[mid]) / 2) : runtimes[mid]
}
