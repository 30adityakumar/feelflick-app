// src/features/history/components/DiaryRetrieval.jsx
// Sticky retrieval surface: [ search | filters | sort ]. Sticks below the canonical Header using
// the real --hdr-h token (never the prototype's 62px); z-index below Header/overlays + above the
// month headings and rows (see history.css).

import DiarySearch from './DiarySearch'
import DiaryFilters from './DiaryFilters'
import DiarySort from './DiarySort'

export default function DiaryRetrieval({ search, onSearch, onClearSearch, filter, onFilter, sort, onSort }) {
  return (
    <div className="ff-diary-retrieval">
      <div className="ff-diary-section ff-diary-retrieval__shell">
        <div className="ff-diary-retrieval__inner">
          <DiarySearch value={search} onChange={onSearch} onClear={onClearSearch} />
          <DiaryFilters filter={filter} onSelect={onFilter} />
          <DiarySort value={sort} onChange={onSort} />
        </div>
      </div>
    </div>
  )
}
