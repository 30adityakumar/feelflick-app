// src/features/account/components/SettingsSwitch.jsx
// Accessible on/off switch (role="switch" + aria-checked). Disabled while a save is in flight.

export default function SettingsSwitch({ checked, onChange, disabled = false, label, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="ff-acct-switch"
      onClick={() => !disabled && onChange(!checked)}
    >
      <i aria-hidden="true" />
    </button>
  )
}
