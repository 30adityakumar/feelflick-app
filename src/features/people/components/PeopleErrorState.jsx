// src/features/people/components/PeopleErrorState.jsx
// Two honest failure states (never a raw backend message):
//  • variant="load_error"          — the own follow graph could not load → relationship state is
//    unknowable. Owns the page's single <h1>, role="alert", Try again + Go to Home. Rendered alone
//    (no masthead) so there is exactly one <h1>.
//  • variant="discovery_unavailable" — discovery (similarity/taste/identity) failed but name search
//    still works. A non-heading notice (role="status") + Retry, rendered BELOW the masthead + search.

export default function PeopleErrorState({ variant, onRetry, onHome }) {
  if (variant === 'load_error') {
    return (
      <div className="ff-people-errorwrap">
        <div className="ff-people-error" role="alert">
          <p className="ff-people-error__eyebrow">People</p>
          <h1 className="ff-people-error__title">We couldn’t load People.</h1>
          <p className="ff-people-error__body">Your follows and settings are safe. Try again in a moment.</p>
          <div className="ff-people-error__actions">
            <button type="button" className="ff-people-action ff-people-action--primary" onClick={onRetry}>Try again</button>
            <button type="button" className="ff-people-action" onClick={onHome}>Go to Home</button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <section className="ff-people-section ff-people-coldwrap" aria-label="Taste matches">
      <div className="ff-people-empty" role="status">
        <p className="ff-people-empty__title">Taste matches are unavailable right now.</p>
        <p className="ff-people-empty__body">You can still search for someone by name.</p>
        <button type="button" className="ff-people-action ff-people-action--primary ff-people-retry" onClick={onRetry}>Retry</button>
      </div>
    </section>
  )
}
