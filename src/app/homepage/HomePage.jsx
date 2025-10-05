// src/app/homepage/HomePage.jsx
import CarouselRow from '@/app/homepage/components/CarouselRow'

export default function HomePage() {
  return (
    <div className="w-full pb-14">
      <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-10 md:gap-12">
        <CarouselRow title="Popular Now" endpoint="popular" />
        <CarouselRow title="Top Rated" endpoint="top_rated" />
      </div>
    </div>
  )
}