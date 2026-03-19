import { Image as ImageIcon } from 'lucide-react'
import { IMG } from './utils'

export default function MovieImages({ images }) {
  if (!images?.length) return null
  return (
    <div>
      <h2 className="text-base font-bold mb-3 flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        Images
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-0.5">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[200px] md:w-[240px] aspect-video rounded-md overflow-hidden bg-white/5 border border-white/10 shadow-md group"
          >
            <img
              src={IMG.still(img.file_path)}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 loading-lazy"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
