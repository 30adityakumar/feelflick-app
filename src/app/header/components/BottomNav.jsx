// src/app/header/components/BottomNav.jsx
// FeelFlick — Mobile bottom navigation.
// Five tabs: Home · Browse · Discover (hero) · DNA · Account.
// Discover is the prime action — gradient core, conic ring, ambient bloom.
// Active tab gets a 4px purple dot under the icon (no competing pill background).

import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Sparkles, Fingerprint, User } from 'lucide-react'

const AMBIENT_HEX = '#A78BFA'
const PINK = '#EC4899'
const GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'

const TABS = [
  { id: 'home',     label: 'Home',     path: '/home',     match: ['/home'],     Icon: Home         },
  { id: 'browse',   label: 'Browse',   path: '/browse',   match: ['/browse'],   Icon: LayoutGrid   },
  { id: 'discover', label: 'Discover', path: '/discover', match: ['/discover'], Icon: Sparkles, hero: true },
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
                    background: `radial-gradient(circle, ${PINK}88, ${AMBIENT_HEX}44 50%, transparent 75%)`,
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
                    background: `conic-gradient(${AMBIENT_HEX}, ${PINK}, #fbcfe8, ${PINK}, ${AMBIENT_HEX})`,
                    padding: 1.5,
                    animation: 'ff-bloom-pulse 6s ease-in-out infinite',
                  }}
                >
                  <span
                    className="flex items-center justify-center w-full h-full rounded-full text-white"
                    style={{
                      background: GRAD,
                      boxShadow:
                        '0 4px 12px -2px rgba(236,72,153,0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                </span>
                <span
                  className="relative text-[10px] font-semibold text-white"
                  style={{ fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.005em' }}
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
                      background: AMBIENT_HEX,
                      boxShadow: `0 0 6px ${AMBIENT_HEX}`,
                    }}
                  />
                )}
              </span>
              <span
                className="text-[10px]"
                style={{
                  fontFamily: '"Outfit", sans-serif',
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
