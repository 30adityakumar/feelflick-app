// src/shared/ui/ErrorState.jsx
export default function ErrorState({ title = 'Something went wrong', detail, onRetry }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-red-200/40 bg-red-50/30 p-4 text-red-700">
      <div className="text-sm font-medium">{title}</div>
      {detail ? <div className="text-xs opacity-80">{String(detail)}</div> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}