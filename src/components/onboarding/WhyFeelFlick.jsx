import React from "react";

const cards = [
  {
    title: "Mood-Driven, Personalized Picks",
    description:
      "FeelFlick learns your movie taste and listens to your current mood. No generic suggestions — just titles that match your vibe. The more you watch and share how you feel, the smarter and more personal your recommendations become.",
  },
  {
    title: "Fast, Simple, and Private",
    description:
      "Tired of scrolling for something to watch? FeelFlick delivers quick and clutter-free suggestions. No ratings, no filters, no noise — just the right movie when you need it. Your data stays private, always secure and never shared.",
  },
  {
    title: "Track What You Love For Free",
    description:
      "Keep a personal log of every movie you’ve seen. Build watchlists, revisit past favorites, and reflect on your evolving taste. FeelFlick helps you stay organized, sentimental, and inspired — all in one place. Always free, with no paywalls or limits.",
  },
];

export default function WhyFeelFlick() {
  return (
    <section className="w-screen bg-black/80 flex flex-col items-start justify-center py-4 box-border">
      <div className="w-full px-[7vw] box-border flex flex-col">
        {/* Section Title */}
        <div className="font-black text-white text-[1.37rem] tracking-widest uppercase mb-7 mt-4 text-left">
          More Reasons To Join
        </div>
        <div
          className={`
            bg-black/80 rounded-[28px] px-6 py-5 flex justify-center items-stretch
            max-w-[1450px] mx-auto shadow-[0_8px_48px_0_rgba(0,0,0,0.12)]
            gap-8 flex-nowrap
            lg:gap-6
            md:gap-4
            sm:flex-col sm:gap-4 sm:rounded-[18px] sm:p-2
          `}
        >
          {cards.map((card, idx) => (
            <div
              key={idx}
              tabIndex={0}
              className={`
                flex-1 min-w-[280px] max-w-[490px] flex flex-col justify-start
                px-5 py-8 rounded-[22px] bg-[rgba(22,16,10,0.94)]
                border border-[rgba(255,91,46,0.12)]
                shadow-[0_2.5px_12px_0_rgba(40,24,14,0.11)]
                transition-all duration-300 ease-out relative cursor-default
                opacity-0 translate-y-10 animate-fadeInUp
                sm:w-[96vw] sm:max-w-[99vw] sm:px-[5vw] sm:mb-5 sm:min-w-0
              `}
              style={{
                animationDelay: `${idx * 0.14 + 0.07}s`,
                animationFillMode: "both"
              }}
            >
              <h3
                className={`
                  mb-4 text-[1.3rem] sm:text-[1.1rem] font-black leading-[1.19]
                  bg-gradient-to-r from-[#FF5B2E] to-[#367cff] bg-clip-text text-transparent
                  drop-shadow-[0_2.5px_8px_rgba(0,0,0,0.16)]
                  tracking-wider
                `}
              >
                {card.title}
              </h3>
              <p
                className={`
                  m-0 text-[1.05rem] sm:text-[0.98rem] text-[#c6c7d2]
                  leading-[1.72] font-light tracking-wide
                `}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Animation keyframes in Tailwind */}
      <style>
        {`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(38px);}
          to   { opacity: 1; transform: translateY(0);}
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.7s cubic-bezier(.25,.7,.3,1.1) both;
        }
        `}
      </style>
    </section>
  );
}
