/**
 * Canonical empty state. Use when a surface has no content to display.
 *
 * @param {React.ElementType} [icon] - Lucide icon component
 * @param {string} title - Short headline
 * @param {string} [description] - Supporting text
 * @param {React.ReactNode} [action] - Optional CTA (usually a <Button>)
 */
export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      {Icon && (
        <div className="inline-flex h-12 w-12 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mb-4">
          <Icon className="h-5 w-5 text-white/40" />
        </div>
      )}
      <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-white/60 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
