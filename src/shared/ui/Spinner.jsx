// src/shared/ui/Spinner.jsx
export default function Spinner({ size = 24, className = '' }) {
  const style = { width: size, height: size }
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-[3px] border-current border-t-transparent align-[-0.125em] ${className}`}
      style={style}
    />
  )
}