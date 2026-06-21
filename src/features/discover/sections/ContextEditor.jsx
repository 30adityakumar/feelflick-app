// src/features/discover/sections/ContextEditor.jsx
// Per-dimension accordion: each collapsed row shows the current value; tapping
// opens a compact, touch-friendly choice set; only one group is open at a time.
// Predicted values are a starting point — every value is editable and presented
// non-authoritatively (no confidence %, no "you are tired" claims).

export default function ContextEditor({ groups, openId, setOpenId, onPick }) {
  const labelOf = (options, value) => options.find((o) => o.id === value)?.label || '—'
  return (
    <div className="ff-disc-ctx">
      {groups.map((g) => {
        const open = openId === g.id
        return (
          <div key={g.id} className={`ff-disc-ctx__row${open ? ' is-open' : ''}`}>
            <button
              type="button"
              className="ff-disc-ctx__summary"
              aria-expanded={open}
              aria-controls={`ff-disc-ctx-${g.id}`}
              onClick={() => setOpenId(open ? null : g.id)}
            >
              <span className="ff-disc-ctx__legend">{g.legend}</span>
              <span className="ff-disc-ctx__value">{labelOf(g.options, g.value)}</span>
              <span className="ff-disc-ctx__chev" aria-hidden="true" />
            </button>
            {open ? (
              <div id={`ff-disc-ctx-${g.id}`} className="ff-disc-ctx__choices" role="group" aria-label={g.legend}>
                {g.options.map((o) => {
                  const on = g.value === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${o.label} — ${o.sub}`}
                      className={`ff-disc-ctx__opt${on ? ' is-on' : ''}`}
                      onClick={() => onPick(g, o.id)}
                    >
                      {o.icon ? <span className="ff-disc-ctx__opt-icon" aria-hidden="true">{o.icon}</span> : null}
                      <span className="ff-disc-ctx__opt-label">{o.label}</span>
                      <span className="ff-disc-ctx__opt-sub">{o.sub}</span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
