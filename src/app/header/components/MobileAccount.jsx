// src/app/header/components/MobileAccount.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { ChevronRight, User, Settings, Bookmark, Clock, LogOut } from 'lucide-react'

export default function MobileAccount() {
  const nav = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user ?? null)
    }
    getUser()
  }, [])

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const email = user?.email
  const initials = name
    .split(' ')
    .map(s => s[0]?.toUpperCase())
    .slice(0, 2)
    .join('')

  async function handleSignOut() {
    await supabase.auth.signOut()
    nav('/', { replace: true })
  }

  // Main menu and library
  const menuSections = [
    {
      items: [
        { icon: User, label: 'Profile', path: '/account' },
        { icon: Settings, label: 'Settings', path: '/preferences' },
      ]
    },
    {
      title: 'Library',
      items: [
        { icon: Bookmark, label: 'Watchlist', path: '/watchlist' },
        { icon: Clock, label: 'History', path: '/history' },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white pb-20" style={{ paddingTop: 'var(--hdr-h, 64px)' }}>
      {/* User Info Card */}
      <div className="px-4 py-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-pink-400 flex items-center justify-center text-3xl font-black text-white flex-shrink-0 ring-4 ring-white/10">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent truncate">{name}</h1>
            <p className="text-sm text-white/60 truncate mt-1">{email}</p>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="py-4">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            {section.title &&
              <h2 className="px-6 py-2 text-xs font-bold text-white/50 uppercase tracking-wider">{section.title}</h2>
            }
            <div className="divide-y divide-white/5">
              {section.items.map(item => (
                <button
                  key={item.label}
                  onClick={() => nav(item.path)}
                  className="flex w-full items-center gap-4 px-6 py-4 text-white/90 hover:bg-white/5 active:bg-purple-600/10 transition-all group"
                >
                  <div className="text-purple-400 group-hover:text-pink-400 group-active:scale-110 transition-all">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-base font-semibold flex-1 text-left">{item.label}</span>
                  <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-pink-400 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sign Out Button */}
      <div className="px-6 pt-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:brightness-110 active:scale-97 transition-all group"
        >
          <LogOut className="h-5 w-5 group-active:scale-110 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* App Info */}
      <div className="px-6 py-8 text-center">
        <p className="text-xs text-white/40">FeelFlick v1.0.0</p>
        <p className="text-xs text-white/30 mt-1">© 2025 FeelFlick. All rights reserved.</p>
      </div>
    </div>
  )
}
