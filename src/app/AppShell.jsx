import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '@/app/header/Header'
import Sidebar from '@/app/header/sidebar/Sidebar'
import SearchBar from '@/app/header/components/SearchBar'

export default function AppShell() {
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)

  // Open search with "/" on any app page
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Show sidebar only on /browse (desktop will handle its own visibility)
  const showSidebar = useMemo(() => pathname.startsWith('/browse'), [pathname])

  return (
    <div className="relative min-h-screen text-white">
      {/* Brand background (same family as Landing/Auth) */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#0a121a_0%,#0d1722_50%,#0c1017_100%)]" />
        <div className="pointer-events-none absolute -top-40 -left-40 h-[65vmin] w-[65vmin] rounded-full blur-3xl opacity-60 bg-[radial-gradient(closest-side,rgba(254,146,69,0.45),rgba(254,146,69,0)_70%)]" />
        <div className="pointer-events-none absolute -bottom-44 -right-44 h-[70vmin] w-[70vmin] rounded-full blur-3xl opacity-55 bg-[radial-gradient(closest-side,rgba(235,66,59,0.38),rgba(235,66,59,0)_70%)]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(45,119,255,0.35),rgba(45,119,255,0)_70%)]" />
        <div className="pointer-events-none absolute -top-24 right-[15%] h-[45vmin] w-[45vmin] rounded-full blur-3xl opacity-45 bg-[radial-gradient(closest-side,rgba(255,99,196,0.35),rgba(255,99,196,0)_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
          <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_220deg_at_50%_50%,rgba(255,255,255,0.08),rgba(255,255,255,0)_65%)] motion-safe:md:animate-[spin_48s_linear_infinite]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
      </div>

      <Header onOpenSearch={() => setSearchOpen(true)} />

      {/* Content grid: optionally reserve sidebar space on /browse */}
      <div className="relative z-10">
        <div className={`mx-auto w-full max-w-[1200px] px-4 md:px-6 ${showSidebar ? 'grid grid-cols-12 gap-6' : ''}`}>
          {showSidebar && (
            <aside className="hidden lg:block col-span-3 pt-4">
              <Sidebar />
            </aside>
          )}
          <main className={showSidebar ? 'col-span-12 lg:col-span-9 pt-4' : 'pt-4'}>
            <Outlet />
          </main>
        </div>
      </div>

      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}