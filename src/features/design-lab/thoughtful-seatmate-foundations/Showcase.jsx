import { useState } from 'react'
import {
  ThoughtfulRoot,
  PageDepth,
  Surface,
  Text,
  PrimaryAction,
  DecisionMarker,
  BrandMark,
  BrandLink,
  BrandSignature,
} from '@/shared/ui/thoughtful-seatmate'
import './showcase.css'

/**
 * Thoughtful Seatmate — Stage 1 foundation showcase (DEV-ONLY).
 *
 * Reached only via the dev-only, tree-shaken route /design-lab/thoughtful-seatmate-foundations
 * (excluded from the production bundle). It adopts NO production surface, uses no
 * production user data, and exercises every Stage 1 primitive + state for manual
 * accessibility review (toggle forced-colors, reduced-motion, and 200%/400% zoom;
 * resize to 360px for mobile).
 */
const LONG = 'A quietly confident recommendation reads as one calm sentence at a glance, then offers fuller, truthful evidence only when you ask for it — even across long titles, other languages, and unexpectedly verbose copy that must wrap without clipping or overflowing its container.'

function Section({ title, children }) {
  return (
    <section className="tsx-section">
      <Text variant="metadata" as="h2">{title}</Text>
      <div className="tsx-section__body">{children}</div>
    </section>
  )
}

function SelectableRow({ label }) {
  const [selected, setSelected] = useState(false)
  // The marker is supplementary; the row supplies the semantic state (aria-pressed),
  // a changed label, and an ivory border — ≥2 non-color cues beyond the marker.
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => setSelected((s) => !s)}
      className={`tsx-selectable${selected ? ' tsx-selectable--on' : ''}`}
    >
      <DecisionMarker active={selected} srLabel="Chosen for tonight" />
      <Text variant="body" as="span">{label}</Text>
      <Text variant="caption" as="span" className="tsx-selectable__state">
        {selected ? 'Chosen ✓' : 'Choose'}
      </Text>
    </button>
  )
}

export default function ThoughtfulSeatmateFoundationsShowcase() {
  const [loading, setLoading] = useState(false)

  return (
    <ThoughtfulRoot>
      <PageDepth depth="radial" className="tsx-page">
        <div className="tsx-wrap">
          <header className="tsx-head">
            <BrandSignature>FeelFlick — Stage 1</BrandSignature>
            <Text variant="display" as="h1">Thoughtful Seatmate foundations</Text>
            <Text variant="body" className="tsx-lede">
              Dev-only showcase. Not adopted by any production surface. Toggle
              forced-colors, reduced-motion, and 200% / 400% zoom; resize to 360px to
              review the mobile composition.
            </Text>
          </header>

          <Section title="Background depth — radial (preferred)">
            <PageDepth depth="radial" className="tsx-depth-demo" />
          </Section>

          <Section title="Background depth — linear (geometry only)">
            <PageDepth depth="linear" className="tsx-depth-demo" />
          </Section>

          <Section title="Background depth — none (solid canvas)">
            <PageDepth depth="none" className="tsx-depth-demo" />
          </Section>

          <Section title="Solid surfaces">
            <div className="tsx-grid">
              <Surface level={1} className="tsx-cell"><Text variant="label">surface-1</Text></Surface>
              <Surface level={2} className="tsx-cell"><Text variant="label">surface-2</Text></Surface>
              <Surface level="raised" border="strong" shadow className="tsx-cell"><Text variant="label">surface-raised</Text></Surface>
            </div>
          </Section>

          <Section title="Text hierarchy (Inter only)">
            <Surface level={1} className="tsx-pad">
              <Text variant="display" as="p">Display</Text>
              <Text variant="title" as="p">Title</Text>
              <Text variant="section" as="p">Section heading</Text>
              <Text variant="body" as="p">Body — {LONG}</Text>
              <Text variant="body-sm" as="p">Body small — secondary reading text.</Text>
              <Text variant="label" as="p">Label</Text>
              <Text variant="caption" as="p">Caption — a quiet supporting note.</Text>
              <Text variant="metadata" as="p">Metadata · 1994 · 132 min</Text>
            </Surface>
          </Section>

          <Section title="Neutral primary action (all states)">
            <div className="tsx-row">
              <PrimaryAction size="sm">Small</PrimaryAction>
              <PrimaryAction size="md">Medium</PrimaryAction>
              <PrimaryAction size="lg">Large</PrimaryAction>
              <PrimaryAction disabled>Disabled</PrimaryAction>
              <PrimaryAction loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1600) }}>
                {loading ? 'Working' : 'Click to load'}
              </PrimaryAction>
            </div>
            <div className="tsx-row tsx-row--narrow">
              <PrimaryAction fullWidth>Full width</PrimaryAction>
            </div>
          </Section>

          <Section title="Ivory-only decision state (zero layout shift)">
            <Surface level={1} className="tsx-pad tsx-stack">
              <SelectableRow label="Past Lives (2023)" />
              <SelectableRow label="In the Mood for Love (2000)" />
              <SelectableRow label="Aftersun (2022)" />
            </Surface>
          </Section>

          <Section title="Bounded rose accent">
            <Surface level={1} className="tsx-pad tsx-stack">
              <Text variant="body" as="p">
                A wordmark detail <BrandMark /> and a lightweight{' '}
                <BrandLink href="#stage1" onClick={(e) => e.preventDefault()}>rose link</BrandLink>.
              </Text>
              <div className="tsx-row">
                <BrandSignature>Signature kicker</BrandSignature>
                <BrandSignature solid>New</BrandSignature>
              </div>
            </Surface>
          </Section>

          <Section title="Missing-image state">
            <Surface level={2} className="tsx-poster" aria-label="No image available">
              <Text variant="caption">No image</Text>
            </Surface>
          </Section>

          <Section title="Combined composition (resize to 360px for mobile)">
            {/* surface-1: rose-as-text meets AA here (it does NOT on surface-raised
                #2d2621 — only 3.89:1; see the pilot handoff contrast note). */}
            <Surface level={1} border="subtle" radius="xl" shadow className="tsx-pad tsx-card">
              <BrandSignature>Tonight</BrandSignature>
              <Text variant="title" as="h3">One pick, with its reason.</Text>
              <Text variant="body" as="p" className="tsx-lede">{LONG}</Text>
              <div className="tsx-row">
                <PrimaryAction>See why</PrimaryAction>
                <BrandLink href="#more" onClick={(e) => e.preventDefault()}>Not tonight</BrandLink>
              </div>
            </Surface>
          </Section>
        </div>
      </PageDepth>
    </ThoughtfulRoot>
  )
}
