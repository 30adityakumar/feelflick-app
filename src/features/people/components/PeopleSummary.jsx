// src/features/people/components/PeopleSummary.jsx
// Factual following/follower summary. Correct singular/plural. When the follower count could not be
// loaded it is OMITTED (never a fabricated "0 followers"). Counts imply no reciprocity.

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

export default function PeopleSummary({ following = 0, followers = 0, followersUnavailable = false }) {
  return (
    <p className="ff-people-summary">
      <span>{plural(following, 'following', 'following')}</span>
      {!followersUnavailable && (
        <>
          <span className="ff-people-summary__dot" aria-hidden="true">·</span>
          <span>{plural(followers, 'follower', 'followers')}</span>
        </>
      )}
    </p>
  )
}
