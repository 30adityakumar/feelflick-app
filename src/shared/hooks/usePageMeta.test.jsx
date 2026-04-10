import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { usePageMeta } from './usePageMeta'

const DEFAULT_TITLE = 'FeelFlick — Movies that match your mood'
const DEFAULT_DESC = 'Discover movies based on how you feel. Fast, private, and always free.'
const DEFAULT_IMAGE = 'https://app.feelflick.com/og.jpg'
const BASE_URL = 'https://app.feelflick.com'

function Probe({ title = null, description = null, image = null, url = null }) {
  usePageMeta({ title, description, image, url })
  return null
}

function getMetaByProperty(property) {
  return document.querySelector(`meta[property="${property}"]`)?.getAttribute('content')
}

function getMetaByName(name) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')
}

describe('usePageMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.title = 'Original title'
  })

  it('sets movie-specific title/meta/canonical values', () => {
    render(
      <Probe
        title="Interstellar (2014) — FeelFlick"
        description="A sci-fi epic with emotional depth."
        image="https://image.tmdb.org/t/p/w1280/interstellar.jpg"
        url="https://app.feelflick.com/movie/157336"
      />
    )

    expect(document.title).toBe('Interstellar (2014) — FeelFlick')
    expect(getMetaByName('description')).toBe('A sci-fi epic with emotional depth.')
    expect(getMetaByProperty('og:title')).toBe('Interstellar (2014) — FeelFlick')
    expect(getMetaByProperty('og:description')).toBe('A sci-fi epic with emotional depth.')
    expect(getMetaByProperty('og:image')).toBe('https://image.tmdb.org/t/p/w1280/interstellar.jpg')
    expect(getMetaByProperty('og:url')).toBe('https://app.feelflick.com/movie/157336')
    expect(getMetaByName('twitter:title')).toBe('Interstellar (2014) — FeelFlick')
    expect(getMetaByName('twitter:description')).toBe('A sci-fi epic with emotional depth.')
    expect(getMetaByName('twitter:image')).toBe('https://image.tmdb.org/t/p/w1280/interstellar.jpg')
    expect(getMetaByName('twitter:url')).toBe('https://app.feelflick.com/movie/157336')
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://app.feelflick.com/movie/157336')
  })

  it('applies defaults when values are null', () => {
    render(<Probe />)

    expect(document.title).toBe(DEFAULT_TITLE)
    expect(getMetaByName('description')).toBe(DEFAULT_DESC)
    expect(getMetaByProperty('og:title')).toBe(DEFAULT_TITLE)
    expect(getMetaByProperty('og:description')).toBe(DEFAULT_DESC)
    expect(getMetaByProperty('og:image')).toBe(DEFAULT_IMAGE)
    expect(getMetaByProperty('og:url')).toBe(BASE_URL)
    expect(getMetaByName('twitter:title')).toBe(DEFAULT_TITLE)
    expect(getMetaByName('twitter:description')).toBe(DEFAULT_DESC)
    expect(getMetaByName('twitter:image')).toBe(DEFAULT_IMAGE)
    expect(getMetaByName('twitter:url')).toBe(BASE_URL)
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(BASE_URL)
  })

  it('restores defaults and previous title on unmount', () => {
    document.title = 'Page before movie detail'

    const { unmount } = render(
      <Probe
        title="Blade Runner 2049 (2017) — FeelFlick"
        description="Neo-noir mood and atmosphere."
        image="https://image.tmdb.org/t/p/w1280/blade.jpg"
        url="https://app.feelflick.com/movie/335984"
      />
    )

    expect(document.title).toBe('Blade Runner 2049 (2017) — FeelFlick')

    unmount()

    expect(document.title).toBe('Page before movie detail')
    expect(getMetaByName('description')).toBe(DEFAULT_DESC)
    expect(getMetaByProperty('og:title')).toBe(DEFAULT_TITLE)
    expect(getMetaByProperty('og:description')).toBe(DEFAULT_DESC)
    expect(getMetaByProperty('og:image')).toBe(DEFAULT_IMAGE)
    expect(getMetaByProperty('og:url')).toBe(BASE_URL)
    expect(getMetaByName('twitter:title')).toBe(DEFAULT_TITLE)
    expect(getMetaByName('twitter:description')).toBe(DEFAULT_DESC)
    expect(getMetaByName('twitter:image')).toBe(DEFAULT_IMAGE)
    expect(getMetaByName('twitter:url')).toBe(BASE_URL)
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(BASE_URL)
  })
})
