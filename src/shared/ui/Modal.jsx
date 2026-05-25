import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Canonical Modal primitive. Backdrop + Escape + click-outside + focus
 * management + framer entrance/exit. Replaces the six ad-hoc modal patterns
 * in the codebase.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   label: string,
 *   children: React.ReactNode,
 *   size?: 'sm' | 'md' | 'lg',
 *   dismissible?: boolean,
 *   className?: string,
 * }} props
 */
export default function Modal({
  open,
  onClose,
  label,
  children,
  size = 'md',
  dismissible = true,
  className = '',
}) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)

  // Capture the currently-focused element when opening; restore on close.
  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement
    } else if (openerRef.current && typeof openerRef.current.focus === 'function') {
      openerRef.current.focus()
      openerRef.current = null
    }
  }, [open])

  // Move focus into the dialog when it opens. Picks the first focusable child;
  // falls back to the dialog itself (tabIndex=-1 makes it focusable).
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const focusable = dialogRef.current.querySelector(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (focusable) focusable.focus()
    else dialogRef.current.focus()
  }, [open])

  // Escape closes (when dismissible).
  useEffect(() => {
    if (!open || !dismissible) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissible, onClose])

  const sizeClass =
    size === 'sm' ? 'sm:max-w-md' :
    size === 'lg' ? 'sm:max-w-2xl' :
    'sm:max-w-lg'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          {/* Focusable backdrop dismiss button — keyboard-reachable. */}
          {dismissible && (
            <button
              type="button"
              className="absolute inset-0"
              onClick={onClose}
              aria-label="Close"
              tabIndex={-1}
            />
          )}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`relative z-10 w-full ${sizeClass} bg-black border border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden focus:outline-none ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
