// src/features/history/components/DiarySort.jsx
// Diary sort. Options + accessible label are a locked contract. Most recent → chronological
// timeline; Highest rated / Runtime → flat sorted list (the page decides the presentation).

export default function DiarySort({ value, onChange }) {
  return (
    <label className="ff-diary-sort">
      <span className="ff-diary-sort__label">Sort</span>
      <select
        className="ff-diary-sort__select"
        value={value}
        aria-label="Sort diary"
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="recent">Most recent</option>
        <option value="rating">Highest rated</option>
        <option value="runtime">Runtime</option>
      </select>
    </label>
  )
}
