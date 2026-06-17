// Home — bottom sections, wired to useHomeData.
// All hardcoded RECENT / CONTINUE / DNA / FRIENDS / LISTS imports gone.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import Eyebrow from '@/shared/ui/Eyebrow'
import { HP, ROSE_DEEP } from './data'
import { SmartImg } from './atoms'
import { ROSE } from './WhyThisPick'
import { useHomeData } from './useHomeData'
import { tmdbImg } from '@/shared/api/tmdb'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { logSurfaceImpressions } from '@/shared/services/recommendations'

// Stage 2 — Thoughtful Seatmate: the bottom sections speak the consolidated system
// (one Inter voice, projection-ivory hierarchy, graphite keylines) via the scoped
// --ts-* tokens, with literal fallbacks for out-of-.ts-root rendering. Mirrors
// sections-top. ROSE stays imported for the non-rendered components + the single
// bounded large editorial closer em (AA as large text); rendered kickers are ivory.
const EDITORIAL = 'Inter, system-ui, sans-serif'
const IVORY = 'var(--ts-text-primary, #f3ecdf)'
const IVORY_META = 'var(--ts-text-muted, #8d887f)'
const WARM_KEYLINE = 'var(--ts-border-strong, #46423d)'

// `accent` colours the kicker eyebrow + its rule. Defaults to undefined → the
// Eyebrow's own default (the rendered /home sections pass ivory — rose fails AA on
// the depth canvas as small text; the not-yet-rendered sections keep their default
// until their own migration).
const Heading = ({ kicker, title, sub, accent }) => (
  <header style={{ marginBottom: 36 }}>
    <Eyebrow rule color={accent} size={10} spacing="0.24em" style={{ marginBottom: 14 }}>{kicker}</Eyebrow>
    <h2 style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ts-text-primary, #f3ecdf)', margin: 0, textWrap: 'balance' }}>{title}</h2>
    {sub && <p style={{ marginTop: 14, fontSize: 14, color: 'var(--ts-text-muted, #8d887f)', maxWidth: 540, fontFamily: 'Inter, sans-serif', textWrap: 'pretty' }}>{sub}</p>}
  </header>
)

export function ContinueWatching({ onResume }) {
  const { continueItem } = useHomeData()
  // Hidden when no resume source — better than fabricating a card. The
  // recommendation pipeline doesn't yet write resume progress anywhere, so
  // there's nothing meaningful to display.
  if (!continueItem) return null
  const f = continueItem.film
  return (
    <section className="border-t px-5 py-10 sm:px-8 sm:py-12 lg:px-[88px] lg:py-[56px]" style={{ borderColor: HP.border }}>
      <Heading kicker="In Progress" title="Pick up where you paused." />
      <button
        type="button"
        onClick={() => onResume?.(f)}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = ROSE + '66'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = HP.border}
        style={{
          display: 'flex', gap: 24, padding: 20, border: `1px solid ${HP.border}`, borderRadius: 6,
          background: 'rgba(255,255,255,0.012)', maxWidth: 720, cursor: 'pointer',
          transition: 'border-color 0.3s ease', textAlign: 'left', width: '100%', fontFamily: 'inherit', color: 'inherit',
        }}
      >
        <SmartImg film={f} sizes="84px" style={{ width: 84, height: 126, objectFit: 'cover', borderRadius: 4, flex: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 19, fontWeight: 500, color: HP.text, letterSpacing: '-0.015em' }}>{f.title}</div>
            <div style={{ fontSize: 12, color: HP.textMuted, marginTop: 4, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>{continueItem.timeLeft} · last watched {continueItem.lastWatched}</div>
          </div>
          <div>
            <div style={{ height: 2, background: HP.border, borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${continueItem.progress * 100}%`, background: ROSE, borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 10, color: HP.textFaint, fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{Math.round(continueItem.progress * 100)}% watched</div>
          </div>
        </div>
        <span style={{ alignSelf: 'center', padding: '10px 18px', borderRadius: 4, background: ROSE_DEEP, color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: '0.04em' }}>Resume &rarr;</span>
      </button>
    </section>
  )
}

// Cinematic DNA — editorial taste portrait (audit pass-17).
//
// Reframed from a 4-quadrant stats dashboard (Confidence / Motifs /
// Moods / Runtime) into an editorial profile:
//   • LEFT  — motifs (top tone tags) as display-type stacked words.
//             "Earnest. / Warm. / Sentimental." like a magazine pull-quote.
//   • RIGHT — mood weights as elegant horizontal bars (top 3 only).
//   • FOOTER — small grace-note stats line (films · runtime · confidence).
// Falls back to copy-only empty states when fingerprint hasn't computed yet
// (< 5 logged films).
function DNAKicker({ children }) {
  return (
    <div style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Inter, sans-serif', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 22, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span aria-hidden style={{ height: 1, width: 18, background: ROSE, opacity: 0.6 }} />
      {children}
    </div>
  )
}

function MoodWeightRow({ label, weight }) {
  const pct = Math.round(weight * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: HP.text, letterSpacing: '-0.005em' }}>{label}</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: HP.textMuted, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${ROSE}, ${HP.pink})`,
            borderRadius: 999,
            transition: 'width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}

function DNAStat({ value, label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 200, color: HP.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontSize: 11, color: HP.textMuted, fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

export function CinematicDNA() {
  const { dna } = useHomeData()
  if (!dna) return null

  const { motifs, topMoods, runtime, progress, filmsLogged, filmsToNext } = dna
  const confidence = Math.round(progress * 100)
  const hasRealMotifs = motifs.length > 0 && motifs[0] !== 'Patterns forming…'
  const hasMoods = topMoods && topMoods.length > 0
  // Top 3 moods — tighter than 4, balances the column visually with the
  // motifs display type beside it. Fingerprint still stores up to 12; we
  // surface only the strongest signals on /home.
  const topMoodRows = hasMoods ? topMoods.slice(0, 3) : []

  return (
    <section className="border-t px-5 py-14 sm:px-8 sm:py-16 lg:px-[88px] lg:py-[80px]" style={{ borderColor: HP.border, background: 'rgba(255,255,255,0.008)' }}>
      <Heading
        kicker="Cinematic DNA"
        title="Your taste, taking shape."
        sub={filmsToNext > 0
          ? `A portrait of what you’re drawn to. ${filmsToNext} more films and your DNA tunes further.`
          : 'A portrait of what you’re drawn to.'}
      />

      <div className="grid grid-cols-1 gap-12 sm:gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        {/* LEFT — Motifs as editorial display type */}
        <div>
          <DNAKicker>{hasRealMotifs ? 'Motifs' : 'Motifs forming'}</DNAKicker>
          {hasRealMotifs ? (
            <div className="flex flex-col gap-0.5">
              {motifs.map((m, i) => (
                <span
                  key={m}
                  style={{
                    fontFamily: 'var(--font-editorial)',
                    fontSize: 'clamp(36px, 5vw, 56px)',
                    lineHeight: 1.02,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    letterSpacing: '-0.035em',
                    color: i === 0 ? HP.text : 'rgba(255,255,255,0.78)',
                    opacity: i === 0 ? 1 : 0.92,
                  }}
                >
                  {m}.
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.5, color: HP.textMuted, fontStyle: 'italic', margin: 0, maxWidth: 380 }}>
              Rate a few more films and tone patterns will start to surface here.
            </p>
          )}
        </div>

        {/* RIGHT — Mood weights as horizontal bars */}
        <div>
          <DNAKicker>Moods you return to</DNAKicker>
          {hasMoods ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {topMoodRows.map(m => (
                <MoodWeightRow key={m.label} label={m.label} weight={m.weight} />
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.5, color: HP.textMuted, fontStyle: 'italic', margin: 0, maxWidth: 380 }}>
              Log a few more films and your mood signature comes into focus.
            </p>
          )}
        </div>
      </div>

      {/* FOOTER — grace-note stats line (films · runtime · confidence) */}
      <div
        className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t pt-7 lg:mt-16 lg:justify-start lg:pt-8"
        style={{ borderColor: HP.border }}
      >
        <DNAStat value={filmsLogged} label={`film${filmsLogged === 1 ? '' : 's'} logged`} />
        <span aria-hidden style={{ width: 1, height: 14, background: HP.borderStrong, opacity: 0.6 }} />
        <DNAStat
          value={runtime.value}
          label={`${runtime.unit}${runtime.note ? ` · ${runtime.note}` : ''}`}
        />
        <span aria-hidden style={{ width: 1, height: 14, background: HP.borderStrong, opacity: 0.6 }} />
        <DNAStat value={`${confidence}%`} label="taste confidence" />
      </div>
    </section>
  )
}

export function TasteMatch({ onOpenFriend }) {
  const { friends } = useHomeData()
  if (friends.length === 0) return null
  return (
    <section className="border-t px-5 py-12 sm:px-8 sm:py-14 lg:px-[88px] lg:py-[72px]" style={{ borderColor: HP.border, background: 'rgba(255,255,255,0.008)' }}>
      <Heading kicker="Your taste twins" title="People who see what you see." sub="Watchers whose taste fingerprint overlaps with yours — sorted by match. Tap any twin to open their profile." />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {friends.map(fr => (
          <button
            key={fr.userId}
            type="button"
            onClick={() => onOpenFriend?.(fr.userId)}
            style={{
              padding: 28, border: `1px solid ${HP.border}`, borderRadius: 6, background: 'rgba(255,255,255,0.02)',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: fr.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0510', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 16 }}>{fr.name.charAt(0).toUpperCase()}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 38, fontWeight: 200, color: HP.text, lineHeight: 1, letterSpacing: '-0.04em' }}>{fr.match}<span style={{ fontSize: 14, color: HP.textMuted, marginLeft: 2 }}>%</span></div>
                <div style={{ fontSize: 9, color: HP.textMuted, fontFamily: 'Inter, sans-serif', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>match</div>
              </div>
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 500, color: HP.text, marginBottom: 4 }}>{fr.name}</div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: HP.textSoft, fontFamily: 'var(--font-editorial)', fontStyle: 'italic', margin: 0, textWrap: 'pretty' }}>&ldquo;{fr.overlap}.&rdquo;</p>
            {fr.last && fr.last !== '—' && (
              <div style={{ marginTop: 14, fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: HP.textMuted, fontFamily: 'Inter, sans-serif' }}>
                Last · <span style={{ color: HP.textSoft, textTransform: 'none', letterSpacing: '0.02em', fontStyle: 'italic', fontWeight: 400 }}>{fr.last}</span>
                {fr.lastWhen && <span style={{ color: HP.textFaint }}> · {fr.lastWhen}</span>}
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

// Single list card — mirrors the /lists page card aesthetic so a list
// looks the same whether you encounter it on the home rail or the lists
// hub. Palette gradient base, 3 posters fanned edge-to-edge across the
// top half, bottom gradient veil tinted to the palette's c2 so the
// title block is legible without darkening the whole card to black.
function ListCard({ list, onClick }) {
  const [hover, setHover] = useState(false)
  const [c1, c2] = list.palette
  const posters = (list.posters || []).slice(0, 3)
  const hasPosters = posters.length > 0
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer', background: 'transparent', border: 'none', padding: 0,
        textAlign: 'left', fontFamily: 'inherit', color: 'inherit', width: '100%',
        transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '4/5',
          borderRadius: 8,
          overflow: 'hidden',
          background: `linear-gradient(155deg, ${c1}, ${c2})`,
          boxShadow: hover
            ? `0 24px 60px -16px rgba(0,0,0,0.7), 0 0 36px ${c1}33`
            : `0 18px 40px -14px rgba(0,0,0,0.6), 0 0 32px ${c1}22`,
          transition: 'box-shadow 0.35s ease',
        }}
      >
        {/* Poster strip — three real posters fanned across the top 62%
            of the card. Falls through to the gradient when posters are
            empty (cold-start curated config / list with no items yet). */}
        {hasPosters && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '62%', display: 'flex', gap: 0 }}>
            {posters.map((path, i) => (
              <img
                key={i}
                src={tmdbImg(path, 'w185')}
                alt=""
                loading="lazy"
                style={{
                  flex: 1,
                  width: 0,
                  height: '100%',
                  objectFit: 'cover',
                  filter: i === 0 ? 'none' : `brightness(${0.92 - i * 0.06}) saturate(0.9)`,
                }}
              />
            ))}
          </div>
        )}
        {/* Bottom gradient veil — tinted by c2 so the title sits on the
            palette instead of a generic black slab. */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: hasPosters
          ? `linear-gradient(180deg, transparent 28%, ${c2}aa 55%, ${c2}f5 75%, ${c2})`
          : `linear-gradient(180deg, transparent 30%, ${c2}cc 75%, ${c2})`
        }} />
        {/* Title block — title + italic blurb live inside the card on the
            bottom-left; chevron sits flush to the right edge and animates
            on hover the same way the /lists card hint does. */}
        <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, zIndex: 5 }}>
          <div style={{ flex: 1, transform: hover ? 'translateY(-2px)' : 'translateY(0)', transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, lineHeight: 1.1, fontWeight: 500, color: '#fff', letterSpacing: '-0.02em', margin: 0, textWrap: 'balance', textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>{list.title}</h3>
            {list.blurb && (
              <p style={{ margin: '8px 0 0 0', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter, sans-serif', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{list.blurb}</p>
            )}
          </div>
          <ChevronRight
            className="h-4 w-4 flex-none"
            style={{
              color: hover ? '#fff' : 'rgba(255,255,255,0.75)',
              transform: hover ? 'translate(3px, -2px)' : 'translate(0, 0)',
              transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), color 0.2s ease',
              marginBottom: 4,
            }}
            aria-hidden
          />
        </div>
      </div>
    </button>
  )
}

// TasteTwinPulse — what films your algorithmically-similar users (taste
// twins) have logged in the past few weeks. Earns its space ONLY when
// there's real twin signal; hides cleanly otherwise. Pure read of
// `useHomeData.twinPulse`.
export function TasteTwinPulse({ onWatch }) {
  const { twinPulse } = useHomeData()
  const { user } = useAuthSession()
  // Log impressions once the row materializes — twins are a social surface,
  // 'trending' is the closest existing placement enum value ("what's moving
  // in your circle"). Per-day-deduped by the table's unique key, so a same-
  // day reload doesn't double-count.
  const twinIds = (twinPulse || []).map(f => f.id).join(',')
  useEffect(() => {
    if (!user?.id || !twinPulse || twinPulse.length === 0) return
    logSurfaceImpressions({
      userId: user.id,
      films: twinPulse,
      placement: 'trending',
      pickReasonType: 'twin_pulse',
      pickReasonLabel: 'Twins watched',
    })
  }, [user?.id, twinIds, twinPulse])
  if (!twinPulse || twinPulse.length === 0) return null
  return (
    <section className="border-t px-5 py-12 sm:px-8 sm:py-14 lg:px-[88px] lg:py-[72px]" style={{ borderColor: HP.border, background: 'rgba(255,255,255,0.008)' }}>
      <Heading
        kicker="Taste-twin pulse"
        title="What your twins are watching."
        sub="Films logged in the past few weeks by the watchers above — engine-ranked for you."
      />
      {/* Horizontal scroll — same pattern as the Feed-the-Engine row. */}
      <div
        className="-mx-5 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden sm:-mx-8 lg:mx-[-88px]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-4 px-5 sm:gap-5 sm:px-8 lg:gap-6 lg:px-[88px]">
          {twinPulse.map(film => (
            <button
              key={film.id}
              type="button"
              onClick={() => onWatch?.({ tmdbId: film.tmdb_id, id: film.id, title: film.title })}
              className="w-[140px] flex-none sm:w-[170px] lg:w-[200px]"
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit' }}
            >
              <div style={{
                position: 'relative', aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden',
                background: 'rgba(255,255,255,0.04)', marginBottom: 10,
                boxShadow: '0 12px 32px -16px rgba(0,0,0,0.6)',
              }}>
                {film.poster_path ? (
                  <img
                    src={tmdbImg(film.poster_path, 'w342')}
                    alt={film.title}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <SmartImg film={{ id: film.id, title: film.title, year: film.release_year, poster: null }} style={{ width: '100%', height: '100%' }} />
                )}
                {/* Twin-count badge — top-right corner. Reads "N watched". */}
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '4px 8px', borderRadius: 999,
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                  fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, color: HP.text,
                  letterSpacing: '0.06em',
                }}>
                  {film.twinCount} watched
                </div>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: HP.text, lineHeight: 1.25, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{film.title}</div>
              <div style={{ fontSize: 10, color: HP.textMuted, fontFamily: 'Inter, sans-serif', marginTop: 3, letterSpacing: '0.06em' }}>
                {film.release_year || ''}{film.primary_genre ? ` · ${film.primary_genre}` : ''}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CuratedLists({ onOpenList }) {
  const { lists } = useHomeData()
  // Mobile carousel: track which card is centered so we can light the
  // matching dot indicator. sm+ uses a grid so this state is inert there.
  const scrollerRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const handleScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || lists.length === 0) return
    // Each card slot is the scroller width minus gap-padding, divided by
    // visible-card-count. We approximate by using scrollWidth / count which
    // is accurate enough for a 4-card row to map scrollLeft → active idx.
    const slot = el.scrollWidth / lists.length
    const idx = Math.round(el.scrollLeft / slot)
    setActiveIdx(Math.max(0, Math.min(idx, lists.length - 1)))
  }, [lists.length])
  // Reset to first card when the lists themselves change (e.g. mood switch
  // produced a fresh personal-lists set). Avoids the dots showing idx 3
  // while the new row's been scrolled back to start.
  useEffect(() => { setActiveIdx(0) }, [lists])
  if (lists.length === 0) return null
  // Personal lists set `kind` to director/similar/genre/decade.
  // The cold-start fallback path marks every list with kind: 'curated'.
  const isCurated = lists.every(L => L.kind === 'curated' || L.kind === undefined)
  return (
    <section className="border-t px-5 py-12 sm:px-8 sm:py-14 lg:px-[88px] lg:py-[72px]" style={{ borderColor: HP.border }}>
      {/* Custom header — Heading + "View all" CTA on the right edge.
          Mobile stacks the CTA below the sub-copy, desktop pins it
          baseline-aligned with the section title. Copy adapts depending on
          whether the row is personal (default for engaged users) or the
          static curated fallback (cold-start path). */}
      <header
        className="mb-9 flex flex-col gap-3 sm:mb-10 lg:mb-12 lg:flex-row lg:items-end lg:justify-between lg:gap-8"
      >
        <div>
          <Eyebrow rule size={10} spacing="0.24em" style={{ marginBottom: 14 }}>{isCurated ? 'Lists' : 'For you'}</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.0, fontWeight: 400, letterSpacing: '-0.035em', color: HP.text, margin: 0, textWrap: 'balance' }}>
            {isCurated ? 'Curated edits.' : 'Lists, hand-cut for you.'}
          </h2>
          <p style={{ marginTop: 14, fontSize: 14, color: HP.textMuted, maxWidth: 540, fontFamily: 'Inter, sans-serif', textWrap: 'pretty' }}>
            {isCurated
              ? 'Hand-built collections, not algorithmic dumps.'
              : 'Pulled from your watch history. Click any list to dig in.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenList?.()}
          className="group inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/4 px-4 py-2 text-xs font-medium text-white/80 transition-all duration-200 hover:border-white/25 hover:bg-white/8 hover:text-white active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/40 lg:self-end"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}
        >
          View all
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </button>
      </header>
      {/* Below sm: horizontal snap carousel. Cards are ~78% viewport wide so
          the next card peeks ~22% — a clear "swipe me" affordance without
          relying on dots alone. The negative -mx-5 + matching px-5 lets the
          first card sit flush with the section's content edge while the
          scroll surface bleeds to the screen edge (so the peek isn't cut
          off by the section padding). sm+ reverts to the original grid. */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
      >
        {lists.map(L => (
          <div key={L.id} className="w-[78%] flex-none snap-start sm:w-auto">
            <ListCard list={L} onClick={() => onOpenList?.(L.slug, L)} />
          </div>
        ))}
      </div>
      {/* Dots — mobile only. Active dot widens + tints purple; rest stay
          small + white-faint. Decorative — keyboard users get native
          horizontal-scroll affordance from the scroller itself. */}
      <div className="mt-5 flex justify-center gap-1.5 sm:hidden" aria-hidden>
        {lists.map((_, i) => (
          <span
            key={i}
            style={{
              height: 6,
              width: i === activeIdx ? 20 : 6,
              borderRadius: 999,
              background: i === activeIdx ? ROSE : 'rgba(255,255,255,0.18)',
              transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />
        ))}
      </div>
    </section>
  )
}

// One tile in the quick-log grid. Click anywhere on the tile = mark
// watched. After click, the tile shows a brief confirmation state then
// the parent removes it from the row.
function SeenTile({ film, onConfirm }) {
  const [state, setState] = useState('idle') // idle | saving | saved | error
  const errorTimerRef = useRef(null)
  // Clear the error-reset timer on unmount so no setState fires after unmount.
  useEffect(() => () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current) }, [])
  const handleClick = async () => {
    if (state !== 'idle') return
    setState('saving')
    try {
      await onConfirm(film)
      setState('saved')
      // Parent removes the tile via local state after a short beat.
    } catch (err) {
      console.error('[SeenTile] confirm error:', err)
      setState('error')
      errorTimerRef.current = setTimeout(() => { setState('idle'); errorTimerRef.current = null }, 1800)
    }
  }
  return (
    <button
      type="button"
      aria-label={`Mark ${film.title} as watched`}
      aria-busy={state === 'saving'}
      aria-pressed={state === 'saved'}
      onClick={handleClick}
      disabled={state === 'saving' || state === 'saved'}
      className="rounded-lg focus-visible:ring-2 focus-visible:ring-white/40"
      style={{
        background: 'transparent', border: 'none', padding: 0, cursor: state === 'idle' ? 'pointer' : 'default',
        textAlign: 'left', fontFamily: 'inherit', color: 'inherit', width: '100%',
        opacity: state === 'saved' ? 0.45 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div style={{
        position: 'relative', aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)', marginBottom: 10,
        boxShadow: '0 12px 32px -16px rgba(0,0,0,0.6)',
      }}>
        {film.poster_path ? (
          <img
            src={tmdbImg(film.poster_path, 'w342')}
            alt={`${film.title} poster`}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <SmartImg film={{ id: film.id, title: film.title, year: film.release_year, poster: null }} style={{ width: '100%', height: '100%' }} />
        )}
        {/* Saved overlay — confirms the action visually before unmount */}
        {(state === 'saved' || state === 'saving') && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(8,6,14,0.72)', backdropFilter: 'blur(2px)',
            transition: 'opacity 0.2s ease',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: state === 'saved' ? 'rgba(34,197,94,0.92)' : 'rgba(255,255,255,0.18)',
              color: '#fff',
            }}>
              <Check aria-hidden="true" className="h-5 w-5" />
            </div>
          </div>
        )}
        {state === 'error' && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '6px 8px', background: 'rgba(239,68,68,0.85)',
            color: '#fff', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, textAlign: 'center',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            Try again
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: 'var(--ts-text-primary, #f3ecdf)', lineHeight: 1.25, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{film.title}</div>
      <div style={{ fontSize: 10, color: 'var(--ts-text-muted, #8d887f)', fontFamily: 'Inter, sans-serif', marginTop: 3, letterSpacing: '0.06em' }}>
        {film.release_year || ''}{film.primary_genre ? ` · ${film.primary_genre}` : ''}
      </div>
    </button>
  )
}

export function QuickLog({ onLog }) {
  const { seenCandidates } = useHomeData()
  const { user } = useAuthSession()
  // Local "logged-this-session" state — tiles tapped during this visit get
  // removed immediately. Next /home load picks up the change via the
  // watched_ids query, so this state is just for in-session continuity.
  const [confirmedIds, setConfirmedIds] = useState(() => new Set())
  // F4.6 — one QuickLog-owned polite live region announces log outcomes.
  const [statusMsg, setStatusMsg] = useState('')
  const announce = useCallback((msg) => setStatusMsg(msg), [])
  // Track the success-hold removal timers so none fire after unmount.
  const removeTimersRef = useRef(new Set())
  useEffect(() => {
    const timers = removeTimersRef.current
    return () => { timers.forEach(clearTimeout); timers.clear() }
  }, [])

  const handleConfirm = useCallback(async (film) => {
    if (!user?.id) throw new Error('not signed in')
    const { error } = await supabase.from('user_history').insert({
      user_id: user.id,
      movie_id: film.id,
      watched_at: new Date().toISOString(),
      source: 'home_quicklog',
      watch_duration_minutes: null,
      mood_session_id: null,
    })
    if (error) {
      announce(`Could not log ${film.title}. Try again.`)
      throw error
    }
    announce(`Logged ${film.title} as watched.`)
    // Remove after a 650ms beat so the user sees the saved checkmark.
    const t = setTimeout(() => {
      setConfirmedIds(prev => {
        const next = new Set(prev)
        next.add(film.id)
        return next
      })
      removeTimersRef.current.delete(t)
    }, 650)
    removeTimersRef.current.add(t)
  }, [user?.id, announce])

  const visible = useMemo(
    () => (seenCandidates || []).filter(f => !confirmedIds.has(f.id)),
    [seenCandidates, confirmedIds],
  )

  // Log impressions once when the candidate set materializes. These are
  // engine-guessed "you probably saw this" films — the learning loop NEEDS
  // to know which we surfaced (so a click→confirm vs no-click can be
  // attributed). 'quick_picks' is the matching placement enum value.
  const candidateIds = (seenCandidates || []).map(f => f.id).join(',')
  useEffect(() => {
    if (!user?.id || !seenCandidates || seenCandidates.length === 0) return
    logSurfaceImpressions({
      userId: user.id,
      films: seenCandidates,
      placement: 'quick_picks',
      pickReasonType: 'seen_candidates',
      pickReasonLabel: 'Engine guess: probably seen',
    }).catch(() => { /* non-fatal — exposure logging is best-effort */ })
  }, [user?.id, candidateIds, seenCandidates])

  // Hidden entirely when there are no candidates AND no user (cold-start
  // or signed-out). Engaged users will always have something to confirm.
  if (!user?.id || (visible.length === 0 && confirmedIds.size === 0)) return null

  // After the user has marked everything in the row, show a celebratory
  // empty state with the typed-search fallback so the surface still
  // earns its space.
  const allConfirmed = visible.length === 0

  return (
    <section className="border-t px-5 py-12 pb-16 sm:px-8 sm:py-14 sm:pb-20 lg:px-[88px] lg:py-[72px] lg:pb-24" style={{ borderColor: 'var(--ts-border-subtle, #302c28)', background: 'rgba(255,255,255,0.008)' }}>
      {/* QuickLog-owned polite live region — announces log success/failure once. */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{statusMsg}</div>
      <Heading
        kicker="Feed the engine"
        accent={IVORY}
        title={allConfirmed ? 'Nice — your taste profile just got sharper.' : 'Have you seen any of these?'}
        sub={allConfirmed
          ? 'These were our best guesses. Want to log something else?'
          : 'One tap per film you’ve already watched. Each one sharpens tomorrow’s briefing.'}
      />

      {!allConfirmed && (
        // Netflix-style horizontal scroll. The outer wrapper uses negative
        // margins to bleed scroll all the way to the viewport edges, then
        // the inner row re-pads to keep the first/last tile aligned with
        // the section's content rhythm. Free-scrolling (no snap) — snap
        // was clipping the first tile past the padding edge.
        <div
          className="-mx-5 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden sm:-mx-8 lg:mx-[-88px]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-4 px-5 sm:gap-5 sm:px-8 lg:gap-6 lg:px-[88px]">
            {visible.map(film => (
              <div
                key={film.id}
                className="w-[140px] flex-none sm:w-[170px] lg:w-[200px]"
              >
                <SeenTile film={film} onConfirm={handleConfirm} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog quick-jump — secondary to the row, kept because not
          everyone wants the mood-driven Discover path. Routes to /browse
          (the FeelFlick catalog). The page-end card below offers the
          mood path; this pill offers the catalog path — two distinct
          exits, not redundant. */}
      <div style={{ marginTop: allConfirmed ? 8 : 32, paddingTop: allConfirmed ? 0 : 24, borderTop: allConfirmed ? 'none' : `1px solid var(--ts-border-subtle, #302c28)` }}>
        <p style={{ fontSize: 12, color: 'var(--ts-text-muted, #8d887f)', fontFamily: 'Inter, sans-serif', marginBottom: 10, letterSpacing: '0.04em' }}>
          {allConfirmed ? 'Browse the catalog:' : 'Don’t see what you watched? Browse the catalog:'}
        </p>
        <button
          type="button"
          onClick={() => onLog?.()}
          className="group inline-flex min-h-[44px] items-center gap-2 rounded-full bg-transparent px-5 py-2.5 transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/40"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: 'var(--ts-text-secondary, #beb8ad)', letterSpacing: '0.02em', border: `1px solid ${WARM_KEYLINE}` }}
        >
          Open Browse
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>
    </section>
  )
}

// PageEndCard — quiet, role-clear close for /home (F4.5; F2-aligned). Home has
// ALREADY given tonight's pick above; this is just the optional door to Discover
// for when the user would rather shape a pick deliberately by mood + context.
// Deliberately calmer than a second hero and SUBORDINATE to the briefing's
// bone-slab primary — the gradient pill + glowing card were retired (F2), and in
// Stage 2 the mood-tinted panel + rose CTA became a neutral graphite panel with a
// quiet graphite-outline CTA (no per-mood colour). The editorial closer keeps the
// single bounded rose em (large text → AA).
export function PageEndCard({ onDiscover }) {
  return (
    <section className="border-t px-5 py-12 pb-16 sm:px-8 sm:py-14 sm:pb-20 lg:px-[88px] lg:py-[64px] lg:pb-[80px]" style={{ borderColor: 'var(--ts-border-subtle, #302c28)' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
          padding: '40px 28px',
          // Stage 2 — neutral graphite panel (was a mood-tinted radial). No per-mood
          // or contextual colour; a faint ivory top-wash on a solid graphite surface.
          background: 'linear-gradient(180deg, rgba(243,236,223,0.03), transparent 60%), var(--ts-surface-1, #1d1814)',
          border: `1px solid ${WARM_KEYLINE}`,
          textAlign: 'center',
        }}
        className="sm:px-10"
      >
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
          color: IVORY_META, marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 12,
        }}>
          <span aria-hidden style={{ height: 1, width: 24, background: IVORY_META, opacity: 0.6 }} />
          Or shape your own
          <span aria-hidden style={{ height: 1, width: 24, background: IVORY_META, opacity: 0.6 }} />
        </div>
        {/* Editorial closer voice (Inter, Stage 2) — the curator inviting the
            deliberate path; emphasis in the single bounded rose accent (large
            editorial text → AA), not the old mood-purple. */}
        <h2 style={{
          fontFamily: EDITORIAL,
          fontSize: 'clamp(26px, 3vw, 40px)',
          lineHeight: 1.08,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: IVORY,
          margin: '0 auto 14px auto',
          maxWidth: 620,
          textWrap: 'balance',
        }}>
          Want to pick by <em style={{ fontStyle: 'italic', color: ROSE, fontWeight: 500 }}>mood and moment?</em>
        </h2>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(13px, 1vw, 15px)',
          lineHeight: 1.6,
          color: IVORY_META,
          margin: '0 auto 28px auto',
          maxWidth: 520,
          textWrap: 'pretty',
        }}>
          Tonight’s pick is already set above. Discover is the deliberate path — shape a different one around your mood, time, and who you’re with.
        </p>
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => onDiscover?.()}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              minHeight: 44, padding: '12px 24px', borderRadius: 4,
              // Subordinate to the briefing's neutral PrimaryAction: a quiet graphite
              // outline (no rose border, no gradient), per the secondary-action rule.
              border: '1px solid var(--ts-border-strong, #46423d)', color: IVORY,
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
              cursor: 'pointer',
            }}
            className="ff-discover-cta transition-transform duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Open Discover
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  )
}
