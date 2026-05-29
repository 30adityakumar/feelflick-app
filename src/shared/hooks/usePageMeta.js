import { useEffect } from 'react'

const DEFAULT_TITLE = 'FeelFlick — Movies that match your mood'
const DEFAULT_DESC = 'Discover movies based on how you feel. Fast, private, and always free.'
const DEFAULT_IMAGE = 'https://app.feelflick.com/og.jpg'
const BASE_URL = 'https://app.feelflick.com'

function setMeta(property, content, isName = false) {
  if (!content) return

  const attr = isName ? 'name' : 'property'
  let el = document.querySelector(`meta[${attr}="${property}"]`)

  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }

  el.setAttribute('content', content)
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]')

  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }

  el.setAttribute('href', url)
}

// Inject/replace a single page-level JSON-LD <script>. Pass null to remove it.
function setJsonLd(json) {
  const id = 'page-ld-json'
  let el = document.getElementById(id)
  if (!json) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = json
}

/**
 * Sets page-level SEO tags from runtime route data and restores FeelFlick defaults on cleanup.
 *
 * @param {Object} params - Dynamic page metadata.
 * @param {string|null} params.title - Page title.
 * @param {string|null} params.description - Meta description.
 * @param {string|null} params.image - OG/Twitter image URL.
 * @param {string|null} params.url - Canonical/OG/Twitter URL.
 * @param {Object|null} [params.jsonLd] - schema.org structured data injected as JSON-LD; removed on cleanup.
 * @returns {void}
 */
export function usePageMeta({ title, description, image, url, jsonLd }) {
  // Serialize so the effect re-runs only when the structured data actually changes.
  const ldString = jsonLd ? JSON.stringify(jsonLd) : null
  useEffect(() => {
    const prevTitle = document.title

    document.title = title || DEFAULT_TITLE
    setMeta('description', description || DEFAULT_DESC, true)
    setMeta('og:title', title || DEFAULT_TITLE)
    setMeta('og:description', description || DEFAULT_DESC)
    setMeta('og:image', image || DEFAULT_IMAGE)
    setMeta('og:url', url || BASE_URL)
    setMeta('twitter:title', title || DEFAULT_TITLE, true)
    setMeta('twitter:description', description || DEFAULT_DESC, true)
    setMeta('twitter:image', image || DEFAULT_IMAGE, true)
    setMeta('twitter:url', url || BASE_URL, true)
    setCanonical(url || BASE_URL)
    setJsonLd(ldString)

    return () => {
      document.title = prevTitle
      setMeta('description', DEFAULT_DESC, true)
      setMeta('og:title', DEFAULT_TITLE)
      setMeta('og:description', DEFAULT_DESC)
      setMeta('og:image', DEFAULT_IMAGE)
      setMeta('og:url', BASE_URL)
      setMeta('twitter:title', DEFAULT_TITLE, true)
      setMeta('twitter:description', DEFAULT_DESC, true)
      setMeta('twitter:image', DEFAULT_IMAGE, true)
      setMeta('twitter:url', BASE_URL, true)
      setCanonical(BASE_URL)
      setJsonLd(null)
    }
  }, [title, description, image, url, ldString])
}
