// src/components/ToastNotification.jsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'

/**
 * Slide-up toast with optional CTA link. Auto-dismisses after `duration` ms.
 * @param {{ message: string, subtext?: string, ctaLabel?: string, ctaHref?: string, onDismiss: () => void, duration?: number }} props
 */
export default function ToastNotification({ message, subtext, ctaLabel, ctaHref, onDismiss, duration = 8000 }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4"
    >
      <div className="relative flex items-start gap-3 rounded-2xl bg-[#1a1525] border border-purple-500/30 px-5 py-4 shadow-xl shadow-black/50">
        <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{message}</p>
          {subtext && <p className="text-xs text-white/50 mt-0.5">{subtext}</p>}
          {ctaLabel && ctaHref && (
            <Link
              to={ctaHref}
              onClick={onDismiss}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium mt-2 block transition-colors"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}
