// src/app/homepage/components/StarterRows.jsx
/**
 * StarterRows — shown to low-confidence profiles (< 10 data points / tier='cold').
 *
 * Three unconditional rows that work without embedding seeds or taste DNA:
 *   1. "Top rated in your genres"    — from user_preferences, language-aware
 *   2. "Popular in {language}"       — primary language + neighbor fallback
 *   3. "Great starting points"       — global crowd_pleaser films, ff_audience_rating ≥ 80
 *
 * Each row fetches independently so one failure doesn't blank the page.
 */

import { useEffect, useState } from 'react'
import { Film, Globe, Star } from 'lucide-react'

import {
  getTopRatedInGenres,
  getPopularInLanguage,
  getGreatStartingPoints,
} from '@/shared/services/recommendations'
import PersonalizedCarouselRow from './PersonalizedCarouselRow'
import { SectionErrorBoundary } from '@/app/ErrorBoundary'

// ISO 639-1 → display name for the row subtitle
const LANG_DISPLAY = {
  hi: 'Hindi', ta: 'Tamil', te: 'Telugu', ml: 'Malayalam', kn: 'Kannada',
  bn: 'Bengali', pa: 'Punjabi', mr: 'Marathi', gu: 'Gujarati',
  ko: 'Korean', ja: 'Japanese', zh: 'Chinese', cn: 'Cantonese',
  fr: 'French', de: 'German', es: 'Spanish', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', ar: 'Arabic', tr: 'Turkish',
  th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', nl: 'Dutch', pl: 'Polish',
  fa: 'Persian', he: 'Hebrew',
}

function langLabel(code) {
  return LANG_DISPLAY[code] || code?.toUpperCase() || 'Your language'
}

/**
 * Minimal fetch hook for a single starter row.
 * @param {() => Promise<any>} fetchFn
 * @param {string} key - stable key; re-fetches when it changes
 */
function useStarterRow(fetchFn, key) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!key) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    fetchFn()
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { console.error('[StarterRows]', err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { data, loading }
}

/**
 * @param {{ userId: string }} props
 */
export default function StarterRows({ userId }) {
  const rowKey = userId || ''

  const genres = useStarterRow(
    () => getTopRatedInGenres(userId, { limit: 20 }),
    rowKey,
  )

  const langRow = useStarterRow(
    () => getPopularInLanguage(userId, { limit: 20 }),
    rowKey,
  )

  const starters = useStarterRow(
    () => getGreatStartingPoints(userId, { limit: 20 }),
    rowKey,
  )

  const langCode = langRow.data?.language || null
  const langFilms = langRow.data?.films || []

  return (
    <>
      <SectionErrorBoundary label="Top rated in your genres">
        <PersonalizedCarouselRow
          title="Top rated in your genres"
          movies={genres.data || []}
          loading={genres.loading}
          icon={Star}
          rowId="starter-genres"
          placement="home"
        />
      </SectionErrorBoundary>

      {(langRow.loading || langFilms.length > 0) && (
        <SectionErrorBoundary label="Popular in your language">
          <PersonalizedCarouselRow
            title={langCode ? `Popular in ${langLabel(langCode)}` : 'Popular in your language'}
            movies={langFilms}
            loading={langRow.loading}
            icon={Globe}
            rowId="starter-language"
            placement="home"
          />
        </SectionErrorBoundary>
      )}

      <SectionErrorBoundary label="Great starting points">
        <PersonalizedCarouselRow
          title="Great starting points"
          movies={starters.data || []}
          loading={starters.loading}
          icon={Film}
          rowId="starter-global"
          placement="home"
        />
      </SectionErrorBoundary>
    </>
  )
}
