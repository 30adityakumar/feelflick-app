import HeroSliderSection from "@/app/homepage/components/HeroSliderSection";
import CarouselRow from "@/app/homepage/components/CarouselRow";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSliderSection />
      <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
        <CarouselRow title="Popular Now" endpoint="popular" />
        <CarouselRow title="Top Rated" endpoint="top_rated" />
      </div>
    </div>
  );
}
