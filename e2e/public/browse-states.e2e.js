import { test, expect } from '@playwright/test'

// F2-A: Browse must render three TRUTHFUL data states. A failed catalog fetch
// must never masquerade as "zero matches" (filter advice for a server error).
// All states are forced via network interception of the Supabase movies
// endpoint — no backend or data dependencies, anonymous context.

const MOVIES_API = '**/rest/v1/movies*'

// Minimal row satisfying Browse's SELECT + mapRowToFilm guards (missing
// numeric scores default via `|| 0`; null poster falls back to a text card).
const RECOVERY_ROW = {
  id: 901001,
  tmdb_id: 901001,
  title: 'Recovery Test Film',
  poster_path: null,
  backdrop_path: null,
  release_date: '2020-01-01',
  release_year: 2020,
  vote_average: 7.5,
  vote_count: 1200,
  ff_final_rating: 7.5,
  ff_confidence: 0.8,
  original_language: 'en',
  runtime: 110,
  primary_genre: 'Drama',
  genres: ['Drama'],
  overview: 'A film that only exists to prove the retry path works.',
  pacing_score: 50,
  intensity_score: 50,
  emotional_depth_score: 50,
  cult_status_score: 0,
  discovery_potential: 0,
  accessibility_score: 50,
  vfx_level_score: 0,
  director_name: 'Test Director',
  dialogue_density: 50,
  attention_demand: 50,
  ff_critic_rating: 75,
  ff_critic_confidence: 0.8,
  ff_audience_rating: 7.5,
  ff_audience_confidence: 0.8,
  ff_rating_genre_normalized: 7.5,
  ff_critic_audience_gap: 0,
  mood_tags: [],
}

const fulfill500 = (route) =>
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'forced failure (e2e)' }),
  })

const fulfillRows = (route, rows) =>
  route.fulfill({
    status: 200,
    headers: {
      'content-type': 'application/json',
      'content-range': rows.length ? `0-${rows.length - 1}/${rows.length}` : '*/0',
    },
    body: JSON.stringify(rows),
  })

test('fetch failure renders the error state, never the filter-advice empty state', async ({ page }) => {
  await page.route(MOVIES_API, fulfill500)
  await page.goto('/browse')

  const alert = page.getByRole('alert')
  await expect(alert).toContainText('The catalog didn’t load.', { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()

  for (const banned of ['Nothing matches', 'Loosen a filter', '0 films']) {
    await expect(page.locator('body')).not.toContainText(banned)
  }
})

test('"Try again" re-runs the fetch and recovers', async ({ page }) => {
  let failing = true
  await page.route(MOVIES_API, (route) =>
    failing ? fulfill500(route) : fulfillRows(route, [RECOVERY_ROW])
  )

  await page.goto('/browse')
  await expect(page.getByRole('alert')).toContainText('The catalog didn’t load.', { timeout: 15_000 })

  failing = false
  await page.getByRole('button', { name: 'Try again' }).click()

  await expect(page.getByText('Recovery Test Film').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a genuine empty result keeps the filter-advice empty state', async ({ page }) => {
  await page.route(MOVIES_API, (route) => fulfillRows(route, []))
  await page.goto('/browse')

  await expect(page.getByText('Nothing matches.')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Loosen a filter, or clear them all.')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('body')).not.toContainText('didn’t load')
})
