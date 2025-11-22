// src/app/pages/AboutPage.jsx
import { useEffect, useRef, useState } from 'react'
import { Film, Heart, Users, Zap, Database, Code, Shield } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <HeroSection />
      <MissionSection />
      <StatsSection />
      <ValuesSection />
      <TechStackSection />
      <TeamSection />
    </div>
  )
}

// --- SECTIONS ---

function HeroSection() {
  return (
    <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden flex items-center justify-center">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-black to-black z-0" />
      
      {/* Floating Elements (Decorative) */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Film className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-bold tracking-wider uppercase text-purple-200">The FeelFlick Story</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-white/60 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
          More Than Just <br /> A Movie Database.
        </h1>
        <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          We built FeelFlick to bring the magic of discovery back to cinema. 
          No algorithms dictating your taste—just pure, unadulterated movie love.
        </p>
      </div>
    </div>
  )
}

function MissionSection() {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Our Mission: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Curate. Connect. Inspire.</span>
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            In a world of endless scrolling, finding the right movie feels like work. 
            We wanted to change that. FeelFlick combines powerful data from TMDB with 
            a user-centric design that puts the "feel" back in flicking through catalogs.
          </p>
          <p className="text-white/70 leading-relaxed text-lg">
            Whether you're a cinephile tracking every watch or a casual viewer looking 
            for a Friday night hit, we've built the tools to make your journey seamless.
          </p>
        </div>
        <div className="relative">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-black border border-white/10 p-1">
            <div className="w-full h-full rounded-xl bg-[url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60 hover:opacity-80 transition-opacity duration-500" />
          </div>
          {/* Floating Badge */}
          <div className="absolute -bottom-6 -left-6 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl max-w-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-green-400 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Built for Fans</p>
                <p className="text-xs text-white/50">By fans, for fans.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { label: 'Movies Indexed', value: '800K+', icon: Database },
    { label: 'Active Users', value: '12K+', icon: Users },
    { label: 'Daily Searches', value: '50K+', icon: Zap },
    { label: 'Lines of Code', value: '100%', icon: Code },
  ]

  return (
    <div className="border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center group cursor-default">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300">
              <stat.icon className="h-6 w-6" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</h3>
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ValuesSection() {
  const values = [
    {
      title: 'Privacy First',
      desc: 'We believe your watchlist is personal. No selling data, no creepy tracking.',
      icon: Shield,
    },
    {
      title: 'Lightning Fast',
      desc: 'Optimized for speed. Because nobody likes waiting for a poster to load.',
      icon: Zap,
    },
    {
      title: 'Community Driven',
      desc: 'Features voted by you. We build what the movie community actually needs.',
      icon: Users,
    },
  ]

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white mb-4">Why Choose FeelFlick?</h2>
        <p className="text-white/60 max-w-2xl mx-auto">
          We are not just another database. We are a modern experience designed for the modern viewer.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {values.map((item, idx) => (
          <div key={idx} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-6 shadow-lg group-hover:shadow-purple-500/20 transition-all">
              <item.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
            <p className="text-white/60 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function TechStackSection() {
  const stack = ['React', 'Supabase', 'Tailwind', 'TMDB API', 'Vite', 'Framer Motion']
  
  return (
    <section className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-8">Powered by Modern Tech</p>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {stack.map((tech) => (
            <span key={tech} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm font-medium hover:text-white hover:border-white/30 transition-colors cursor-default">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function TeamSection() {
  const team = [
    {
      name: 'Alex Chen',
      role: 'Founder & Lead Dev',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=300&h=300',
    },
    {
      name: 'Sarah Jones',
      role: 'UI/UX Designer',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=300&h=300',
    },
    {
      name: 'Mike Ross',
      role: 'Data Engineer',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fit=crop&w=300&h=300',
    },
  ]

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white mb-4">Meet the Team</h2>
        <p className="text-white/60">The minds behind the magic.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {team.map((member, idx) => (
          <div key={idx} className="group text-center">
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full p-1 bg-gradient-to-br from-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="w-full h-full rounded-full overflow-hidden bg-black border-4 border-black">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
            <p className="text-purple-400 text-sm font-medium">{member.role}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
