// src/app/header/components/Account.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * Can render as:
 *  - variant="dropdown": compact card for the header popover
 *  - variant="page": standalone page (shows bigger spacing)
 */
export default function Account({ user: userProp, onProfileUpdate, onClose, variant = 'dropdown' }) {
  const nav = useNavigate()
  const [user, setUser] = useState(userProp || null)
  const [name, setName] = useState(userProp?.name || '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // If no user was passed, fetch the current one
  useEffect(() => {
    if (userProp) return
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user || null
      setUser(u)
      setName(u?.user_metadata?.name || '')
    })
  }, [userProp])

  async function handleSave(e) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('users').update({ name }).eq('id', user.id)
      // also mirror into auth metadata
      await supabase.auth.updateUser({ data: { name } })
      setSavedMsg('Saved!')
      setTimeout(() => setSavedMsg(''), 1600)
      onProfileUpdate?.({ name })
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    if (onClose) onClose()
    nav('/auth', { replace: true })
  }

  const shell =
    variant === 'page'
      ? 'max-w-[420px] mx-auto mt-14 p-6 sm:p-7 bg-[#191820]/90 rounded-2xl border border-white/10 shadow-2xl'
      : 'p-3'

  return (
    <div className={shell}>
      {variant === 'page' && (
        <h2 className="mb-4 text-[22px] font-extrabold tracking-tight text-white">My Account</h2>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="block text-[12px] font-semibold text-[#fdaf41]">NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
              mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[15px]
              font-medium text-white outline-none placeholder:text-zinc-400
              focus:ring-2 focus:ring-brand/60
            "
            placeholder="Your name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[12px] font-semibold text-[#fdaf41]">EMAIL</label>
          <input
            value={user?.email || ''}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[15px] font-medium text-white/80 opacity-70"
            placeholder="Email address"
          />
        </div>

        {/* Save + Sign out */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#fe9245] to-[#eb423b] px-4 py-2 text-[14px] font-bold text-white disabled:opacity-70"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg bg-white/8 px-3 py-2 text-[14px] font-semibold text-white/90 hover:bg-white/12"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {savedMsg && (
          <p className="text-right text-[12px] font-semibold text-emerald-400/90">{savedMsg}</p>
        )}
      </form>
    </div>
  )
}