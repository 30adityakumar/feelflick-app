// src/features/account/components/SettingRow.jsx
// One setting line: label (+ optional badge), optional description, and an `end` slot
// (switch, value text, save status, or chevron). Used by every detail pane.

export default function SettingRow({ label, labelId, desc, badge, end, children }) {
  return (
    <div className="ff-acct-row">
      <div>
        <div className="ff-acct-row__label" id={labelId}>
          {label}
          {badge && <span className="ff-acct-badge">{badge}</span>}
        </div>
        {desc && <p className="ff-acct-row__desc">{desc}</p>}
        {children}
      </div>
      {end !== undefined && <div className="ff-acct-row__end">{end}</div>}
    </div>
  )
}
