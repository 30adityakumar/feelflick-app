// src/features/history/components/DiaryEmpty.jsx
// Completely-empty Diary (no films logged at all). Calm, truthful: a film appears once it's marked
// watched — a rating/review is optional, never required. Two quiet routes onward. The masthead +
// Library nav + zero stats remain (rendered by the shell); retrieval is hidden when truly empty.

import { Link } from 'react-router-dom'

export default function DiaryEmpty() {
  return (
    <section className="ff-diary-empty" aria-label="Your Diary is empty">
      <h2 className="ff-diary-empty__title">Your Diary is open.</h2>
      <p className="ff-diary-empty__body">
        Mark a film watched and it will appear here. Add a rating or review whenever you like.
      </p>
      <p className="ff-diary-empty__actions">
        <Link to="/home" className="ff-diary-empty__link">Browse tonight’s picks</Link>
        <Link to="/browse" className="ff-diary-empty__link ff-diary-empty__link--muted">Browse films</Link>
      </p>
    </section>
  )
}
