// src/features/account/panes/PersonalInformationPane.jsx
// Name (editable via dialog), email (read-only / provider-managed), and profile photo.
//
// Photo changes are intentionally UNAVAILABLE in this slice: the `avatars` storage bucket's
// write policy (user-owns-their-own-path) is configured in the Supabase dashboard, NOT in repo
// migrations, so it can't be verified here. Per the approval, rather than ship an unverified
// upload we keep the avatar visible and disable changing it. Re-enable with a hardened client
// (MIME allowlist, ≤5 MB, ≤4096², SVG rejected, MIME-derived path) once the policy is verified.

import { useState } from 'react'
import Avatar from '../components/Avatar'
import SettingGroup from '../components/SettingGroup'
import SettingRow from '../components/SettingRow'
import EditNameDialog from '../dialogs/EditNameDialog'
import { useAccountData } from '../useAccountData'

export default function PersonalInformationPane() {
  const { authUser, profile } = useAccountData()
  const [editing, setEditing] = useState(false)
  const name = profile?.name || authUser?.user_metadata?.name || 'Your name'
  const email = authUser?.email || profile?.email || '—'
  const avatarUrl = profile?.avatar_url || null

  return (
    <>
      <SettingGroup title="Profile">
        <SettingRow
          label="Name"
          desc="Shown across FeelFlick."
          end={<button type="button" className="ff-acct-text-action" onClick={() => setEditing(true)}>Edit</button>}
        >
          <p className="ff-acct-row__desc" style={{ color: 'var(--text-2)', marginTop: 2 }}>{name}</p>
        </SettingRow>

        <SettingRow
          label="Email"
          desc="Managed by your sign-in provider. Email can’t be changed here."
          end={<span className="ff-acct-row__value">{email}</span>}
        />
      </SettingGroup>

      <SettingGroup title="Profile photo">
        <SettingRow
          label={(
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={name} url={avatarUrl} size={44} fontSize="1.1rem" />
              <span>{avatarUrl ? 'Your photo' : 'Default initials'}</span>
            </span>
          )}
          desc="Photo changes are temporarily unavailable."
          end={<span className="ff-acct-row__value" style={{ color: 'var(--text-3)' }}>Unavailable</span>}
        />
      </SettingGroup>

      {editing && <EditNameDialog onClose={() => setEditing(false)} />}
    </>
  )
}
