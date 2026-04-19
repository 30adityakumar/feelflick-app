import { useMemo } from 'react'
import { Link } from 'react-router-dom'

/**
 * Visual taste signature from watched film aggregates.
 * @param {Array} history - user_history rows with nested movies(mood_tags, tone_tags, fit_profile)
 */
export default function TasteFingerprint({ history }) {
  const { topMoods, topTones, topFits, total } = useMemo(() => {
    const moods = {}, tones = {}, fits = {}
    let count = 0

    for (const h of history || []) {
      const m = h.movies
      if (!m) continue
      count++
      ;(m.mood_tags || []).forEach(t => { moods[t] = (moods[t] || 0) + 1 })
      ;(m.tone_tags || []).forEach(t => { tones[t] = (tones[t] || 0) + 1 })
      if (m.fit_profile) fits[m.fit_profile] = (fits[m.fit_profile] || 0) + 1
    }

    const top = (obj, n) => Object.entries(obj)
      .sort(([,a],[,b]) => b - a)
      .slice(0, n)
      .map(([key, c]) => ({ key, count: c, share: count > 0 ? c / count : 0 }))

    return {
      topMoods: top(moods, 12),
      topTones: top(tones, 6),
      topFits: top(fits, 5),
      total: count,
    }
  }, [history])

  if (total < 5) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <p className="text-sm text-white/40">
          Watch 5 films to reveal your taste fingerprint.{total > 0 ? ` ${5 - total} more to go.` : ''}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-1">Taste Fingerprint</p>
        <p className="text-xs text-white/55">Based on {total} watched films</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Mood cloud — sized by share */}
        {topMoods.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/55 mb-3">You gravitate toward</p>
            <div className="flex flex-wrap gap-2 items-baseline">
              {topMoods.map(({ key, share }) => {
                const size = share > 0.4 ? 'text-2xl' : share > 0.25 ? 'text-lg' : share > 0.15 ? 'text-sm' : 'text-xs'
                const opacity = share > 0.25 ? 'text-white' : share > 0.15 ? 'text-white/75' : 'text-white/45'
                return (
                  <Link
                    key={key}
                    to={`/mood/${encodeURIComponent(key)}`}
                    className={`${size} ${opacity} font-bold hover:text-purple-300 transition-colors`}
                  >
                    {key}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Tone cloud */}
        {topTones.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/55 mb-3">Your tonal range</p>
            <div className="flex flex-wrap gap-2">
              {topTones.map(({ key, share }) => (
                <Link
                  key={key}
                  to={`/tone/${encodeURIComponent(key)}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-colors"
                >
                  {key} <span className="text-white/30">{Math.round(share * 100)}%</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Fit profile bars */}
        {topFits.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/55 mb-3">What you watch</p>
            <div className="space-y-2">
              {topFits.map(({ key, share }) => (
                <Link
                  key={key}
                  to={`/browse/fit/${key}`}
                  className="block group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/75 group-hover:text-white w-40 flex-shrink-0 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500/60 to-pink-500/60"
                        style={{ width: `${Math.round(share * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/40 w-10 text-right tabular-nums">
                      {Math.round(share * 100)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
