// src/features/account/Account.jsx
// FeelFlick — /account. Apple-inspired master–detail settings, rendered inside the canonical
// AppShell (Header + mobile BottomNav are AppShell's). Section selection is URL-addressable via
// ?section= (deep-linkable, refresh-safe, Back/Forward-aware) — one registry, shared by the
// desktop sidebar + the mobile index/push-in detail. No localStorage, no innerHTML cloning.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { VALID_SECTIONS, resolveSection, sectionById } from './accountSections'
import AccountSummary from './components/AccountSummary'
import AccountSidebar from './components/AccountSidebar'
import AccountMobileHome from './components/AccountMobileHome'
import AccountDetail from './components/AccountDetail'
import { AccountDataProvider, useAccountData } from './useAccountData'
import './account.css'

const MOBILE_QUERY = '(max-width: 760px)'

function useIsMobile() {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(MOBILE_QUERY).matches : false)
  const [isMobile, setIsMobile] = useState(get)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return isMobile
}

export default function Account() {
  return (
    <AccountDataProvider>
      <AccountShell />
    </AccountDataProvider>
  )
}

function AccountShell() {
  const { loading, authUser, error, refresh } = useAccountData()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const rawSection = searchParams.get('section')
  const activeSection = resolveSection(rawSection)
  const detailOpen = isMobile && !!rawSection && VALID_SECTIONS.has(rawSection)
  const headingRef = useRef(null)
  const prevKeyRef = useRef(null)

  usePageMeta({ title: rawSection && VALID_SECTIONS.has(rawSection) ? `${sectionById(activeSection).label} · Account — FeelFlick` : 'Account — FeelFlick' })

  // An invalid ?section= falls back safely to a clean /account.
  useEffect(() => {
    if (rawSection && !VALID_SECTIONS.has(rawSection)) setSearchParams({}, { replace: true })
  }, [rawSection, setSearchParams])

  // Move focus to the active heading after a navigation (not on first mount); on mobile Back,
  // restore focus to the index row that opened the detail.
  useLayoutEffect(() => {
    const prev = prevKeyRef.current
    const key = !isMobile || detailOpen ? activeSection : '__index__'
    if (prev !== null && prev !== key) {
      if (key === '__index__') {
        document.querySelector(`a[href="/account?section=${prev}"]`)?.focus?.()
      } else {
        headingRef.current?.focus?.()
      }
    }
    prevKeyRef.current = key
  }, [activeSection, detailOpen, isMobile])

  if (loading) return <AccountLoading />
  if (error) return <AccountError error={error} onRetry={refresh} />
  if (!authUser) return <AccountSignedOut onSignIn={() => navigate('/')} />

  return (
    <div className="ff-acct">
      <div className="ff-acct__shell">
        <header className="ff-acct__title">
          <h1>Account</h1>
          <p>Your FeelFlick identity, privacy, connections, and access—all in one quiet place.</p>
        </header>

        <AccountSummary />

        {isMobile ? (
          <div className="ff-acct-window">
            <AccountMobileHome />
            {detailOpen && (
              <section className="ff-acct-mobiledetail is-open" aria-label={sectionById(activeSection).label}>
                <div className="ff-acct-mobiledetail__head">
                  <button type="button" className="ff-acct-back" aria-label="Back to settings" onClick={() => setSearchParams({}, { replace: true })}>
                    <span aria-hidden="true" style={{ fontSize: '1.6rem', lineHeight: 1 }}>‹</span>
                  </button>
                  <strong>{sectionById(activeSection).label}</strong>
                </div>
                <AccountDetail sectionId={activeSection} headingRef={headingRef} />
              </section>
            )}
          </div>
        ) : (
          <div className="ff-acct-window">
            <AccountSidebar active={activeSection} />
            <AccountDetail sectionId={activeSection} headingRef={headingRef} />
          </div>
        )}
      </div>
    </div>
  )
}

function AccountLoading() {
  return (
    <div className="ff-acct" aria-busy="true">
      <div className="ff-acct__shell">
        <h1 className="sr-only">Account</h1>
        <p className="sr-only" role="status">Loading your account…</p>
        <div className="ff-acct__title" aria-hidden="true">
          <div className="ff-acct-skel" style={{ height: 56, width: '50%', margin: '24px auto' }} />
        </div>
        <div className="ff-acct-skel" style={{ height: 122, borderRadius: 22 }} />
        <div className="ff-acct-skel" style={{ height: 420, borderRadius: 22, marginTop: 22 }} />
      </div>
    </div>
  )
}

function AccountError({ error, onRetry }) {
  return (
    <div className="ff-acct">
      <div className="ff-acct-state">
        <div className="ff-acct-state__box">
          <p className="ff-acct-eyebrow">Account</p>
          <h1>We couldn’t load your settings.</h1>
          <p>Something went wrong reaching your account. Please try again.</p>
          <button type="button" className="ff-acct-btn ff-acct-btn--primary" onClick={onRetry}>Retry</button>
          {import.meta.env?.DEV && error ? <p style={{ marginTop: 16, fontSize: 11 }}>{String(error)}</p> : null}
        </div>
      </div>
    </div>
  )
}

function AccountSignedOut({ onSignIn }) {
  return (
    <div className="ff-acct">
      <div className="ff-acct-state">
        <div className="ff-acct-state__box">
          <p className="ff-acct-eyebrow">Account</p>
          <h1>Sign in to manage your settings.</h1>
          <p>Your account settings need an account to attach to.</p>
          <button type="button" className="ff-acct-btn ff-acct-btn--primary" onClick={onSignIn}>Go to sign in</button>
        </div>
      </div>
    </div>
  )
}
