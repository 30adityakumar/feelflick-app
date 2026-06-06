/**
 * Shared onboarding step scaffold: the full-height flex column every step uses,
 * with header / body / footer slots. The body (`children`) varies per step
 * (tile grid, search + carousels, etc.) and is rendered as direct flex children
 * so each step keeps its own layout.
 *
 * Intentionally does NOT include Progress or TasteStrip — those are parent-level
 * siblings rendered by Onboarding.jsx outside the step.
 *
 * @param {object} props
 * @param {React.ReactNode} props.header   — the <StepHeader> (or equivalent)
 * @param {React.ReactNode} props.footer   — the <StepFooter> (or equivalent)
 * @param {React.ReactNode} props.children — the step body
 */
export default function StepShell({ header, footer, children }) {
  return (
    <div className="h-full flex flex-col">
      {header}
      {children}
      {footer}
    </div>
  )
}
