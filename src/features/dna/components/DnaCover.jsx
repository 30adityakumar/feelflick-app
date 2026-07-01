// Cinematic cover. Prefers a real landscape backdrop_path (owner-selected cover film, else a My
// Four film) as a full-bleed hero; falls back to a poster composition (posters in their own
// columns — never a stretched portrait); then a neutral editorial fallback. Adds the prototype's
// top-left caption chip and bottom-right "Current cinematic chapter" card (real journey chapter).
import { tmdbImg, backdropImg, backdropSrcSet } from '@/shared/api/tmdb'

export default function DnaCover({ films = [], curated = false, firstName = '', isOwner = false, chapter = null }) {
  const backdropFilm = films.find((m) => m.backdropPath) || null
  const posterFilms = films.filter((m) => m.posterPath).slice(0, 4)
  const hasImagery = backdropFilm || posterFilms.length > 0
  const caption = isOwner
    ? (curated ? 'Cover you chose' : 'From your films')
    : (curated ? `Cover chosen by ${firstName || 'this member'}` : `From ${firstName || 'this member'}’s films`)

  return (
    <section className="dna-cover" aria-label="Profile cover">
      {backdropFilm ? (
        <div className="dna-cover__backdrop">
          <img src={backdropImg(backdropFilm.backdropPath, 'w1280')} srcSet={backdropSrcSet(backdropFilm.backdropPath)}
            sizes="100vw" alt="" loading="eager" decoding="async" />
        </div>
      ) : posterFilms.length > 0 ? (
        <div className="dna-cover__frames" aria-hidden="true">
          {posterFilms.map((m, i) => (
            <div className="dna-cover__frame" key={m.id ?? i}><img src={tmdbImg(m.posterPath, 'w500')} alt="" loading="eager" decoding="async" /></div>
          ))}
        </div>
      ) : (
        <div className="dna-cover__frames" aria-hidden="true">
          <div className="dna-cover__frame"><div className="dna-cover__fallback">A cinematic cover appears once films are logged.</div></div>
        </div>
      )}
      <div className="dna-cover__scrim" aria-hidden="true" />
      {hasImagery && <div className="dna-cover__caption"><i aria-hidden="true" />{caption}</div>}
      {chapter?.title && (
        <div className="dna-chapter-card">
          <small>Current cinematic chapter</small>
          <strong>{chapter.title}</strong>
          {chapter.change ? <p>{chapter.change}</p> : null}
        </div>
      )}
    </section>
  )
}
