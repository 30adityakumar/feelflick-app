import { Outlet, useOutletContext } from 'react-router-dom'
import BrandSplash from '@/shared/ui/BrandSplash'
import { useBetaAccess } from './useBetaAccess'
import BetaAccessRequired from './BetaAccessRequired'

/**
 * B1.4 — gates the authenticated private-beta surfaces. Nested INSIDE PostAuthGate (so auth +
 * onboarding are already resolved) and ABOVE the app routes. When the gate is disabled (default)
 * `useBetaAccess` returns 'allowed' with no query, so this is a transparent pass-through; it only
 * blocks when VITE_ENABLE_BETA_GATE is on AND the signed-in user is not an active beta member.
 * Forwards PostAuthGate's outlet context unchanged so downstream routes keep { userId, user, … }.
 */
export default function BetaAccessGate() {
  const ctx = useOutletContext()
  const status = useBetaAccess()
  if (status === 'loading') return <BrandSplash />
  if (status === 'denied') return <BetaAccessRequired />
  if (status === 'error') return <BetaAccessRequired errored />
  return <Outlet context={ctx} />
}
