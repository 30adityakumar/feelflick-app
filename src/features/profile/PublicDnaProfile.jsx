// src/features/profile/PublicDnaProfile.jsx
// Full public-facing Cinematic DNA page for /profile/:userId (non-self).
// Shows the archetype hero + passport via a SECURITY DEFINER RPC (no direct table reads),
// then the social sections (history, watchlist, lists) via the people public RPCs.

import { useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { tmdbImg } from '@/shared/api/tmdb'
import { ThoughtfulRoot } from '@/shared/ui/thoughtful-seatmate'
import { usePublicDna } from './hooks/usePublicDna'
import { classifyProfileMaturity, MATURITY } from './derive/profilePresentation'
import { resolveDnaIdentity } from './dna/identity'
import CinematicDnaHero from './dna/CinematicDnaHero'
import DnaFormingState from './dna/DnaFormingState'
import CinematicPassportSection from './dna/CinematicPassportSection'
import { usePersonPublicProfile } from '@/features/people/hooks/usePersonPublicProfile'
import { usePeopleData, PeopleDataProvider } from '@/features/people/usePeopleData'
import './profile.css'
import '@/features/people/people-profile.css'

const TMDB_W = 'w185'

function buildDnaData(raw) {
  const tf = raw.taste_fingerprint ?? {}
  const archetype = Array.isArray(raw.editorial_archetype) && raw.editorial_archetype.length > 0
    ? raw.editorial_archetype
    : null
  const watched = raw.total_watched ?? 0
  const rated = raw.total_rated ?? 0
  const maturity = classifyProfileMaturity({ watchedCount: watched, ratedCount: rated })
  const confidence = maturity === MATURITY.ESTABLISHED ? 72
    : maturity === MATURITY.EMERGING ? 48
    : 15

  return {
    user: { name: raw.name },
    stats: { filmsLogged: watched, filmsRated: rated, dnaConfidence: confidence },
    moods: (tf.topMoodTags ?? []).slice(0, 4).map(t => ({ name: t.label || t.key || String(t) })),
    editorial: {
      archetype,
      summary: raw.editorial_summary ?? null,
      signature: raw.editorial_signature ?? null,
      generatedAt: raw.editorial_generated_at ?? null,
    },
    editorialStatus: maturity === MATURITY.FORMING ? 'forming'
      : (raw.editorial_summary ? 'current' : (archetype ? 'stale' : 'none')),
    mixtape: [],
    evidenceVersion: null,
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

function FollowControl({ targetId }) {
  const { followingIds, follow, unfollow, isPending, isErrored } = usePeopleData()
  const isFollowing = followingIds.has(targetId)
  const pending = isPending(targetId)
  const errored = isErrored(targetId)
  return (
    <button
      type="button"
      onClick={() => (isFollowing ? unfollow(targetId) : follow(targetId))}
      disabled={pending}
      aria-pressed={isFollowing}
      aria-busy={pending || undefined}
      className={`ff-people-followbtn ff-prof-followbtn${isFollowing ? ' ff-people-followbtn--following' : ''}`}
    >
      {pending ? (isFollowing ? 'Unfollowing…' : 'Following…') : errored ? 'Try again' : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

function DnaContent({ raw }) {
  const [toast, setToast] = useState(null)
  const showToast = useCallback((msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const { user: authUser } = useAuthSession()
  const data = buildDnaData(raw)
  const identity = resolveDnaIdentity(data)

  return (
    <ThoughtfulRoot className="ff-dna" role="region" aria-label={`${raw.name}'s Cinematic DNA`}>
      <div className="ff-dna__shell ff-prof-back-row">
        <Link to="/people" className="ff-prof-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to People
        </Link>
      </div>

      {identity.forming ? (
        <DnaFormingState identity={identity} />
      ) : (
        <>
          <CinematicDnaHero
            identity={identity}
            mixtape={[]}
            evidenceVersion={null}
            onEvidence={() => {}}
            onScrollTo={() => {}}
          />
          <CinematicPassportSection
            identity={identity}
            evidenceVersion={null}
            onEvidence={() => {}}
            onToast={showToast}
          />
        </>
      )}

      <div className="ff-dna__shell" style={{ paddingBottom: 'calc(var(--pl-nav-clear, 80px) + env(safe-area-inset-bottom))' }}>
        <div className="ff-prof-body">
          <header className="ff-prof-header" style={{ paddingTop: 32 }}>
            <div className="ff-prof-header__copy">
              <p className="ff-prof-similarity" style={{ marginTop: 0 }}>
                {identity.facts?.find(f => f.kind === 'watched')?.text ?? ''}{' '}
                {identity.facts?.find(f => f.kind === 'rated')?.text ?? ''}
              </p>
            </div>
            <FollowControl targetId={raw.id ?? ''} />
          </header>

          <SocialSections targetId={raw.id ?? ''} authUserId={authUser?.id} />
        </div>
      </div>

      <div className={`ff-dna-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </ThoughtfulRoot>
  )
}

function LoadingState() {
  return (
    <ThoughtfulRoot className="ff-dna" role="region" aria-label="Loading profile">
      <div className="ff-dna__shell ff-prof-back-row">
        <Link to="/people" className="ff-prof-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to People
        </Link>
      </div>
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
      <div className="ff-dna__shell ff-prof-back-row">
        <Link to="/people" className="ff-prof-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to People
        </Link>
      </div>
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
  const { status, raw, retry } = usePublicDna(userId)

  if (status === 'loading') return <LoadingState />
  if (status === 'error' || !raw) return <ErrorState retry={retry} />
  return <DnaContent raw={{ ...raw, id: userId }} />
}

export default function PublicDnaProfile() {
  return (
    <PeopleDataProvider>
      <PublicDnaInner />
    </PeopleDataProvider>
  )
}
