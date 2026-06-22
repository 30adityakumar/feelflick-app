// src/features/people/components/HideButton.jsx
// Quiet tertiary "Hide" on automatic discovery cards. NOT Block/Mute/Report/Unfollow — it removes
// the suggestion from THIS session only (no write, no notification, reversible via Undo).

export default function HideButton({ onHide, name }) {
  return (
    <button
      type="button"
      onClick={onHide}
      aria-label={`Hide ${name || 'this person'} from your suggestions`}
      style={{ minHeight: 44, minWidth: 44 }}
      className="ff-people-hidebtn"
    >
      Hide
    </button>
  )
}
