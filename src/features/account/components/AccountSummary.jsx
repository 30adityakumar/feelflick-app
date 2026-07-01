// src/features/account/components/AccountSummary.jsx
// Identity header: avatar, name, email, member-since, Edit profile, View profile (the public social
// profile at /profile), and an honest plan summary ("Free plan"). No Films/Hours/DNA% stats — those
// belong to Cinematic DNA, not account administration.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatMonthYear } from '@/shared/lib/format/date'
import Avatar from './Avatar'
import EditNameDialog from '../dialogs/EditNameDialog'
import { useAccountData } from '../useAccountData'

export default function AccountSummary() {
  const { authUser, profile } = useAccountData()
  const [editing, setEditing] = useState(false)
  const name = profile?.name || authUser?.user_metadata?.name || 'Your name'
  const email = authUser?.email || profile?.email || '—'
  const joined = formatMonthYear(profile?.joined_at || authUser?.created_at)
  const avatarUrl = profile?.avatar_url || null

  return (
    <section className="ff-acct-summary" aria-label="Account summary">
      <Avatar name={name} url={avatarUrl} size={78} />
      <div style={{ minWidth: 0 }}>
        <h2 className="ff-acct-summary__name">{name}</h2>
        <p className="ff-acct-summary__meta">{email}{joined ? ` · Member since ${joined}` : ''}</p>
        <div className="ff-acct-summary__links">
          <button type="button" className="ff-acct-btn ff-acct-btn--secondary" onClick={() => setEditing(true)}>Edit profile</button>
          <Link className="ff-acct-btn ff-acct-btn--secondary" to="/profile">View profile</Link>
        </div>
      </div>
      <div className="ff-acct-plan">
        <small>Current plan</small>
        <strong>Free plan</strong>
        {joined && <span>Member since {joined}</span>}
      </div>
      {editing && <EditNameDialog onClose={() => setEditing(false)} />}
    </section>
  )
}
