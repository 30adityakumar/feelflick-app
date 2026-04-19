import { useNavigate } from 'react-router-dom'

export default function MovieSimilar({ title, items }) {
  const navigate = useNavigate()
  if (!items?.length) return null

  return (
    <div>
      <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">{title}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate(`/movie/${m.id}`)}
            className="group text-left"
            title={m.title}
          >
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/5 border border-white/8 mb-2 shadow-md group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:border-purple-500/20 transition-all duration-200">
              {m.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                  alt={m.title}
                  className="w-full h-full object-cover loading-lazy"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/30 text-xs">
                  No poster
                </div>
              )}
            </div>
            <h3 className="text-xs font-bold text-white/90 line-clamp-2 leading-tight mb-0.5">
              {m.title}
            </h3>
            {m.vote_average > 0 && (
              <p className="text-[10px] text-white/40">
                {Math.round(m.vote_average * 10) / 10}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
