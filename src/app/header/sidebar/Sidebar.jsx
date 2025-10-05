// src/app/header/sidebar
// Minimal placeholder; only shown on /browse (desktop)
export default function Sidebar() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-3 backdrop-blur-md">
      <h3 className="mb-2 text-sm font-semibold text-white/80">Filters</h3>
      <div className="space-y-2 text-sm text-white/70">
        <div>• Genre</div>
        <div>• Year</div>
        <div>• Rating</div>
      </div>
    </div>
  )
}