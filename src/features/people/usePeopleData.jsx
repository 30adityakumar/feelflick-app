// src/features/people/usePeopleData.jsx
// FeelFlick — People data layer (consent-led taste discovery). Reads the caller's OWN follow graph +
// OWN similarity pairs, then resolves discovery through the narrow authenticated RPCs only.
//
// Consent (the P0 fix): the AUTHORITATIVE opt-in membership is the result of
// get_discoverable_taste_profiles (own row + explicitly opted-in users). A similarity/FOF candidate
// may appear ONLY when its id is in that projection. There is NO client-side cross-user
// user_settings read (it was RLS-dead and failed open). The taste projection is treated as CRITICAL
// for discovery: if it errors, discovery is suppressed (fail closed) — never identity-only cards.
//
// State model: loading | ready | discovery_unavailable | load_error.
//   • load_error          — the own follow graph could not load (relationship state unknowable).
//   • discovery_unavailable — similarity / taste-projection / identity failed; name search still works.
//   • ready               — discovery resolved (rails may legitimately be empty → cold start).
// Every Supabase response's .error is checked (PostgREST resolves errors, it does not throw).

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { usePeopleFollowActions } from './hooks/usePeopleFollowActions'
import { usePeopleHideActions } from './hooks/usePeopleHideActions'
import { mergeSimilarity, deriveDiscovery, deriveSuggestedFOF, initialOf, avatarBg } from './derive/peopleDiscovery'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

const PeopleDataContext = createContext(null)

const INITIAL = {
  user: { name: '', following: 0, followers: 0, followersUnavailable: false },
  strongest: [],
  more: [],
  suggested: [],
  followingIds: new Set(),
  followingList: [], // [{id, name, avatarUrl, initial, avatarBg}] for all followed users
  status: 'loading', // loading | ready | discovery_unavailable | load_error
}

function deriveUserName(session) {
  return session?.user?.user_metadata?.full_name
    || session?.user?.user_metadata?.name
    || session?.user?.email?.split('@')[0]
    || 'You'
}

export function PeopleDataProvider({ children }) {
  const { user, session } = useAuthSession()
  const [state, setState] = useState(INITIAL)
  const userId = user?.id

  // Single relationship live-region authority (shared by follow + hide).
  const [relStatus, setRelStatus] = useState('')
  const announce = useCallback((msg) => {
    // Re-announce identical consecutive messages by toggling a trailing zero-width space.
    setRelStatus((prev) => (prev === msg ? msg + '​' : msg))
  }, [])

  const load = useCallback(async () => {
    if (!userId) { setState({ ...INITIAL, status: 'ready' }); return }
    setState((s) => ({ ...s, status: 'loading' }))
    const name = deriveUserName(session)

    // ── Phase 1: own follows + follower count + own similarity (both directions) ──
    const [followingRes, followersRes, simARes, simBRes] = await Promise.all([
      supabase.from('user_follows').select('following_id').eq('follower_id', userId),
      supabase.from('user_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('user_similarity').select('user_b_id, overall_similarity, movies_in_common').eq('user_a_id', userId).order('overall_similarity', { ascending: false }).limit(30),
      supabase.from('user_similarity').select('user_a_id, overall_similarity, movies_in_common').eq('user_b_id', userId).order('overall_similarity', { ascending: false }).limit(30),
    ])

    // CRITICAL: own follow graph. Without it, relationship state is unknowable → safe load error.
    if (followingRes.error) {
      if (import.meta.env?.DEV) console.error('[usePeopleData] following', followingRes.error)
      setState({ ...INITIAL, status: 'load_error' })
      return
    }
    const followingIds = new Set((followingRes.data || []).map((r) => r.following_id))
    const followersUnavailable = !!followersRes.error
    const followersCount = followersRes.error ? null : (followersRes.count ?? 0)
    const baseUser = { name, following: followingIds.size, followers: followersCount ?? 0, followersUnavailable }

    // CRITICAL for discovery: both similarity reads. Failure → discovery unavailable (search still works).
    if (simARes.error || simBRes.error) {
      if (import.meta.env?.DEV) console.error('[usePeopleData] similarity', simARes.error || simBRes.error)
      setState({ ...INITIAL, user: baseUser, followingIds, status: 'discovery_unavailable' })
      return
    }
    const mergedSimilarity = mergeSimilarity({ simAsA: simARes.data || [], simAsB: simBRes.data || [], selfId: userId })

    // ── Phase 2: authoritative opt-in taste projection (CRITICAL — fail closed) ──
    const fingerprintRes = await supabase.rpc('get_discoverable_taste_profiles')
    if (fingerprintRes.error) {
      if (import.meta.env?.DEV) console.error('[usePeopleData] taste projection', fingerprintRes.error)
      setState({ ...INITIAL, user: baseUser, followingIds, status: 'discovery_unavailable' })
      return
    }
    const fingerprintByUser = new Map((fingerprintRes.data || []).map((r) => [r.user_id, {
      topMoodTags: r.top_mood_tags || [], topToneTags: r.top_tone_tags || [], topFitProfiles: r.top_fit_profiles || [], total: r.total || 0,
    }]))
    const discoverableTasteIds = new Set(fingerprintByUser.keys()) // opt-in allowlist (+ self)

    // Consent gate the similarity candidates BEFORE requesting any identity.
    const optedInRows = mergedSimilarity.filter((r) => discoverableTasteIds.has(r.id))
    const lookupIds = optedInRows.map((r) => r.id)

    // ── Phase 3: least-data identity for opted-in candidates only (CRITICAL for discovery) ──
    let usersById = new Map()
    if (lookupIds.length) {
      const idRes = await supabase.rpc('get_people_public_identities', { requested_user_ids: lookupIds })
      if (idRes.error) {
        if (import.meta.env?.DEV) console.error('[usePeopleData] identities', idRes.error)
        setState({ ...INITIAL, user: baseUser, followingIds, status: 'discovery_unavailable' })
        return
      }
      usersById = new Map((idRes.data || []).map((u) => [u.id, u]))
    }

    const { strongest, more, shownIds } = deriveDiscovery({ mergedSimilarity: optedInRows, discoverableTasteIds, usersById, fingerprintByUser })

    // ── Following identity — fetch identities for followed users not already in usersById ──
    // This lets us show a "People you follow" section even when the followed user is not
    // in the caller's similarity/discovery pool (e.g. followed via search in a prior session).
    const followingExtra = [...followingIds].filter((id) => !usersById.has(id))
    if (followingExtra.length) {
      const extraFollowRes = await supabase.rpc('get_people_public_identities', { requested_user_ids: followingExtra })
      if (!extraFollowRes.error) for (const u of extraFollowRes.data || []) usersById.set(u.id, u)
    }
    const followingList = [...followingIds]
      .map((id) => {
        const u = usersById.get(id)
        if (!u) return null
        return { id: u.id, name: u.name, avatarUrl: u.avatar_url, initial: initialOf(u.name), avatarBg: avatarBg(u.id) }
      })
      .filter(Boolean)

    // ── Suggested (FOF) — optional rail; consent-gated to the same opt-in projection ──
    let suggested = []
    if (followingIds.size > 0) {
      const fofRes = await supabase.rpc('get_follow_suggestions')
      if (!fofRes.error && (fofRes.data || []).length) {
        const fofRows = fofRes.data || []
        // Resolve "via" friend names (people the caller follows) + opted-in FOF candidate identities.
        const viaIds = [...new Set(fofRows.map((r) => r.via_user_id).filter(Boolean))]
        const candIds = [...new Set(fofRows.map((r) => r.suggested_user_id).filter((id) => id && id !== userId && !followingIds.has(id) && !shownIds.has(id) && discoverableTasteIds.has(id)))]
        const needIdentity = [...new Set([...viaIds, ...candIds])].filter((id) => !usersById.has(id))
        if (needIdentity.length) {
          const extraRes = await supabase.rpc('get_people_public_identities', { requested_user_ids: needIdentity })
          if (!extraRes.error) for (const u of extraRes.data || []) usersById.set(u.id, u)
        }
        const viaNames = new Map(viaIds.map((id) => [id, usersById.get(id)?.name]).filter(([, n]) => n))
        suggested = deriveSuggestedFOF({ fofRows, followingIds, selfId: userId, usersById, fingerprintByUser, discoverableTasteIds, shownIds, viaNames })
      }
    }

    setState({ user: baseUser, strongest, more, suggested, followingIds, followingList, status: 'ready' })
  }, [userId, session])

  useEffect(() => { load() }, [load])

  // Settled follow state: update the SINGLE relationship authority (followingIds) + the count. Cards
  // derive `following` from followingIds at render, so every rail (Strongest/More/Suggested/Search)
  // updates from one source — no per-rail mapping, no stale hardcoded booleans.
  const applyFollowState = useCallback((targetId, isFollowing) => {
    setState((s) => {
      if (s.followingIds.has(targetId) === isFollowing) return s
      const next = new Set(s.followingIds)
      if (isFollowing) next.add(targetId); else next.delete(targetId)
      return { ...s, followingIds: next, user: { ...s.user, following: Math.max(0, s.user.following + (isFollowing ? 1 : -1)) } }
    })
  }, [])

  const followActions = usePeopleFollowActions({ userId, followingIds: state.followingIds, applyFollowState, announce })
  const hideActions = usePeopleHideActions({ announce })
  const retry = useCallback(() => load(), [load])

  const value = useMemo(() => ({
    ...state,
    loading: state.status === 'loading',
    relStatus,
    announce, // exposed so the shell's invite can use the single live region (no second region)
    retry,
    ...followActions,
    ...hideActions,
  }), [state, relStatus, announce, retry, followActions, hideActions])

  return <PeopleDataContext.Provider value={value}>{children}</PeopleDataContext.Provider>
}

export function usePeopleData() {
  const ctx = useContext(PeopleDataContext)
  if (!ctx) throw new Error('usePeopleData must be inside PeopleDataProvider')
  return ctx
}
