// src/app/pages/lists/ListsPage.jsx
import { useState, useEffect } from 'react'

import { Link, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'

import { Plus, Pencil, Trash2, Film } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { tmdbImg } from '@/shared/api/tmdb'
import CreateListModal from './CreateListModal'

// ============================================================================
// SKELETON
// ============================================================================

function ListsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.03] h-32" />
      ))}
    </div>
  )
}

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
      <h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
      {action}
    </div>
  )
}

// ============================================================================
// LIST CARD
// ============================================================================

function ListCard({ list, posters, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(list.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const handleEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit(list)
  }

  return (
    <Link
      to={`/lists/${list.id}`}
      className="group flex h-32 rounded-2xl bg-white/[0.04] border border-white/[0.07] overflow-hidden hover:bg-white/[0.07] hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/30 transition-all duration-200"
    >
      {/* Poster strip — horizontal, up to 4 posters */}
      <div className="flex overflow-hidden rounded-l-2xl flex-shrink-0 w-28">
        {posters.slice(0, 4).map((poster, i) => (
          <div key={i} className="flex-1 min-w-0 h-full">
            <img
              src={tmdbImg(poster, 'w185')}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - posters.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1 bg-white/[0.04]" />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-4">
        <div>
          <h3 className="text-sm font-bold text-white line-clamp-2 mb-1">{list.title}</h3>
          {list.description && (
            <p className="text-xs text-white/35 line-clamp-2 leading-relaxed">{list.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/25">
            {list.film_count ?? 0} {(list.film_count ?? 0) === 1 ? 'film' : 'films'}
          </span>
          {/* Edit/Delete — visible on hover */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleEdit}
              aria-label="Edit list"
              className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.06] transition-colors duration-150"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              aria-label={confirmDelete ? 'Confirm delete' : 'Delete list'}
              className="p-1.5 rounded-lg text-white/25 hover:text-red-400/70 hover:bg-red-500/[0.08] transition-colors duration-150"
            >
              {confirmDelete ? (
                <span className="text-[11px] font-semibold text-red-400">Delete?</span>
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyLists({ onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center py-20 px-4"
    >
      <div className="h-20 w-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
        <Film className="h-9 w-9 text-purple-400/60" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">No lists yet</h2>
      <p className="text-white/40 text-sm max-w-sm mb-6">
        Create curated film collections to organize and share your favorites.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
      >
        <Plus className="h-4 w-4" />
        Create your first list
      </button>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ListsPage() {
  const outlet = useOutletContext() || {}
  const userId = outlet.userId

  const [lists, setLists] = useState([])
  const [posterMap, setPosterMap] = useState(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingList, setEditingList] = useState(null)

  useEffect(() => {
    if (!userId) return
    let mounted = true

    ;(async () => {
      try {
        // Fetch user's lists with film count
        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })

        if (listsError) throw listsError
        if (!mounted) return

        // Get film counts and first 3 posters per list
        const listIds = (listsData || []).map((l) => l.id)
        let filmCountMap = new Map()
        let postersMap = new Map()

        if (listIds.length > 0) {
          const { data: movieRows, error: movieError } = await supabase
            .from('list_movies')
            .select('list_id, movie_id, position, movies ( poster_path )')
            .in('list_id', listIds)
            .order('position', { ascending: true, nullsFirst: false })

          if (movieError) throw movieError

          for (const row of (movieRows || [])) {
            // Count
            filmCountMap.set(row.list_id, (filmCountMap.get(row.list_id) || 0) + 1)
            // Posters (max 3)
            const existing = postersMap.get(row.list_id) || []
            if (existing.length < 4 && row.movies?.poster_path) {
              existing.push(row.movies.poster_path)
              postersMap.set(row.list_id, existing)
            }
          }
        }

        const enriched = (listsData || []).map((l) => ({
          ...l,
          film_count: filmCountMap.get(l.id) || 0,
        }))

        setLists(enriched)
        setPosterMap(postersMap)
      } catch (err) {
        console.error('[ListsPage] fetch error:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [userId])

  const handleListSaved = (savedList) => {
    if (editingList) {
      // Update in place
      setLists((prev) => prev.map((l) => l.id === savedList.id ? { ...l, ...savedList } : l))
    } else {
      // Prepend new list
      setLists((prev) => [{ ...savedList, film_count: 0 }, ...prev])
    }
    setShowModal(false)
    setEditingList(null)
  }

  const handleDelete = async (listId) => {
    // Optimistic
    const prevLists = lists
    setLists((prev) => prev.filter((l) => l.id !== listId))

    const { error } = await supabase.from('lists').delete().eq('id', listId)
    if (error) {
      console.error('[ListsPage] delete error:', error)
      setLists(prevLists)
    }
  }

  const handleEdit = (list) => {
    setEditingList(list)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingList(null)
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 md:pb-10 relative" style={{ paddingTop: 'var(--hdr-h, 64px)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(88,28,135,0.15) 0%, transparent 60%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">Lists</h1>
          <p className="text-sm text-white/35">Your curated film collections</p>
        </div>

        {isLoading ? (
          <ListsSkeleton />
        ) : lists.length === 0 ? (
          <EmptyLists onCreate={() => setShowModal(true)} />
        ) : (
          <>
            <SectionHeader
              title="My Lists"
              action={
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/[0.10] hover:bg-white/[0.09] hover:border-white/[0.18] px-3.5 py-1.5 text-sm font-semibold text-white/70 hover:text-white transition-all duration-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New list
                </button>
              }
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {lists.map((list, idx) => (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                >
                  <ListCard
                    list={list}
                    posters={posterMap.get(list.id) || []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <CreateListModal
          userId={userId}
          existingList={editingList}
          onClose={handleCloseModal}
          onSave={handleListSaved}
        />
      )}
    </div>
  )
}
