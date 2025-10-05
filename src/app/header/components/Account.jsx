// src/app/header/components/Account.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { LogOut } from 'lucide-react'

/**
 * Drop-down account panel that anchors to the avatar button.
 * Put this component inside a relatively-positioned container
 * (e.g., <div className="relative">) in the header.
 */
export default function Account({
  user,
  onProfileUpdate,
  dropdownPlacement = 'bottom-end', // 'bottom-start' | 'bottom-end'
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  // Keep local name in sync if the prop changes
  useEffect(() => {
    setName(user?.name || '')
  }, [user?.name])

  // Close on outside click / Esc
  useEffect(() => {
    function onDocDown(e) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const initial =
    (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()

  const posClass =
    dropdownPlacement === 'bottom-start' ? 'left-0' : 'right-0'

  async function handleSave(e) {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', user.id)
      // Keep auth metadata loosely in sync (best-effort)
      await supabase.auth.updateUser({ data: { name } }).catch(() => {})
      if (error) throw error
      onProfileUpdate?.({ name })
      setOpen(false)
    } catch (err) {
      console.warn('Profile update failed:', err)
      alert('Could not save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger (avatar) */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 text-white/90 hover:bg-white/15 focus:outline-none"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
      >
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold">{initial}</span>
        )}
      </button>

      {/* Dropdown panel (anchored to the avatar) */}
      {open && (
        <div
          role="menu"
          className={`absolute ${posClass} mt-2 z-50 w-[min(360px,92vw)] rounded-2xl border border-white/12 bg-black/70 backdrop-blur-md shadow-[0_20px_80px_rgba(0,0,0,.5)]`}
          style={{ top: 'calc(100% + 4px)' }}
        >
          <form onSubmit={handleSave} className="p-4">
            {/* Name */}
            <div className="mb-4">
              <div className="mb-1 text-[12px] font-semibold tracking-wide text-white/60">
                NAME
              </div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:outline-none"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="mb-4">
              <div className="mb-1 text-[12px] font-semibold tracking-wide text-white/60">
                EMAIL
              </div>
              <input
                value={user?.email || ''}
                disabled
                className="w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-white/80 placeholder-white/40 opacity-80"
                placeholder="Email address"
                readOnly
              />
            </div>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-4 py-2.5 text-[0.95rem] font-semibold text-white disabled:opacity-60 focus:outline-none"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>

            {/* Sign out */}
            <div className="mt-4 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => navigate('/logout')}
                className="inline-flex items-center gap-2 text-[0.95rem] font-semibold text-white/85 hover:text-white focus:outline-none"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}