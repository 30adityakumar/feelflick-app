import { ChevronRight, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { IMG } from './utils'

export function WhereToWatch({ providers }) {
  if (!providers?.flatrate?.length) return null

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Where to Watch</p>
      <div className="flex flex-wrap gap-2">
        {providers.flatrate.map((p) => (
          <div
            key={p.provider_id}
            className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 p-1.5 flex items-center justify-center hover:scale-105 hover:border-white/15 transition-all"
            title={p.provider_name}
          >
            {p.logo_path ? (
              <img
                src={IMG.logo(p.logo_path)}
                alt={p.provider_name}
                className="w-full h-full object-contain loading-lazy"
              />
            ) : (
              <span className="text-[8px] text-white/60 text-center leading-tight">
                {p.provider_name}
              </span>
            )}
          </div>
        ))}
      </div>
      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          More options
          <ChevronRight className="h-3 w-3" />
        </a>
      )}
      <p className="text-[10px] text-white/40 mt-2">via JustWatch</p>
    </div>
  )
}

export function MovieDetails({ movie }) {
  const details = [
    { label: 'Budget',   value: movie?.budget  ? `$${(movie.budget  / 1000000).toFixed(1)}M` : null },
    { label: 'Revenue',  value: movie?.revenue ? `$${(movie.revenue / 1000000).toFixed(1)}M` : null },
    { label: 'Status',   value: movie?.status },
    { label: 'Language', value: movie?.original_language?.toUpperCase() },
  ].filter((d) => d.value)

  if (!details.length) return null

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Details</p>
      <div className="space-y-2">
        {details.map((d, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-white/60">{d.label}</span>
            <span className="text-white/90 font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductionCompanies({ companies }) {
  const top = (companies || []).slice(0, 3)
  if (!top.length) return null
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Production</p>
      <div className="flex flex-wrap gap-3">
        {top.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-center h-12 px-3 rounded-xl bg-white/5 border border-white/8"
            title={c.name}
          >
            {c.logo_path ? (
              <img
                src={IMG.logo(c.logo_path)}
                alt={c.name}
                className="max-h-8 max-w-[80px] object-contain loading-lazy"
              />
            ) : (
              <span className="text-[10px] text-white/70 text-center">{c.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function KeywordsSection({ keywords }) {
  if (!keywords?.length) return null
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Keywords
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((k) => (
          <span
            key={k.id}
            className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-white/55 text-[11px] font-medium hover:bg-white/10 hover:border-white/15 hover:text-white/80 transition-colors cursor-default"
          >
            {k.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export function CollectionCard({ collection }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 overflow-hidden">
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Part of a Collection</p>
      <div className="relative aspect-16/9 rounded overflow-hidden mb-2">
        {collection.backdrop_path ? (
          <img
            src={IMG.backdrop(collection.backdrop_path)}
            alt={collection.name}
            className="w-full h-full object-cover loading-lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-xs font-bold text-white line-clamp-2">{collection.name}</p>
        </div>
      </div>
      <button
        onClick={() => navigate(`/collection/${collection.id}`)}
        className="w-full text-xs font-semibold text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1"
      >
        View Collection <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  )
}
