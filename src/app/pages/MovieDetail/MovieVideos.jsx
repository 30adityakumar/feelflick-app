import { Film, Play } from 'lucide-react'
import { trackTrailerPlay } from '@/shared/services/interactions'

export default function MovieVideos({ videos, internalMovieId }) {
  const filtered = (videos || []).filter((v) => v.site === 'YouTube').slice(0, 6)
  if (!filtered.length) return null

  const handleVideoClick = (video) => {
    if (internalMovieId) {
      trackTrailerPlay(internalMovieId, 'videos_section')
    }
  }

  return (
    <div>
      <h2 className="text-base font-bold mb-3 flex items-center gap-2">
        <Film className="h-4 w-4" />
        Videos &amp; Trailers
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((v) => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.key}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => handleVideoClick(v)}
            className="group relative aspect-video rounded-md overflow-hidden bg-white/5 border border-white/10"
          >
            <img
              src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
              alt={v.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 loading-lazy"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                <Play className="h-5 w-5 fill-current text-black ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
              <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                {v.name}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
