// src/features/browse/components/BrowseSurpriseDialog.jsx
// "Surprise me within these filters" — a confirmation dialog, NOT an immediate
// navigation. The container draws a weighted pick from the qualified pool inside
// the active scope (respecting Hide watched, excluding invalid records, avoiding
// an immediate repeat) and passes it here. Copy explains the SCOPE the pick came
// from — never invents personal certainty. The user chooses to open the real Film
// File or draw "Another within these filters". Built on the shared Modal (focus
// capture/restore, Escape, backdrop dismiss).

import Modal from '@/shared/ui/Modal'

export default function BrowseSurpriseDialog({ open, onClose, film, scopeReason, loading, onOpenFilm, onAnother }) {
  return (
    <Modal open={open} onClose={onClose} label="A film within your current filters" size="sm">
      <div className="ff-browse-surprise">
        <div className="ff-browse-surprise__head">
          <p className="ff-eyebrow">Surprise · within these filters</p>
          <p className="ff-browse-surprise__scope">{scopeReason}</p>
        </div>

        {loading ? (
          <div className="ff-browse-surprise__body is-loading"><div className="ff-browse-surprise__poster is-skeleton" /></div>
        ) : film ? (
          <div className="ff-browse-surprise__body">
            <div className="ff-browse-surprise__poster">
              {film.poster ? <img src={film.poster} alt={`${film.title} poster`} /> : <span>{film.title}</span>}
            </div>
            <div className="ff-browse-surprise__meta">
              <h3>{film.title}</h3>
              <p>{[film.year, film.runtime ? `${film.runtime} min` : null, film.dir && film.dir !== '—' ? film.dir : null].filter(Boolean).join(' · ')}</p>
              {film.genre ? <p className="ff-browse-surprise__genre">{film.genre}</p> : null}
            </div>
          </div>
        ) : (
          <div className="ff-browse-surprise__body"><p className="ff-browse-surprise__empty">Nothing matches these filters to surprise you with. Loosen a filter and try again.</p></div>
        )}

        <div className="ff-browse-surprise__actions">
          <button type="button" className="ffb-btn ffb-btn--ghost" onClick={onAnother} disabled={loading || !film}>Another within these filters</button>
          <button type="button" className="ffb-btn ffb-btn--primary" onClick={() => film && onOpenFilm(film)} disabled={loading || !film}>Open Film File</button>
        </div>
      </div>
    </Modal>
  )
}
