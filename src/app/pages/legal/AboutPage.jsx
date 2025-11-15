// src/app/pages/legal/AboutPage.jsx
import { Link } from 'react-router-dom'
import { ArrowLeft, Heart, Sparkles, Users } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with back button */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-16">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-[#FF9245] via-[#EB423B] to-[#E03C9E] bg-clip-text text-transparent">
            About FeelFlick
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl">
            Movies that match your mood — fast, private, and always free.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-12 rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
              <p className="text-white/80 leading-relaxed">
                FeelFlick exists to solve a simple problem: decision fatigue. With thousands of movies available, 
                finding the right one for how you feel can be overwhelming. We believe movie discovery should be 
                intuitive, personal, and emotion-driven — not another endless scroll.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">How FeelFlick Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Mood-Based Discovery"
              description="Select how you're feeling and get instant, personalized recommendations."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Build Your Library"
              description="Create watchlists, track history, and share with friends."
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6" />}
              title="100% Free"
              description="No subscriptions, no ads, no hidden fees. Just great movie recommendations."
            />
          </div>
        </section>

        {/* Story */}
        <section className="mb-12 prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <div className="space-y-4 text-white/80 leading-relaxed">
            <p>
              FeelFlick started as a simple idea: what if finding a movie was as easy as telling 
              someone how you feel? We noticed that platforms focused on what you've watched, but 
              rarely asked how you're feeling right now.
            </p>
            <p>
              We're building FeelFlick to be more than a recommendation engine — it's a companion 
              for your movie journey, understanding that the perfect film changes with your mood, 
              your day, and your company.
            </p>
            <p>
              Today, FeelFlick is in active development, powered by the TMDB API and shaped by 
              feedback from early users like you. We're committed to keeping it fast, private, 
              and free forever.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-white/10 p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-3">Get in Touch</h2>
          <p className="text-white/80 mb-4">
            Have questions, feedback, or just want to say hi? We'd love to hear from you.
          </p>
          <a
            href="mailto:hello@feelflick.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#FF9245] to-[#EB423B] text-white font-bold hover:from-[#FF9245] hover:to-[#E03C9E] transition-all active:scale-95"
          >
            Contact Us
          </a>
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/70 leading-relaxed">{description}</p>
    </div>
  )
}
