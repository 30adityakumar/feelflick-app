// src/features/account/components/SettingGroup.jsx
// A titled card grouping related setting rows (Apple-style grouped list).

export default function SettingGroup({ title, children, danger = false }) {
  return (
    <>
      {title && <div className="ff-acct-group-title">{title}</div>}
      <div className={`ff-acct-group${danger ? ' ff-acct-danger' : ''}`}>{children}</div>
    </>
  )
}
