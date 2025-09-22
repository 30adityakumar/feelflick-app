import CarouselRow from '@/app/homepage/components/CarouselRow'

export default function HomePage() {
  return (
    <div className="w-full min-h-screen pb-14 bg-zinc-950">
      <div className="flex flex-col gap-6 md:gap-10 max-w-full md:max-w-[1100px] mx-auto mt-4">
        <CarouselRow title="Popular Now" endpoint="popular" />
        <CarouselRow title="Top Rated"   endpoint="top_rated" />
      </div>
    </div>
  )
}