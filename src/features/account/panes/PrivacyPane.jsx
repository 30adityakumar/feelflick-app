// src/features/account/panes/PrivacyPane.jsx
// Controls: taste-match discovery (explicit opt-in, default off), follower sharing (history +
// watchlist, both default ON — turn off here if desired), and product analytics. Each toggle
// persists through the save-state model with rollback; analytics runtime is coordinated in
// useAccountData.updatePrivacy.

import SectionIcon from '../components/SectionIcon'
import SettingGroup from '../components/SettingGroup'
import SettingRow from '../components/SettingRow'
import SettingsSwitch from '../components/SettingsSwitch'
import SaveStatus from '../components/SaveStatus'
import { useAccountData } from '../useAccountData'

// Exposed when discovery is ON / what always stays private — enumerated verbatim for honesty.
const DISCOVERY_DESC = 'When on, other signed-in members may see your name, avatar, your top film-taste tags and film count when FeelFlick suggests compatible people. Your watched films, Diary, ratings, reviews and Cinematic DNA reflection stay private.'
const DISCOVERY_BETA_NOTE = 'Taste-match discovery is not currently surfaced in the beta, but your preference is saved for when it returns.'
const HISTORY_DESC = 'Followers can view your watch history on your profile page. On by default — turn off to make it private.'
const WATCHLIST_DESC = "Followers can view the films you've saved to watch. On by default — turn off to make it private."
const ANALYTICS_DESC = "Optional product-usage analytics (PostHog) help us improve FeelFlick. We never send your email, name, search text, reviews, Diary, or Cinematic DNA reflection, and session replay masks all text and inputs. Essential security, infrastructure and error logs aren't controlled by this setting."

export default function PrivacyPane() {
  const { serverSettings, updatePrivacy, saveStatus, retrySection } = useAccountData()
  const p = serverSettings?.privacy || {}
  const status = saveStatus?.privacy
  const busy = status === 'saving'

  return (
    <>
      <div className="ff-acct-privacy-summary">
        <SectionIcon name="privacy" size={20} />
        <div>
          <strong>Your Cinematic DNA, Diary, and ratings stay private.</strong>
          <p>Watch history and watchlist are visible to your followers by default. Turn them off below if you&apos;d prefer to keep them private.</p>
        </div>
      </div>

      <SettingGroup title="Discovery">
        <SettingRow
          label="Appear in taste-match discovery"
          desc={DISCOVERY_DESC}
          end={(
            <>
              <SaveStatus status={status} onRetry={() => retrySection('privacy')} />
              <SettingsSwitch
                checked={!!p.showOnLeaderboards}
                disabled={busy}
                label={`${p.showOnLeaderboards ? 'Disable' : 'Enable'} taste-match discovery`}
                onChange={(next) => updatePrivacy({ showOnLeaderboards: next })}
              />
            </>
          )}
        >
          <p className="ff-acct-row__desc" style={{ marginTop: 8, fontStyle: 'italic' }}>{DISCOVERY_BETA_NOTE}</p>
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Followers">
        <SettingRow
          label="Share watch history with followers"
          desc={HISTORY_DESC}
          end={(
            <>
              <SaveStatus status={status} onRetry={() => retrySection('privacy')} />
              <SettingsSwitch
                checked={!!p.shareHistory}
                disabled={busy}
                label={`${p.shareHistory ? 'Disable' : 'Enable'} watch history sharing`}
                onChange={(next) => updatePrivacy({ shareHistory: next })}
              />
            </>
          )}
        />
        <SettingRow
          label="Share watchlist with followers"
          desc={WATCHLIST_DESC}
          end={(
            <>
              <SaveStatus status={status} onRetry={() => retrySection('privacy')} />
              <SettingsSwitch
                checked={!!p.shareWatchlist}
                disabled={busy}
                label={`${p.shareWatchlist ? 'Disable' : 'Enable'} watchlist sharing`}
                onChange={(next) => updatePrivacy({ shareWatchlist: next })}
              />
            </>
          )}
        />
      </SettingGroup>

      <SettingGroup title="Analytics">
        <SettingRow
          label="Product analytics"
          desc={ANALYTICS_DESC}
          end={(
            <>
              <SaveStatus status={status} onRetry={() => retrySection('privacy')} />
              <SettingsSwitch
                checked={p.analytics !== false}
                disabled={busy}
                label={`${p.analytics !== false ? 'Disable' : 'Enable'} product analytics`}
                onChange={(next) => updatePrivacy({ analytics: next })}
              />
            </>
          )}
        />
      </SettingGroup>
    </>
  )
}
