import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * After each navigation, focuses the #main region and scrolls to top.
 * Ensures keyboard users land in the right place.
 */
export default function FocusOnNavigate({ selector = '#main' }) {
  const { pathname } = useLocation()

  useEffect(() => {
    const el = document.querySelector(selector)
    if (el) {
      // ensure focusable
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
      el.focus({ preventScroll: true })
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, selector])

  return null
}