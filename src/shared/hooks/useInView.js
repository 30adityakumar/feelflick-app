import { useState, useEffect, useRef } from 'react'

/**
 * Observe when an element first scrolls into the viewport.
 *
 * The shared scroll-reveal primitive behind the landing's `<Reveal>` wrapper and
 * its DNA bar-fill animation (both previously hand-rolled their own
 * IntersectionObserver). Lives in `shared/hooks` so any surface can drive a
 * reveal/animate-on-scroll effect without re-implementing the observer.
 *
 * One-shot by default: once the element intersects it sets `inView` true and
 * disconnects, so the reveal never reverses on scroll-out. Pass `once: false`
 * to keep tracking enter/leave.
 *
 * @param {object}  [options]
 * @param {number}  [options.threshold=0.15]  IntersectionObserver threshold (0–1).
 * @param {number}  [options.delay=0]         ms to wait after intersect before flipping `inView` (stagger reveals).
 * @param {boolean} [options.once=true]       Disconnect after the first intersection (one-shot reveal).
 * @returns {[React.RefObject<HTMLElement>, boolean]} `[ref, inView]` — attach `ref` to the target element.
 */
export function useInView({ threshold = 0.15, delay = 0, once = true } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = setTimeout(() => setInView(true), delay)
        if (once) obs.disconnect()
      } else if (!once) {
        setInView(false)
      }
    }, { threshold })
    obs.observe(el)
    return () => {
      clearTimeout(timer)
      obs.disconnect()
    }
  }, [threshold, delay, once])

  return [ref, inView]
}
