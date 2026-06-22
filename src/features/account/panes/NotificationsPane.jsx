// src/features/account/panes/NotificationsPane.jsx
// Only the Daily Briefing channel is rendered — it's the only one with real send infrastructure.
// Copy is intentionally generic ("a daily email with tonight's picks"): the exact send time,
// pick count and timezone live in an out-of-repo edge function and are not asserted here.

import SettingGroup from '../components/SettingGroup'
import SettingRow from '../components/SettingRow'
import SettingsSwitch from '../components/SettingsSwitch'
import SaveStatus from '../components/SaveStatus'
import { useAccountData } from '../useAccountData'

export default function NotificationsPane() {
  const { serverSettings, updateNotifications, saveStatus, retrySection } = useAccountData()
  const items = serverSettings?.notifications || []
  const status = saveStatus?.notifications
  const busy = status === 'saving'

  function toggle(id, next) {
    updateNotifications(items.map((n) => (n.id === id ? { ...n, enabled: next } : n)))
  }

  return (
    <SettingGroup title="Email">
      {items.map((n) => (
        <SettingRow
          key={n.id}
          label={n.label}
          badge={n.badge}
          desc={n.desc}
          end={(
            <>
              <SaveStatus status={status} onRetry={() => retrySection('notifications')} />
              <SettingsSwitch
                checked={!!n.enabled}
                disabled={busy}
                label={`${n.enabled ? 'Disable' : 'Enable'} ${n.label}`}
                onChange={(next) => toggle(n.id, next)}
              />
            </>
          )}
        />
      ))}
    </SettingGroup>
  )
}
