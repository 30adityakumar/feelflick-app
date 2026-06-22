// src/features/people/components/PeopleColdState.jsx
// Honest empty/cold states. `variant` distinguishes the cause (never one message for all):
//  • no-matches  — nobody opted-in matches yet (no arbitrary "rate a dozen films" promise)
//  • all-hidden  — everything was hidden this session (reversible by refresh)

export default function PeopleColdState({ variant = 'no-matches' }) {
  const copy = variant === 'all-hidden'
    ? { title: 'No more suggestions this session.', body: 'Refresh the page to restore hidden suggestions.' }
    : { title: 'No confident taste matches yet.', body: 'Keep rating films and FeelFlick will begin surfacing people whose film taste overlaps with yours.' }
  return (
    <section className="ff-people-section ff-people-coldwrap" aria-label="Taste matches">
      <div className="ff-people-empty ff-people-empty--cold">
        <p className="ff-people-empty__title">{copy.title}</p>
        <p className="ff-people-empty__body">{copy.body}</p>
      </div>
    </section>
  )
}
