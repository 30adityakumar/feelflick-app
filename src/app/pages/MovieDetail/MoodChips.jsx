import { Link } from 'react-router-dom'

const MOOD_COLORS = {
  // warm
  cozy: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fcd34d' },
  heartwarming: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fcd34d' },
  tender: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fcd34d' },
  uplifting: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fcd34d' },
  nostalgic: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fcd34d' },
  inspiring: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fcd34d' },
  empowering: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fcd34d' },
  // dark
  dark: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', text: '#c4b5fd' },
  haunting: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', text: '#c4b5fd' },
  unsettling: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', text: '#c4b5fd' },
  gritty: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', text: '#c4b5fd' },
  devastating: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', text: '#c4b5fd' },
  melancholic: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', text: '#c4b5fd' },
  somber: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', text: '#c4b5fd' },
  bittersweet: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', text: '#c4b5fd' },
  // tense
  tense: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
  suspenseful: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
  intense: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
  thrilling: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
  exhilarating: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
  // playful
  playful: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#86efac' },
  whimsical: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#86efac' },
  lighthearted: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#86efac' },
  // cerebral
  mysterious: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
  'mind-bending': { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
  contemplative: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
  meditative: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
  dreamy: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
  provocative: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
  // romance
  romantic: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', text: '#f9a8d4' },
}

const DEFAULT_COLOR = { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.75)' }

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
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/[0.06] border border-white/15 text-white/85 hover:bg-white/[0.1] hover:border-white/25 transition-colors"
        >
          {FIT_PROFILE_LABELS[fitProfile] || fitProfile.replace(/_/g, ' ')}
        </Link>
      )}
      {moodTags.map((tag) => {
        const c = MOOD_COLORS[tag] || DEFAULT_COLOR
        return (
          <Link
            key={`m-${tag}`}
            to={`/mood/${encodeURIComponent(tag)}`}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
            style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
          >
            {tag}
          </Link>
        )
      })}
      {toneTags.map((tag) => (
        <Link
          key={`t-${tag}`}
          to={`/tone/${encodeURIComponent(tag)}`}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-transparent border border-white/12 text-white/55 hover:text-white/80 hover:border-white/25 transition-colors"
        >
          {tag}
        </Link>
      ))}
    </div>
  )
}
