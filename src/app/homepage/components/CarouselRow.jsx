import MovieCard from "@/app/pages/shared/MovieCard";

export default function CarouselRow({ title, movies }) {
  return (
    <div className="mb-8">
      <div
        className="
          font-extrabold text-[22px] tracking-tight
          mb-[13px] ml-[14px]
        "
      >
        {title}
      </div>
      <div
        className="
          flex overflow-x-auto gap-[22px] px-0 py-1 pl-[10px]
          scrollbar-thin scrollbar-thumb-[#232330] scrollbar-track-transparent
        "
      >
        {movies.map(movie => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
