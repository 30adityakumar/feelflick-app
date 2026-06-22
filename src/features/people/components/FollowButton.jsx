// src/features/people/components/FollowButton.jsx
// Settled one-way Follow control. The label NEVER reads "Following" until the DB write succeeds.
// `following` is derived by the parent from the single followingIds authority (not baked on cards),
// so every rail (Strongest/More/Suggested/Search) shows consistent state.

export default function FollowButton({ id, following, pending, errored, name, onFollow, onUnfollow }) {
  const label = pending ? (following ? 'Unfollowing…' : 'Following…') : errored ? 'Try again' : following ? 'Following' : 'Follow'
  return (
    <button
      type="button"
      onClick={() => (following ? onUnfollow() : onFollow())}
      disabled={pending}
      aria-pressed={following}
      aria-busy={pending || undefined}
      aria-label={`${following ? 'Unfollow' : 'Follow'} ${name || 'this person'}`}
      data-follow-target={id}
      style={{ minHeight: 44, minWidth: 44 }}
      className={`ff-people-followbtn${following ? ' ff-people-followbtn--following' : ''}`}
    >
      {label}
    </button>
  )
}
