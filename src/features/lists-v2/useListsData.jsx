// src/features/lists-v2/useListsData.jsx
// FeelFlick — Lists v2 ("Shelves") data layer.
//
// Three sources:
//   MINE      → public.lists where user_id = me  + list_movies enrichment
//   FOLLOWED  → public.lists where user_id ∈ (people I follow) AND is_public=true
//   EDITORIAL → CURATED_LISTS config (query-driven, not table-stored) — surfaced
//               here as virtual "lists" so the editorial tab has content. Each
//               curated slug renders via the existing /lists/curated/:slug route.
//
// Each list shape: { id, title, count, palette, cover, blurb, ...kind-specific }

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { tmdbImg } from '@/shared/api/tmdb'
import { CURATED_LISTS } from '@/app/pages/browse/curatedListsConfig'

const ListsDataContext = createContext(null)

// Deterministic palette per list id so colors are stable across reloads but
// vary across cards — gives the grid visual rhythm without a DB column.
const PALETTE_POOL = [
  ['#7C3AED', '#1e1b4b'],
  ['#F59E0B', '#451a03'],
  ['#EF4444', '#7f1d1d'],
  ['#A78BFA', '#312e81'],
  ['#0EA5E9', '#172554'],
  ['#EC4899', '#3a0d1f'],
  ['#34D399', '#064e3b'],
  ['#F472B6', '#3a0d1f'],
]

function paletteFor(id) {
  const s = String(id || '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return PALETTE_POOL[Math.abs(h) % PALETTE_POOL.length]
}

const AVATAR_PALETTE = ['#A78BFA', '#F472B6', '#7DD3FC', '#FBBF24', '#34D399', '#C084FC', '#F59FA8']
function avatarBg(id) {
  if (!id) return AVATAR_PALETTE[0]
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

function timeAgo(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.round(ms / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.round(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
}

const INITIAL = {
  user: { name: 'You', mineCount: 0, followedCount: 0 },
  mine: [],
  followed: [],
  editorial: [],
  featured: null,
  loading: true,
  error: null,
}

// === Helpers =============================================================

// Build { listId → [poster_path, …], listId → count } from a list_movies row dump.
function indexListMovies(rows) {
  const posters = new Map()
  const counts = new Map()
  for (const r of rows || []) {
    counts.set(r.list_id, (counts.get(r.list_id) || 0) + 1)
    if (r.movies?.poster_path) {
      const arr = posters.get(r.list_id) || []
      if (arr.length < 4) arr.push(r.movies.poster_path)
      posters.set(r.list_id, arr)
    }
  }
  return { posters, counts }
}

function shapeMine(list, posters, counts) {
  return {
    id: list.id,
    title: list.title,
    count: counts.get(list.id) || 0,
    palette: paletteFor(list.id),
    cover: posters.get(list.id)?.[0] ? tmdbImg(posters.get(list.id)[0], 'w500') : null,
    blurb: list.description || null,
    updated: timeAgo(list.updated_at),
    public: !!list.is_public,
  }
}

function shapeFollowed(list, posters, counts, author) {
  return {
    id: list.id,
    title: list.title,
    count: counts.get(list.id) || 0,
    palette: paletteFor(list.id),
    cover: posters.get(list.id)?.[0] ? tmdbImg(posters.get(list.id)[0], 'w500') : null,
    blurb: list.description || null,
    by: author?.name || 'Someone',
    byBg: avatarBg(list.user_id),
    updated: timeAgo(list.updated_at),
  }
}

function shapeEditorial(curated) {
  return {
    id: curated.slug,
    slug: curated.slug,
    title: curated.title,
    count: 40, // CURATED_LISTS queries cap at 40 — exact counts would require running each query
    palette: paletteFor(curated.slug),
    cover: null, // editorial lists are query-driven; the slug page renders covers at view time
    blurb: curated.description,
  }
}

// === Provider ============================================================

export function ListsDataProvider({ children }) {
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
      // === Phase 1: my lists + my follows graph (parallel) ===
      const [myListsRes, followsRes] = await Promise.all([
        supabase
          .from('lists')
          .select('id, title, description, is_public, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId),
      ])

      const myLists = myListsRes.data || []
      const followingIds = (followsRes.data || []).map(r => r.following_id)

      // === Phase 2: lists by people I follow + list_movies enrichment ===
      const [followedListsRes, followedAuthorsRes] = await Promise.all([
        followingIds.length
          ? supabase
              .from('lists')
              .select('id, user_id, title, description, is_public, updated_at')
              .in('user_id', followingIds)
              .eq('is_public', true)
              .order('updated_at', { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [] }),
        followingIds.length
          ? supabase
              .from('users')
              .select('id, name')
              .in('id', followingIds)
          : Promise.resolve({ data: [] }),
      ])

      const followedLists = followedListsRes.data || []
      const authors = new Map((followedAuthorsRes.data || []).map(u => [u.id, u]))

      const allListIds = [...myLists.map(l => l.id), ...followedLists.map(l => l.id)]
      const moviesRes = allListIds.length
        ? await supabase
            .from('list_movies')
            .select('list_id, position, movies(poster_path)')
            .in('list_id', allListIds)
            .order('position', { ascending: true, nullsFirst: false })
        : { data: [] }

      const { posters, counts } = indexListMovies(moviesRes.data || [])

      const mine = myLists.map(l => shapeMine(l, posters, counts))
      const followed = followedLists.map(l => shapeFollowed(l, posters, counts, authors.get(l.user_id)))
      const editorial = CURATED_LISTS.map(shapeEditorial)

      // === Phase 3: featured-shelf detail (first owned list with films) ===
      const featuredSeed = myLists.find(l => (counts.get(l.id) || 0) > 0)
        || followedLists.find(l => (counts.get(l.id) || 0) > 0)
        || null

      let featured = null
      if (featuredSeed) {
        const { data: items } = await supabase
          .from('list_movies')
          .select(`
            position, note,
            movies!inner(id, tmdb_id, title, director_name, release_date, mood_tags, poster_path)
          `)
          .eq('list_id', featuredSeed.id)
          .order('position', { ascending: true, nullsFirst: false })
          .limit(20)

        featured = {
          id: featuredSeed.id,
          title: featuredSeed.title,
          blurb: featuredSeed.description,
          updated: timeAgo(featuredSeed.updated_at),
          mine: featuredSeed.user_id ? featuredSeed.user_id === userId : true,
          films: (items || []).map(it => ({
            id: it.movies?.id,
            tmdbId: it.movies?.tmdb_id,
            title: it.movies?.title || 'Untitled',
            year: it.movies?.release_date ? new Date(it.movies.release_date).getFullYear() : '',
            dir: it.movies?.director_name || '—',
            mood: (it.movies?.mood_tags || [])[0] || 'Mixed',
            poster: it.movies?.poster_path ? tmdbImg(it.movies.poster_path, 'w185') : null,
            note: it.note || null,
          })),
        }
      }

      const name = session?.user?.user_metadata?.full_name
        || session?.user?.user_metadata?.name
        || session?.user?.email?.split('@')[0]
        || 'You'

      setState({
        user: { name, mineCount: mine.length, followedCount: followed.length },
        mine,
        followed,
        editorial,
        featured,
        loading: false,
        error: null,
      })
    } catch (e) {
      console.error('[useListsData]', e)
      setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load' }))
    }
  }, [userId, session])

  useEffect(() => {
    load()
  }, [load])

  // Optimistic local delete used by the v2 list card actions menu later.
  const removeList = useCallback(async (listId) => {
    setState(s => ({
      ...s,
      mine: s.mine.filter(l => l.id !== listId),
      user: { ...s.user, mineCount: s.user.mineCount - 1 },
    }))
    const { error } = await supabase.from('lists').delete().eq('id', listId)
    if (error) console.error('[useListsData.removeList]', error)
  }, [])

  const value = useMemo(() => ({ ...state, removeList, reload: load }), [state, removeList, load])
  return <ListsDataContext.Provider value={value}>{children}</ListsDataContext.Provider>
}

export function useListsData() {
  const ctx = useContext(ListsDataContext)
  if (!ctx) throw new Error('useListsData must be inside ListsDataProvider')
  return ctx
}
