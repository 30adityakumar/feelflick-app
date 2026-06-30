// src/features/browse/components/BrowseMasthead.jsx
// Shortened cinematic Browse masthead (~340px desktop / ~295–310px mobile).
// Left-side readable copy over a restrained scrim; a decorative poster ribbon of
// REAL catalogue artwork (passed in, deduped, aria-hidden, fallback-safe — never
// implies personal recommendation); the scoped catalogue search; and the scoped
// "Surprise me within these filters" action. Not a second full-screen Home hero.

import { Shuffle } from 'lucide-react'
import BrowseScopedSearch from './BrowseScopedSearch'
import { tmdbImg } from '@/shared/api/tmdb'

export default function BrowseMasthead({ ribbonPosters = [], draftQuery, setDraftQuery, onSearch, onSurprise }) {
  const posters = (ribbonPosters || []).filter(Boolean).slice(0, 4)
  return (
    <section className="ff-browse-masthead" aria-labelledby="ff-browse-title">
      <div className="ff-browse-masthead__atmosphere" aria-hidden="true" />
      {posters.length > 0 ? (
        <div className="ff-browse-ribbon" aria-hidden="true">
          {posters.map((p, i) => (
            <div className="ff-browse-ribbon__poster" key={i}>
              <img src={tmdbImg(p, 'w342')} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      ) : null}
      <div className="ff-browse-masthead__scrim" aria-hidden="true" />

      <div className="ff-browse-masthead__content">
        <h1 id="ff-browse-title" className="ff-browse-masthead__title">Follow your curiosity.</h1>

        <BrowseScopedSearch draft={draftQuery} setDraft={setDraftQuery} onSubmit={onSearch} />

        <div className="ff-browse-masthead__actions">
          <button className="ffb-btn ffb-btn--ghost" type="button" onClick={onSurprise}>
            <Shuffle className="h-[16px] w-[16px]" aria-hidden="true" />
            Surprise me within these filters
          </button>
        </div>
      </div>
    </section>
  )
}
