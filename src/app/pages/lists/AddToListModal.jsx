// src/app/pages/lists/AddToListModal.jsx
import { useState, useEffect, useCallback } from 'react'

import { motion } from 'framer-motion'

import { X, Plus, Check } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import Button from '@/shared/ui/Button'
import CreateListModal from './CreateListModal'

// ============================================================================
// ADD TO LIST MODAL
// ============================================================================

/**
 * Modal showing the user's lists with checkboxes to add/remove a movie.
 * @param {{ movieId: number, movieTitle: string, userId: string, onClose: () => void }} props
 */
export default function AddToListModal({ movieId, movieTitle, userId, onClose }) {
  const [lists, setLists] = useState([])
  const [membershipMap, setMembershipMap] = useState(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toggling, setToggling] = useState(new Set())

  // Fetch user's lists + which ones contain this movie
  useEffect(() => {
    if (!userId || !movieId) return
    let mounted = true

    ;(async () => {
      try {
        const [listsRes, membershipsRes] = await Promise.all([
          supabase
            .from('lists')
            .select('id, title, is_public')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false }),
          supabase
            .from('list_movies')
            .select('list_id')
            .eq('movie_id', movieId),
        ])

        if (listsRes.error) throw listsRes.error
        if (membershipsRes.error) throw membershipsRes.error
        if (!mounted) return

        setLists(listsRes.data ?? [])
        const memberSet = new Map()
        for (const row of (membershipsRes.data ?? [])) {
          memberSet.set(row.list_id, true)
        }
        setMembershipMap(memberSet)
      } catch (err) {
        console.error('[AddToListModal] fetch error:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [userId, movieId])

  // Close on Escape (only when CreateListModal isn't open)
  useEffect(() => {
    if (showCreate) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showCreate])

  const handleToggle = useCallback(async (listId) => {
    if (toggling.has(listId)) return
    const wasIn = membershipMap.has(listId)

    // Optimistic update
    setMembershipMap((prev) => {
      const next = new Map(prev)
      if (wasIn) {
        next.delete(listId)
      } else {
        next.set(listId, true)
      }
      return next
    })
    setToggling((prev) => new Set(prev).add(listId))

    try {
      if (wasIn) {
        const { error } = await supabase
          .from('list_movies')
          .delete()
          .eq('list_id', listId)
          .eq('movie_id', movieId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('list_movies')
          .insert({ list_id: listId, movie_id: movieId })
        if (error) throw error
      }
      // Update list's updated_at
      await supabase
        .from('lists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', listId)
    } catch (err) {
      console.error('[AddToListModal] toggle error:', err)
      // Revert
      setMembershipMap((prev) => {
        const next = new Map(prev)
        if (wasIn) {
          next.set(listId, true)
        } else {
          next.delete(listId)
        }
        return next
      })
    } finally {
      setToggling((prev) => {
        const next = new Set(prev)
        next.delete(listId)
        return next
      })
    }
  }, [toggling, membershipMap, movieId])

  const handleListCreated = (newList) => {
    setLists((prev) => [newList, ...prev])
    setShowCreate(false)
    // Auto-add the movie to the new list
    handleToggle(newList.id)
  }

  if (showCreate) {
    return (
      <CreateListModal
        userId={userId}
        onClose={() => setShowCreate(false)}
        onSave={handleListCreated}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close modal"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${movieTitle} to a list`}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full sm:max-w-md bg-black border border-white/8 sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="min-w-0 flex-1 mr-3">
            <h2 className="text-base font-bold text-white truncate">Add to list</h2>
            <p className="text-xs text-white/40 truncate mt-0.5">{movieTitle}</p>
          </div>
          <Button variant="icon" size="sm" onClick={onClose} aria-label="Close" className="flex-shrink-0 text-white/40">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* List rows */}
        <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
          {isLoading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-5 w-5 rounded bg-purple-500/[0.04]" />
                  <div className="h-3.5 w-32 rounded bg-purple-500/[0.04]" />
                </div>
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-white/40 text-sm">No lists yet. Create one below.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {lists.map((list) => {
                const isIn = membershipMap.has(list.id)
                const isBusy = toggling.has(list.id)
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => handleToggle(list.id)}
                    disabled={isBusy}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    <div
                      className={`h-5 w-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                        isIn
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {isIn && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-white/80 font-medium truncate flex-1">{list.title}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* New list + Done */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/8">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 text-sm text-purple-400 font-semibold hover:text-purple-300 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New list
          </button>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
