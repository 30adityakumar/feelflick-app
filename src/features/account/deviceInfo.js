// src/features/account/deviceInfo.js
// Best-effort current-device description from the browser UA + auth provider. This is the ONLY
// session fact available to the client (Supabase exposes only the current session) — so we never
// claim "active now", a device list, or per-device timestamps.

export function describeDevice(authUser) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const browser =
    /Edg\//.test(ua) ? 'Edge'
      : /OPR\//.test(ua) ? 'Opera'
        : /Firefox\//.test(ua) ? 'Firefox'
          : /Chrome\//.test(ua) ? 'Chrome'
            : /Safari\//.test(ua) ? 'Safari'
              : 'your browser'
  const os =
    /iPhone|iPad|iPod/.test(ua) ? 'iOS'
      : /Mac OS X/.test(ua) ? 'macOS'
        : /Android/.test(ua) ? 'Android'
          : /Windows/.test(ua) ? 'Windows'
            : /Linux/.test(ua) ? 'Linux'
              : ''
  const device =
    /iPhone/.test(ua) ? 'iPhone'
      : /iPad/.test(ua) ? 'iPad'
        : /Android/.test(ua) ? 'Android device'
          : 'This device'
  const provider = authUser?.app_metadata?.provider
  const providerLabel = provider === 'google' ? 'signed in with Google' : 'signed in with email'
  const line = `${browser}${os ? ` on ${os}` : ''} · ${providerLabel}`
  return { device, browser, os, provider: provider || 'email', line }
}
