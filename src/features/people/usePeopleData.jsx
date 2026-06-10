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
  activity: [],
  crewOverlap: [],
  suggested: [],
  popular: [],          // cold-start fallback: top FeelFlick users by watch count
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

function timeAgo(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.round(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
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
function buildTwinMeta(ratings, history) {
  const recent = new Map()
  const moodCounts = new Map() // userId -> Map<mood, count>

  // Most recent rating wins for "recent activity"
  for (const r of ratings || []) {
    if (!r.user_id || !r.movies?.title) continue
    if (!recent.has(r.user_id)) {
      recent.set(r.user_id, {
        kind: 'rated',
        film: r.movies.title,
        rating: r.rating ? Math.round(r.rating / 2) : null,
        when: timeAgo(r.rated_at),
      })
    }
  }
  // Fill in mood counts from each user's watched history
  for (const h of history || []) {
    if (!h.user_id) continue
    const tags = h.movies?.mood_tags || []
    if (tags.length === 0) continue
    if (!moodCounts.has(h.user_id)) moodCounts.set(h.user_id, new Map())
    const m = moodCounts.get(h.user_id)
    const top = tags[0]
    m.set(top, (m.get(top) || 0) + 1)
    // Also fill "recent" if rating-based recent didn't catch this user
    if (!recent.has(h.user_id)) {
      recent.set(h.user_id, {
        kind: 'watched',
        film: h.movies?.title || 'a film',
        rating: null,
        when: timeAgo(h.watched_at),
      })
    }
  }

  const topMood = new Map()
  for (const [uid, counts] of moodCounts.entries()) {
    let best = null
    let bestN = 0
    for (const [mood, n] of counts.entries()) {
      if (n > bestN) { bestN = n; best = mood }
    }
    if (best) topMood.set(uid, capitalize(best))
  }

  return { recent, topMood }
}

function deriveTwins(similarityRows, followingIds, meta, fingerprintByUser) {
  return similarityRows.slice(0, 4).map(row => {
    const u = row.users
    if (!u) return null
    const r = meta.recent.get(u.id)
    const watchCount = u.user_history?.[0]?.count || row.movies_in_common || 0
    return {
      id: u.id,
      name: u.name || 'Anonymous',
      handle: deriveHandle(u.name, u.id),
      avatarUrl: u.avatar_url || null,
      initial: initialOf(u.name),
      avatarBg: avatarBg(u.id),
      match: Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100))),
      films: watchCount,
      // F8.3 evidence: films-in-common (the honest shared-evidence basis) + the discoverable
      // fingerprint total (counterpart maturity), turned into the de-precisioned, evidence-qualified
      // taste-match presentation by the pure module (no exact % surfaced; no relationship implied).
      inCommon: Number.isFinite(row.movies_in_common) ? row.movies_in_common : null,
      total: fingerprintByUser.get(u.id)?.total ?? null,
      matchPresentation: deriveTasteMatchPresentation({
        matchPct: Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100))),
        moviesInCommon: Number.isFinite(row.movies_in_common) ? row.movies_in_common : null,
        total: fingerprintByUser.get(u.id)?.total ?? null,
      }),
      mood: meta.topMood.get(u.id) || 'Building taste',
      bio: deriveBio({ fingerprint: fingerprintByUser.get(u.id), watchCount }),
      recent: r
        ? r.kind === 'rated' && r.rating
          ? `${r.film} · ${r.rating}★ · ${r.when}`
          : `${r.film} · ${r.when}`
        : 'No recent activity',
      following: followingIds.has(u.id),
    }
  }).filter(Boolean)
}

function deriveRising(similarityRows, followingIds, meta, fingerprintByUser) {
  return similarityRows.slice(4, 7).map(row => {
    const u = row.users
    if (!u) return null
    const r = meta.recent.get(u.id)
    const watchCount = u.user_history?.[0]?.count || row.movies_in_common || 0
    return {
      id: u.id,
      name: u.name || 'Anonymous',
      handle: deriveHandle(u.name, u.id),
      avatarUrl: u.avatar_url || null,
      initial: initialOf(u.name),
      avatarBg: avatarBg(u.id),
      match: Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100))),
      films: watchCount,
      // F8.3 evidence: films-in-common (the honest shared-evidence basis) + the discoverable
      // fingerprint total (counterpart maturity), turned into the de-precisioned, evidence-qualified
      // taste-match presentation by the pure module (no exact % surfaced; no relationship implied).
      inCommon: Number.isFinite(row.movies_in_common) ? row.movies_in_common : null,
      total: fingerprintByUser.get(u.id)?.total ?? null,
      matchPresentation: deriveTasteMatchPresentation({
        matchPct: Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100))),
        moviesInCommon: Number.isFinite(row.movies_in_common) ? row.movies_in_common : null,
        total: fingerprintByUser.get(u.id)?.total ?? null,
      }),
      mood: meta.topMood.get(u.id) || 'Building taste',
      bio: deriveBio({ fingerprint: fingerprintByUser.get(u.id), watchCount }),
      recent: r
        ? r.kind === 'rated' && r.rating
          ? `${r.film} · ${r.rating}★ · ${r.when}`
          : `${r.film} · ${r.when}`
        : 'just joined',
      following: followingIds.has(u.id),
    }
  }).filter(Boolean)
}

function deriveActivity(ratings, history, usersById, opts = {}) {
  // opts.viewerTopMoods: when present (and we're in twin-fallback mode),
  // boost events whose film's primary mood matches one of the viewer's top
  // moods so the rail reads more relevant than strict time order. Recency
  // still dominates — boost just nudges the rank within a tight time band.
  const viewerTopMoods = new Set(opts.viewerTopMoods || [])
  const HOUR_MS = 60 * 60 * 1000
  const events = []
  for (const r of ratings || []) {
    if (!r.movies?.title) continue
    const u = usersById.get(r.user_id)
    if (!u) continue
    const filmMoods = r.movies.mood_tags || []
    const matchesViewer = filmMoods.some(t => viewerTopMoods.has(t))
    events.push({
      whoId: r.user_id,
      who: u.name || 'Someone',
      whoBg: avatarBg(r.user_id),
      whoAvatarUrl: u.avatar_url || null,
      action: 'rated',
      film: r.movies.title,
      rating: r.rating ? Math.round(r.rating / 2) : null,
      note: r.review_text || null,
      sub: null,
      when: timeAgo(r.rated_at),
      _ts: new Date(r.rated_at).getTime(),
      // 6-hour boost so a mood-match nudges events ahead inside short time
      // bands without inverting actual recency. Tunable.
      _rank: new Date(r.rated_at).getTime() + (matchesViewer ? 6 * HOUR_MS : 0),
    })
  }
  for (const h of history || []) {
    if (!h.movies?.title) continue
    const u = usersById.get(h.user_id)
    if (!u) continue
    const filmMoods = h.movies.mood_tags || []
    const matchesViewer = filmMoods.some(t => viewerTopMoods.has(t))
    events.push({
      whoId: h.user_id,
      who: u.name || 'Someone',
      whoBg: avatarBg(h.user_id),
      whoAvatarUrl: u.avatar_url || null,
      action: 'watched',
      film: h.movies.title,
      rating: null,
      note: null,
      sub: null,
      when: timeAgo(h.watched_at),
      _ts: new Date(h.watched_at).getTime(),
      _rank: new Date(h.watched_at).getTime() + (matchesViewer ? 6 * HOUR_MS : 0),
    })
  }
  return events
    .sort((a, b) => b._rank - a._rank)
    .slice(0, 8)
    .map(e => {
      const { _ts: _omit, _rank: _omitRank, ...rest } = e
      void _omit; void _omitRank
      return rest
    })
}

function deriveCrewOverlap(myHistory, friendHistory) {
  const myByDir = new Map() // director -> count
  const friendByDir = new Map() // director -> Set<userId>
  for (const h of myHistory || []) {
    const d = h.movies?.director_name
    if (!d) continue
    myByDir.set(d, (myByDir.get(d) || 0) + 1)
  }
  for (const h of friendHistory || []) {
    const d = h.movies?.director_name
    if (!d) continue
    if (!friendByDir.has(d)) friendByDir.set(d, new Set())
    friendByDir.get(d).add(h.user_id)
  }
  const rows = []
  for (const [director, friends] of friendByDir.entries()) {
    const yourCount = myByDir.get(director) || 0
    if (friends.size < 2 && yourCount === 0) continue
    rows.push({
      name: director,
      friends: friends.size,
      you: yourCount > 0 ? `${yourCount} film${yourCount === 1 ? '' : 's'} watched` : 'new to you',
      _score: friends.size + yourCount * 0.5,
    })
  }
  return rows
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)
    .map(r => {
      const { _score: _omit, ...rest } = r
      void _omit
      return rest
    })
}

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
function derivePopular(rows, followingIds, currentUserId, fingerprintByUser) {
  return (rows || [])
    .filter(u => u.id !== currentUserId && !followingIds.has(u.id))
    .slice(0, 6)
    .map(u => {
      const watchCount = u.films_count || 0
      return {
        id: u.id,
        name: u.name || 'Anonymous',
        handle: deriveHandle(u.name, u.id),
        avatarUrl: u.avatar_url || null,
        initial: initialOf(u.name),
        avatarBg: avatarBg(u.id),
        films: watchCount,
        bio: deriveBio({ fingerprint: fingerprintByUser.get(u.id), watchCount }),
      }
    })
}

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
      const [followingRes, followersRes, simAsARes, simAsBRes, myHistoryRes] = await Promise.all([
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
            users!user_similarity_user_b_fkey ( id, name, avatar_url, user_history(count) )
          `)
          .eq('user_a_id', userId)
          .order('overall_similarity', { ascending: false })
          .limit(30),
        supabase
          .from('user_similarity')
          .select(`
            user_a_id, overall_similarity, movies_in_common,
            users!user_similarity_user_a_fkey ( id, name, avatar_url, user_history(count) )
          `)
          .eq('user_b_id', userId)
          .order('overall_similarity', { ascending: false })
          .limit(30),
        supabase
          .from('user_history')
          .select('movies!inner(director_name)')
          .eq('user_id', userId),
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
      const myHistory = myHistoryRes.data || []

      // === Phase 2: meta for similarity targets + activity from follows ===
      const twinTargetIds = similarityRows.slice(0, 7).map(r => r.user_b_id)
      const followingArr = [...followingIds]
      // Activity + CrewOverlap fall back to twin IDs when the user has 0
      // follows — so the sections render something useful for cold-start
      // users instead of silently disappearing. Once the user follows
      // people, the followingArr takes precedence.
      const activityIds = followingArr.length > 0 ? followingArr : twinTargetIds
      // Pool of every user_id we'll need fingerprints + display info for.
      const allLookupIds = Array.from(new Set([
        ...twinTargetIds,
        ...similarityRows.map(r => r.user_b_id),
        ...activityIds,
      ]))

      const [
        twinRatingsRes, twinHistoryRes, friendRatingsRes, friendHistoryRes,
        peopleUsersRes, fingerprintRes, popularRes,
      ] = await Promise.all([
        twinTargetIds.length
          ? supabase
              .from('user_ratings')
              .select('user_id, rating, rated_at, movies!inner(title, mood_tags)')
              .in('user_id', twinTargetIds)
              .order('rated_at', { ascending: false })
              .limit(80)
          : Promise.resolve({ data: [] }),
        twinTargetIds.length
          ? supabase
              .from('user_history')
              .select('user_id, watched_at, movies!inner(title, mood_tags)')
              .in('user_id', twinTargetIds)
              .order('watched_at', { ascending: false })
              .limit(120)
          : Promise.resolve({ data: [] }),
        activityIds.length
          ? supabase
              .from('user_ratings')
              .select('user_id, rating, review_text, rated_at, movies!inner(title)')
              .in('user_id', activityIds)
              .order('rated_at', { ascending: false })
              .limit(15)
          : Promise.resolve({ data: [] }),
        activityIds.length
          ? supabase
              .from('user_history')
              .select('user_id, watched_at, movies!inner(title, director_name)')
              .in('user_id', activityIds)
              .order('watched_at', { ascending: false })
              .limit(60)
          : Promise.resolve({ data: [] }),
        // F8.2: cross-user name/avatar comes through the narrow authenticated identity RPC, never a
        // direct users read (users is now owner-only). The RPC returns id/name/avatar — no email,
        // last_active, settings or taste fields — so the usersById map below is unchanged.
        allLookupIds.length
          ? supabase.rpc('get_people_public_identities', { requested_user_ids: allLookupIds })
          : Promise.resolve({ data: [] }),
        // F7.9: cross-user fingerprints come through the narrow authenticated RPC, never the
        // (now browser-inaccessible) user_fingerprint_public view. The RPC returns the least-data
        // top mood/tone/fit aggregates + total for the caller's own row plus every OTHER user who
        // is opted in (privacy.showOnLeaderboards), bounded — so one call covers the twin, FOF
        // and popular rails and no per-set follow-up fetch is needed.
        supabase.rpc('get_discoverable_taste_profiles'),
        // F8.2: the cold-start "popular by film count" rail read other users' rows + their
        // user_history(count) directly. Both are now closed (users is owner-only; cross-user
        // user_history is owner-only RLS, so the embedded count was already 0 → the rail already
        // rendered empty after the films_count > 0 filter). Preserve that empty result here;
        // repointing the popular rail to the discoverable-taste set is deferred to F8.5.
        Promise.resolve({ data: [] }),
      ])

      const usersById = new Map((peopleUsersRes.data || []).map(u => [u.id, u]))
      // Normalize the public view's flat columns back into the shape the
      // deriveBio function expects (topMoodTags/topToneTags/...). Keeps the
      // bio code unaware of whether the source is the locked-down full
      // table (own user, future use) or the public view (everyone else).
      const fingerprintByUser = new Map(
        (fingerprintRes.data || []).map(r => [r.user_id, {
          topMoodTags: r.top_mood_tags || [],
          topToneTags: r.top_tone_tags || [],
          topFitProfiles: r.top_fit_profiles || [],
          total: r.total || 0,
        }])
      )
      const meta = buildTwinMeta(twinRatingsRes.data || [], twinHistoryRes.data || [])

      // Viewer's own taste fingerprint — used to mood-weight the Activity rail in twin-fallback
      // mode. The RPC always returns the caller's own row, so read it straight from the map.
      const viewerTopMoods = (fingerprintByUser.get(userId)?.topMoodTags || []).slice(0, 3).map(t => t.key)

      const twins = deriveTwins(similarityRows, followingIds, meta, fingerprintByUser)
      const rising = deriveRising(similarityRows, followingIds, meta, fingerprintByUser)
      const activity = deriveActivity(
        friendRatingsRes.data || [],
        friendHistoryRes.data || [],
        usersById,
        // Mood-weight activity only when we're in the twin-fallback path —
        // when the user actually follows people, strict recency is more
        // intuitive ("what did my friends just do") than mood-aware sort.
        followingArr.length === 0 ? { viewerTopMoods } : undefined,
      )
      const crewOverlap = deriveCrewOverlap(myHistory, friendHistoryRes.data || [])
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
      // Popular rail: rendered only when the user has no twins yet. The
      // SELECT pulled user_history(count) via PostgREST relationship — that
      // shape is `[{count: N}]` per user. Sort client-side by the real
      // count + filter out users with 0 watches (no signal = nothing useful
      // to surface). Fingerprints we already fetched for similarity users
      // are reused; missing ones produce the "Building taste" bio fallback.
      const popularRows = (popularRes.data || [])
        .map(u => ({
          id: u.id,
          name: u.name,
          avatar_url: u.avatar_url,
          films_count: u.user_history?.[0]?.count || 0,
        }))
        .filter(u => u.films_count > 0)
        .sort((a, b) => b.films_count - a.films_count)
      // F7.9: popular users' fingerprints are already in the map (the RPC returned every opted-in
      // user up front) — no follow-up fetch. Missing/opted-out users use the bio fallback as before.
      const popular = twins.length === 0
        ? derivePopular(popularRows, followingIds, userId, fingerprintByUser)
        : []
      const derivedUser = deriveUser({ session, followingCount: followingIds.size, followersCount })

      setState({
        user: derivedUser,
        twins,
        rising,
        activity,
        crewOverlap,
        suggested,
        popular,
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
