import { Link } from 'react-router-dom'

import { trackInteraction } from '@/shared/services/interactions'

const FIT_PROFILE_LABELS = {
  prestige_drama: 'Prestige Drama',
  arthouse: 'Arthouse',
  challenging_art: 'Challenging Art',
  festival_discovery: 'Festival Discovery',
  genre_popcorn: 'Genre Popcorn',
  crowd_pleaser: 'Crowd-Pleaser',
  comfort_watch: 'Comfort Watch',
  cult_classic: 'Cult Classic',
  franchise_entry: 'Franchise',
  niche_world_cinema: 'World Cinema',
}

/**
 * @param {{ movie: object|null }} props
 */
export default function MoodChips({ movie }) {
  if (!movie) return null

  const moodTags = Array.isArray(movie.mood_tags) ? movie.mood_tags.slice(0, 5) : []
  const toneTags = Array.isArray(movie.tone_tags) ? movie.tone_tags.slice(0, 3) : []
  const fitProfile = movie.fit_profile

  if (moodTags.length === 0 && toneTags.length === 0 && !fitProfile) return null

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {fitProfile && (
        <Link
          to={`/browse/fit/${fitProfile}`}
          onClick={() => trackInteraction('mood_chip_click', { metadata: { tag: fitProfile, type: 'fit' } })}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/[0.06] border border-white/20 text-white/80 hover:bg-white/[0.1] hover:border-white/20 transition-colors"
        >
          {FIT_PROFILE_LABELS[fitProfile] || fitProfile.replace(/_/g, ' ')}
        </Link>
      )}
      {moodTags.map((tag) => (
        <Link
          key={`m-${tag}`}
          to={`/mood/${encodeURIComponent(tag)}`}
          onClick={() => trackInteraction('mood_chip_click', { metadata: { tag, type: 'mood' } })}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-200 transition-all hover:bg-purple-500/15 hover:scale-105"
        >
          {tag}
        </Link>
      ))}
      {toneTags.map((tag) => (
        <Link
          key={`t-${tag}`}
          to={`/tone/${encodeURIComponent(tag)}`}
          onClick={() => trackInteraction('mood_chip_click', { metadata: { tag, type: 'tone' } })}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-transparent border border-white/10 text-white/50 hover:text-white/70 hover:border-white/20 transition-colors"
        >
          {tag}
        </Link>
      ))}
    </div>
  )
}
