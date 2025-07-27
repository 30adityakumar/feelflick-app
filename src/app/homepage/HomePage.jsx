import HeroSliderSection from "@/app/homepage/components/HeroSliderSection";
import CarouselRow from "@/app/homepage/components/CarouselRow";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen pb-14 bg-zinc-950">
      <HeroSliderSection />
      <div className="flex flex-col gap-6 md:gap-10 w-full mx-0 px-0 md:max-w-[1100px] md:mx-auto">
        <CarouselRow title="Popular Now" endpoint="popular" />
        <CarouselRow title="Top Rated" endpoint="top_rated" />
      </div>
    </div>
  );
}
