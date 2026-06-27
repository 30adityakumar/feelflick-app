// src/app/header/components/BottomNav.jsx
// FeelFlick — Mobile bottom navigation.
// Five EQUAL tabs (no hero): Home · Browse · Discover · DNA · Account.
// A flat, full-width dock (top hairline on solid ink) — not a floating glass capsule.
// The active tab gets a coral top-line + a quiet neutral field + paper-white icon/label
// + aria-current; redundant non-colour cues (incl. a forced-colors outline in BottomNav.css
// so the active tab stays distinct when colour is flattened). Order matches the desktop header.
// Supersedes the prior hero-tab IA in docs/ia-v2-decision-record.md (no hero; five equal tabs).

import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Compass, Fingerprint, User } from 'lucide-react'

import './BottomNav.css'

// Exported as the mobile IA contract (asserted in __tests__/BottomNav.test.js):
// five equal destinations in this order; DNA → /profile (Cinematic DNA), Account → /account.
export const TABS = [
  { id: 'home',     label: 'Home',     path: '/home',     match: ['/home'],     Icon: Home       },
  { id: 'browse',   label: 'Browse',   path: '/browse',   match: ['/browse'],   Icon: LayoutGrid },
  { id: 'discover', label: 'Discover', path: '/discover', match: ['/discover'], Icon: Compass    },
  { id: 'dna',      label: 'DNA',      path: '/profile',  match: ['/profile'],  Icon: Fingerprint},
  { id: 'account',  label: 'Account',  path: '/account',  match: ['/account'],  Icon: User       },
]

/**
 * @param {{ active?: string }} props — optional override; otherwise derives from location.
 *   When the current route isn't owned by any tab (e.g. /watchlist, /history,
 *   /people, /lists, /preferences, /movie/:id) activeId stays null — no tab
 *   lights up, which is more honest than misleadingly highlighting Home.
 */
export default function BottomNav({ active }) {
  const location = useLocation()
  const activeId =
    active ??
    TABS.find(t => (t.match || [t.path]).some(p => location.pathname.startsWith(p)))?.id ??
    null

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30"
      aria-label="Primary"
      style={{
        borderTop: '1px solid var(--color-border-subtle, #3a3d41)',
        background: 'var(--color-canvas, #0f1010)',
        padding: '8px 8px calc(env(safe-area-inset-bottom, 0px) + 10px)',
        boxShadow: '0 -18px 42px rgba(0,0,0,0.34)',
      }}
    >
      {/* Height kept ~the prototype's 64px row → dock ≈ 82px + safe-area, matching the
          BottomNav clearance the feature CSS already reserves (~85px). */}
      <ul className="grid grid-cols-5 items-stretch list-none m-0 p-0" style={{ height: 64 }}>
        {TABS.map(t => {
          const on = activeId === t.id
          const Icon = t.Icon
          return (
            <li key={t.id} className="flex">
              <Link
                to={t.path}
                aria-current={on ? 'page' : undefined}
                className="ff-bnav-tab relative flex w-full min-h-[56px] flex-col items-center justify-center gap-1 rounded-[10px] no-underline transition-colors duration-150 focus-visible:[outline:2px_solid_var(--color-focus,#f5f2eb)] focus-visible:[outline-offset:-3px]"
                style={{
                  color: on ? 'var(--color-text-primary, #f5f2eb)' : 'var(--color-text-muted, #a5a198)',
                  background: on ? 'rgba(46,49,53,0.52)' : 'transparent', // surface-raised tint
                }}
              >
                {/* Active marker — coral top-line above the tab (redundant with field + ink +
                    aria-current). Sits in the dock's 8px top padding; the nav→ul→li→Link chain
                    must stay unclipped (no overflow:hidden) for it to show. */}
                {on && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      top: -8,
                      width: 24,
                      height: 2,
                      borderRadius: 999,
                      background: 'var(--color-brand-accent, #e5636f)',
                      boxShadow: '0 0 10px rgba(229,99,111,0.3)',
                    }}
                  />
                )}
                <Icon className="w-[21px] h-[21px]" strokeWidth={1.8} aria-hidden="true" />
                <span
                  className="text-[10px]"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: on ? 600 : 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
