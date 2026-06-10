// src/features/people/usePeopleData.jsx
// FeelFlick — People v2 ("Taste twins") data layer. Fetches the signed-in
// user's social graph (user_follows, user_similarity), then derives every
// panel: USER counts · TWINS (top 4 by similarity) · RISING (next 3) ·
// ACTIVITY (recent ratings/history from followed users) · CREW_OVERLAP
// (directors shared with friends) · SUGGESTED (friend-of-friends).

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { deriveTasteMatchPresentation } from './derive/peoplePresentation'
import { usePeopleFollowActions } from './hooks/usePeopleFollowActions'
import { useAuthSession } from '@/shared/hooks/useAuthSession'

const PeopleDataContext = createContext(null)

const AVATAR_PALETTE = ['#A78BFA', '#F472B6', '#7DD3FC', '#FBBF24', '#34D399', '#C084FC', '#F59FA8']

const INITIAL = {
  user: { name: '', following: 0, followers: 0 },
  twins: [],
  rising: [],
  suggested: [],
  followingIds: new Set(),
  loading: true,
  error: null,
}

// === Helpers =============================================================

function avatarBg(id) {
  if (!id) return AVATAR_PALETTE[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

function initialOf(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?'
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''
}

// Stable handle: name-slug + 4-char user-id suffix so two users with the
// same name (the dev DB has two "Aditya Kumar"s) don't collide. Avoids
// leaking email-derived handles. When we ship a real users.username column,
// switch the source here.
function deriveHandle(name, id) {
  const slug = (name || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14) || 'user'
  const suffix = id ? id.slice(0, 4) : ''
  return suffix ? `@${slug}-${suffix}` : `@${slug}`
}

// Real bio derived from the user's taste fingerprint. Replaces the previous
// formulaic "X's map of cinema" filler with signal-driven copy. The
// taste_fingerprint is pre-computed in user_profiles_computed (24h cache).
//
// Examples:
//   "Tense + Earnest films · 40 watched"
//   "Building taste · 4 films logged"
//   "Crowd-pleaser energy · 218 films"
function deriveBio({ fingerprint, watchCount }) {
  const topMood = fingerprint?.topMoodTags?.[0]?.key
  const topTone = fingerprint?.topToneTags?.[0]?.key
  const topFit  = fingerprint?.topFitProfiles?.[0]?.key
  const count = watchCount || fingerprint?.total || 0
  // Confident path: have mood + tone
  if (topMood && topTone) {
    return `${capitalize(topMood)} + ${capitalize(topTone)} films${count ? ` · ${count} watched` : ''}`
  }
  // Lighter signal: mood-only
  if (topMood) {
    return `${capitalize(topMood)}-driven${count ? ` · ${count} films` : ''}`
  }
  // Even lighter: fit profile
  if (topFit) {
    return `${capitalize(topFit)} energy${count ? ` · ${count} films` : ''}`
  }
  // Cold start
  if (count > 0) return `Building taste · ${count} film${count === 1 ? '' : 's'} logged`
  return 'Just getting started'
}

// === Derivers ============================================================

function deriveUser({ session, followingCount, followersCount }) {
  const name = session?.user?.user_metadata?.full_name
    || session?.user?.user_metadata?.name
    || session?.user?.email?.split('@')[0]
    || 'You'
  return { name, following: followingCount, followers: followersCount }
}

// recentByUser: Map<userId, { kind, film, rating, when }>
// moodByUser:   Map<userId, string>  (top mood_tag across their watched films)
// F8.5: a single card-shaper for the similarity rails (twins = ranks 1-4, rising = ranks 5-7). The
// dead `meta`/mood/recent fields (fed by the removed cross-user behavioral reads) are gone; cards
// carry only identity + the F8.3 evidence-qualified taste-match presentation + the follow state.
function deriveSimilarityCards(similarityRows, followingIds, fingerprintByUser, from, to) {
  return similarityRows.slice(from, to).map(row => {
    const u = row.users
    if (!u) return null
    const matchPct = Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100)))
    const inCommon = Number.isFinite(row.movies_in_common) ? row.movies_in_common : null
    const total = fingerprintByUser.get(u.id)?.total ?? null
    return {
      id: u.id,
      name: u.name || 'Anonymous',
      handle: deriveHandle(u.name, u.id),
      avatarUrl: u.avatar_url || null,
      initial: initialOf(u.name),
      avatarBg: avatarBg(u.id),
      match: matchPct,
      inCommon,
      total,
      matchPresentation: deriveTasteMatchPresentation({ matchPct, moviesInCommon: inCommon, total }),
      bio: deriveBio({ fingerprint: fingerprintByUser.get(u.id), watchCount: inCommon || 0 }),
      following: followingIds.has(u.id),
    }
  }).filter(Boolean)
}

const deriveTwins = (similarityRows, followingIds, fingerprintByUser) =>
  deriveSimilarityCards(similarityRows, followingIds, fingerprintByUser, 0, 4)
const deriveRising = (similarityRows, followingIds, fingerprintByUser) =>
  deriveSimilarityCards(similarityRows, followingIds, fingerprintByUser, 4, 7)

function deriveSuggested(similarityRows, followingIds, currentUserId, fingerprintByUser) {
  // "People you might know" — top-similarity users I don't follow, beyond the
  // twins+rising rails. Cap at 6.
  return similarityRows
    .filter(row => row.users && row.user_b_id !== currentUserId && !followingIds.has(row.user_b_id))
    .slice(7, 13)
    .map(row => {
      const u = row.users
      const watchCount = u.user_history?.[0]?.count || row.movies_in_common || 0
      return {
        id: u.id,
        name: u.name || 'Anonymous',
        handle: deriveHandle(u.name, u.id),
        avatarUrl: u.avatar_url || null,
        initial: initialOf(u.name),
        avatarBg: avatarBg(u.id),
        mutuals: row.movies_in_common ?? 0,
        // F8.3: keep the raw match + evidence; the qualitative band/evidence is derived in the
        // pure presentation module at render (no exact % surfaced).
        match: Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100))),
        inCommon: Number.isFinite(row.movies_in_common) ? row.movies_in_common : null,
        total: fingerprintByUser.get(u.id)?.total ?? null,
        matchPresentation: deriveTasteMatchPresentation({
          matchPct: Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100))),
          moviesInCommon: Number.isFinite(row.movies_in_common) ? row.movies_in_common : null,
          total: fingerprintByUser.get(u.id)?.total ?? null,
        }),
        bio: deriveBio({ fingerprint: fingerprintByUser.get(u.id), watchCount }),
        viaFriend: null,
      }
    })
}

// Friend-of-friend fallback used when similarity-derived Suggested is empty
// (or sparse) but the user is following at least one person. Walks the
// social graph one hop: my follows → their follows → minus me + minus
// already-following. Carries the "via {friend}" attribution so the user
// understands why the suggestion appears.
function deriveSuggestedFOF({ fofRows, followingIds, followingNames, usersById, fingerprintByUser, currentUserId, alreadySuggestedIds }) {
  if (!fofRows?.length) return []
  // Tally how many friends recommend each candidate; remember one friend's
  // name to attribute the suggestion.
  const tally = new Map()  // candidateId → { friends: number, viaName: string }
  for (const row of fofRows) {
    const candidateId = row.following_id
    const viaId = row.follower_id
    if (!candidateId || candidateId === currentUserId) continue
    if (followingIds.has(candidateId)) continue
    if (alreadySuggestedIds.has(candidateId)) continue
    const entry = tally.get(candidateId) || { friends: 0, viaName: followingNames.get(viaId) || null }
    entry.friends += 1
    tally.set(candidateId, entry)
  }
  // Rank by friend-count desc, take top 6
  const ranked = [...tally.entries()]
    .sort((a, b) => b[1].friends - a[1].friends)
    .slice(0, 6)
  return ranked.map(([cid, info]) => {
    const u = usersById.get(cid)
    if (!u) return null
    const watchCount = (u.user_history?.[0]?.count) || 0
    return {
      id: cid,
      name: u.name || 'Anonymous',
      handle: deriveHandle(u.name, cid),
      avatarUrl: u.avatar_url || null,
      initial: initialOf(u.name),
      avatarBg: avatarBg(cid),
      mutuals: info.friends,
      mood: info.friends === 1 ? '1 friend follows' : `${info.friends} friends follow`,
      bio: deriveBio({ fingerprint: fingerprintByUser.get(cid), watchCount }),
      viaFriend: info.viaName,
    }
  }).filter(Boolean)
}

// "Popular on FeelFlick" — cold-start fallback when the user has no twins
// yet. Top users by watched-film count so a new user has someone to follow
// from day one. Excludes the calling user and anyone the user already follows.
// === Provider ============================================================

export function PeopleDataProvider({ children }) {
  const { user, session } = useAuthSession()
  const [state, setState] = useState(INITIAL)

  const userId = user?.id

  const load = useCallback(async () => {
    if (!userId) {
      setState({ ...INITIAL, loading: false })
      return
    }
    setState(s => ({ ...s, loading: true, error: null }))

    try {
      // === Phase 1: my follows graph + similarity (parallel) ===
      // user_similarity has CHECK (user_a_id < user_b_id) — each pair stored
      // exactly once with the smaller UUID as user_a. So we have to query
      // both directions and merge.
      // F8.5: People reads its own follow edges + its own similarity pairs only — no cross-user
      // user_history/user_ratings (the prior embedded watch-count was owner-only RLS-dead and
      // only fed the now-removed "films" caption). The embedded users() is the similarity counterpart's
      // identity, which the FK join exposes to the participant of the pair.
      const [followingRes, followersRes, simAsARes, simAsBRes] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId),
        supabase
          .from('user_follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('user_similarity')
          .select(`
            user_b_id, overall_similarity, movies_in_common,
            users!user_similarity_user_b_fkey ( id, name, avatar_url )
          `)
          .eq('user_a_id', userId)
          .order('overall_similarity', { ascending: false })
          .limit(30),
        supabase
          .from('user_similarity')
          .select(`
            user_a_id, overall_similarity, movies_in_common,
            users!user_similarity_user_a_fkey ( id, name, avatar_url )
          `)
          .eq('user_b_id', userId)
          .order('overall_similarity', { ascending: false })
          .limit(30),
      ])

      const followingRows = followingRes.data || []
      const followingIds = new Set(followingRows.map(r => r.following_id))
      const followersCount = followersRes.count ?? 0
      // Normalize both directions into a unified shape: { user_b_id (= friend id), overall_similarity, movies_in_common, users (= friend) }
      const simAsA = (simAsARes.data || []).map(r => ({ ...r, users: r.users }))
      const simAsB = (simAsBRes.data || []).map(r => ({
        user_b_id: r.user_a_id, // remap so "user_b_id" always means the friend
        overall_similarity: r.overall_similarity,
        movies_in_common: r.movies_in_common,
        users: r.users,
      }))
      const mergedSimilarity = [...simAsA, ...simAsB]
        .filter(r => r.users) // drop rows where the join didn't resolve
        .sort((a, b) => (b.overall_similarity ?? 0) - (a.overall_similarity ?? 0))

      // Privacy gate: drop candidates whose user_settings.privacy.showOnLeaderboards
      // is explicitly false. Defaults to opt-in when unset. Single fetch for
      // all candidates keeps this cheap.
      const candidateIds = mergedSimilarity.map(r => r.user_b_id)
      let discoverableIds = new Set(candidateIds)
      if (candidateIds.length) {
        const { data: settingsRows } = await supabase
          .from('user_settings')
          .select('user_id, settings')
          .in('user_id', candidateIds)
        const optedOut = new Set()
        for (const row of settingsRows || []) {
          if (row.settings?.privacy?.showOnLeaderboards === false) {
            optedOut.add(row.user_id)
          }
        }
        discoverableIds = new Set(candidateIds.filter(id => !optedOut.has(id)))
      }
      const similarityRows = mergedSimilarity
        .filter(r => discoverableIds.has(r.user_b_id))
        .slice(0, 15)

      // === Phase 2: resolve identity + taste for the similarity candidates ===
      const followingArr = [...followingIds]
      // Every user_id we'll need name/avatar for (the similarity candidates).
      const allLookupIds = Array.from(new Set(similarityRows.map(r => r.user_b_id)))

      // F8.5: People reads ONLY the two narrow authenticated RPCs for cross-user data — no
      // cross-user user_history/user_ratings reads remain (those were owner-only RLS-dead and only
      // fed the now-removed Activity / CrewOverlap / Popular sections).
      const [peopleUsersRes, fingerprintRes] = await Promise.all([
        // identity (id/name/avatar only — no email/last_active/settings/taste)
        allLookupIds.length
          ? supabase.rpc('get_people_public_identities', { requested_user_ids: allLookupIds })
          : Promise.resolve({ data: [] }),
        // opt-in least-data taste fingerprints (the caller's own row + every opted-in user)
        supabase.rpc('get_discoverable_taste_profiles'),
      ])

      const usersById = new Map((peopleUsersRes.data || []).map(u => [u.id, u]))
      const fingerprintByUser = new Map(
        (fingerprintRes.data || []).map(r => [r.user_id, {
          topMoodTags: r.top_mood_tags || [],
          topToneTags: r.top_tone_tags || [],
          topFitProfiles: r.top_fit_profiles || [],
          total: r.total || 0,
        }])
      )

      const twins = deriveTwins(similarityRows, followingIds, fingerprintByUser)
      const rising = deriveRising(similarityRows, followingIds, fingerprintByUser)
      const similaritySuggested = deriveSuggested(similarityRows, followingIds, userId, fingerprintByUser)
      // FOF fallback: when similarity Suggested doesn't fill the rail (<6
      // entries), walk the social graph one hop. Only fires when the user
      // has at least one follow (otherwise nothing to walk from).
      let suggested = similaritySuggested
      if (suggested.length < 6 && followingArr.length > 0) {
        // Fetch follows-of-my-follows (skip my own follower row).
        // F8.2: friend-of-follows discovery reads OTHER users' follow edges, which are no longer
        // directly readable (user_follows is participant-only). The narrow RPC returns ONLY the
        // caller's own FOF subgraph (suggested + via), never the global graph. Adapt to the existing
        // { follower_id (via), following_id (suggested) } shape so deriveSuggestedFOF is unchanged.
        const { data: fofRaw } = await supabase.rpc('get_follow_suggestions')
        const fofRows = (fofRaw || []).map(r => ({ follower_id: r.via_user_id, following_id: r.suggested_user_id }))
        // Look up names of my follows so we can show "via {friend}".
        const followingNames = new Map()
        const followingUserIds = followingArr
        const namesNeeded = followingUserIds.filter(id => !usersById.has(id))
        if (namesNeeded.length) {
          const { data: namesRes } = await supabase.rpc('get_people_public_identities', { requested_user_ids: namesNeeded })
          for (const u of namesRes || []) followingNames.set(u.id, u.name)
        }
        for (const id of followingUserIds) {
          if (!followingNames.has(id) && usersById.get(id)?.name) {
            followingNames.set(id, usersById.get(id).name)
          }
        }
        // Hydrate candidate users we don't yet know.
        const candidateIds = Array.from(new Set((fofRows || [])
          .map(r => r.following_id)
          .filter(id => id && id !== userId && !followingIds.has(id) && !usersById.has(id))))
        if (candidateIds.length) {
          // F8.2: resolve FOF candidate identities via the narrow RPC (id/name/avatar only).
          const { data: candUsers } = await supabase.rpc('get_people_public_identities', { requested_user_ids: candidateIds })
          for (const u of candUsers || []) usersById.set(u.id, u)
          // F7.9: FOF candidates' fingerprints are already in the map — the RPC returned every
          // opted-in user up front, so no follow-up fetch is needed. Opted-out candidates fall
          // back to the "Building taste" bio, exactly as before.
        }
        // Exclude users already surfaced on this page: similarity-derived
        // Suggested + the four Twin cards + the three Rising cards.
        // Otherwise a twin shows twice as "via friend" further down.
        const alreadySuggestedIds = new Set([
          ...suggested.map(s => s.id),
          ...twins.map(t => t.id),
          ...rising.map(t => t.id),
        ])
        const fofSuggested = deriveSuggestedFOF({
          fofRows: fofRows || [],
          followingIds,
          followingNames,
          usersById,
          fingerprintByUser,
          currentUserId: userId,
          alreadySuggestedIds,
        })
        suggested = [...suggested, ...fofSuggested].slice(0, 6)
      }
      const derivedUser = deriveUser({ session, followingCount: followingIds.size, followersCount })

      setState({
        user: derivedUser,
        twins,
        rising,
        suggested,
        followingIds,
        loading: false,
        error: null,
      })
    } catch (e) {
      console.error('[usePeopleData]', e)
      setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
    }
  }, [userId, session])

  useEffect(() => {
    load()
  }, [load])

  // === Follow / unfollow with optimistic update ===
  // F8.4: settled follow state — applied ONLY after a write succeeds (never optimistic). The action
  // layer (usePeopleFollowActions) owns the user_follows writes (EXACT existing payloads/filters) +
  // per-target pending/error + announcements + the session-local Hide suggestion; the provider just
  // flips the server-backed state on settled success. No optimistic swap, no silent revert.
  const applyFollowState = useCallback((targetId, isFollowing) => {
    setState(s => {
      const had = s.followingIds.has(targetId)
      if (had === isFollowing) return s
      const next = new Set(s.followingIds)
      if (isFollowing) next.add(targetId); else next.delete(targetId)
      return {
        ...s,
        followingIds: next,
        twins: s.twins.map(p => p.id === targetId ? { ...p, following: isFollowing } : p),
        rising: s.rising.map(p => p.id === targetId ? { ...p, following: isFollowing } : p),
        user: { ...s.user, following: Math.max(0, s.user.following + (isFollowing ? 1 : -1)) },
      }
    })
  }, [])

  const followActions = usePeopleFollowActions({ userId, followingIds: state.followingIds, applyFollowState })

  const value = useMemo(() => ({ ...state, ...followActions }), [state, followActions])
  return <PeopleDataContext.Provider value={value}>{children}</PeopleDataContext.Provider>
}

export function usePeopleData() {
  const ctx = useContext(PeopleDataContext)
  if (!ctx) throw new Error('usePeopleData must be inside PeopleDataProvider')
  return ctx
}
