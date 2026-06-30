// src/features/landing/components/LandingAuthStatus.jsx
// The single landing-owned, accessible OAuth failure surface (§18). Announces once
// via role="alert" when an error appears (not a repeated live region), offers a
// keyboard-reachable retry + dismiss, and never shows a fake success state.
import { useLandingAuth } from '../LandingAuth'

export default function LandingAuthStatus() {
  const { authError, clearAuthError, startGoogleAuth, isAuthenticating } = useLandingAuth()
  if (!authError) return null
  return (
    <div className="ff-l-authstatus" role="alert">
      <p className="ff-l-authstatus__msg">{authError}</p>
      <div className="ff-l-authstatus__actions">
        <button type="button" className="ff-l-btn ff-l-btn--primary" onClick={startGoogleAuth} disabled={isAuthenticating}>
          {isAuthenticating ? 'Opening Google…' : 'Try again'}
        </button>
        <button type="button" className="ff-l-btn ff-l-btn--ghost" onClick={clearAuthError}>Dismiss</button>
      </div>
    </div>
  )
}
