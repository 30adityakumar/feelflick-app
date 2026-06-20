// src/features/home/components/HomeRecommendationSection.jsx
// One bounded, poster-led recommendation group on the redesigned Home.
//
// Heading (title + desktop-only subtitle + grounded "i" disclosure) over a
// 5-up poster grid that collapses to a horizontal snap carousel on mobile.
// Bounded by design — never an infinite feed; the row engine already enforced a
// per-row minimum, here we cap the visible count so the row stays a finite,
// scannable selection.
//
// Exposure logging: when the row's films materialise we log a 'carousel'
// surface impression for them (best-effort, the same logSurfaceImpressions
// contract the prior Home tail used) so shown→clicked attribution works for the
// new rows too. Per-day-deduped by the impressions table's unique key.

import { useEffect, useId, useMemo, useState } from 'react'

import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { logSurfaceImpressions } from '@/shared/services/recommendations'
import HomeMovieCard from './HomeMovieCard'
import HomeSectionInfo from './HomeSectionInfo'

const MAX_FILMS = 5

export default function HomeRecommendationSection({ rowKey, title, subtitle, note, films }) {
  const { user } = useAuthSession()
  const [open, setOpen] = useState(false)
  const headingId = useId()
  const noteId = useId()

  const visible = useMemo(() => (films || []).slice(0, MAX_FILMS), [films])
  const filmKey = visible.map(f => f.id).join(',')

  useEffect(() => {
    if (!user?.id || visible.length === 0) return
    logSurfaceImpressions({
      userId: user.id,
      films: visible,
      placement: 'carousel',
      pickReasonType: rowKey || 'home_row',
      pickReasonLabel: title,
    }).catch(() => { /* non-fatal — exposure logging is best-effort */ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filmKey])

  if (visible.length === 0) return null

  return (
    <section className="ff-hsection" aria-labelledby={headingId}>
      <header className="ff-hsection__head">
        <div className="ff-hsection__titleline">
          <h2 id={headingId} className="ff-hsection__title">{title}</h2>
          {note ? (
            <HomeSectionInfo
              open={open}
              onToggle={() => setOpen(v => !v)}
              controlsId={noteId}
              label={`How “${title}” was determined`}
            />
          ) : null}
        </div>
        {subtitle ? <p className="ff-hsection__sub">{subtitle}</p> : null}
      </header>

      {note ? (
        <div id={noteId} role="region" className={`ff-hsection__note${open ? ' is-open' : ''}`} hidden={!open}>
          {note}
        </div>
      ) : null}

      <div className="ff-hrow" role="list">
        {visible.map((film, i) => (
          <div className="ff-hrow__cell" role="listitem" key={film.id ?? i}>
            <HomeMovieCard film={film} index={i} placement="carousel" rowTitle={title} />
          </div>
        ))}
      </div>
    </section>
  )
}
