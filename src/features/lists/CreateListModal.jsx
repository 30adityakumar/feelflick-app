// src/features/lists/CreateListModal.jsx
import { useState, useRef } from 'react'

import { X } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
import Input from '@/shared/ui/Input'
import Textarea from '@/shared/ui/Textarea'
import Checkbox from '@/shared/ui/Checkbox'

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
  // F9.2: new lists default PRIVATE. Editing keeps the existing list's value. The user opts in
  // to public via the explicit "Public — anyone can see this list" checkbox below.
  const [isPublic, setIsPublic] = useState(existingList?.is_public ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const savingRef = useRef(false) // F9.3: synchronous guard — blocks a 2nd submit before React re-renders

  const canSubmit = title.trim().length > 0 && !saving

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (title.trim().length === 0 || savingRef.current) return // duplicate-submit guard
    savingRef.current = true
    setSaving(true)
    setError('')

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
      console.error('[CreateListModal] save error:', err) // raw error stays in the console, never the UI
      setError(isEdit ? 'Could not save your changes. Please try again.' : 'Could not create your list. Please try again.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} label={isEdit ? 'Edit list' : 'Create list'} size="sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h2 className="text-base font-bold text-white">
          {isEdit ? 'Edit list' : 'Create a new list'}
        </h2>
        <Button variant="icon" size="sm" onClick={onClose} aria-label="Close" className="text-white/40">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="list-title" className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
            Title
          </label>
          <Input
            id="list-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            placeholder="e.g. Comfort Movies"
          />
          <p className="text-[11px] text-white/20 mt-1 text-right">{title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="list-description" className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
            Description <span className="text-white/20 font-normal normal-case">(optional)</span>
          </label>
          <Textarea
            id="list-description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="What is this list about?"
            rows={3}
          />
          <p className="text-[11px] text-white/20 mt-1 text-right">{description.length}/500</p>
        </div>

        {/* Public toggle */}
        <Checkbox
          id="list-public"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          label="Public — anyone can see this list"
        />

        {/* Safe, user-facing error (never raw backend text); inputs are preserved for retry */}
        {error && <p role="alert" className="text-[13px] text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create list'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
