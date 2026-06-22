// Honest fallback shown when the People surface is disabled via the VITE_ENABLE_PEOPLE kill-switch.
// It loads NO data (the data provider + every People RPC are never mounted) and exposes nothing
// private. AppShell owns the page <main>, so this renders a route-owned <section> (NOT a nested
// <main>); its single <h1> keeps the disabled page accessible.
export default function PeopleUnavailable() {
  return (
    <section className="ff-people-v2 ff-people-unavailable" aria-label="People">
      <h1 className="ff-people-unavailable__title">People is taking a short break</h1>
      <p className="ff-people-unavailable__body">
        Taste-match discovery is paused during beta. It&rsquo;ll be back soon &mdash; your follows and settings are safe.
      </p>
    </section>
  )
}
