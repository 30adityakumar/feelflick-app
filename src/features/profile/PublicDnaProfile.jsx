// src/features/profile/PublicDnaProfile.jsx
// Full, read-only Cinematic DNA portrait for /profile/:userId (another user).
// Renders the SAME sections the owner sees on their own /profile — archetype hero, Response
// (rating language), Journey (taste over time), Voices (directors) — plus the social sections
// (history, watchlist, lists) and a Follow control.
//
// Data path (no owner-only table reads — those are RLS-blocked cross-user):
//   usePublicDna(userId)
//     ├─ get_person_public_dna   → archetype, editorial, fingerprint, counts
//     └─ get_person_public_taste → history rows + per-film rating (NO review_text / Diary)
//   buildDnaData() runs the same pure derive functions the self fetch uses.
//
// Read-only: owner-only chrome is omitted (the "Private" pill, the evidence sheet, the passport
// export section, the editorial refresh). All section copy is third-person via `subjectName`.

import { useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { tmdbImg } from '@/shared/api/tmdb'
import { dedupeHistoryByMovie } from '@/shared/lib/canonicalHistory'
import { ThoughtfulRoot } from '@/shared/ui/thoughtful-seatmate'
import { usePublicDna } from './hooks/usePublicDna'
import { classifyProfileMaturity, MATURITY } from './derive/profilePresentation'
import { deriveMoods, deriveDirectors, deriveMixtape } from './derive'
import { deriveRatingLanguage } from './derive/ratingLanguage'
import { deriveTasteJourney } from './derive/tasteJourney'
import { resolveDnaIdentity } from './dna/identity'
import CinematicDnaHero from './dna/CinematicDnaHero'
import DnaSectionNav from './dna/DnaSectionNav'
import RatingLanguage from './dna/RatingLanguage'
import TasteJourney from './dna/TasteJourney'
import DirectorInfluence from './dna/DirectorInfluence'
import { usePersonPublicProfile } from '@/features/people/hooks/usePersonPublicProfile'
import { usePeopleData, PeopleDataProvider } from '@/features/people/usePeopleData'
import './profile.css'
import '@/features/people/people-profile.css'

const TMDB_W = 'w185'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

// Map the flat RPC rows + DNA row into the data object resolveDnaIdentity + the section
// components consume — running the same pure derivations the self fetch uses.
function buildDnaData(raw, tasteRows) {
  const fingerprint = raw.taste_fingerprint ?? null
  const historyRows = (tasteRows || []).map((r) => ({
    movie_id: r.movie_id,
    watched_at: r.watched_at,
    movies: {
      id: r.movie_id,
      title: r.title,
      poster_path: r.poster_path,
      release_date: r.release_date,
      director_name: r.director_name,
      runtime: r.runtime,
      mood_tags: r.mood_tags,
      tone_tags: r.tone_tags,
      tmdb_id: r.tmdb_id,
    },
  }))
  const history = dedupeHistoryByMovie(historyRows)
  // review_text is never exposed (Diary private) → '' ; watched_at is a stable ordering proxy.
  const ratings = (tasteRows || [])
    .filter((r) => r.rating != null)
    .map((r) => ({ movie_id: r.movie_id, rating: r.rating, rated_at: r.watched_at, review_text: '' }))
  const ratingsByMovieId = new Map(ratings.map((r) => [r.movie_id, r]))

  const watched = Number.isFinite(raw.total_watched) ? raw.total_watched : history.length
  const rated = Number.isFinite(raw.total_rated) ? raw.total_rated : ratings.length
  const maturity = classifyProfileMaturity({ watchedCount: watched, ratedCount: rated })
  // Presentation-only confidence number → maps to the right evidence band label (exact % never shown).
  const dnaConfidence = maturity === MATURITY.ESTABLISHED ? 72 : maturity === MATURITY.EMERGING ? 48 : 15
  const archetype = Array.isArray(raw.editorial_archetype) && raw.editorial_archetype.length > 0
    ? raw.editorial_archetype
    : null

  return {
    user: { name: raw.name },
    stats: { filmsLogged: watched, filmsRated: rated, dnaConfidence },
    moods: deriveMoods(fingerprint),
    // Suppress the LLM reflection for other users (its voice isn't guaranteed third-person);
    // the deterministic third-person line is used instead. Archetype still shows.
    editorial: { archetype, summary: null, signature: null, generatedAt: null },
    editorialStatus: maturity === MATURITY.FORMING ? 'forming' : 'none',
    ratingLanguage: deriveRatingLanguage({ ratings }),
    journey: deriveTasteJourney({ history }),
    directors: deriveDirectors({ history, ratingsByMovieId }),
    mixtape: deriveMixtape({ history, ratingsByMovieId }),
  }
}

function PosterGrid({ items, label }) {
  if (!items?.length) return null
  return (
    <div className="ff-prof-grid" aria-label={label}>
      {items.slice(0, 20).map((m) => (
        <Link key={m.movie_id} to={`/movie/${m.movie_id}`} className="ff-prof-poster-link" aria-label={m.title}>
          {m.poster_path ? (
            <img className="ff-prof-poster" src={tmdbImg(m.poster_path, TMDB_W)} alt="" loading="lazy" decoding="async" />
          ) : (
            <div className="ff-prof-poster ff-prof-poster--fallback" aria-hidden="true"><span>{m.title}</span></div>
          )}
        </Link>
      ))}
    </div>
  )
}

function SocialSections({ targetId, authUserId }) {
  const { status, profile, history, watchlist, lists } = usePersonPublicProfile(targetId, authUserId)
  if (status === 'loading') return null
  if (status === 'error' || !profile) return null

  return (
    <>
      <section className="ff-prof-section">
        <h2 className="ff-prof-section-title">Watch history</h2>
        {!profile.share_history ? (
          <p className="ff-prof-private"><span className="ff-prof-private__icon" aria-hidden="true">🔒</span>Watch history is private.</p>
        ) : history.length === 0 ? (
          <p className="ff-prof-empty">No films logged yet.</p>
        ) : (
          <PosterGrid items={history} label="Watch history" />
        )}
      </section>

      <section className="ff-prof-section">
        <h2 className="ff-prof-section-title">Watchlist</h2>
        {!profile.share_watchlist ? (
          <p className="ff-prof-private"><span className="ff-prof-private__icon" aria-hidden="true">🔒</span>Watchlist is private.</p>
        ) : watchlist.length === 0 ? (
          <p className="ff-prof-empty">Nothing saved yet.</p>
        ) : (
          <PosterGrid items={watchlist} label="Watchlist" />
        )}
      </section>

      <section className="ff-prof-section">
        <h2 className="ff-prof-section-title">Public lists</h2>
        {lists.length === 0 ? (
          <p className="ff-prof-empty">No public lists yet.</p>
        ) : (
          <div className="ff-prof-lists">
            {lists.map((l) => (
              <Link key={l.id} to={`/lists/${l.id}`} className="ff-prof-list-card">
                <div className="ff-prof-list-card__title">{l.title}</div>
                {l.description ? <div className="ff-prof-list-card__desc">{l.description}</div> : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function FollowControl({ targetId, name }) {
  const { followingIds, follow, unfollow, isPending, isErrored } = usePeopleData()
  const isFollowing = followingIds.has(targetId)
  const pending = isPending(targetId)
  const errored = isErrored(targetId)
  return (
    <button
      type="button"
      onClick={() => (isFollowing ? unfollow(targetId, name) : follow(targetId, name))}
      disabled={pending}
      aria-pressed={isFollowing}
      aria-busy={pending || undefined}
      aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${name}`}
      className={`ff-people-followbtn ff-prof-followbtn${isFollowing ? ' ff-people-followbtn--following' : ''}`}
    >
      {pending ? (isFollowing ? 'Unfollowing…' : 'Following…') : errored ? 'Try again' : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

function BackRow() {
  return (
    <div className="ff-dna__shell ff-prof-back-row">
      <Link to="/people" className="ff-prof-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to People
      </Link>
    </div>
  )
}

function DnaContent({ targetId, profile, raw, tasteRows, dnaPrivate }) {
  const [toast, setToast] = useState(null)
  const showToast = useCallback((msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const { user: authUser } = useAuthSession()
  // Name comes from the always-present identity row, so it's correct even when DNA is private.
  const name = (profile?.name || '').trim() || 'This person'
  const subjectName = name.split(/\s+/)[0]

  // Build the DNA portrait only when the target shares their DNA and we have a row.
  const data = !dnaPrivate && raw ? buildDnaData(raw, tasteRows) : null
  const identity = data ? resolveDnaIdentity(data, subjectName) : null

  // Section nav (no Passport on the read-only view — passport visual lives in the hero).
  const downstream = identity && !identity.forming ? [
    data.ratingLanguage ? { id: 'dna-response', label: 'Response' } : null,
    Array.isArray(data.journey) && data.journey.length >= 2 ? { id: 'dna-journey', label: 'Journey' } : null,
    Array.isArray(data.directors) && data.directors.length > 0 ? { id: 'dna-voices', label: 'Voices' } : null,
  ].filter(Boolean) : []
  const navItems = downstream.length > 0 ? [{ id: 'dna-portrait', label: 'Portrait' }, ...downstream] : []

  const portraitUnavailable = dnaPrivate
    ? `${subjectName} keeps their Cinematic DNA private.`
    : identity?.forming
      ? `${subjectName}'s Cinematic DNA is still forming — not enough films logged yet.`
      : null

  return (
    <ThoughtfulRoot className="ff-dna" role="region" aria-label={`${name}'s Cinematic DNA`}>
      <BackRow />

      {portraitUnavailable ? (
        <div className="ff-dna__shell" style={{ paddingBlock: 28 }}>
          <p className="ff-dna-eyebrow">Cinematic DNA</p>
          <p className="ff-prof-empty">{portraitUnavailable}</p>
        </div>
      ) : (
        <>
          <CinematicDnaHero
            identity={identity}
            mixtape={data.mixtape}
            evidenceVersion={null}
            onEvidence={() => {}}
            onScrollTo={scrollToSection}
            subjectName={subjectName}
          />
          {navItems.length > 0 ? <DnaSectionNav items={navItems} /> : null}
          <RatingLanguage ratingLanguage={data.ratingLanguage} subjectName={subjectName} />
          <TasteJourney journey={data.journey} subjectName={subjectName} />
          <DirectorInfluence directors={data.directors} subjectName={subjectName} />
        </>
      )}

      <div className="ff-dna__shell" style={{ paddingBottom: 'calc(var(--pl-nav-clear, 80px) + env(safe-area-inset-bottom))' }}>
        <div className="ff-prof-body">
          <header className="ff-prof-header" style={{ paddingTop: 32 }}>
            <div className="ff-prof-header__copy">
              <h2 className="ff-prof-name">{name}</h2>
            </div>
            <FollowControl targetId={targetId} name={name} />
          </header>

          <SocialSections targetId={targetId} authUserId={authUser?.id} />
        </div>
      </div>

      <div className={`ff-dna-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </ThoughtfulRoot>
  )
}

function LoadingState() {
  return (
    <ThoughtfulRoot className="ff-dna" role="region" aria-label="Loading profile">
      <BackRow />
      <div className="ff-dna ff-dna-state" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading Cinematic DNA…</span>
        <div className="ff-dna-state__box" aria-hidden="true" style={{ width: 'min(640px, 92vw)' }}>
          <div className="ff-dna-skel" style={{ height: 12, width: 200, margin: '0 auto 28px' }} />
          <div className="ff-dna-skel" style={{ height: 92, width: '88%', margin: '0 auto 18px' }} />
          <div className="ff-dna-skel" style={{ height: 18, width: '64%', margin: '0 auto 30px' }} />
          <div className="ff-dna-skel" style={{ height: 320, width: '100%', borderRadius: 24 }} />
        </div>
      </div>
    </ThoughtfulRoot>
  )
}

function ErrorState({ retry }) {
  return (
    <ThoughtfulRoot className="ff-dna ff-dna-state" role="region" aria-label="Profile error">
      <div className="ff-dna-state__box" role="alert">
        <p className="ff-dna-eyebrow">Cinematic DNA</p>
        <h1>This profile could not be loaded.</h1>
        <div className="ff-dna-state__actions">
          <button type="button" className="ff-dna-btn ff-dna-btn--primary" onClick={retry}>Try again</button>
          <Link className="ff-dna-btn ff-dna-btn--ghost" to="/people">Back to People</Link>
        </div>
      </div>
    </ThoughtfulRoot>
  )
}

function PublicDnaInner() {
  const { userId } = useParams()
  const { status, profile, raw, tasteRows, retry } = usePublicDna(userId)

  if (status === 'loading') return <LoadingState />
  if (status === 'error') return <ErrorState retry={retry} />
  // 'private' → DNA hidden by the owner, but social sections still render under their own flags.
  return (
    <DnaContent
      targetId={userId}
      profile={profile}
      raw={raw}
      tasteRows={tasteRows}
      dnaPrivate={status === 'private'}
    />
  )
}

export default function PublicDnaProfile() {
  return (
    <PeopleDataProvider>
      <PublicDnaInner />
    </PeopleDataProvider>
  )
}
