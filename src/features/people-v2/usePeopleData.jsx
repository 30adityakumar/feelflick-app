// src/features/people-v2/usePeopleData.jsx
// FeelFlick — People v2 ("Taste twins") data layer. Fetches the signed-in
// user's social graph (user_follows, user_similarity), then derives every
// panel: USER counts · TWINS (top 4 by similarity) · RISING (next 3) ·
// ACTIVITY (recent ratings/history from followed users) · CREW_OVERLAP
// (directors shared with friends) · SUGGESTED (friend-of-friends).

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
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

function deriveTwins(similarityRows, followingIds, meta) {
  return similarityRows.slice(0, 4).map(row => {
    const u = row.users
    if (!u) return null
    const r = meta.recent.get(u.id)
    return {
      id: u.id,
      name: u.name || 'Anonymous',
      handle: `@${(u.name || 'user').toLowerCase().replace(/\s+/g, '').slice(0, 16)}`,
      initial: initialOf(u.name),
      avatarBg: avatarBg(u.id),
      match: Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100))),
      films: u.user_history?.[0]?.count || row.movies_in_common || 0,
      mood: meta.topMood.get(u.id) || 'Building taste',
      overlap: [],
      bio: u.name ? `${u.name.split(' ')[0]}'s map of cinema — built film by film.` : '',
      recent: r
        ? r.kind === 'rated' && r.rating
          ? `${r.film} · ${r.rating}★ · ${r.when}`
          : `${r.film} · ${r.when}`
        : 'No recent activity',
      following: followingIds.has(u.id),
    }
  }).filter(Boolean)
}

function deriveRising(similarityRows, followingIds, meta) {
  return similarityRows.slice(4, 7).map(row => {
    const u = row.users
    if (!u) return null
    const r = meta.recent.get(u.id)
    return {
      id: u.id,
      name: u.name || 'Anonymous',
      handle: `@${(u.name || 'user').toLowerCase().replace(/\s+/g, '').slice(0, 16)}`,
      initial: initialOf(u.name),
      avatarBg: avatarBg(u.id),
      match: Math.max(0, Math.min(100, Math.round((row.overall_similarity ?? 0) * 100))),
      films: u.user_history?.[0]?.count || row.movies_in_common || 0,
      mood: meta.topMood.get(u.id) || 'Building taste',
      recent: r
        ? r.kind === 'rated' && r.rating
          ? `${r.film} · ${r.rating}★ · ${r.when}`
          : `${r.film} · ${r.when}`
        : 'just joined',
      following: followingIds.has(u.id),
    }
  }).filter(Boolean)
}

function deriveActivity(ratings, history, usersById) {
  const events = []
  for (const r of ratings || []) {
    if (!r.movies?.title) continue
    const u = usersById.get(r.user_id)
    if (!u) continue
    events.push({
      who: u.name || 'Someone',
      whoBg: avatarBg(r.user_id),
      action: 'rated',
      film: r.movies.title,
      rating: r.rating ? Math.round(r.rating / 2) : null,
      note: r.review_text || null,
      sub: null,
      when: timeAgo(r.rated_at),
      _ts: new Date(r.rated_at).getTime(),
    })
  }
  for (const h of history || []) {
    if (!h.movies?.title) continue
    const u = usersById.get(h.user_id)
    if (!u) continue
    events.push({
      who: u.name || 'Someone',
      whoBg: avatarBg(h.user_id),
      action: 'watched',
      film: h.movies.title,
      rating: null,
      note: null,
      sub: null,
      when: timeAgo(h.watched_at),
      _ts: new Date(h.watched_at).getTime(),
    })
  }
  return events
    .sort((a, b) => b._ts - a._ts)
    .slice(0, 8)
    .map(e => {
      const { _ts: _omit, ...rest } = e
      void _omit
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

function deriveSuggested(similarityRows, followingIds, currentUserId) {
  // "People you might know" — top-similarity users I don't follow, beyond the
  // twins+rising rails. Cap at 6.
  return similarityRows
    .filter(row => row.users && row.user_b_id !== currentUserId && !followingIds.has(row.user_b_id))
    .slice(7, 13)
    .map(row => {
      const u = row.users
      return {
        id: u.id,
        name: u.name || 'Anonymous',
        handle: `@${(u.name || 'user').toLowerCase().replace(/\s+/g, '').slice(0, 16)}`,
        initial: initialOf(u.name),
        avatarBg: avatarBg(u.id),
        mutuals: row.movies_in_common ?? 0,
        mood: `${Math.round((row.overall_similarity ?? 0) * 100)}% match`,
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
          .limit(15),
        supabase
          .from('user_similarity')
          .select(`
            user_a_id, overall_similarity, movies_in_common,
            users!user_similarity_user_a_fkey ( id, name, avatar_url, user_history(count) )
          `)
          .eq('user_b_id', userId)
          .order('overall_similarity', { ascending: false })
          .limit(15),
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
      const similarityRows = [...simAsA, ...simAsB]
        .filter(r => r.users) // drop rows where the join didn't resolve
        .sort((a, b) => (b.overall_similarity ?? 0) - (a.overall_similarity ?? 0))
        .slice(0, 15)
      const myHistory = myHistoryRes.data || []

      // === Phase 2: meta for similarity targets + activity from follows ===
      const twinTargetIds = similarityRows.slice(0, 7).map(r => r.user_b_id)
      const followingArr = [...followingIds]

      const [twinRatingsRes, twinHistoryRes, friendRatingsRes, friendHistoryRes, friendUsersRes] = await Promise.all([
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
        followingArr.length
          ? supabase
              .from('user_ratings')
              .select('user_id, rating, review_text, rated_at, movies!inner(title)')
              .in('user_id', followingArr)
              .order('rated_at', { ascending: false })
              .limit(15)
          : Promise.resolve({ data: [] }),
        followingArr.length
          ? supabase
              .from('user_history')
              .select('user_id, watched_at, movies!inner(title, director_name)')
              .in('user_id', followingArr)
              .order('watched_at', { ascending: false })
              .limit(60)
          : Promise.resolve({ data: [] }),
        followingArr.length
          ? supabase
              .from('users')
              .select('id, name')
              .in('id', followingArr)
          : Promise.resolve({ data: [] }),
      ])

      const usersById = new Map((friendUsersRes.data || []).map(u => [u.id, u]))
      const meta = buildTwinMeta(twinRatingsRes.data || [], twinHistoryRes.data || [])

      const twins = deriveTwins(similarityRows, followingIds, meta)
      const rising = deriveRising(similarityRows, followingIds, meta)
      const activity = deriveActivity(friendRatingsRes.data || [], friendHistoryRes.data || [], usersById)
      const crewOverlap = deriveCrewOverlap(myHistory, friendHistoryRes.data || [])
      const suggested = deriveSuggested(similarityRows, followingIds, userId)
      const derivedUser = deriveUser({ session, followingCount: followingIds.size, followersCount })

      setState({
        user: derivedUser,
        twins,
        rising,
        activity,
        crewOverlap,
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
  const toggleFollow = useCallback(async (targetId) => {
    if (!userId || !targetId || targetId === userId) return
    const wasFollowing = state.followingIds.has(targetId)

    // Optimistic UI swap
    setState(s => {
      const next = new Set(s.followingIds)
      if (wasFollowing) next.delete(targetId)
      else next.add(targetId)
      return {
        ...s,
        followingIds: next,
        twins: s.twins.map(p => p.id === targetId ? { ...p, following: !wasFollowing } : p),
        rising: s.rising.map(p => p.id === targetId ? { ...p, following: !wasFollowing } : p),
        user: { ...s.user, following: s.user.following + (wasFollowing ? -1 : 1) },
      }
    })

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({ follower_id: userId, following_id: targetId })
        if (error) throw error
      }
    } catch (e) {
      console.error('[usePeopleData.toggleFollow]', e)
      // Revert
      setState(s => {
        const next = new Set(s.followingIds)
        if (wasFollowing) next.add(targetId)
        else next.delete(targetId)
        return {
          ...s,
          followingIds: next,
          twins: s.twins.map(p => p.id === targetId ? { ...p, following: wasFollowing } : p),
          rising: s.rising.map(p => p.id === targetId ? { ...p, following: wasFollowing } : p),
          user: { ...s.user, following: s.user.following + (wasFollowing ? 1 : -1) },
        }
      })
    }
  }, [userId, state.followingIds])

  const value = useMemo(() => ({ ...state, toggleFollow }), [state, toggleFollow])
  return <PeopleDataContext.Provider value={value}>{children}</PeopleDataContext.Provider>
}

export function usePeopleData() {
  const ctx = useContext(PeopleDataContext)
  if (!ctx) throw new Error('usePeopleData must be inside PeopleDataProvider')
  return ctx
}
