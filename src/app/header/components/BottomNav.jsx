// src/app/header/components/BottomNav.jsx
// FeelFlick — Mobile bottom navigation.
// Five tabs: Browse · Discover · Home (hero) · DNA · Account.
// IA v2 (F2): /home (the Briefing) is the prime action — gradient core, conic ring,
// ambient bloom — centered so it's one thumb-tap. It carries the `hero` flag (moved
// off Discover, which is a *supporting* surface, not the product). The label matches
// the desktop header ("Home"). Active non-hero tab gets a 4px purple dot under the icon.
// See docs/ia-v2-decision-record.md.

import { Link, useLocation } from 'react-router-dom'
import { Clapperboard, LayoutGrid, Sparkles, Fingerprint, User } from 'lucide-react'

const ACTIVE_INK = 'var(--color-text-primary, #f3ecdf)'
const PILL_FILL = 'var(--color-action-primary-fill, #efe7d7)'
const PILL_TEXT = 'var(--color-action-primary-text, #221b13)'

// Exported as the mobile IA contract (asserted in __tests__/BottomNav.test.jsx):
// the `hero` tab must be the Briefing (/home, "Home"); Discover is a normal tab.
export const TABS = [
  { id: 'browse',   label: 'Browse',   path: '/browse',   match: ['/browse'],   Icon: LayoutGrid   },
  { id: 'discover', label: 'Discover', path: '/discover', match: ['/discover'], Icon: Sparkles      },
  { id: 'tonight',  label: 'Home',     path: '/home',     match: ['/home'],     Icon: Clapperboard, hero: true },
  { id: 'dna',      label: 'DNA',      path: '/profile',  match: ['/profile'],  Icon: Fingerprint  },
  { id: 'account',  label: 'Account',  path: '/account',  match: ['/account'],  Icon: User         },
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
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 pointer-events-none"
      style={{
        padding: '10px 16px calc(env(safe-area-inset-bottom, 12px) + 6px)',
        background:
          'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 50%, #000 100%)',
        backdropFilter: 'blur(28px) saturate(140%)',
        WebkitBackdropFilter: 'blur(28px) saturate(140%)',
      }}
    >
      <div
        className="relative grid grid-cols-5 items-end gap-0 rounded-[28px] pointer-events-auto"
        style={{
          padding: '10px 4px 8px',
          background: 'rgba(18,12,28,0.78)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 14px 32px -12px rgba(0,0,0,0.7)',
        }}
      >
        {TABS.map(t => {
          const on = activeId === t.id
          const Icon = t.Icon

          if (t.hero) {
            return (
              <Link
                key={t.id}
                to={t.path}
                aria-label={t.label}
                className="relative inline-flex flex-col items-center justify-end gap-[5px] p-0 cursor-pointer no-underline"
              >
                {/* Ambient bloom */}
                <span
                  aria-hidden
                  className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 999,
                    background: 'var(--color-action-primary-fill, #efe7d7)',
                    opacity: 0.18,
                    filter: 'blur(12px)',
                    animation: 'ff-bloom-pulse 3.4s ease-in-out infinite',
                  }}
                />
                {/* Conic ring around the core */}
                <span
                  aria-hidden
                  className="relative"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: 'var(--color-border-strong, #46423d)',
                    padding: 1.5,
                    animation: 'ff-bloom-pulse 6s ease-in-out infinite',
                  }}
                >
                  <span
                    className="flex items-center justify-center w-full h-full rounded-full"
                    style={{
                      background: PILL_FILL,
                      color: PILL_TEXT,
                      boxShadow:
                        '0 4px 12px -2px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                </span>
                <span
                  className="relative text-[10px] font-semibold"
                  style={{ fontFamily: '"Inter", sans-serif', color: ACTIVE_INK, letterSpacing: '-0.005em' }}
                >
                  {t.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={t.id}
              to={t.path}
              className="relative inline-flex flex-col items-center justify-end gap-[5px] px-1 no-underline transition-colors"
            >
              <span
                className="relative inline-flex items-center justify-center transition-colors"
                style={{
                  width: 32,
                  height: 32,
                  color: on ? '#FAFAFA' : 'rgba(250,250,250,0.45)',
                }}
              >
                <Icon className="w-[18px] h-[18px]" />
                {on && (
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 999,
                      background: ACTIVE_INK,
                      boxShadow: '0 0 6px rgba(243,236,223,0.55)',
                    }}
                  />
                )}
              </span>
              <span
                className="text-[10px]"
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: on ? 600 : 500,
                  color: on ? '#FAFAFA' : 'rgba(250,250,250,0.45)',
                  letterSpacing: '-0.005em',
                }}
              >
                {t.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* ff-bloom-pulse keyframe lives in src/styles/animations.css */}
    </div>
  )
}
