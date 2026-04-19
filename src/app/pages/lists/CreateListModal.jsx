// src/app/pages/lists/CreateListModal.jsx
import { useState, useEffect } from 'react'

import { motion } from 'framer-motion'

import { X } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'

// ============================================================================
// CREATE / EDIT LIST MODAL
// ============================================================================

/**
 * Modal for creating a new list or editing an existing one.
 * @param {{ onClose: () => void, onSave: (list: object) => void, existingList?: object|null, userId: string }} props
 */
export default function CreateListModal({ onClose, onSave, existingList = null, userId }) {
  const isEdit = !!existingList
  const [title, setTitle] = useState(existingList?.title || '')
  const [description, setDescription] = useState(existingList?.description || '')
  const [isPublic, setIsPublic] = useState(existingList?.is_public ?? true)
  const [saving, setSaving] = useState(false)

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const canSubmit = title.trim().length > 0 && !saving

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSaving(true)

    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from('lists')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            is_public: isPublic,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingList.id)
          .select()
          .single()

        if (error) throw error
        onSave(data)
      } else {
        const { data, error } = await supabase
          .from('lists')
          .insert({
            user_id: userId,
            title: title.trim(),
            description: description.trim() || null,
            is_public: isPublic,
          })
          .select()
          .single()

        if (error) throw error
        onSave(data)
      }
    } catch (err) {
      console.error('[CreateListModal] save error:', err)
    } finally {
      setSaving(false)
    }
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
        aria-label={isEdit ? 'Edit list' : 'Create list'}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full sm:max-w-md bg-black border border-white/8 sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-base font-bold text-white">
            {isEdit ? 'Edit list' : 'Create a new list'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="list-title" className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              id="list-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="e.g. Comfort Movies"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors"
            />
            <p className="text-[11px] text-white/20 mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="list-description" className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
              Description <span className="text-white/20 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              id="list-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="What is this list about?"
              rows={3}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-colors resize-none"
            />
            <p className="text-[11px] text-white/20 mt-1 text-right">{description.length}/500</p>
          </div>

          {/* Public toggle */}
          <label htmlFor="list-public" className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                id="list-public"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-5 w-9 rounded-full bg-white/10 peer-checked:bg-purple-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
              Public — anyone can see this list
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white/60 hover:text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              {saving ? 'Saving\u2026' : isEdit ? 'Save changes' : 'Create list'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
