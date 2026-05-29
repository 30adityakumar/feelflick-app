import { IMG } from './utils'

export default function MovieCast({ cast }) {
  if (!cast?.length) return null
  return (
    <div>
      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Top Cast</p>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-0.5">
          {cast.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-[88px] group">
              <div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/5 border border-white/8 mb-2 shadow-md">
                {p.profile_path ? (
                  <img
                    src={IMG.profile(p.profile_path)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-white/20 text-xs">No photo</div>
                )}
              </div>
              <p className="text-xs font-semibold text-white/80 line-clamp-2 leading-tight mb-0.5">{p.name}</p>
              <p className="text-[10px] text-white/40 line-clamp-1">{p.character}</p>
            </div>
          ))}
        </div>
        {/* Scroll affordance — right fade */}
        <div className="absolute top-0 right-0 bottom-3 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
