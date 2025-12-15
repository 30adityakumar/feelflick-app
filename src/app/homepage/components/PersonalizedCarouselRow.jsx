// src/app/homepage/components/PersonalizedCarouselRow.jsx
/**
 * PersonalizedCarouselRow
 *
 * A thin, production-safe wrapper around the shared <CarouselRow /> component.
 *
 * Goals:
 * - Never crash HomePage if upstream returns odd data shapes.
 * - Avoid rendering empty rows (Netflix-style: only show rows that have content).
 * - Keep props stable (dedupe + filter) to reduce unnecessary re-renders.
 * - Support a row anchor (rowId) and optional retry action.
 */

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import CarouselRow from '@/components/carousel/Row'

function getMovieKey(movie) {
  // Prefer tmdb_id (stable across environments), fall back to internal id.
  return movie?.tmdb_id ?? movie?.id ?? null
}

function normalizeMovies(input) {
  if (!Array.isArray(input) || input.length === 0) return []

  const seen = new Set()
  const out = []

  for (const m of input) {
    if (!m) continue

    const key = getMovieKey(m)
    if (key == null) continue

    // Carousels look broken without posters; filter them out.
    if (!m.poster_path) continue

    if (seen.has(key)) continue
    seen.add(key)
    out.push(m)
  }

  return out
}

function normalizeError(err) {
  if (!err) return null
  if (typeof err === 'string') return err
  if (err?.message) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return 'Something went wrong'
  }
}

export default function PersonalizedCarouselRow({
  title,
  movies = [],
  loading = false,
  error = null,
  icon: Icon = Sparkles,
  rowId = undefined,
  placement = 'home',
  priority = false,
  hideWhenEmpty = true,
  onRetry = undefined,
} = {}) {
  const safeTitle = typeof title === 'string' ? title.trim() : title

  const validMovies = useMemo(() => normalizeMovies(movies), [movies])
  const safeError = useMemo(() => normalizeError(error), [error])

  // If we have nothing to show and we're not loading and there's no error,
  // skip the row entirely (keeps the homepage clean + fast).
  if (!safeTitle) return null
  if (!loading && !safeError && hideWhenEmpty && validMovies.length === 0) return null

  const titleNode =
    typeof safeTitle === 'string' ? (
      <span className="inline-flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-white/70" /> : null}
        <span>{safeTitle}</span>
      </span>
    ) : (
      safeTitle
    )

  return (
    <section
      id={rowId}
      aria-label={typeof title === 'string' ? title : undefined}
      data-placement={placement}
      className="w-full"
    >
      <CarouselRow
        title={titleNode}
        items={validMovies}
        loading={Boolean(loading)}
        error={safeError}
        priority={Boolean(priority)}
        placement={placement}
        onRetry={typeof onRetry === 'function' ? onRetry : undefined}
      />
    </section>
  )
}
