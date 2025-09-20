import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Announces route changes for screen readers via aria-live.
 * Keeps copy simple and uses document.title when available.
 */
export default function RouteAnnouncer() {
  const { pathname } = useLocation()
  const [message, setMessage] = useState('')

  useEffect(() => {
    const title = document.title?.trim() || 'Page'
    setMessage(`Navigated to ${title}`)
  }, [pathname])

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  )
}