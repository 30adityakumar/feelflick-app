// src/legacy/header/MobileAccount.jsx
// FeelFlick — Mobile Account v2.
// Editorial Edition Nº header · gradient halo avatar with DNA peek ·
// Tonight's pick rail · grouped menu · brand footer.
// Pairs with BottomNav below.

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import {
  ChevronRight, User, Settings, Bookmark, Clock, LogOut,
  Users, ListVideo, Mail,
} from 'lucide-react'

import { computeUserProfile } from '@/shared/services/recommendations'
import { usePageMeta } from '@/shared/hooks/usePageMeta'

// BottomNav is rendered globally by AppShell — no need to mount it here.
// (The drop-in originally had `<BottomNav active="account" />` for standalone
// preview; removed to avoid double-stacked nav at /mobile-account.)

const AMBIENT_HEX = '#A78BFA'
const GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)'

// Mood-tag → hex map for the DNA peek's mood dot. Falls back to AMBIENT_HEX
// when a tag isn't in this list. Vocabulary matches the raw mood_tags the
// engine produces (not the 8 UI axes — those are bridged at scoring time).
const MOOD_TAG_HEX = {
  tense: '#EF4444', dark: '#EF4444', haunting: '#EF4444', unsettling: '#EF4444',
  tender: '#F472B6', romantic: '#F472B6', heartwarming: '#F472B6', warm: '#F472B6',
  bittersweet: '#FB7185', melancholic: '#FB7185', somber: '#FB7185', nostalgic: '#FB7185',
  cozy: '#FBBF24', lighthearted: '#FBBF24', playful: '#FBBF24', whimsical: '#FBBF24',
  cerebral: '#7DD3FC', mysterious: '#7DD3FC', 'thought-provoking': '#7DD3FC', complex: '#7DD3FC',
  contemplative: '#A78BFA', meditative: '#A78BFA', poetic: '#A78BFA',
  exhilarating: '#0EA5E9', grandiose: '#0EA5E9', surreal: '#0EA5E9', epic: '#0EA5E9',
  intense: '#34D399', thrilling: '#34D399', urgent: '#34D399',
}

const prettify = (tag) => String(tag || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function MobileAccount() {
  usePageMeta({ title: 'Account — FeelFlick' })
  const nav = useNavigate()
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  // Sign-out 2-stage confirm: first tap arms the action, second tap
  // (within 4s) actually signs out. Prevents single-tap misfires that
  // dump the user back to landing. iOS-style "tap again to confirm".
  const [signOutArmed, setSignOutArmed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      setUserLoading(false)
    })
  }, [])

  // Auto-disarm sign-out after 4s if user doesn't confirm.
  useEffect(() => {
    if (!signOutArmed) return
    const t = setTimeout(() => setSignOutArmed(false), 4000)
    return () => clearTimeout(t)
  }, [signOutArmed])

  // Compute real profile so the DNA peek shows actual data, not the
  // hardcoded "Slow-burn / Films that earn their silences" placeholder
  // every user used to see. Calibrating fallback when watch count < 5.
  useEffect(() => {
    if (!user?.id) return
    computeUserProfile(user.id).then(setProfile).catch(() => setProfile(null))
  }, [user?.id])

  const name     = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const email    = user?.email
  const avatar   = user?.user_metadata?.avatar_url || null
  // Array.from handles emoji + multi-byte first chars cleanly (a previous
  // `name?.[0]` would split a surrogate pair into `�`).
  const initial  = (Array.from(name || 'U')[0] || 'U').toUpperCase()

  // DNA peek — real data when available, calibrating state otherwise.
  // Mood tags come from moodSignature.recentMoodTags ({tag, weight}[])
  // for v2 profile shape, or affinity.mood_tags for v3.
  const dna = useMemo(() => {
    if (!profile) return null
    const watchCount = profile?.qualityProfile?.totalMoviesWatched
      ?? profile?.meta?.total_watches
      ?? 0
    const tagsArr = profile?.moodSignature?.recentMoodTags
      ?? profile?.affinity?.mood_tags
      ?? []
    const topTagRaw = Array.isArray(tagsArr) && tagsArr.length > 0
      ? (typeof tagsArr[0] === 'string' ? tagsArr[0] : (tagsArr[0]?.tag || tagsArr[0]?.name))
      : null
    return {
      watchCount,
      ready: watchCount >= 5 && !!topTagRaw,
      topTag: topTagRaw,
      topMoodLabel: topTagRaw ? prettify(topTagRaw) : null,
      topMoodHex: MOOD_TAG_HEX[String(topTagRaw || '').toLowerCase()] || AMBIENT_HEX,
    }
  }, [profile])

  async function handleSignOut() {
    // Two-stage: first tap arms, second commits. Disarm timer in effect above.
    if (!signOutArmed) {
      setSignOutArmed(true)
      return
    }
    await supabase.auth.signOut()
    nav('/', { replace: true })
  }

  // Taste Profile row dropped: the hero card's "See Cinematic DNA" button
  // already owns the entry point to /profile. Two CTAs to the same place
  // 100px apart was redundancy and visual maintenance cost — the prominent
  // button wins for brand prominence; the menu row stops repeating it.
  const sections = [
    {
      items: [
        // "Profile" was confusing on a page already labelled Account —
        // and the destination /account is account-settings, not the
        // public taste profile (which lives at /profile, behind the
        // hero "See Cinematic DNA" button).
        { icon: User,     label: 'Account settings', sub: 'Name and photo',           path: '/account'     },
        { icon: Users,    label: 'People',           sub: 'Find & follow cinephiles', path: '/people'      },
        { icon: Settings, label: 'Preferences',      sub: 'Tune the engine',          path: '/preferences' },
      ],
    },
    {
      title: 'Library',
      items: [
        { icon: Bookmark,  label: 'Watchlist', sub: 'Saved films',           path: '/watchlist' },
        { icon: Clock,     label: 'History',   sub: "What you've watched",   path: '/history'   },
        { icon: ListVideo, label: 'Lists',     sub: 'Your film collections', path: '/lists'     },
      ],
    },
    {
      title: 'Support',
      items: [
        // Help & FAQ removed — no /help route exists, would 404. Re-add
        // alongside a real /help page.
        { icon: Mail, label: 'Send feedback', sub: 'hello@feelflick.com', href: 'mailto:hello@feelflick.com?subject=Feelflick%20feedback' },
      ],
    },
  ]

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{
        paddingTop: 'var(--hdr-h, 56px)',
        // AppShell already adds pb-28 to clear BottomNav on mobile; we don't
        // need to double-count it here. Just respect the iOS safe-area inset
        // so content doesn't tuck under the gesture bar on notched devices.
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >

      {/* ── Header strip ───────────────────────────────────────── */}
      {/* "Account · Edition Nº NNN" eyebrow removed — it added editorial
         framing but no functional value, and on a leaf page the magazine
         masthead pattern doesn't earn the space. Ambient gradient kept
         since it gives the hero card a subtle backdrop. */}
      <div className="relative px-5 pt-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ background: `radial-gradient(ellipse 110% 70% at 50% 0%, ${AMBIENT_HEX}1c, transparent 65%)` }}
        />

        {/* ── Identity hero card with DNA peek ─────────────────── */}
        <div
          className="relative rounded-2xl border border-white/8 px-5 py-5 mb-4 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <div
            aria-hidden
            className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${AMBIENT_HEX}33, transparent 70%)`,
              filter: 'blur(20px)',
            }}
          />

          <div className="relative flex items-center gap-3.5">
            {/* Avatar with conic ring — pulse skeleton while user resolves */}
            <div className="relative w-[60px] h-[60px] flex-none">
              <div
                className="absolute -inset-[3px] rounded-full"
                style={{
                  background: `conic-gradient(${AMBIENT_HEX}, #ec4899, ${AMBIENT_HEX})`,
                  opacity: 0.8,
                  animation: 'ff-bloom-pulse 5s ease-in-out infinite',
                }}
              />
              <div className="relative w-[60px] h-[60px] rounded-full p-[3px]" style={{ background: '#06060a' }}>
                {userLoading ? (
                  <div className="w-full h-full rounded-full bg-white/10 animate-pulse" />
                ) : avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-[22px] font-semibold text-white"
                    style={{ background: GRAD, fontFamily: '"Outfit", sans-serif' }}
                  >
                    {initial}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {userLoading ? (
                <>
                  <div className="h-[19px] w-32 rounded bg-white/10 animate-pulse" />
                  <div className="mt-2 h-[12px] w-44 rounded bg-white/8 animate-pulse" />
                </>
              ) : (
                <>
                  <div
                    className="text-[19px] font-medium leading-tight truncate"
                    style={{ fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.018em' }}
                  >
                    {name}
                  </div>
                  {email && <div className="text-xs text-white/40 mt-0.5 truncate">{email}</div>}
                </>
              )}
            </div>
          </div>

          {/* DNA peek — real data when we have it, calibrating state when
             not. The hardcoded "Slow-burn / Films that earn their silences"
             placeholder for every user is gone; that fake personalization
             actively damaged the "films that know you" brand promise.
             Signature line dropped entirely — it was the most egregious
             fake. The mood dot + label come from moodSignature.recentMoodTags
             once the user has >= 5 watches; below that, a calibrating row. */}
          <div className="mt-4 pt-4 border-t border-white/8">
            {dna?.ready ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="text-[8.5px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.18em', color: 'rgba(250,250,250,0.28)', fontFamily: '"Outfit", sans-serif' }}>
                    Top mood
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <span
                      className="w-[7px] h-[7px] rounded-full"
                      style={{ background: dna.topMoodHex, boxShadow: `0 0 6px ${dna.topMoodHex}` }}
                    />
                    <span className="text-sm font-medium" style={{ fontFamily: '"Outfit", sans-serif' }}>
                      {dna.topMoodLabel}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[8.5px] font-bold uppercase mb-1.5" style={{ letterSpacing: '0.18em', color: 'rgba(250,250,250,0.28)', fontFamily: '"Outfit", sans-serif' }}>
                    Logged
                  </div>
                  <div className="text-sm font-medium" style={{ fontFamily: '"Outfit", sans-serif' }}>
                    {dna.watchCount} film{dna.watchCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span
                  className="w-[7px] h-[7px] rounded-full"
                  style={{ background: AMBIENT_HEX, boxShadow: `0 0 6px ${AMBIENT_HEX}`, opacity: 0.6, animation: 'ff-bloom-pulse 2.6s ease-in-out infinite' }}
                />
                <span className="text-[13px] text-white/55" style={{ fontFamily: '"Outfit", sans-serif', fontStyle: 'italic' }}>
                  {dna ? `Calibrating — ${5 - (dna.watchCount || 0)} more films to read your taste.` : 'Calibrating…'}
                </span>
              </div>
            )}
          </div>

          <Link
            to="/profile"
            className="mt-4 flex items-center justify-center gap-1.5 w-full px-3.5 py-2.5 rounded-full text-xs font-semibold text-white/90 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.14)',
              fontFamily: '"Outfit", sans-serif',
              letterSpacing: '-0.005em',
            }}
          >
            See Cinematic DNA <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Tonight's pick rail removed — was 45 lines of dead code that
           promised a feature we don't deliver yet (constant `tonight = null`
           meant the conditional never rendered). Re-add when wired to a
           real /discover hero pick query. */}
      </div>

      {/* ── Menu rows ──────────────────────────────────────────── */}
      <div className="px-5 flex flex-col gap-[18px]">
        {sections.map((section, i) => (
          <Group key={i} title={section.title} items={section.items} onNav={nav} />
        ))}
        <Group items={[{
          icon: LogOut,
          label: signOutArmed ? 'Tap again to sign out' : 'Sign out',
          sub: signOutArmed ? 'Or wait — this cancels in a few seconds.' : null,
          danger: true,
          onClick: handleSignOut,
        }]} onNav={nav} />
      </div>

      {/* Footer (FEELFLICK wordmark + tagline) removed — decorative
         redundancy on a leaf page. The brand identity is already
         established by the top header on every screen. */}

      {/* ff-bloom-pulse keyframe lives in src/styles/animations.css
         (was duplicated here and in BottomNav.jsx). */}
    </div>
  )
}

function Group({ title, items, onNav }) {
  return (
    <div>
      {title && (
        <div
          className="text-[9.5px] font-bold uppercase mb-2.5 pl-1.5"
          style={{ letterSpacing: '0.22em', color: 'rgba(250,250,250,0.45)', fontFamily: '"Outfit", sans-serif' }}
        >
          {title}
        </div>
      )}
      <div
        className="rounded-[14px] border border-white/8 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        {items.map((it, i) => {
          const Icon = it.icon
          const isFirst = i === 0
          const rowClass = `flex items-center gap-3.5 w-full px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] ${
            isFirst ? '' : 'border-t border-white/[0.06]'
          }`
          const bubble = (
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-none"
              style={{
                background: it.danger ? 'rgba(239,68,68,0.08)' : 'rgba(167,139,250,0.08)',
                border: `1px solid ${it.danger ? 'rgba(239,68,68,0.16)' : 'rgba(167,139,250,0.18)'}`,
                color: it.danger ? '#f87171' : AMBIENT_HEX,
              }}
            >
              <Icon className="w-4 h-4" />
            </div>
          )
          const labels = (
            <div className="flex-1 min-w-0">
              <div
                className="text-[14.5px] font-medium"
                style={{
                  fontFamily: '"Outfit", sans-serif',
                  letterSpacing: '-0.005em',
                  color: it.danger ? '#f87171' : 'rgba(250,250,250,0.92)',
                }}
              >
                {it.label}
              </div>
              {it.sub && <div className="text-[11.5px] text-white/45 mt-0.5">{it.sub}</div>}
            </div>
          )

          if (it.href?.startsWith('mailto:')) {
            return (
              <a key={it.label} href={it.href} target="_blank" rel="noopener noreferrer" className={rowClass}>
                {bubble}
                {labels}
                <ChevronRight className="w-3.5 h-3.5 text-white/28 flex-none" />
              </a>
            )
          }

          if (it.onClick) {
            return (
              <button key={it.label} type="button" onClick={it.onClick} className={rowClass}>
                {bubble}
                {labels}
              </button>
            )
          }

          return (
            <button key={it.label} type="button" onClick={() => onNav(it.path)} className={rowClass}>
              {bubble}
              {labels}
              <ChevronRight className="w-3.5 h-3.5 text-white/28 flex-none" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
