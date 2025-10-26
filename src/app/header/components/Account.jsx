// src/app/header/components/Account.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { LogOut } from 'lucide-react'

/**
 * Minimal account card.
 * - variant="dropdown" (default): compact, used in header popover
 * - variant="page": padded, for a dedicated route if you ever add one
 */
export default function Account({ user: userProp, onProfileUpdate, onClose, variant = 'dropdown' }) {
  const nav = useNavigate()
  const [user, setUser] = useState(userProp || null)
  const [name, setName] = useState(userProp?.name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Fetch once if not provided from parent
  useEffect(() => {
    if (userProp) return
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user || null
      setUser(u)
      setName(u?.user_metadata?.name || '')
    })
  }, [userProp])

  const canSave = useMemo(() => {
    const current = (user?.user_metadata?.name || userProp?.name || '').trim()
    return name.trim() && name.trim() !== current && !saving
  }, [name, user, userProp, saving])

  async function handleSave(e) {
    e.preventDefault()
    if (!user || !canSave) return
    setSaving(true)
    try {
      await supabase.from('users').update({ name: name.trim() }).eq('id', user.id)
      await supabase.auth.updateUser({ data: { name: name.trim() } })
      onProfileUpdate?.({ name: name.trim() })
      setMessage('Saved')
      setTimeout(() => setMessage(''), 1400)
    } catch (err) {
      console.warn('profile save failed:', err)
      setMessage('Could not save')
      setTimeout(() => setMessage(''), 1600)
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } finally {
      onClose?.()
      nav('/auth', { replace: true })
    }
  }

  const shell =
    variant === 'page'
      ? 'max-w-[420px] mx-auto p-6 sm:p-7 rounded-2xl border border-white/10 bg-black/65 shadow-2xl'
      : 'p-1.5'

  return (
    <div className={shell}>
      {variant === 'page' && (
        <h2 className="mb-4 text-[22px] font-extrabold tracking-tight text-white">My Account</h2>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#fdaf41]">NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[15px] font-medium text-white outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-orange-400/70"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#fdaf41]">EMAIL</label>
          <input
            value={user?.email || userProp?.email || ''}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[15px] font-medium text-white/80"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-4 py-2 text-[14px] font-bold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[14px] font-semibold text-white hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {message && (
          <p className="text-right text-[12px] font-semibold text-white/80" role="status" aria-live="polite">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}