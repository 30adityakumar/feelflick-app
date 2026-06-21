// src/features/profile/dna/DnaBarcode.jsx
// Decorative passport barcode. Geometry/colour is deterministic from a PRIVACY-SAFE seed
// (evidence version + archetype + sorted tags) — never the user id or any raw behavioural data.
// aria-hidden: it is atmosphere, not information.

import { deriveDnaBarcode } from '../derive/dnaBarcode'

export default function DnaBarcode({ evidenceVersion, archetype, tags, bars = 60 }) {
  const list = deriveDnaBarcode({ evidenceVersion, archetype, tags, bars })
  return (
    <div className="ff-dna-barcode" aria-hidden="true">
      {list.map((b, i) => (
        <span key={i} className="ff-dna-bar" style={{ '--c': b.color, '--w': b.weight, '--o': b.opacity, '--s': b.scale }} />
      ))}
    </div>
  )
}
