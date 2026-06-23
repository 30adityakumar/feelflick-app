// src/features/preferences/Preferences.jsx
// FeelFlick — Preferences ("Your taste, clearly."). The private place to adjust
// supported recommendation + presentation preferences. AppShell owns the
// Header, <main>, and BottomNav; this renders one <h1> and no app chrome.

import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { PreferencesDataProvider, usePreferencesData } from './usePreferencesData'
import PreferencesHeader from './components/PreferencesHeader'
import PreferenceSummary from './components/PreferenceSummary'
import QuickTune from './components/QuickTune'
import PreferenceControlGroups from './components/PreferenceControlGroups'
import LearningExplanation from './components/LearningExplanation'
import RecommendationDataDialog from './components/RecommendationDataDialog'
import PreferenceSaveDock from './components/PreferenceSaveDock'
import PreferenceStatus from './components/PreferenceStatus'
import PreferencesLoading from './components/PreferencesLoading'
import PreferencesError from './components/PreferencesError'
import UnsavedChangesDialog from './components/UnsavedChangesDialog'
import './preferences.css'

function PreferencesBody() {
  const { status, dirty, discard } = usePreferencesData()
  const [dataOpen, setDataOpen] = useState(false)
  const dataTriggerRef = useRef(null)

  // Warn on browser refresh / tab close while there are unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // Block internal navigation while dirty (data-router blocker).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  if (status === 'loading') return <PreferencesLoading />
  if (status === 'load_error') return <PreferencesError />

  return (
    <div className="ff-prefs">
      <PreferencesHeader />
      <PreferenceStatus />
      <PreferenceSummary />
      <QuickTune />
      <PreferenceControlGroups />
      <LearningExplanation onOpenData={(e) => { dataTriggerRef.current = e.currentTarget; setDataOpen(true) }} />

      <PreferenceSaveDock />
      <RecommendationDataDialog open={dataOpen} onClose={() => setDataOpen(false)} returnFocusRef={dataTriggerRef} />
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onKeepEditing={() => blocker.reset?.()}
        onLeave={() => { discard(); blocker.proceed?.() }}
      />
    </div>
  )
}

export default function Preferences() {
  usePageMeta({ title: 'Preferences — FeelFlick' })
  return (
    <PreferencesDataProvider>
      <PreferencesBody />
    </PreferencesDataProvider>
  )
}
