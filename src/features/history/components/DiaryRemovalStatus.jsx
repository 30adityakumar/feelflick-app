// src/features/history/components/DiaryRemovalStatus.jsx
// Visual-only toast mirroring the SETTLED removal result. The screen-reader announcement is the
// single live authority (useLibraryAnnouncement in the shell), so this toast is aria-hidden to
// avoid a duplicate announcement. No Undo, no focus stealing; sits above the BottomNav; the shell
// auto-clears it.

export default function DiaryRemovalStatus({ message, tone }) {
  if (!message) return null
  return (
    <div className="ff-diary-toast-wrap" aria-hidden="true">
      <div className={`ff-diary-toast ff-diary-toast--${tone === 'error' ? 'error' : 'ok'}`}>
        {message}
      </div>
    </div>
  )
}
