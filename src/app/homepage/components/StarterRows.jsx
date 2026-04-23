// src/app/homepage/components/StarterRows.jsx
/**
 * StarterRows — shown to low-confidence profiles (tier='cold').
 *
 * Three rows for users with too little watch history for taste-DNA rows:
 *   1. "Top rated in your genres"    — from user_preferences, language-aware
 *   2. "Popular in {language}"       — primary language + neighbor fallback
 *   3. "Great starting points"       — global crowd_pleaser films, ≥80 audience rating
 *
 * Rows are fetched in parallel, then globally deduped so no film appears twice.
 * Rows with fewer than 8 films after dedup are hidden.
 * Accepts excludeIds from parent (hero + topOfTaste) to prevent cross-surface repeats.
 */

import { useEffect, useMemo, useState } from 'react'
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

const MIN_ROW_SIZE = 8

/**
 * @param {{ userId: string, excludeIds?: number[] }} props
 *   excludeIds — internal movie IDs already shown in hero / TopOfTaste
 */
export default function StarterRows({ userId, excludeIds = [] }) {
  const [genresRaw, setGenresRaw] = useState(null)
  const [langRaw, setLangRaw] = useState(null)
  const [startingRaw, setStartingRaw] = useState(null)
  const [loading, setLoading] = useState(true)

  const rowKey = userId || ''
  const excludeKey = excludeIds.join(',')

  useEffect(() => {
    if (!rowKey) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    // Fetch all 3 rows in parallel
    Promise.allSettled([
      getTopRatedInGenres(userId, { limit: 24 }),
      getPopularInLanguage(userId, { limit: 24 }),
      getGreatStartingPoints(userId, { limit: 24 }),
    ]).then(([genresRes, langRes, startingRes]) => {
      if (cancelled) return
      setGenresRaw(genresRes.status === 'fulfilled' ? genresRes.value : null)
      setLangRaw(langRes.status === 'fulfilled' ? langRes.value : null)
      setStartingRaw(startingRes.status === 'fulfilled' ? startingRes.value : null)
      setLoading(false)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowKey, excludeKey])

  // Global dedup across all 3 rows (+ excludeIds from hero/topOfTaste)
  const deduped = useMemo(() => {
    const seen = new Set(excludeIds.filter(Boolean))

    function take(arr) {
      if (!arr) return []
      return arr.filter(m => {
        if (!m?.id || seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })
    }

    const genres = take(Array.isArray(genresRaw) ? genresRaw : null)
    const langFilms = take(Array.isArray(langRaw?.films) ? langRaw.films : null)
    const starting = take(Array.isArray(startingRaw) ? startingRaw : null)

    return { genres, langFilms, langCode: langRaw?.language || null, starting }
  }, [genresRaw, langRaw, startingRaw, excludeIds])

  return (
    <>
      <SectionErrorBoundary label="Top rated in your genres">
        <PersonalizedCarouselRow
          title="Top rated in your genres"
          movies={deduped.genres}
          loading={loading}
          icon={Star}
          rowId="starter-genres"
          placement="home"
        />
      </SectionErrorBoundary>

      {(loading || deduped.langFilms.length >= MIN_ROW_SIZE) && (
        <SectionErrorBoundary label="Popular in your language">
          <PersonalizedCarouselRow
            title={deduped.langCode ? `Popular in ${langLabel(deduped.langCode)}` : 'Popular in your language'}
            movies={deduped.langFilms}
            loading={loading}
            icon={Globe}
            rowId="starter-language"
            placement="home"
          />
        </SectionErrorBoundary>
      )}

      {(loading || deduped.starting.length >= MIN_ROW_SIZE) && (
        <SectionErrorBoundary label="Great starting points">
          <PersonalizedCarouselRow
            title="Great starting points"
            movies={deduped.starting}
            loading={loading}
            icon={Film}
            rowId="starter-global"
            placement="home"
          />
        </SectionErrorBoundary>
      )}
    </>
  )
}
