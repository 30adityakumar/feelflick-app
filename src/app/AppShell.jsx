// src/app/AppShell.jsx
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@/app/header/Header'
import SearchBar from '@/app/header/components/SearchBar'

export default function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)

  // Keyboard shortcut for search (/)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target
        // Don't trigger if user is typing in an input/textarea
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Subtle background gradient - non-intrusive */}
      <div aria-hidden className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-black to-neutral-950" />
      </div>

      {/* Header - Fixed at top */}
      <Header onOpenSearch={() => setSearchOpen(true)} />

      {/* Page content - Full width, each page controls its own layout */}
      <main className="relative z-10 w-full">
        <Outlet />
      </main>

      {/* Global search modal */}
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
