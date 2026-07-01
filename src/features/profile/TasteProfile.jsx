// src/features/profile/TasteProfile.jsx
// FeelFlick — Cinematic DNA (/DNA, /DNA/:userId).
//
// The portrait redesign: a cinematic hero (deterministic archetype identity), an evidence-honest
// set of sections that each self-hide when their evidence is missing, and a privacy-safe Cinematic
// Passport. Composition is adopted into the Adaptive Editorial Cinema foundation (ThoughtfulRoot +
// the global --color-* theme); per-section logic lives in focused components under ./dna; all
// numbers are deterministic (./derive) and only the short reflection is LLM-written.
//
// Privacy: a Cinematic DNA profile is OWNER-PRIVATE. Another user's portrait must never render and
// must never be fetched — the data hook is kept entirely out of the non-self branch (defense in
// depth behind the owner-only RLS in supabase/migrations/20260609000000).

import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { ThoughtfulRoot } from '@/shared/ui/thoughtful-seatmate'
import PublicDnaProfile from './PublicDnaProfile'
import { useProfileDataFetch } from './useProfileData'
import { resolveDnaIdentity } from './dna/identity'
import CinematicDnaHero from './dna/CinematicDnaHero'
import DnaFormingState from './dna/DnaFormingState'
import RatingLanguage from './dna/RatingLanguage'
import CinematicSignature, { hasSignatureEvidence } from './dna/CinematicSignature'
import TasteJourney from './dna/TasteJourney'
import DirectorInfluence from './dna/DirectorInfluence'
import CinematicPassportSection from './dna/CinematicPassportSection'
import DnaEvidenceSheet from './dna/DnaEvidenceSheet'
import DnaStats from '@/features/dna/components/DnaStats'
import './profile.css'
import '@/features/dna/dna.css'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

export default function TasteProfile() {
  const { user } = useAuthSession()
  const { userId: paramUserId } = useParams()
  const isSelf = !paramUserId || paramUserId === user?.id
  usePageMeta({ title: isSelf ? 'Your Cinematic DNA — FeelFlick' : 'Cinematic DNA — FeelFlick' })

  if (!isSelf) return <PublicDnaProfile />
  return <SelfProfile authUser={user} />
}

function SelfProfile({ authUser }) {
  const data = useProfileDataFetch({ userId: authUser?.id, authUser, isSelf: true })
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 2600)
  }, [])

  if (data.loading) return <PageSkeleton />
  if (data.error) return <PageError onRetry={data.retry} />

  const identity = resolveDnaIdentity(data)
  // Downstream sections are eligibility-driven; the hero "Portrait" entry is prepended whenever any
  // downstream section is shown (so the nav always starts at the portrait, matching the locked IA).
  const downstream = [
    data.ratingLanguage ? { id: 'dna-response', label: 'Response' } : null,
    hasSignatureEvidence({ moods: data.moods, genres: data.genres, motifs: data.motifs })
      ? { id: 'dna-signature', label: 'Signature' } : null,
    Array.isArray(data.journey) && data.journey.length >= 2 ? { id: 'dna-journey', label: 'Journey' } : null,
    Array.isArray(data.directors) && data.directors.length > 0 ? { id: 'dna-voices', label: 'Voices' } : null,
    !identity.forming ? { id: 'dna-numbers', label: 'Numbers' } : null,
    !identity.forming ? { id: 'dna-passport', label: 'Passport' } : null,
  ].filter(Boolean)

  const firstName = (data.user?.name || '').trim().split(/\s+/)[0] || 'You'
  const numbersStats = {
    filmsWatched: data.stats?.filmsLogged ?? 0,
    avgStars: data.ratingLanguage?.averageStars ?? null,
    reviews: data.reviewsCount ?? 0,
    hoursWatched: data.stats?.hoursWatched ?? 0,
  }
  const numbersCharts = {
    trendAll: (data.trajectoryAllTime || []).map((b) => ({ label: b.label, count: b.count })),
    trendYear: data.trajectoryYear || [],
    ratingBuckets: data.ratingLanguage?.buckets || [],
    ratingLanguage: data.ratingLanguage,
    decades: data.decades || [],
    runtime: data.runtime,
    daypart: data.daypart || [],
  }
  return (
    <ThoughtfulRoot
      className="ff-dna"
      id="cinematic-dna-content"
      tabIndex={-1}
      role="region"
      aria-label="Cinematic DNA"
    >
      {downstream.length > 0 ? (
        <a className="ff-dna__skip" href={`#${downstream[0].id}`} onClick={(e) => { e.preventDefault(); scrollToSection(downstream[0].id) }}>
          Skip to your Cinematic DNA
        </a>
      ) : null}

      {identity.forming ? (
        <DnaFormingState identity={identity} />
      ) : (
        <>
          <CinematicDnaHero
            identity={identity}
            mixtape={data.mixtape}
            evidenceVersion={data.evidenceVersion}
            onEvidence={() => setEvidenceOpen(true)}
            onScrollTo={scrollToSection}
          />
          <RatingLanguage ratingLanguage={data.ratingLanguage} />
          <CinematicSignature moods={data.moods} genres={data.genres} motifs={data.motifs} />
          <TasteJourney journey={data.journey} />
          <DirectorInfluence directors={data.directors} />
          {/* "{Name} by the numbers" — the shared Cinematic-DNA stats section, defaulting to the
              current year. Wrapped in .dna so the dna.css chart tokens (--dna-*) resolve; width
              aligned to the profile shell. */}
          <div className="dna" id="dna-numbers" tabIndex={-1} style={{ '--dna-max': '1380px' }}>
            <DnaStats firstName={firstName} stats={numbersStats} charts={numbersCharts} isOwner sections={{ viewingRhythm: true }} defaultPeriod="year" />
          </div>
          <CinematicPassportSection
            identity={identity}
            evidenceVersion={data.evidenceVersion}
            onEvidence={() => setEvidenceOpen(true)}
            onToast={showToast}
          />
        </>
      )}

      <footer className="ff-dna-footer">
        <div className="ff-dna__shell" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', width: '100%' }}>
          <span>Cinematic DNA · Private to you</span>
          <span><a href="/home">Tonight</a> · <a href="/browse">Browse</a></span>
        </div>
      </footer>

      <DnaEvidenceSheet
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        identity={identity}
        editorialStatus={data.editorialStatus}
        refreshStatus={data.refreshStatus}
        onRefresh={data.refreshEditorial}
      />

      <div className={`ff-dna-toast${toast ? ' is-show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </ThoughtfulRoot>
  )
}

// /DNA/:userId of anyone but the signed-in user. No data fetched. Honest, keyboard-accessible.

// Honest loading status — one polite live region, aria-busy, sr-only text; decorative skeleton hidden.
function PageSkeleton() {
  return (
    <div className="ff-dna ff-dna-state" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading your Cinematic DNA…</span>
      <div className="ff-dna-state__box" aria-hidden="true" style={{ width: 'min(640px, 92vw)' }}>
        <div className="ff-dna-skel" style={{ height: 12, width: 200, margin: '0 auto 28px' }} />
        <div className="ff-dna-skel" style={{ height: 92, width: '88%', margin: '0 auto 18px' }} />
        <div className="ff-dna-skel" style={{ height: 18, width: '64%', margin: '0 auto 30px' }} />
        <div className="ff-dna-skel" style={{ height: 320, width: '100%', borderRadius: 24 }} />
      </div>
    </div>
  )
}

// Fixed, safe error copy off the stable load_error classification — raw backend message never shown.
function PageError({ onRetry }) {
  return (
    <div className="ff-dna ff-dna-state">
      <div className="ff-dna-state__box" role="alert">
        <p className="ff-dna-eyebrow">Cinematic DNA</p>
        <h1>We couldn&rsquo;t load your Cinematic DNA.</h1>
        <p>Try refreshing in a moment.</p>
        <div className="ff-dna-state__actions">
          {typeof onRetry === 'function' && (
            <button type="button" className="ff-dna-btn ff-dna-btn--primary" onClick={onRetry}>Try again</button>
          )}
          <a className="ff-dna-btn ff-dna-btn--ghost" href="/home">Go to Home</a>
        </div>
      </div>
    </div>
  )
}
