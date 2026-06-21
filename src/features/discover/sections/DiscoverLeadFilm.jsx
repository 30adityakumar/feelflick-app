// src/features/discover/sections/DiscoverLeadFilm.jsx
// The dominant cinematic decision surface for the FOCUSED film — the low-left copy
// composed OVER the full-bleed artwork (no standalone poster rectangle; the artwork
// itself is the image). Presentational: every action operates on the focused film
// (handlers passed in). In fallback (example) mode only the real-tmdbId Film File +
// trailer remain — Save / Already watched / Not tonight are hidden (example ids are
// not real catalogue rows). No match %, no fabricated reasons, no unsupported
// provider claims. Film-first order: direction label → title → metadata → moment-fit
// reason → actions (provider/chips stay subordinate to title + artwork).

import { Play, Bookmark, Check } from 'lucide-react'
import DiscoverReason from './DiscoverReason'
import StreamingChip from './StreamingChip'

const SAVE_LABEL = { idle: 'Save for later', saving: 'Saving…', saved: 'Saved', error: 'Try again' }
// A long real title gets a bounded, balanced fallback scale instead of the oversized
// default — without shrinking normal titles globally.
const LONG_TITLE = 22

export default function DiscoverLeadFilm({
  film, roleLabel, blendHex, descriptorChips = [], reason, provider, providerStatus,
  isFallback, fallbackNote, savedState = 'idle', watchedState = 'idle',
  onSeeMore, onSave, onWatched, onSkip, onTrailer,
}) {
  if (!film) return null
  const watchedLabel = watchedState === 'watched' ? 'Watched' : watchedState === 'error' ? 'Try again' : 'Already watched'
  const isLong = (film.title || '').length > LONG_TITLE
  return (
    <div className="ff-disc-result__copy">
      <p className="ff-disc-lead__eyebrow" style={{ color: blendHex }}>{roleLabel}</p>
      {fallbackNote ? <p className="ff-disc-lead__note" role="note">{fallbackNote}</p> : null}
      <h1 id="ff-disc-lead-title" className={`ff-disc-lead__title${isLong ? ' is-long' : ''}`}>{film.title}</h1>
      <div className="ff-disc-lead__meta">
        {[film.dir && film.dir !== 'Unknown' ? film.dir : null, film.year, film.runtime ? `${film.runtime} min` : null].filter(Boolean).map((bit, i, arr) => (
          <span key={i}>{bit}{i < arr.length - 1 ? <span aria-hidden="true" className="ff-disc-lead__dot">·</span> : null}</span>
        ))}
      </div>

      {descriptorChips.length > 0 ? (
        <div className="ff-disc-lead__chips">
          {descriptorChips.map((c, i) => <span key={`${c}-${i}`} className="ff-disc-lead__chip">{c}</span>)}
        </div>
      ) : null}

      {reason ? <DiscoverReason momentFit={reason.momentFit} personal={reason.personal} /> : null}

      {(provider || providerStatus === 'empty' || providerStatus === 'error') ? (
        <div className="ff-disc-lead__provider"><StreamingChip provider={provider} status={providerStatus} /></div>
      ) : null}

      <div className="ff-disc-lead__actions" role="group" aria-label="Film actions">
        {film.tmdbId ? (
          <button type="button" className="ff-disc-btn ff-disc-btn--primary" onClick={onSeeMore}>Open Film File</button>
        ) : <span className="ff-disc-lead__unavailable">Film file unavailable for this title.</span>}
        {film.trailerKey ? (
          <button type="button" className="ff-disc-btn ff-disc-btn--secondary" onClick={onTrailer}>
            <Play size={14} fill="currentColor" aria-hidden="true" /> <span>Trailer</span>
          </button>
        ) : null}
        {!isFallback ? (
          <>
            <button
              type="button"
              className={`ff-disc-btn ff-disc-btn--secondary${savedState === 'saved' ? ' is-done' : ''}`}
              onClick={onSave} disabled={savedState === 'saving' || savedState === 'saved'}
              aria-busy={savedState === 'saving'} aria-pressed={savedState === 'saved'}
            >
              <Bookmark size={14} fill={savedState === 'saved' ? 'currentColor' : 'none'} aria-hidden="true" /> <span>{SAVE_LABEL[savedState]}</span>
            </button>
            <button
              type="button"
              className={`ff-disc-btn ff-disc-btn--tertiary${watchedState === 'watched' ? ' is-done' : ''}`}
              onClick={onWatched} disabled={watchedState === 'saving' || watchedState === 'watched'}
              aria-busy={watchedState === 'saving'} aria-pressed={watchedState === 'watched'}
            >
              {watchedState === 'watched' ? <Check size={13} aria-hidden="true" /> : null} {watchedLabel}
            </button>
            <button type="button" className="ff-disc-btn ff-disc-btn--tertiary" onClick={onSkip}>Not tonight</button>
          </>
        ) : null}
      </div>
    </div>
  )
}
