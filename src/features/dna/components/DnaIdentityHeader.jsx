// Overlapping identity header: avatar (with FeelFlick mark badge), name, public/private indicator
// (NOT a verified badge), handle/location/member-since, bio, stat counts, and mode actions.
import { profileImg } from '@/shared/api/tmdb'

function monogram(name) { return (name || '?').trim().charAt(0).toUpperCase() || '?' }
function memberSince(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function DnaIdentityHeader({ identity, stats, actions }) {
  const since = memberSince(identity.joinedAt)
  return (
    <section aria-label="Profile">
      <div className="dna__shell dna-id">
        <div className="dna-id__grid">
          <div className="dna-avatar">
            {identity.avatarUrl
              ? <img src={identity.avatarUrl.startsWith('http') ? identity.avatarUrl : profileImg(identity.avatarUrl)} alt="" />
              : <span aria-hidden="true">{monogram(identity.name)}</span>}
            <span className="dna-avatar__mark" aria-hidden="true"><i /></span>
          </div>
          <div>
            <div className="dna-id__name-row">
              <h1 className="dna-id__name">{identity.name}</h1>
              <span className={`dna-id__vis${identity.publicProfile ? ' dna-id__vis--public' : ''}`}>
                <i aria-hidden="true" />{identity.publicProfile ? 'Public profile' : 'Private profile'}
              </span>
              {identity.handle ? <span className="dna-id__handle">@{identity.handle.replace(/^@/, '')}</span> : null}
            </div>
            <div className="dna-id__meta">
              {identity.location ? <><span>{identity.location}</span><span aria-hidden="true">·</span></> : null}
              {since ? <span>Member since {since}</span> : null}
            </div>
            {identity.bio ? <p className="dna-id__bio">{identity.bio}</p> : null}
          </div>
          <div className="dna-id__actions">{actions}</div>
        </div>

        <div className="dna-stats" aria-label="Profile statistics">
          <div className="dna-stat"><strong>{stats.films}</strong><span>films</span></div>
          <div className="dna-stat"><strong>{stats.reviews}</strong><span>reviews</span></div>
          <div className="dna-stat"><strong>{stats.followers ?? 0}</strong><span>followers</span></div>
          <div className="dna-stat"><strong>{stats.following ?? 0}</strong><span>following</span></div>
        </div>
      </div>
    </section>
  )
}
