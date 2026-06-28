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
import { moodSignatureLabel, signatureTonesLabel, dnaSignalsFromProfile } from '@/shared/services/rowSubtitles'
import { ThoughtfulRoot, PageDepth } from '@/shared/ui/thoughtful-seatmate'

import { HomeDataProvider, useHomeData } from './useHomeData'
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
  const { profile, profileReady, profileError } = rows

  useEffect(() => { trackEvent(EVENTS.home_opened, { surface: 'home' }) }, []) // funnel entry (preserved)

  // === Hero — grounded top-of-taste standouts, deduped from the rows below ===
  const heroFilms = useMemo(
    () => filmsOf(rows.topOfTaste.data).filter(isGroundedHero).slice(0, HERO_MAX),
    [rows.topOfTaste.data],
  )
  const heroIds = useMemo(() => new Set(heroFilms.map(f => f.id)), [heroFilms])

  // === Rows — identity-forward taste facets, one concrete discovery row, and a
  // broad editorial fallback last (a thin-profile safety net). The row engine
  // already cross-deduped films across rows; here we additionally remove the hero
  // films and hide any row with no title or no remaining films. `top_genre` is
  // placed between the two emotion-driven facets (mood signature / signature tones)
  // so they don't read back-to-back. Labels derive from the same v3 profile the
  // rows used — never invented (no thematic motifs: that data doesn't exist).
  const moodLabel = moodSignatureLabel(profile)
  const tonesLabel = signatureTonesLabel(profile)
  const topGenreName = rows.topGenre.data?.genre?.name || null
  const sections = useMemo(() => {
    const defs = [
      {
        key: 'top_of_taste',
        title: 'Your taste, distilled',
        subtitle: rows.topOfTaste.data?.subtitle || null,
        note: 'The films, filmmakers, and tones your ratings and saves reward most — scored for you.',
        films: filmsOf(rows.topOfTaste.data),
      },
      {
        key: 'hidden_gems',
        title: 'Hidden gems for you',
        subtitle: 'Less obvious, still very you',
        note: 'Lower-exposure films that still score highly against your taste — your pace, mood, and emotional register. Less obvious picks, still unmistakably you.',
        films: filmsOf(rows.hiddenGems.data),
      },
      {
        key: 'still_in_orbit',
        title: rows.orbit.data?.seed?.title ? `Because you loved ${rows.orbit.data.seed.title}` : null,
        note: 'Films that share the DNA of one you rated highly.',
        films: filmsOf(rows.orbit.data),
      },
      {
        key: 'mood_signature',
        title: moodLabel ? `Mood signature · ${moodLabel}` : null,
        subtitle: 'Your strongest emotional pattern',
        note: 'Derived from the emotional tone of the films you repeatedly rate well and keep in your watchlist.',
        films: filmsOf(rows.mood.data),
      },
      {
        key: 'top_genre',
        title: topGenreName ? `Your top genre · ${topGenreName}` : null,
        subtitle: 'The genre your ratings return to most',
        note: topGenreName
          ? `Inferred from the films you rate highly and watch most. Prioritises ${topGenreName} that still fits your specific taste within the genre.`
          : null,
        films: filmsOf(rows.topGenre.data),
      },
      {
        key: 'signature_tones',
        title: tonesLabel ? `Signature tones · ${tonesLabel}` : null,
        subtitle: 'The textures that recur in what you love',
        note: 'Learned from the stylistic tones — like cerebral, atmospheric, or noir — that recur across your highly rated and saved films.',
        films: filmsOf(rows.signatureTones.data),
      },
      // The broad editorial "Critics swooned / Loved by audiences" fallback was
      // removed: it surfaced the same niche-critic films for every user (samey,
      // lightly personalized) and is redundant now that the personal facet rows are
      // guaranteed to populate. True-empty users still get the honest empty state.
    ]
    return defs
      .map(d => ({ ...d, films: (d.films || []).filter(f => f && !heroIds.has(f.id)) }))
      .filter(d => d.title && d.films.length > 0)
  }, [rows, heroIds, moodLabel, tonesLabel, topGenreName])

  // Keep the Cinematic DNA strip consistent with the facet rows. The strip's base
  // `dna` comes from the 24h-cached taste fingerprint, which excludes onboarding and
  // lags for thin profiles — so it could read "still taking shape" while the rows
  // below confidently show Mood/Tone facets. Override its taste signals with the
  // SAME v3 affinity the rows use (cold-start onboarding fallback included); fall
  // back to the fingerprint when there's no affinity signal (genuinely empty users).
  const dnaForStrip = useMemo(() => {
    if (!dna) return dna
    const sig = dnaSignalsFromProfile(profile)
    if (!sig) return dna
    return {
      ...dna,
      motifs: sig.motifs ?? dna.motifs,
      topMoods: sig.topMoods ?? dna.topMoods,
      topFit: sig.topFit ?? dna.topFit,
    }
  }, [dna, profile])

  // === States ===
  const isError = Boolean(dnaError || profileError)
  const anyRowLoading = [
    rows.topOfTaste, rows.hiddenGems, rows.orbit, rows.mood, rows.topGenre, rows.signatureTones,
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
            {heroFilms.length > 0 ? <HomeHero films={heroFilms} user={authUser} /> : null}
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
              <HomeDnaStrip dna={dnaForStrip} />
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
