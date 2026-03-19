import { IMG } from './utils'

export default function MovieCast({ cast }) {
  if (!cast?.length) return null
  return (
    <div>
      <h2 className="text-base font-bold mb-3">Top Cast</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-0.5">
        {cast.map((p) => (
          <div key={p.id} className="flex-shrink-0 w-[100px] group">
            <div className="aspect-[2/3] overflow-hidden rounded-md bg-white/5 border border-white/10 mb-2 shadow-md">
              {p.profile_path ? (
                <img
                  src={IMG.profile(p.profile_path)}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 loading-lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/30 text-xs">
                  No photo
                </div>
              )}
            </div>
            <h3 className="text-xs font-bold text-white/90 line-clamp-2 leading-tight mb-0.5">
              {p.name}
            </h3>
            <p className="text-[10px] text-white/60 line-clamp-1">{p.character}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
