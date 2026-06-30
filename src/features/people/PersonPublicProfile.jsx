// src/features/people/PersonPublicProfile.jsx
// Public profile page for /people/:userId.
// Shows name, avatar, taste similarity context, Cinematic DNA (if the user opted in),
// watch history and watchlist (if the user enabled follower sharing), and public lists.

import { Link, useParams } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { tmdbImg } from '@/shared/api/tmdb'
import { usePersonPublicProfile } from './hooks/usePersonPublicProfile'
import PersonAvatar from './components/PersonAvatar'
import { usePeopleData, PeopleDataProvider } from './usePeopleData'
import { initialOf, avatarBg } from './derive/peopleDiscovery'
import './people.css'
import './people-profile.css'

const TMDB_W = 'w185'

function PosterGrid({ items, label }) {
  if (!items.length) return null
  return (
    <div className="ff-prof-grid" aria-label={label}>
      {items.slice(0, 20).map((m) => (
        <Link key={m.movie_id} to={`/movie/${m.movie_id}`} className="ff-prof-poster-link" aria-label={m.title}>
          {m.poster_path ? (
            <img
              className="ff-prof-poster"
              src={tmdbImg(m.poster_path, TMDB_W)}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="ff-prof-poster ff-prof-poster--fallback" aria-hidden="true">
              <span>{m.title}</span>
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}

function SectionHeader({ title }) {
  return <h2 className="ff-prof-section-title">{title}</h2>
}

function PrivateNotice({ label }) {
  return (
    <p className="ff-prof-private">
      <span className="ff-prof-private__icon" aria-hidden="true">🔒</span>
      {label} is private.
    </p>
  )
}

function DnaSection({ profile }) {
  const hasDna = profile.top_mood_tags || profile.top_tone_tags || profile.top_fit_profiles
  return (
    <section className="ff-prof-section">
      <SectionHeader title="Cinematic DNA" />
      {hasDna ? (
        <div className="ff-prof-dna">
          {profile.top_mood_tags?.length > 0 && (
            <div className="ff-prof-dna__group">
              <span className="ff-prof-dna__label">Mood</span>
              <div className="ff-prof-tags">
                {profile.top_mood_tags.map((t) => (
                  <span key={t.key || t} className="ff-prof-tag">{t.label || t.key || t}</span>
                ))}
              </div>
            </div>
          )}
          {profile.top_tone_tags?.length > 0 && (
            <div className="ff-prof-dna__group">
              <span className="ff-prof-dna__label">Tone</span>
              <div className="ff-prof-tags">
                {profile.top_tone_tags.map((t) => (
                  <span key={t.key || t} className="ff-prof-tag">{t.label || t.key || t}</span>
                ))}
              </div>
            </div>
          )}
          {profile.top_fit_profiles?.length > 0 && (
            <div className="ff-prof-dna__group">
              <span className="ff-prof-dna__label">Fit</span>
              <div className="ff-prof-tags">
                {profile.top_fit_profiles.map((t) => (
                  <span key={t.key || t} className="ff-prof-tag">{t.label || t.key || t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <PrivateNotice label="Cinematic DNA" />
      )}
    </section>
  )
}

function SimilarityBand({ similarity }) {
  if (!similarity) return null
  const pct = Math.round(similarity.overall_similarity * 100)
  const common = similarity.movies_in_common
  const band = pct >= 70 ? 'Strong overlap' : pct >= 40 ? 'Solid overlap' : 'Some overlap'
  return (
    <p className="ff-prof-similarity">
      {band} · {common} film{common !== 1 ? 's' : ''} in common
    </p>
  )
}

function ProfileContent({ targetId }) {
  const { user } = useAuthSession()
  const { status, profile, lists, history, watchlist, similarity, retry } = usePersonPublicProfile(targetId, user?.id)
  const { followingIds, follow, unfollow, isPending, isErrored } = usePeopleData()

  usePageMeta({ title: profile?.name ? `${profile.name} — FeelFlick` : 'Profile — FeelFlick' })

  if (status === 'loading') {
    return (
      <div className="ff-prof-skeleton" aria-busy="true" aria-label="Loading profile">
        <div className="ff-prof-skel-head animate-pulse" />
        <div className="ff-prof-skel-body animate-pulse" />
      </div>
    )
  }

  if (status === 'error' || !profile) {
    return (
      <div className="ff-prof-error">
        <p className="ff-prof-error__msg">This profile could not be loaded.</p>
        <button type="button" className="ff-prof-retry" onClick={retry}>Try again</button>
      </div>
    )
  }

  const isFollowing = followingIds.has(targetId)
  const pending = isPending(targetId)
  const errored = isErrored(targetId)

  return (
    <article className="ff-prof-body">
      {/* Header */}
      <header className="ff-prof-header">
        <PersonAvatar
          url={profile.avatar_url}
          initial={initialOf(profile.name)}
          bg={avatarBg(targetId)}
          size={64}
        />
        <div className="ff-prof-header__copy">
          <h1 className="ff-prof-name">{profile.name}</h1>
          <SimilarityBand similarity={similarity} />
        </div>
        <button
          type="button"
          onClick={() => (isFollowing ? unfollow(targetId, profile.name) : follow(targetId, profile.name))}
          disabled={pending}
          aria-pressed={isFollowing}
          aria-busy={pending || undefined}
          aria-label={`${isFollowing ? 'Unfollow' : 'Follow'} ${profile.name}`}
          className={`ff-people-followbtn ff-prof-followbtn${isFollowing ? ' ff-people-followbtn--following' : ''}`}
        >
          {pending ? (isFollowing ? 'Unfollowing…' : 'Following…') : errored ? 'Try again' : isFollowing ? 'Following' : 'Follow'}
        </button>
      </header>

      {/* Cinematic DNA */}
      <DnaSection profile={profile} />

      {/* Watch history */}
      <section className="ff-prof-section">
        <SectionHeader title="Watch history" />
        {!profile.share_history ? (
          <PrivateNotice label="Watch history" />
        ) : history.length === 0 ? (
          <p className="ff-prof-empty">No films logged yet.</p>
        ) : (
          <PosterGrid items={history} label="Watch history" />
        )}
      </section>

      {/* Watchlist */}
      <section className="ff-prof-section">
        <SectionHeader title="Watchlist" />
        {!profile.share_watchlist ? (
          <PrivateNotice label="Watchlist" />
        ) : watchlist.length === 0 ? (
          <p className="ff-prof-empty">Nothing saved yet.</p>
        ) : (
          <PosterGrid items={watchlist} label="Watchlist" />
        )}
      </section>

      {/* Public lists */}
      <section className="ff-prof-section">
        <SectionHeader title="Public lists" />
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
    </article>
  )
}

export default function PersonPublicProfile() {
  const { userId } = useParams()

  return (
    <PeopleDataProvider>
      <div className="ff-people-v2 ff-prof-page">
        <div className="ff-prof-back-row ff-people-section">
          <Link to="/people" className="ff-prof-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back to People
          </Link>
        </div>
        <ProfileContent targetId={userId} />
      </div>
    </PeopleDataProvider>
  )
}
