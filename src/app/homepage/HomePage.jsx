import HeroSection from "@/app/homepage/components/HeroSection";
import CarouselRow from "@/app/homepage/components/CarouselRow";
import { Star, Flame } from "lucide-react";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen pb-14 bg-zinc-950">
      <HeroSection />
      <div className="flex flex-col gap-8 md:gap-12 w-full mx-0 px-0 md:max-w-[1100px] md:mx-auto">
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-orange-300 font-bold text-base md:text-lg"><Flame size={18} /> Popular Now</span>}
          endpoint="popular"
        />
        <CarouselRow
          title={<span className="inline-flex items-center gap-2 text-yellow-300 font-bold text-base md:text-lg"><Star size={18} /> Top Rated</span>}
          endpoint="top_rated"
        />
      </div>
    </div>
  );
}
