import { describe, it, expect } from 'vitest'
import dialogSrc from '../dialogs/AccountDialog.jsx?raw'
import deleteSrc from '../dialogs/DeleteAccountDialog.jsx?raw'
import resetSrc from '../dialogs/ResetTasteDialog.jsx?raw'
import dataPaneSrc from '../panes/DataDeletionPane.jsx?raw'

// Account destructive-action a11y + reliability + copy honesty (source guards), carried
// forward from F9.3 to the redesigned dialog/pane architecture.
describe('Account — dialog a11y primitive', () => {
  it('the shared dialog is a labelled modal with a focus trap, Escape-when-safe, scroll lock + restore', () => {
    expect(dialogSrc).toMatch(/role="dialog"/)
    expect(dialogSrc).toMatch(/aria-modal="true"/)
    expect(dialogSrc).toMatch(/aria-labelledby=\{titleId\}/)
    expect(dialogSrc).toMatch(/e\.key === 'Escape' && !busy/)        // Escape only when not busy
    expect(dialogSrc).toMatch(/e\.key !== 'Tab'/)                    // Tab is trapped
    expect(dialogSrc).toMatch(/document\.body\.style\.overflow = 'hidden'/) // body scroll lock
    expect(dialogSrc).toMatch(/opener\.focus\(\)/)                   // focus restoration
  })
})

describe('Account — delete dialog', () => {
  it('is labelled by its visible title and gates the destructive action on email match + busy', () => {
    expect(deleteSrc).toMatch(/<h2 id=\{titleId\}/)
    expect(deleteSrc).toMatch(/disabled=\{!matches \|\| busy\}/)
    expect(deleteSrc).toMatch(/busy \? 'Scheduling…' : 'Schedule deletion'/)
  })
  it('uses generic wording (no unverified enumerated deleted-data scope)', () => {
    expect(deleteSrc).toMatch(/seven days to cancel/i)
    expect(deleteSrc).not.toMatch(/profile, watches, ratings, lists, and DNA/i)
  })
  it('treats the reason as sensitive — never sent to analytics from the dialog', () => {
    expect(deleteSrc).not.toMatch(/from ['"]@\/shared\/services\/analytics['"]/) // no analytics import
    expect(deleteSrc).not.toMatch(/posthog|\.capture\(/i)                        // no capture call
  })
})

describe('Account — restart taste setup', () => {
  it('confirmation copy is accurate (onboarding, what is kept) and not "Reset DNA"', () => {
    expect(resetSrc).toMatch(/onboarding/i)
    expect(resetSrc).toMatch(/Films, ratings, lists and Diary entries you added later remain/)
    expect(resetSrc).not.toMatch(/Reset DNA/)
  })
  it('the reset checks every operation and only redirects after full success', () => {
    expect(dataPaneSrc).toMatch(/if \(r\.error\) throw r\.error/)
    expect(dataPaneSrc).toMatch(/if \(metaErr\) throw metaErr/)
    // navigate to onboarding happens inside runReset, after the checked deletes
    expect(dataPaneSrc).toMatch(/navigate\('\/onboarding'/)
  })
  it('pending deletion shows an explicit timezone and a cancel path', () => {
    expect(dataPaneSrc).toMatch(/timeZoneName: 'short'/)
    expect(dataPaneSrc).toMatch(/Cancel deletion/)
  })
})
