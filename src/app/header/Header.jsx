// src/app/header/Header.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import logoPng from '@/assets/images/logo.png'
import { Search, ChevronDown, LogOut, User, History, ListChecks, PanelLeftOpen } from 'lucide-react'

export default function Header({ onOpenSearch }) {
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = useNavigate()
  const menuRef = useRef(null)

  useEffect(() => {
    let unsub
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data } = supabase.auth.onAuthStateChange((_e, sess) => setUser(sess?.user || null))
    unsub = data?.subscription?.unsubscribe
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('pointerdown', onClick)
    return () => document.removeEventListener('pointerdown', onClick)
  }, [menuOpen])

  const initial = (user?.user_metadata?.name || user?.email || 'U').trim()[0]?.toUpperCase()

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6 py-3">
        {/* Brand */}
        <Link to="/home" className="flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/60">
          <img src={logoPng} alt="" width="36" height="36" className="h-8 w-8 object-contain" loading="eager" decoding="async" />
          <span className="text-[clamp(1.1rem,3.5vw,1.4rem)] font-extrabold tracking-tight text-brand-100">FEELFLICK</span>
        </Link>

        {/* Desktop: subtle search activator */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden md:flex w-[420px] max-w-[42vw] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-left text-white/70 hover:bg-white/10 focus:outline-none"
          aria-label="Search movies"
        >
          <Search className="h-4 w-4 text-white/70" />
          <span className="text-[0.95rem] truncate">Search movies…</span>
          <span className="ml-auto text-xs text-white/45 rounded border border-white/15 px-1.5 py-0.5">/</span>
        </button>

        {/* Right: profile menu */}
        <div className="flex items-center gap-2">
          {/* Mobile search icon */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 focus:outline-none"
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-white/90 hover:bg-white/10 focus:outline-none"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#fe9245] to-[#eb423b] text-[0.95rem] font-bold text-white">
                {initial}
              </span>
              <ChevronDown className="h-4 w-4 text-white/70" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-black/70 backdrop-blur-md shadow-2xl p-1.5"
              >
                <MenuItem icon={<User className="h-4 w-4" />} onClick={() => { setMenuOpen(false); nav('/account') }}>
                  Account
                </MenuItem>
                <MenuItem icon={<PanelLeftOpen className="h-4 w-4" />} onClick={() => { setMenuOpen(false); nav('/browse') }}>
                  Browse
                </MenuItem>
                <div className="my-1 h-px bg-white/10" />
                <MenuItem icon={<ListChecks className="h-4 w-4" />} onClick={() => { setMenuOpen(false); nav('/watchlist') }}>
                  Watchlist
                </MenuItem>
                <MenuItem icon={<History className="h-4 w-4" />} onClick={() => { setMenuOpen(false); nav('/history') }}>
                  History
                </MenuItem>
                <div className="my-1 h-px bg-white/10" />
                <MenuItem
                  icon={<LogOut className="h-4 w-4" />}
                  onClick={async () => { setMenuOpen(false); await supabase.auth.signOut(); nav('/auth', { replace: true }) }}
                >
                  Sign out
                </MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function MenuItem({ icon, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[0.95rem] text-white/90 hover:bg-white/10 focus:outline-none"
    >
      {icon}
      <span>{children}</span>
    </button>
  )
}