// src/app/header/Header.jsx
// Header.jsx — Production‑grade MVP header for FeelFlick
// - Single file, no new deps (uses plain React + Tailwind classes)
// - Desktop: sticky top header with logo, inline nav, account
// - Mobile: compact top bar + bottom tab bar (YouTube‑style)
// - Accessible: skip link, aria-current on active items, keyboard focus rings
// - Works with any router (anchors). If you have <Link>, swap <a> with it.
// - Active state is derived from window.location.pathname.

import React from 'react'

// ------- Small inline icons (no external libs) -------
const IconHome = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 10.5 12 3l9 7.5"/>
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>
  </svg>
)

const IconGrid = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
)

const IconSearch = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="11" cy="11" r="7"/>
    <path d="m20 20-3.5-3.5"/>
  </svg>
)

const IconUser = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M20 21a8 8 0 1 0-16 0"/>
    <circle cx="12" cy="8" r="4"/>
  </svg>
)

// ------- Helpers -------
const isActive = (href) => {
  try {
    const path = window.location?.pathname || '/'
    if (href === '/') return path === '/'
    return path === href || path.startsWith(href + '/')
  } catch {
    return false
  }
}

const classes = (...xs) => xs.filter(Boolean).join(' ')

function NavItem({ href, label, icon: Icon, variant = 'desktop' }) {
  const active = isActive(href)
  const base = 'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 focus-visible:ring-offset-transparent'

  if (variant === 'mobile') {
    return (
      <a href={href} aria-label={label} aria-current={active ? 'page' : undefined} className={classes(
        'flex flex-col items-center justify-center gap-1 min-w-[64px] py-2',
        active ? 'text-black dark:text-white' : 'text-neutral-600 dark:text-neutral-300'
      )}>
        <Icon className="h-6 w-6" />
        <span className={classes('text-[11px] leading-none', active && 'font-semibold')}>{label}</span>
      </a>
    )
  }

  // desktop
  return (
    <a href={href} aria-current={active ? 'page' : undefined} className={classes(
      base,
      active
        ? 'bg-neutral-200/70 text-black dark:bg-neutral-800/70 dark:text-white'
        : 'text-neutral-700 hover:bg-neutral-200/60 dark:text-neutral-200 dark:hover:bg-neutral-800/50'
    )}>
      <Icon className="h-[18px] w-[18px]" />
      <span>{label}</span>
    </a>
  )
}

// ------- Main Header -------
export default function Header({ user, onSignOut }) {
  // Ensure we render a skip link and safe top/bottom bars
  return (
    <>
      {/* Skip to content for keyboard users */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-black focus:px-3 focus:py-2 focus:text-white">Skip to content</a>

      {/* Sticky top header (desktop & tablet) */}
      <header className="sticky top-0 z-50 hidden border-b border-neutral-200/80 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-neutral-800/80 dark:bg-neutral-950/60 md:block">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between gap-3">
            {/* Left: Brand */}
            <a href="/" className="group flex items-center gap-2 rounded-lg p-1 focus-visible:outline-none focus-visible:ring focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-700">
              {/* If you have an image logo, place it here */}
              <div aria-hidden className="h-6 w-6 rounded-md bg-black dark:bg-white" />
              <span className="text-sm font-bold tracking-wide text-neutral-900 group-hover:opacity-90 dark:text-neutral-100">FeelFlick</span>
            </a>

            {/* Center: Primary nav */}
            <nav aria-label="Primary" className="flex items-center gap-1">
              <NavItem href="/" label="Home" icon={IconHome} />
              <NavItem href="/browse" label="Browse" icon={IconGrid} />
              <NavItem href="/search" label="Search" icon={IconSearch} />
            </nav>

            {/* Right: Account */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-3">
                  <a href="/account" className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-neutral-800 hover:bg-neutral-200/60 dark:text-neutral-100 dark:hover:bg-neutral-800/60">
                    <div className="h-7 w-7 overflow-hidden rounded-full ring-1 ring-neutral-300 dark:ring-neutral-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={user.avatarUrl || 'https://api.dicebear.com/9.x/identicon/svg?seed=user'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <span className="hidden sm:inline-block max-w-[160px] truncate">{user.name || 'Account'}</span>
                  </a>
                  {onSignOut && (
                    <button type="button" onClick={onSignOut} className="rounded-xl px-3 py-1.5 text-sm text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-200/70 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800/70">
                      Sign out
                    </button>
                  )}
                </div>
              ) : (
                <a href="/account" className="rounded-xl px-3 py-1.5 text-sm text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-200/70 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800/70">
                  Sign in
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Compact top bar for mobile (brand + search shortcut) */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800/80 dark:bg-neutral-950/70 md:hidden">
        <div className="mx-auto max-w-6xl px-3">
          <div className="flex h-12 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div aria-hidden className="h-5 w-5 rounded-md bg-black dark:bg-white" />
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">FeelFlick</span>
            </a>
            <a href="/search" aria-label="Search" className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-200/60 focus-visible:outline-none focus-visible:ring dark:text-neutral-200 dark:hover:bg-neutral-800/60">
              <IconSearch className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Bottom tab bar (mobile only) */}
      <nav aria-label="Bottom" className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200/80 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800/80 dark:bg-neutral-950/70 md:hidden">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-4">
            <NavItem href="/" label="Home" icon={IconHome} variant="mobile" />
            <NavItem href="/browse" label="Browse" icon={IconGrid} variant="mobile" />
            <NavItem href="/search" label="Search" icon={IconSearch} variant="mobile" />
            <NavItem href="/account" label="Account" icon={IconUser} variant="mobile" />
          </div>
        </div>
      </nav>
    </>
  )
}

// Notes:
// 1) If you already use a router (e.g., custom, Next.js, React Router), replace <a> with your Link.
// 2) Ensure your main content has an id="main" and bottom padding on mobile, e.g.:
//    <main id="main" className="pb-16 md:pb-0"> ... </main>  // to avoid tab bar overlap
// 3) Replace the square brand placeholder with your SVG/logo image.
// 4) If you have a theme toggle, you can slot it at the right side of the desktop header.
