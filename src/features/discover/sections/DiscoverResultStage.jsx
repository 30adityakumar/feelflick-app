// src/features/discover/sections/DiscoverResultStage.jsx
// The cinematic result: one dominant FOCUSED film + up to two finite directions
// held in the dock. Owns the finite session (roles/focus/promotion/exhaustion),
// genuine-exposure impressions, the focused film's write actions, the streaming
// lookup, the trailer modal, and a single polite live region. Distinct from a grid
// — one film always dominates; selecting a direction changes focus, not role.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { constellationName } from '../derive'
import { INTENTIONS, TIME_OPTIONS, WHO_OPTIONS, ENERGY_OPTIONS } from '../constants'
import { buildMomentFitLine, buildPersonalSignal } from '../resultPresentation'
import { directionDeltaCopy, familiarLanguagesOf, DIRECTION_LABEL } from '../discoverDirections'
import { useDiscoverSession } from '../hooks/useDiscoverSession'
import { useDiscoverImpressions } from '../hooks/useDiscoverImpressions'
import { useDiscoverResultActions } from '../hooks/useDiscoverResultActions'
import { useStreamingProvider } from '../hooks/useStreamingProvider'
import DiscoverLeadFilm from './DiscoverLeadFilm'
import DiscoverDirectionDock from './DiscoverDirectionDock'
import DiscoverContextChips from './DiscoverContextChips'
import DiscoverExhaustedState from './DiscoverExhaustedState'
import TrailerModal from './TrailerModal'

const prettify = (t) => String(t).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const FALLBACK_COPY = {
  live_error: 'Example pick — live recommendations are unavailable right now.',
  live_empty: 'Example pick — live recommendations are not ready yet.',
  filtered_empty: 'Example pick — no strong live fit for these details.',
}

export default function DiscoverResultStage({
  ranked, selected, profile, blendHex, isFallback, fallbackReason,
  intention, energy, who, time, user, sessionKey, onAdjust, onRestart, audioToggle,
}) {
  const navigate = useNavigate()
  const cName = constellationName(selected)
  const session = useDiscoverSession({ ranked, selected, profile, allowAlternates: !isFallback, sessionKey })
  const { roles, focusId, focused, exhaustion } = session
  const lead = roles.closest
  const role = focused ? session.roleOf(focused.id) : null
  const familiar = useMemo(() => familiarLanguagesOf(profile), [profile])

  const impressions = useDiscoverImpressions({
    userId: user?.id, sessionKey,
    context: { selected, intention, energy, who, isFallback, cName },
  })

  // Lead exposure (closest / promoted closest) — always genuinely visible on reveal.
  useEffect(() => {
    if (lead) impressions.logExposure(lead)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id, lead?._placement])

  const { provider, status: providerStatus } = useStreamingProvider(focused?.tmdbId)
  const actions = useDiscoverResultActions({
    focused, user, selected, intention, energy, who, onRemove: session.remove, navigate, isFallback,
  })

  // Reason (always one grounded moment line; personal only when a real signal exists).
  const reason = useMemo(() => focused ? {
    momentFit: buildMomentFitLine({ film: focused, role, lead, selected, time, profile }),
    personal: buildPersonalSignal({ film: focused, profile, isFallback }),
  } : null, [focused, role, lead, selected, time, profile, isFallback])

  const descriptorChips = useMemo(() => {
    if (!focused) return []
    const out = focused.genre ? [focused.genre] : []
    const tags = [...(focused._raw?.mood_tags || []), ...(focused._raw?.tone_tags || [])].filter(Boolean).slice(0, 2).map(prettify)
    return [...out, ...tags].slice(0, 3)
  }, [focused])

  const contextChips = useMemo(() => [
    { key: 'mood', label: 'Mood', value: cName },
    { key: 'intention', label: 'Intention', value: INTENTIONS.find((o) => o.id === intention)?.label },
    { key: 'time', label: 'Time', value: TIME_OPTIONS.find((o) => o.id === time)?.label },
    { key: 'who', label: 'Watching', value: WHO_OPTIONS.find((o) => o.id === who)?.label },
    { key: 'energy', label: 'Energy', value: ENERGY_OPTIONS.find((o) => o.id === energy)?.label },
  ].filter((c) => c.value), [cName, intention, time, who, energy])

  const deltaCopyByRole = useMemo(() => ({
    gentler: roles.gentler ? directionDeltaCopy('gentler', roles.gentler, lead, familiar) : null,
    bolder: roles.bolder ? directionDeltaCopy('bolder', roles.bolder, lead, familiar) : null,
  }), [roles.gentler, roles.bolder, lead, familiar])

  // ── Single polite live region ────────────────────────────────────────────────
  const [liveStatus, setLiveStatus] = useState('')
  const announcedRef = useRef(null)
  useEffect(() => {
    if (exhaustion) { setLiveStatus(exhaustion === 'cap' ? 'That’s a full set of directions for tonight.' : 'No more strong fits for these details.'); return }
    if (!focused?.id || announcedRef.current === `${focused.id}:${focusId}`) return
    announcedRef.current = `${focused.id}:${focusId}`
    const label = role ? DIRECTION_LABEL[role] : 'Tonight’s pick'
    setLiveStatus(`Now showing the ${label.toLowerCase()}: ${focused.title}.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused?.id, focusId, role, exhaustion])
  useEffect(() => {
    if (actions.savedState === 'saved') setLiveStatus('Saved for later.')
    else if (actions.savedState === 'error') setLiveStatus('Could not save. Try again.')
  }, [actions.savedState])
  useEffect(() => {
    if (actions.watchedState === 'watched') setLiveStatus('Marked watched.')
    else if (actions.watchedState === 'error') setLiveStatus('Could not mark watched. Try again.')
  }, [actions.watchedState])

  const [trailerOpen, setTrailerOpen] = useState(false)
  const liveRegion = <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{liveStatus}</p>

  if (exhaustion) {
    return (
      <>
        {liveRegion}
        <section className="ff-disc-stage ff-disc-stage--result">
          {audioToggle}
          <DiscoverExhaustedState reason={exhaustion} onAdjust={onAdjust} onRestart={onRestart} blendHex={blendHex} />
        </section>
      </>
    )
  }

  return (
    <>
      {liveRegion}
      <section className="ff-disc-stage ff-disc-stage--result" aria-labelledby="ff-disc-lead-title">
        {audioToggle}
        <div aria-hidden="true" className="ff-disc-grain" />
        <DiscoverContextChips chips={contextChips} onAdjust={onAdjust} />
        <DiscoverLeadFilm
          film={focused}
          roleLabel={role ? DIRECTION_LABEL[role] : 'Tonight’s pick'}
          blendHex={blendHex}
          descriptorChips={descriptorChips}
          reason={reason}
          provider={provider}
          providerStatus={providerStatus}
          isFallback={isFallback}
          fallbackNote={isFallback ? (FALLBACK_COPY[fallbackReason] || 'Example pick — using a safe fallback.') : null}
          savedState={actions.savedState}
          watchedState={actions.watchedState}
          onSeeMore={actions.handleSeeMore}
          onSave={actions.handleSaveForLater}
          onWatched={actions.handleMarkWatched}
          onSkip={actions.handleSkip}
          onTrailer={() => setTrailerOpen(true)}
        />
        <DiscoverDirectionDock
          roles={roles}
          focusId={focusId}
          onSelect={(f) => session.focus(f.id)}
          observe={impressions.observe}
          blendHex={blendHex}
          deltaCopyByRole={deltaCopyByRole}
        />
        <div className="ff-disc-result-footer">
          <button type="button" className="ff-disc-link" onClick={onAdjust}>Adjust tonight</button>
          <button type="button" className="ff-disc-link" onClick={onRestart}>Start over</button>
        </div>
      </section>
      <TrailerModal open={trailerOpen} youtubeKey={focused?.trailerKey} title={focused?.title} onClose={() => setTrailerOpen(false)} />
    </>
  )
}
