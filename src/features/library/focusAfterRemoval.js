// src/features/library/focusAfterRemoval.js
// F6.3 — deterministic, testable focus recovery after a Library item is removed.
// The pure part (nextFocusId) decides WHICH equivalent control should receive focus;
// the impure part (scheduleFocus) moves focus after the DOM settles and is cancellable
// on unmount. Targets are resolved by stable data attributes keyed on movie/entry ids
// (never by film title), so multiple card representations of the same movie are
// unambiguous and titles never leak into selectors. <body> is never a focus target.

// Pure: the id to focus after `removedId` is removed from `orderedIds`.
// Prefer the NEXT equivalent item; otherwise the PREVIOUS; otherwise null (the caller
// then falls back to a stable section heading / results container).
export function nextFocusId(orderedIds, removedId) {
  if (!Array.isArray(orderedIds)) return null
  const i = orderedIds.indexOf(removedId)
  if (i === -1) return null
  if (i + 1 < orderedIds.length) return orderedIds[i + 1]
  if (i - 1 >= 0) return orderedIds[i - 1]
  return null
}

// Escape a value for safe use inside an attribute selector.
function attrEscape(v) {
  return String(v).replace(/["\\\]]/g, '\\$&')
}

// Resolve a Library remove control within `container` by its stable id (+ optional
// view), matching the data attributes the pages stamp on each Remove button.
export function findRemoveControl(container, itemId, view) {
  if (!container || itemId == null) return null
  let sel = `[data-library-action="remove"][data-library-item-id="${attrEscape(itemId)}"]`
  if (view) sel += `[data-library-view="${attrEscape(view)}"]`
  return container.querySelector(sel)
}

export function findFallback(container) {
  return container ? container.querySelector('[data-library-fallback]') : null
}

// Schedule focus after the DOM settles (double rAF). `getEl` is invoked at fire time
// so it sees the post-removal DOM. Never focuses <body> or a null/non-focusable node.
// Returns a cancel fn — call it on unmount or before scheduling another focus.
export function scheduleFocus(getEl, { raf } = {}) {
  const schedule = raf || ((cb) => requestAnimationFrame(cb))
  let cancelled = false
  schedule(() => schedule(() => {
    if (cancelled) return
    const el = typeof getEl === 'function' ? getEl() : getEl
    const body = typeof document !== 'undefined' ? document.body : null
    if (el && el !== body && typeof el.focus === 'function') el.focus()
  }))
  return () => { cancelled = true }
}
