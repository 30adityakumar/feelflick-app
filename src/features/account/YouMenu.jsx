// src/features/account/YouMenu.jsx
// Mobile "You" hub — the account menu as a full page (the mobile equivalent of the
// desktop header avatar dropdown, which is hidden below md). Reuses the shared
// ACCOUNT_MENU so the two surfaces never drift. Rendered inside AppShell, so the
// shared header + bottom nav (with "You" active) frame it.
import { Link, useNavigate } from 'react-router-dom'
import { Mail, LogOut } from 'lucide-react'

import { supabase } from '@/shared/lib/supabase/client'
import { clearDraft } from '@/features/onboarding/draft'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { ACCOUNT_MENU, FEEDBACK_HREF } from '@/shared/lib/accountMenu'

// One row treatment for every destination + feedback (icon + label, ≥44px, paper-white focus).
const ROW =
  'flex w-full items-center gap-3.5 min-h-[56px] px-3 rounded-xl text-[15px] no-underline ' +
  'text-[var(--color-text-secondary,#c9c5bc)] transition-colors duration-150 ' +
  'hover:bg-white/[0.05] hover:text-[var(--color-text-primary,#f5f2eb)] ' +
  'focus-visible:[outline:2px_solid_var(--color-focus,#f5f2eb)] focus-visible:[outline-offset:-2px]'

const ICON = { color: 'var(--color-text-muted, #a5a198)' }
const HAIRLINE = { background: 'var(--color-border-subtle, #3a3d41)' }

export default function YouMenu() {
  usePageMeta({ title: 'You · FeelFlick' })
  const navigate = useNavigate()
  const { user } = useAuthSession()

  // Identity derived exactly as the desktop AvatarMenu (Header.jsx) does.
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'You'
  const userInitial = userName.charAt(0).toUpperCase()
  const userEmail = user?.email
  const userAvatar = user?.user_metadata?.avatar_url || null

  const handleSignOut = async () => {
    // Drop this user's onboarding draft before the session is gone (shared-browser safety).
    clearDraft(user?.id)
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 pt-4 pb-2">
      <h1 className="sr-only">You</h1>

      {/* Profile header */}
      <div className="flex items-center gap-3 px-3 py-3">
        <div
          className="h-12 w-12 shrink-0 overflow-hidden rounded-full grid place-items-center"
          style={{ background: 'var(--color-surface-raised, #2e3135)', color: 'var(--color-text-primary, #f5f2eb)' }}
        >
          {userAvatar
            ? <img src={userAvatar} alt="" className="h-full w-full object-cover" />
            : <span className="text-base font-semibold">{userInitial}</span>}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold" style={{ color: 'var(--color-text-primary, #f5f2eb)' }}>
            {userName}
          </div>
          {userEmail && (
            <div className="truncate text-[13px]" style={{ color: 'var(--color-text-muted, #a5a198)' }}>{userEmail}</div>
          )}
        </div>
      </div>

      <div className="my-2 h-px" style={HAIRLINE} />

      {/* Destinations + feedback */}
      <nav aria-label="Your account" className="flex flex-col">
        {ACCOUNT_MENU.map(({ label, to, Icon }) => (
          <Link key={to} to={to} className={ROW}>
            <Icon className="h-5 w-5 shrink-0" style={ICON} aria-hidden="true" />
            {label}
          </Link>
        ))}
        <a href={FEEDBACK_HREF} target="_blank" rel="noopener noreferrer" className={ROW}>
          <Mail className="h-5 w-5 shrink-0" style={ICON} aria-hidden="true" />
          Send feedback
        </a>
      </nav>

      <div className="my-2 h-px" style={HAIRLINE} />

      {/* Sign out — an action, not a destination; kept outside the nav. */}
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center gap-3.5 min-h-[56px] px-3 rounded-xl text-[15px] text-[var(--color-text-secondary,#c9c5bc)] transition-colors duration-150 hover:bg-red-500/10 hover:text-red-300 focus-visible:[outline:2px_solid_var(--color-focus,#f5f2eb)] focus-visible:[outline-offset:-2px]"
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
        Sign out
      </button>
    </div>
  )
}
