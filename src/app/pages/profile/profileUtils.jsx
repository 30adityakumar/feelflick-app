// src/app/pages/profile/profileUtils.js
// Shared constants, helpers, and components for TasteProfile & PublicProfile.

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import { tmdbImg } from '@/shared/api/tmdb'

// ============================================================================
// CONSTANTS
// ============================================================================

export const GENRE_ID_TO_NAME = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
}

/** @type {Array<[number, string]>} [minRating (on /5 scale), label] */
export const RATING_PERSONALITY = [
  [4.5, 'A generous rater \u2014 finds the good in everything.'],
  [3.5, 'A balanced critic \u2014 fair but discerning.'],
  [0, 'A tough critic \u2014 only the best earns praise.'],
]

/** First-person variants (for own profile). */
export const RATING_PERSONALITY_SELF = [
  [4.5, 'You\'re a generous rater \u2014 you find the good in everything.'],
  [3.5, 'You\'re a balanced critic \u2014 fair but discerning.'],
  [0, 'You\'re a tough critic \u2014 only the best earns your praise.'],
]

export const TASTE_SUMMARIES = {
  'Drama-Cozy': 'Gravitates toward heartfelt dramas that feel like a warm blanket on a cold night.',
  'Drama-Heartbroken': 'Seeks out raw emotional stories that let you feel everything deeply.',
  'Drama-Dark': 'Gravitates toward emotionally intense films that don\'t let you off easy.',
  'Comedy-Silly': 'Loves a good laugh and never apologizes for wanting pure, joyful entertainment.',
  'Comedy-Cozy': 'Reaches for feel-good comedies that leave you smiling long after the credits.',
  'Thriller-Dark': 'Craves tension and the thrill of stories that push into shadowy territory.',
  'Thriller-Energized': 'Lives for edge-of-your-seat cinema that keeps your heart pounding.',
  'Action-Adventurous': 'Watches films to feel alive \u2014 the bigger the stakes, the better.',
  'Action-Energized': 'Lives for high-octane cinema that keeps your pulse racing start to finish.',
  'Horror-Dark': 'Drawn to the edge of fear, finding beauty in cinema\'s darkest corners.',
  'Science Fiction-Curious': 'A cinematic explorer, drawn to big ideas and unknown frontiers.',
  'Romance-Romantic': 'Believes in the power of love stories and never tires of a great romance.',
  'Romance-Cozy': 'A romantic at heart, drawn to tender stories that warm the soul.',
  'Documentary-Curious': 'Has an insatiable appetite for truth and real stories that expand your world.',
  'Animation-Cozy': 'Appreciates the artistry of animation and the comfort of beautifully told stories.',
  'Crime-Dark': 'Fascinated by the criminal mind and stories that probe moral grey zones.',
}

export const TASTE_FALLBACK = 'Eclectic taste \u2014 a true cinematic omnivore who refuses to be boxed in.'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve a genre value (TMDB JSONB is polymorphic) to a human-readable name.
 * Handles: integer IDs, {id, name} objects, and plain strings.
 * @param {number|string|{id?:number, name?:string}} g
 * @returns {string|null}
 */
export function resolveGenreName(g) {
  if (!g && g !== 0) return null
  if (typeof g === 'object' && g.name) return g.name
  if (typeof g === 'object' && g.id) return GENRE_ID_TO_NAME[g.id] || null
  if (typeof g === 'number') return GENRE_ID_TO_NAME[g] || null
  if (typeof g === 'string') {
    const parsed = parseInt(g, 10)
    if (!isNaN(parsed)) return GENRE_ID_TO_NAME[parsed] || null
    return g
  }
  return null
}

/**
 * Count occurrences in an array of strings, return sorted desc.
 * @param {string[]} items
 * @returns {Array<{name: string, count: number}>}
 */
export function countAndSort(items) {
  const map = new Map()
  for (const item of items) {
    if (!item) continue
    map.set(item, (map.get(item) || 0) + 1)
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * @param {string|null} dateStr
 * @returns {string|null}
 */
export function formatMemberSince(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return null
  }
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

/** Section header — matches CLAUDE.md pattern. */
export function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
      <h2 className="text-[1.05rem] sm:text-[1.15rem] font-bold text-white tracking-tight whitespace-nowrap">
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-purple-400/20 via-white/5 to-transparent" />
    </div>
  )
}

/** Motion-animated stat card wrapper. */
export function StatCard({ children, index = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className={`rounded-2xl border border-white/8 bg-white/[0.03] p-4 ${className}`}
    >
      {children}
    </motion.div>
  )
}

/**
 * Profile avatar with gradient fallback.
 * @param {{ name: string, avatarUrl: string|null, size?: number }} props
 */
export function ProfileAvatar({ name, avatarUrl, size = 64 }) {
  const initials = (name || 'U')
    .trim()
    .split(' ')
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join('')

  if (avatarUrl) {
    return (
      <div
        className="rounded-full overflow-hidden shrink-0 ring-2 ring-purple-500/20"
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover block"
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-black text-white shadow-lg"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        background: 'linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153))',
      }}
    >
      {initials}
    </div>
  )
}

/**
 * Stat pill — renders as Link, button, or static div depending on props.
 * @param {{ icon: import('lucide-react').LucideIcon, value: number, label: string, to?: string, onClick?: () => void, className?: string }} props
 */
export function StatPill({ icon: Icon, value, label, to, onClick, className }) {
  const inner = (
    <>
      <Icon className="h-3.5 w-3.5 text-purple-400/60" />
      <span className="text-xs text-white/70 font-medium">
        <span className="text-white font-semibold">{value}</span> {label}
      </span>
    </>
  )

  const baseClass = `inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/8 px-3.5 py-1.5 transition-colors duration-200 ${className || ''}`

  if (to) {
    return (
      <Link to={to} className={`${baseClass} hover:bg-white/8`} aria-label={`View ${label}`}>
        {inner}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseClass} cursor-pointer hover:bg-white/8`} aria-label={`View ${label}`}>
        {inner}
      </button>
    )
  }

  return <div className={baseClass}>{inner}</div>
}

/**
 * Sidebar list card with stacked poster thumbnails.
 * Reuses the visual pattern from ListsPage.
 * @param {{ list: { id: string, title: string, description?: string, film_count?: number }, posters: string[] }} props
 */
export function SidebarListCard({ list, posters }) {
  return (
    <Link
      to={`/lists/${list.id}`}
      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-colors"
    >
      {/* Stacked posters */}
      <div className="relative w-12 h-16 flex-shrink-0">
        {posters.length > 0 ? (
          posters.slice(0, 3).map((posterPath, idx) => (
            <img
              key={idx}
              src={tmdbImg(posterPath, 'w92')}
              alt=""
              className="absolute rounded-md object-cover w-9 h-[3.25rem] ring-1 ring-black/50"
              style={{
                top: idx * 3,
                left: idx * 4,
                zIndex: 3 - idx,
              }}
              loading="lazy"
            />
          ))
        ) : (
          [0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="absolute rounded-md w-9 h-[3.25rem] bg-white/5 ring-1 ring-white/8"
              style={{
                top: idx * 3,
                left: idx * 4,
                zIndex: 3 - idx,
              }}
            />
          ))
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight line-clamp-2">{list.title}</p>
        <p className="text-xs text-white/40 mt-0.5">
          {list.film_count ?? 0} {(list.film_count ?? 0) === 1 ? 'film' : 'films'}
        </p>
      </div>
    </Link>
  )
}
