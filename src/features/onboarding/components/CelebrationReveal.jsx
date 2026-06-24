import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { tmdbImg } from '@/shared/api/tmdb'
import { MOODS } from '../data'

function buildAnnouncement(titles) {
  if (titles.length === 0) return 'Your taste is tuned. Opening your first picks.'
  if (titles.length === 1) return `Your taste is tuned with ${titles[0]}. Opening your first picks.`
  if (titles.length === 2) return `Your taste is tuned with ${titles[0]} and ${titles[1]}. Opening your first picks.`
  return `Your taste is tuned with ${titles[0]}, ${titles[1]}, and more. Opening your first picks.`
}

function buildTasteLine({ moods, genres, ratings, films }) {
  const parts = []
  if (moods.length) parts.push('your moods')
  if (genres.length) parts.push('your genres')
  if (Object.keys(ratings).length) parts.push('how those films landed')
  else if (films.length) parts.push('the films you chose')
  if (!parts.length) return 'Your first signals are in.'
  const list = parts.length === 1
    ? parts[0]
    : `${parts.slice(0, -1).join(', ')}${parts.length > 2 ? ',' : ''} and ${parts.at(-1)}`
  return `Your first signals are in — ${list}.`
}

const EASE = [0.16, 1, 0.3, 1]

export default function CelebrationReveal({
  moods = [],
  selectedGenres = [],
  favoriteMovies = [],
  ratings = {},
  fadingOut = false,
  ready = true,
  continuing = false,
  onContinue,
}) {
  const reduced = useReducedMotion()
  const selectedMoods = moods.map(key => MOODS.find(mood => mood.key === key)).filter(Boolean)
  const posterFilms = favoriteMovies.slice(0, 5)
  const tasteLine = buildTasteLine({ moods, genres: selectedGenres, ratings, films: posterFilms })
  const announcementText = buildAnnouncement(posterFilms.map(film => film.title).filter(Boolean))
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => setAnnouncement(announcementText), [announcementText])

  return (
    <div className="onboarding ob-celebration-root">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div aria-hidden="true" className="ob-celebration-atmosphere" />
      <div aria-hidden="true" className="ob-grain" />

      <motion.div
        className="ob-celebration-content"
        initial={false}
        animate={{ opacity: fadingOut ? 0 : 1 }}
        transition={{ duration: fadingOut ? 0.9 : 0, ease: EASE }}
      >
        <motion.p
          className="ob-celebration-kicker"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.25, ease: EASE }}
        >
          Your taste, tuned
        </motion.p>

        {selectedMoods.length > 0 && (
          <motion.div className="ob-celebration-moods" initial="hidden" animate="visible" variants={{ visible: { transition: { delayChildren: reduced ? 0 : 0.55, staggerChildren: reduced ? 0 : 0.1 } } }}>
            {selectedMoods.map(mood => (
              <motion.span key={mood.key} style={{ '--mood-rgb': mood.rgb }} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                {mood.label}
              </motion.span>
            ))}
          </motion.div>
        )}

        <motion.p className="ob-celebration-taste-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: reduced ? 0 : 0.9, ease: EASE }}>
          {tasteLine}
        </motion.p>

        {posterFilms.length > 0 && (
          <div className="ob-celebration-picks">
            <p>From your picks</p>
            <div className="ob-celebration-posters">
              {posterFilms.map((film, index) => (
                <motion.div key={film.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, rotate: (index - 2) * 2.5 }} transition={{ duration: 0.5, delay: reduced ? 0 : 1.05 + index * 0.08, ease: EASE }}>
                  {film.poster_path ? <img src={tmdbImg(film.poster_path, 'w185')} alt="" loading="lazy" /> : <span>{film.title?.slice(0, 14) ?? ''}</span>}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: reduced ? 0 : 1.7, ease: EASE }}>
          Tonight is <em>yours.</em>
        </motion.h1>

        <motion.div className="ob-celebration-next" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.65, delay: reduced ? 0 : 2.0, ease: EASE }}>
          <p>Next up</p>
          <span>Tell us how tonight feels. A few quick questions, then one film for your night — with the case for why it fits.</span>
        </motion.div>

        <motion.button
          className="ob-celebration-action"
          type="button"
          onClick={onContinue}
          disabled={!ready || continuing}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduced ? 0 : 2.25, ease: EASE }}
        >
          {continuing ? 'Opening…' : ready ? 'Find my first film' : 'Tuning your first picks…'}
        </motion.button>
      </motion.div>
    </div>
  )
}
