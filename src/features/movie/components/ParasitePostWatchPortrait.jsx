// src/features/movie/components/ParasitePostWatchPortrait.jsx
// Parasite-ONLY curated post-watch portrait (§16). Lazy-loaded — this file and
// the spoiler text it imports are NOT in the pre-watch bundle. Rendered only when:
// signed in + persisted Watched + mv.id === 496243 (gate enforced by the parent).

import FilmPortrait from './FilmPortrait'
import { PARASITE_PORTRAIT } from '../curated/parasiteFilmPortrait'

export default function ParasitePostWatchPortrait() {
  return <FilmPortrait portrait={PARASITE_PORTRAIT} />
}
