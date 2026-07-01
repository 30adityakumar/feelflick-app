// Compare taste — the prototype's faces + "Where you meet / differ" layout, with REAL data only.
// No fabricated compatibility %: "Taste overlap" is the real user_similarity value, clearly
// labelled. Insufficient data → an honest empty state. No fabricated bridge film / "send film".
import Modal from '@/shared/ui/Modal'

function initial(n) { return (n || '?').trim().charAt(0).toUpperCase() || '?' }

export default function DnaCompareDialog({ open, onClose, viewerName, targetName, compare }) {
  const { overlap = null, filmsInCommon = null, shared = [], different = [] } = compare || {}
  const hasEvidence = overlap != null || filmsInCommon != null || shared.length > 0
  return (
    <Modal open={open} onClose={onClose} label={`Compare taste with ${targetName}`} size="md">
      <div className="dna-dialog">
        <div className="dna-dialog__head"><h3>{viewerName || 'You'} + {targetName}</h3><button type="button" className="dna-iconbtn" onClick={onClose} aria-label="Close">✕</button></div>
        <div style={{ textAlign: 'center', paddingBottom: 18 }}>
          <div className="dna-compare__faces"><div className="dna-compare__face">{initial(viewerName)}</div><div className="dna-compare__face">{initial(targetName)}</div></div>
        </div>
        {!hasEvidence ? (
          <p className="dna-empty">Not enough shared signal yet to compare tastes. As you both watch and rate more films, this fills in.</p>
        ) : (
          <>
            {(overlap != null || filmsInCommon != null) && (
              <div className="dna-rep__grid" style={{ marginTop: 0, marginBottom: 14 }}>
                {overlap != null ? <div className="dna-rep__stat"><strong>{overlap}%</strong><span>taste overlap (shared rating patterns)</span></div> : null}
                {filmsInCommon != null ? <div className="dna-rep__stat"><strong>{filmsInCommon}</strong><span>films you both watched</span></div> : null}
              </div>
            )}
            <div className="dna-compare__meet">
              <div className="dna-compare__box"><h5>Where you meet</h5>{shared.length ? <ul>{shared.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="dna-empty">No shared signature tags yet.</p>}</div>
              <div className="dna-compare__box"><h5>Where you differ</h5>{different.length ? <ul>{different.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="dna-empty">Too early to tell.</p>}</div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
