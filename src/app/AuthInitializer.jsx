// src/app/AuthInitializer.jsx 
// src/app/AuthInitializer.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase/client'

function SplashSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-gradient-to-br from-[#0a121a] via-[#0d1722] to-[#0c1017]">
      <div className="flex flex-col items-center gap-4">
        <svg className="h-10 w-10 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity=".25"
            strokeWidth="4"
          />
          <path d="M21 12a9 9 0 0 0-9-9v9z" fill="currentColor" />
        </svg>
        <span className="text-base font-semibold text-white/80">
          Signing you in...
        </span>
      </div>
    </div>
  )
}

/**
 * Global gate that:
 *  - On first load, checks if URL has #access_token & refresh_token
 *  - If yes, calls supabase.auth.setSession(...) to persist the session
 *  - Cleans the hash from the URL
 *  - Only then renders the actual app (RouterProvider)
 */
export default function AuthInitializer({ children }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function initAuthFromHash() {
      try {
        const hash = window.location.hash

        // Only do anything if we see an OAuth-style hash
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')

          if (access_token && refresh_token) {
            console.log('[AuthInitializer] Found tokens in hash, setting Supabase session...')

            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })

            if (error) {
              console.error('[AuthInitializer] Error setting Supabase session', error)
            } else {
              console.log('[AuthInitializer] Session established from OAuth callback')

              // Clean token fragment from URL: keep path + query, drop #...
              const cleanUrl =
                window.location.origin +
                window.location.pathname +
                window.location.search

              window.history.replaceState(null, '', cleanUrl)
            }
          } else {
            console.warn('[AuthInitializer] Hash had no access_token/refresh_token')
          }
        }
      } catch (e) {
        console.error('[AuthInitializer] Unexpected error processing OAuth hash', e)
      } finally {
        setIsReady(true)
      }
    }

    initAuthFromHash()
  }, [])

  if (!isReady) {
    // While we’re processing the hash, don’t render the router at all.
    return <SplashSpinner />
  }

  return children
}