// src/app/header/components/MobileAccount.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ChevronRight, User, Settings, Bookmark, Clock, LogOut, Fingerprint, Users, ListVideo, Mail } from 'lucide-react'

export default function MobileAccount() {
  const nav = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null))
  }, [])

  const name     = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const email    = user?.email
  const avatar   = user?.user_metadata?.avatar_url || null
  const initials = name.trim().split(' ').map(s => s[0]?.toUpperCase()).slice(0, 2).join('')

  async function handleSignOut() {
    await supabase.auth.signOut()
    nav('/', { replace: true })
  }

  const sections = [
    {
      items: [
        { icon: User,        label: 'Profile',       sub: 'Name and photo',     path: '/account'     },
        { icon: Fingerprint, label: 'Taste Profile', sub: 'Your cinematic DNA', path: '/profile'     },
        { icon: Users,       label: 'People',        sub: 'Find & follow cinephiles', path: '/people' },
        { icon: Settings,    label: 'Settings',      sub: 'Preferences',        path: '/preferences' },
        { icon: Mail,        label: 'Send feedback', sub: 'hello@feelflick.com', href: 'mailto:hello@feelflick.com?subject=Feelflick%20feedback' },
      ],
    },
    {
      title: 'Library',
      items: [
        { icon: Bookmark,  label: 'Watchlist', sub: 'Saved films',           path: '/watchlist' },
        { icon: Clock,     label: 'History',   sub: 'What you\'ve watched',  path: '/history'   },
        { icon: ListVideo, label: 'Lists',     sub: 'Your film collections', path: '/lists'     },
      ],
    },
  ]

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ paddingTop: 'var(--hdr-h, 64px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
    >

      {/* ── Hero card ─────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-5">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-5 flex items-center gap-4">
          {/* Avatar */}
          <div
            className="h-16 w-16 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-black text-white shadow-lg overflow-hidden"
            style={{
              background: avatar
                ? undefined
                : 'linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153))',
            }}
          >
            {avatar
              ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
              : initials}
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-white truncate leading-tight">{name}</div>
            <div className="text-sm text-white/40 truncate mt-0.5">{email}</div>
          </div>
        </div>
      </div>

      {/* ── Menu sections ─────────────────────────────────────── */}
      <div className="px-4 space-y-3">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest px-1 mb-2">
                {section.title}
              </p>
            )}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden divide-y divide-white/5">
              {section.items.map(item =>
                item.href?.startsWith('mailto:') ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-white/4 active:bg-white/6 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/15 transition-colors">
                      <item.icon className="h-4.5 w-4.5 text-white/60 group-hover:text-purple-400 transition-colors" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/80">{item.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{item.sub}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 flex-shrink-0 transition-colors" />
                  </a>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => nav(item.path)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-white/4 active:bg-white/6 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/15 transition-colors">
                      <item.icon className="h-4.5 w-4.5 text-white/60 group-hover:text-purple-400 transition-colors" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/80">{item.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{item.sub}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 flex-shrink-0 transition-colors" />
                  </button>
                )
              )}
            </div>
          </div>
        ))}

        {/* ── Sign out row ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-red-500/5 active:bg-red-500/8 transition-colors group"
          >
            <div className="h-9 w-9 rounded-xl bg-white/6 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/12 transition-colors">
              <LogOut className="h-4.5 w-4.5 text-white/40 group-hover:text-red-400 transition-colors" style={{ width: 18, height: 18 }} />
            </div>
            <span className="flex-1 text-sm font-semibold text-white/70 group-hover:text-red-400 transition-colors">Sign out</span>
            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-red-400/40 flex-shrink-0 transition-colors" />
          </button>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className="text-center pt-8 pb-4 px-6">
        <div className="text-xs text-white/20">FeelFlick · mood-first cinema</div>
      </div>

    </div>
  )
}
