// src/app/header/components/MobileAccount.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { 
  ChevronRight, User, Settings, Bookmark, 
  Clock, LogOut, Sparkles 
} from 'lucide-react'

export default function MobileAccount() {
  const nav = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user ?? null)
    }
    getUser()
  }, [])

  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const email = user?.email
  const avatarUrl = user?.user_metadata?.avatar_url

  const initials = name
    .split(' ')
    .map(s => s[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'U'

  async function handleSignOut() {
    await supabase.auth.signOut()
    nav('/', { replace: true })
  }

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
    }
  ]

  return (
    <div 
      className="min-h-screen bg-black text-white pb-32"
      style={{ paddingTop: 'var(--hdr-h, 72px)' }}
    >
      {/* Header / User Card */}
      <div className="px-4 pt-6 pb-8">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div 
            className="relative h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-black text-white flex-shrink-0 ring-4 ring-white/10 shadow-2xl overflow-hidden"
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          
          {/* Name/Email */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-white truncate tracking-tight leading-tight">
              {name}
            </h1>
            <p className="text-sm font-medium text-white/50 truncate mt-1">
              {email}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="h-3 w-3 text-purple-400 fill-current" />
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                Free Plan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-4 space-y-6">
        {menuSections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <h2 className="px-2 mb-3 text-xs font-bold text-white/40 uppercase tracking-wider">
                {section.title}
              </h2>
            )}
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-lg">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => nav(item.path)}
                  className={`
                    flex w-full items-center gap-4 px-5 py-4 text-white transition-all active:bg-white/10 group
                    ${i !== section.items.length - 1 ? 'border-b border-white/5' : ''}
                  `}
                >
                  <div className="p-2 rounded-xl bg-white/5 text-white/80 group-active:scale-95 group-active:bg-purple-500/20 group-active:text-purple-300 transition-all">
                    <item.icon className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <span className="text-base font-bold flex-1 text-left tracking-tight">
                    {item.label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-white/20 group-active:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-3 px-6 py-4 rounded-3xl bg-[#111] border border-white/10 text-red-400 active:bg-red-500/10 active:border-red-500/30 transition-all font-bold shadow-lg active:scale-[0.98]"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* App Info */}
        <div className="py-6 text-center">
          <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-3">
            <Sparkles className="h-4 w-4 text-purple-400 fill-current opacity-50" />
          </div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
            FeelFlick v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
