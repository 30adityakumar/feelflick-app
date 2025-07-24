const cards = [
  {
    title: 'Mood-Driven, Personalized Picks',
    description: "FeelFlick learns your movie taste and listens to your current mood. No generic suggestions — just titles that match your vibe.",
  },
  {
    title: 'Fast, Simple, and Private',
    description: "FeelFlick delivers quick, clutter-free suggestions. No ratings, no filters, no noise. Your data stays private, always secure.",
  },
  {
    title: 'Track What You Love For Free',
    description: "Keep a log of every movie you’ve seen. Build watchlists, revisit favorites, and reflect on your taste. Always free.",
  },
];

export default function WhyFeelFlick() {
  return (
    <section className="w-full bg-black/80 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-wider uppercase mb-7">
          More Reasons To Join
        </h2>
        <div className="flex flex-col md:flex-row gap-5">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="
                flex-1 bg-zinc-900 rounded-xl shadow-md
                px-5 py-6
                min-w-[230px]
              "
            >
              <h3 className="text-base md:text-lg font-bold mb-2 text-orange-400">{card.title}</h3>
              <p className="text-zinc-200 text-sm md:text-base leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
