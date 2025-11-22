// src/app/pages/AboutPage.jsx
import { Link } from 'react-router-dom'
import { Sparkles, Heart, Shield, Zap, Mail, Github, Twitter } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-black to-pink-600/20 animate-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.15),transparent_50%)]" />
        
        {/* Content */}
        <div className="relative mx-auto max-w-4xl px-4 md:px-8 pt-32 md:pt-40 pb-20 md:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-white/80">About FeelFlick</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Movies that match your mood
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Fast, private, and always free.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="relative mx-auto max-w-5xl px-4 md:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
              <Heart className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Our Mission</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Solving decision fatigue
            </h2>
            <p className="text-white/70 leading-relaxed mb-6">
              With thousands of movies available, finding the right one for how you feel can be overwhelming. We believe movie discovery should be <span className="text-white font-semibold">intuitive, personal, and emotion-driven</span> — not another endless scroll.
            </p>
            <p className="text-white/70 leading-relaxed">
              FeelFlick puts your feelings first, helping you discover films that resonate with your current mood in seconds.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 p-8 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <div>
                  <p className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    1000+
                  </p>
                  <p className="text-white/60 text-sm font-semibold">Movies Curated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 mb-4">
            <Zap className="h-4 w-4 text-pink-400" />
            <span className="text-xs font-bold text-pink-300 uppercase tracking-wider">How It Works</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black">
            Three steps to your perfect movie
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 text-white font-black text-xl">
              1
            </div>
            <h3 className="text-xl font-bold mb-3">Share Your Mood</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Tell us how you're feeling — happy, stressed, nostalgic, or anything in between. No complicated forms or endless questions.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4 text-white font-black text-xl">
              2
            </div>
            <h3 className="text-xl font-bold mb-3">Get Smart Matches</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Our mood engine analyzes your feelings and matches you with films that fit your vibe, from hidden gems to crowd favorites.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 text-white font-black text-xl">
              3
            </div>
            <h3 className="text-xl font-bold mb-3">Watch & Enjoy</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Skip the endless scrolling. Start watching the perfect movie for your moment, every time.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="relative mx-auto max-w-4xl px-4 md:px-8 py-16 md:py-20">
        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm p-8 md:p-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
            <Heart className="h-4 w-4 text-pink-400" />
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Our Story</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            From frustration to innovation
          </h2>
          
          <div className="space-y-4 text-white/70 leading-relaxed">
            <p>
              FeelFlick started as a simple idea: <span className="text-white font-semibold">what if finding a movie was as easy as telling someone how you feel?</span> We noticed that platforms focused on what you've watched, but rarely asked how you're feeling right now.
            </p>
            
            <p>
              We're building FeelFlick to be more than a recommendation engine — it's a companion for your movie journey, understanding that the perfect film changes with your mood, your day, and your company.
            </p>
            
            <p>
              Today, FeelFlick is in active development, powered by the TMDB API and shaped by feedback from early users like you. We're committed to keeping it <span className="text-purple-400 font-semibold">fast, private, and free forever</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="relative mx-auto max-w-5xl px-4 md:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Built on principles that matter
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            We're not just building an app — we're creating an experience that respects you and your time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Value 1 */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-center group hover:bg-white/10 transition-all">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <Zap className="h-7 w-7 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Lightning Fast</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              No bloat, no lag. Just instant recommendations when you need them.
            </p>
          </div>

          {/* Value 2 */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-center group hover:bg-white/10 transition-all">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30 flex items-center justify-center">
              <Shield className="h-7 w-7 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Privacy First</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Your data stays yours. No tracking, no selling, no compromises.
            </p>
          </div>

          {/* Value 3 */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-center group hover:bg-white/10 transition-all">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 flex items-center justify-center">
              <Heart className="h-7 w-7 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Always Free</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              No paywalls, no premium tiers. Great movie discovery for everyone.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative mx-auto max-w-4xl px-4 md:px-8 py-16 md:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-white/10 backdrop-blur-sm p-8 md:p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.2),transparent_70%)]" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Get in Touch
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              Have questions, feedback, or just want to say hi? We'd love to hear from you.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:hello@feelflick.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <Mail className="h-5 w-5" />
                Email Us
              </a>

              <a
                href="https://twitter.com/feelflick"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Twitter className="h-5 w-5" />
                Twitter
              </a>

              <a
                href="https://github.com/feelflick"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Github className="h-5 w-5" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative mx-auto max-w-4xl px-4 md:px-8 pb-20 text-center">
        <p className="text-white/60 mb-6">
          Ready to discover your next favorite movie?
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-2xl"
        >
          <Sparkles className="h-5 w-5" />
          Start Browsing
        </Link>
      </div>
    </div>
  )
}
