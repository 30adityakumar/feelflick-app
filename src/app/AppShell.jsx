import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'

// A11y helpers
import SkipLink from '@/app/a11y/SkipLink'
import RouteAnnouncer from '@/app/a11y/RouteAnnouncer'
import FocusOnNavigate from '@/app/a11y/FocusOnNavigate'

// Global chrome
import Header from '@/app/header/Header'
import Sidebar from '@/app/header/sidebar/Sidebar'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-black text-white">
      <SkipLink />
      <RouteAnnouncer />
      <FocusOnNavigate />

      <Header />

      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 pb-8 pt-4 md:px-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <Sidebar />
        </aside>

        <main id="main" className="min-h-[70vh] flex-1">
          <Suspense fallback={<div className="p-6 text-white/70">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}