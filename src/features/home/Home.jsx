// FeelFlick — Home (bounded personal discovery). Mounted at /home.
//
// AppShell owns the global Header / SearchBar / BottomNav. Home composes, inside
// the scoped Thoughtful-Seatmate foundation (<ThoughtfulRoot> + neutral
// <PageDepth> canvas), four things:
//
//   1. HomeHero            — a contained editorial backdrop carousel of ≤3
//                            personally-grounded standouts (grounded reason only).
//   2. HomeShortcutStrip   — Discover / Browse / Log shortcuts, after the hero.
//   3. HomeRecommendationSection[] — bounded, poster-led groups.
//   4. HomeDnaStrip        — a compact, honest Cinematic-DNA close.
//
// Hero + rows come from the dedicated, tier-aware row engine (useHomepageRows);
// the DNA strip + greeting come from the slimmed HomeDataProvider. The legacy
// single-pick Briefing + its supporting tail (and their recommendation pipeline)
// are retired — see useHomeData.jsx for the provider scope change.

import { useEffect, useMemo } from 'react'

import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { trackEvent, EVENTS } from '@/shared/services/betaEvents'
import { useHomepageRows } from '@/shared/hooks/useHomepageRows'
import { ThoughtfulRoot, PageDepth } from '@/shared/ui/thoughtful-seatmate'

import { HomeDataProvider, useHomeData } from './useHomeData'
import { useHeroTitleLogos } from './hooks/useHeroTitleLogos'
import HomeHero from './components/HomeHero'
import HomeShortcutStrip from './components/HomeShortcutStrip'
import HomeRecommendationSection from './components/HomeRecommendationSection'
import HomeDnaStrip from './components/HomeDnaStrip'
import './home.css'

const HERO_MAX = 3

// A row's films, regardless of whether the builder returns an array (critics /
// under-90) or an object with a `films` field (top-of-taste / mood / orbit / …).
function filmsOf(rowData) {
  if (!rowData) return []
  if (Array.isArray(rowData)) return rowData
  return Array.isArray(rowData.films) ? rowData.films : []
}

// A hero standout MUST carry a specific, grounded engine reason — generic
// "Picked for you" candidates are excluded (per the locked decision: the hero
// never shows a generic fallback as its visible explanation).
function isGroundedHero(f) {
  const r = f?._reason
  return Boolean(r && r.type && r.type !== 'generic' && typeof r.text === 'string' && r.text.trim())
}

// Calm, honest top-level failure — no raw error, no stack trace, no auto-reload.
function HomeLoadError() {
  return (
    <div role="alert" className="ff-home__notice">
      <p className="ff-home__notice-title">We couldn’t load your home.</p>
      <p className="ff-home__notice-sub">Try refreshing in a moment.</p>
    </div>
  )
}

// Content-shaped loading — a hero block + two row skeletons (no spinner).
function HomeSkeleton() {
  return (
    <div role="status" aria-label="Preparing your home" className="ff-home__skeleton">
      <div className="ff-home__skel-hero" aria-hidden="true" />
      <div className="ff-home__body">
        {[0, 1].map(i => (
          <div className="ff-home__skel-section" key={i} aria-hidden="true">
            <div className="ff-home__skel-head" />
            <div className="ff-home__skel-row">
              {[0, 1, 2, 3, 4].map(j => <div className="ff-home__skel-card" key={j} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Honest cold/empty state — never a misleading "no recommendations" after an
// error (errors are handled separately above). Offers a real way forward.
function HomeEmpty() {
  return (
    <div className="ff-home__empty">
      <p className="ff-home__empty-title">Your recommendations are still warming up.</p>
      <p className="ff-home__empty-sub">Log or rate a few films and your personalized picks will fill in here.</p>
    </div>
  )
}

function HomeBody() {
  usePageMeta({ title: 'Home — FeelFlick' })
  const { user: authUser } = useAuthSession()
  const userId = authUser?.id

  const { loading: dnaLoading, error: dnaError, dna } = useHomeData()
  const rows = useHomepageRows(userId)
  const { tier, rotationVariant, profileReady, profileError } = rows

  useEffect(() => { trackEvent(EVENTS.home_opened, { surface: 'home' }) }, []) // funnel entry (preserved)

  // === Hero — grounded top-of-taste standouts, deduped from the rows below ===
  const heroFilms = useMemo(
    () => filmsOf(rows.topOfTaste.data).filter(isGroundedHero).slice(0, HERO_MAX),
    [rows.topOfTaste.data],
  )
  const heroIds = useMemo(() => new Set(heroFilms.map(f => f.id)), [heroFilms])

  // Enrich the hero standouts with their official transparent title logo (when
  // one is available). Best-effort: films without a logo keep their original ref
  // (and render their text title), so this only adds work, never removes a pick.
  const heroLogos = useHeroTitleLogos(heroFilms)
  const heroFilmsWithLogos = useMemo(
    () => heroFilms.map(f => {
      const url = heroLogos.get(f.id)
      return url ? { ...f, titleLogoUrl: url } : f
    }),
    [heroFilms, heroLogos],
  )

  // === Rows — personal first, broad/editorial only as honest fallbacks ===
  // The row engine already cross-deduped films across rows (in its own priority
  // order); here we additionally remove the hero films and hide any row that has
  // no title or no remaining films. Order is deliberately personal-first.
  const isPeoples = tier === 'engaged' && rotationVariant === 'B'
  const sections = useMemo(() => {
    const defs = [
      {
        key: 'top_of_taste',
        title: 'Top of your taste',
        subtitle: rows.topOfTaste.data?.subtitle || null,
        note: 'The films, filmmakers, and tones your ratings and saves reward most — scored for you.',
        films: filmsOf(rows.topOfTaste.data),
      },
      {
        key: 'still_in_orbit',
        title: rows.orbit.data?.seed?.title ? `Because you loved ${rows.orbit.data.seed.title}` : null,
        note: 'Films that share the DNA of one you rated highly.',
        films: filmsOf(rows.orbit.data),
      },
      {
        key: 'mood_row',
        title: rows.mood.data?.title || null,
        subtitle: rows.mood.data?.subtitle || null,
        note: 'Drawn from the emotional tones your highly-rated films keep returning to.',
        films: filmsOf(rows.mood.data),
      },
      {
        key: 'signature_director',
        title: rows.director.data?.director?.name ? `More from ${rows.director.data.director.name}` : null,
        subtitle: rows.director.data?.subtitle || null,
        note: 'A filmmaker your ratings keep rewarding.',
        films: filmsOf(rows.director.data),
      },
      {
        key: 'watchlist',
        title: 'Still on your watchlist',
        note: 'Saved a while ago and still waiting — worth another look.',
        films: filmsOf(rows.watchlist.data),
      },
      // Broad / editorial — honest fallbacks, deliberately AFTER the personal rows.
      {
        key: isPeoples ? 'peoples_champions' : 'critics_swooned',
        title: isPeoples ? 'Loved by audiences' : 'Critics swooned',
        note: isPeoples
          ? 'Widely loved by viewers — a broader pick, lighter on personalization.'
          : 'Critically adored titles — a broader pick, lighter on personalization.',
        films: filmsOf(rows.criticSplit.data),
      },
      {
        key: 'under_90',
        title: 'Under 90 minutes',
        note: 'For when you want something shorter tonight.',
        films: filmsOf(rows.under90.data),
      },
    ]
    return defs
      .map(d => ({ ...d, films: (d.films || []).filter(f => f && !heroIds.has(f.id)) }))
      .filter(d => d.title && d.films.length > 0)
  }, [rows, heroIds, isPeoples])

  // === States ===
  const isError = Boolean(dnaError || profileError)
  const anyRowLoading = [
    rows.topOfTaste, rows.orbit, rows.mood, rows.director, rows.watchlist, rows.criticSplit, rows.under90,
  ].some(r => r.loading)
  const loading = !isError && (dnaLoading || !profileReady || anyRowLoading)
  const hasContent = heroFilms.length > 0 || sections.length > 0
  const isEmpty = !loading && !isError && !hasContent

  return (
    <PageDepth
      depth="radial"
      className="ff-home"
      style={{ minHeight: '100vh', color: 'var(--ts-text-primary, #f3ecdf)', position: 'relative', overflowX: 'hidden' }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* One stable, meaningful page heading across every state (the visual
            masthead is the hero film title, an h2). */}
        <h1 className="sr-only">Home — your picks for tonight</h1>

        {isError ? (
          <HomeLoadError />
        ) : loading ? (
          <HomeSkeleton />
        ) : (
          <>
            {heroFilms.length > 0 ? <HomeHero films={heroFilmsWithLogos} user={authUser} /> : null}
            <div className="ff-home__body">
              <HomeShortcutStrip />
              {isEmpty ? (
                <HomeEmpty />
              ) : (
                sections.map(d => (
                  <HomeRecommendationSection
                    key={d.key}
                    rowKey={d.key}
                    title={d.title}
                    subtitle={d.subtitle}
                    note={d.note}
                    films={d.films}
                  />
                ))
              )}
              <HomeDnaStrip dna={dna} />
            </div>
          </>
        )}
      </div>
    </PageDepth>
  )
}

export default function Home() {
  return (
    <HomeDataProvider>
      {/* Local Stage-2 activation boundary — scopes the --ts-* foundation to Home
          only (Header/BottomNav stay outside the scoped visual system). */}
      <ThoughtfulRoot>
        <HomeBody />
      </ThoughtfulRoot>
    </HomeDataProvider>
  )
}
