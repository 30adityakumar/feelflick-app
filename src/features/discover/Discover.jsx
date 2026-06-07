import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { scoreMovieForUser, logSurfaceImpressions, updateImpression } from '@/shared/services/recommendations'
import { computeMatchPercent } from '@/shared/services/matchScore'
import { trackInteraction } from '@/shared/services/interactions'
import { getMovieWatchProviders } from '@/shared/api/tmdb'
import { HP_GRAD } from '@/shared/lib/tokens'
import { Play, SkipForward, X, Check, Bookmark } from 'lucide-react'
import { DiscoverDataProvider, useDiscoverData } from './useDiscoverData'
import { MOODS, ONBOARDING_TO_DISCOVER, constellationName, buildBecauseLine, diversifyTop3, predictDiscoverDefaults } from './derive'
import { HP, TIME_OPTIONS } from './constants'
import StageHero from './sections/StageHero'
import StageMood from './sections/StageMood'
import StageNightStacked from './sections/StageNightStacked'
import StageBreath from './sections/StageBreath'
import StageReveal from './sections/StageReveal'
import StageTitleCard from './sections/StageTitleCard'
import './discover.css'

// /discover v5 — Magazine + the immersion senses
// Adds: Web Audio cue layer (plucks/whooms/chord), breath pause,
// black title-card cut, mouse parallax + film grain + vignette on the spread.

// ── Web Audio cue layer ───────────────────────────────────────────────────────
const FFAudio = (() => {
  let ctx = null;
  let masterGain = null;
  // Audio defaults to MUTED. Auto-playing sound on a web app is jarring (quiet or
  // public settings) and off-brand for a calm, considered pick — users opt in via
  // the AudioToggle, and the choice persists across visits.
  const MUTED_KEY = 'ff_discover_muted';
  const readMutedPref = () => {
    try { const v = localStorage.getItem(MUTED_KEY); return v === null ? true : v === '1'; }
    catch { return true; }
  };
  let muted = readMutedPref();
  function ensure() {
    if (ctx) return ctx;
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : 0.45;
      masterGain.connect(ctx.destination);
    } catch { ctx = null; }
    return ctx;
  }
  // Mood → frequency map (notes in a soft Lydian-ish cluster)
  const FREQ = { tender:392.00, tense:493.88, slow:329.63, cerebral:587.33, cozy:440.00, bittersweet:369.99, mythic:523.25, restless:659.25 };
  function pluck(moodId) {
    const c = ensure(); if (!c || muted) return;
    const f = FREQ[moodId] || 440;
    const t = c.currentTime;
    const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(f, t);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const harm = c.createOscillator(); harm.type='triangle'; harm.frequency.setValueAtTime(f*2, t);
    const hg = c.createGain(); hg.gain.setValueAtTime(0, t); hg.gain.linearRampToValueAtTime(0.04, t + 0.012); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.connect(g); harm.connect(hg); g.connect(masterGain); hg.connect(masterGain);
    osc.start(t); harm.start(t); osc.stop(t + 1.0); harm.stop(t + 0.7);
  }
  function whoom() {
    const c = ensure(); if (!c || muted) return;
    const t = c.currentTime;
    const osc = c.createOscillator(); osc.type='sine'; osc.frequency.setValueAtTime(120, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.7);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    osc.connect(g); g.connect(masterGain); osc.start(t); osc.stop(t + 0.75);
  }
  function chord() {
    const c = ensure(); if (!c || muted) return;
    const t = c.currentTime;
    const tones = [261.63, 392.00, 523.25, 659.25]; // C major-ish
    tones.forEach((f, i) => {
      const osc = c.createOscillator(); osc.type = i===0?'sine':'triangle'; osc.frequency.setValueAtTime(f, t);
      const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      osc.connect(g); g.connect(masterGain); osc.start(t + i*0.06); osc.stop(t + 2.7);
    });
  }
  function setMuted(v) {
    muted = v;
    if (masterGain) masterGain.gain.value = v ? 0 : 0.45;
    try { localStorage.setItem(MUTED_KEY, v ? '1' : '0'); } catch { /* private mode — non-fatal */ }
  }
  function isMuted() { return muted; }
  return { pluck, whoom, chord, setMuted, isMuted };
})();

// Mute toggle component
function AudioToggle() {
  const [muted, setMuted] = useState(FFAudio.isMuted());
  return (
    <button onClick={() => { const n = !muted; FFAudio.setMuted(n); setMuted(n); }} title={muted?'Sound off':'Sound on'} style={{ position:'fixed', bottom:24, left:24, width:40, height:40, borderRadius:999, background:'rgba(18,11,28,0.85)', backdropFilter:'blur(12px)', border:`1px solid rgba(255,255,255,0.14)`, color:muted?'rgba(255,255,255,0.45)':'#A78BFA', cursor:'pointer', zIndex:60, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        {!muted && <><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>}
        {muted && <><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></>}
      </svg>
    </button>
  );
}

// ── imports below ──

// Discover keeps a deeper accent purple + two surface tints; spread the shared
// core and override only those (explicit divergence, not copy-paste drift).
const TMDB = (p) => `https://image.tmdb.org/t/p/w500${p}`;

// M.'s diary lookbacks are sourced live from user_ratings via useDiscoverData
// (which falls back to a curated default per mood). The hardcoded set below
// is kept only as a reference snapshot of the editorial copy.
// eslint-disable-next-line no-unused-vars
const DIARY_QUOTES = {
  tense:       { quote:'I held my breath the whole final scene.', after:'Whiplash, 3 weeks ago' },
  slow:        { quote:'Wrote nothing for an hour after the credits.', after:'Past Lives, 12 days ago' },
  tender:      { quote:'Soft. Devastating. I sat there.', after:'Her, last month' },
  cerebral:    { quote:'Stayed in my chest for days.', after:'Arrival, 2 weeks ago' },
  cozy:        { quote:'It healed something I didn’t know was hurting.', after:'Spirited Away, 6 weeks ago' },
  bittersweet: { quote:'Still thinking about the final shot.', after:'In the Mood for Love, 5 weeks ago' },
  mythic:      { quote:'Like seeing the world the first time.', after:'Arrival, 2 weeks ago' },
  restless:    { quote:'Couldn’t sit. Got up. Sat down again.', after:'Whiplash, 3 weeks ago' },
};

// PAIRING + pickPairing removed: the "Pairs with — A glass of red. Tissues
// just in case." ritual note was pure decoration that added cognitive load
// to a decision page. The dyslexia/OCD cleanup pass cut the entire surface.

// Fallback shape — only used when the live query returns nothing (offline,
// RLS denied, fresh DB). The page never renders these in normal operation.
const FILMS_FALLBACK = [
  { id:1, title:'Parasite', year:2019, runtime:132, dir:'Bong Joon-ho', genre:'Thriller', poster:TMDB('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'), ff:97, critic:96, audience:90, fit:{tense:0.94,slow:0.78,tender:0.20,cerebral:0.70,cozy:0.05,bittersweet:0.50,mythic:0.10,restless:0.78}, arc:'Starts cozy → turns tense → ends devastating.', arcPoints:[0.3,0.35,0.4,0.5,0.55,0.7,0.85,0.95,0.9,0.75], twin:{who:'Marco',rating:5,note:'The peach scene still wrecks me.'}, criticLine:{q:'There is nothing else on screen quite like it.', src:'— Manohla Dargis, NYT'} },
  { id:2, title:'Past Lives', year:2023, runtime:105, dir:'Celine Song', genre:'Drama', poster:TMDB('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg'), ff:94, critic:96, audience:84, fit:{tense:0.10,slow:0.86,tender:0.94,cerebral:0.40,cozy:0.20,bittersweet:0.92,mythic:0.20,restless:0.55}, arc:'Soft throughout. Heaviest in the final scene.', arcPoints:[0.4,0.42,0.45,0.45,0.5,0.55,0.6,0.75,0.88,0.7], twin:{who:'Priya',rating:5,note:'Held in my chest the whole final scene.'}, criticLine:{q:'A debut of staggering control.', src:'— A.O. Scott'} },
  { id:3, title:'Drive', year:2011, runtime:100, dir:'N. W. Refn', genre:'Crime', poster:TMDB('/602vevIURmpDfzbnv5Ubi6wIkQm.jpg'), ff:88, critic:80, audience:78, fit:{tense:0.74,slow:0.90,tender:0.18,cerebral:0.30,cozy:0.05,bittersweet:0.35,mythic:0.40,restless:0.72}, arc:'Slow → sudden bursts → cool burn.', arcPoints:[0.3,0.32,0.5,0.85,0.5,0.6,0.9,0.5,0.55,0.45], twin:{who:'Theo',rating:5,note:'Elevator scene aged into something else entirely.'}, criticLine:{q:'The kind of cool that won’t age.', src:'— Anthony Lane, The New Yorker'} },
  { id:4, title:'Arrival', year:2016, runtime:116, dir:'Denis Villeneuve', genre:'Sci-Fi', poster:TMDB('/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg'), ff:90, critic:94, audience:82, fit:{tense:0.30,slow:0.82,tender:0.40,cerebral:0.95,cozy:0.10,bittersweet:0.78,mythic:0.85,restless:0.42}, arc:'Patient → awe → quiet ache.', arcPoints:[0.45,0.5,0.55,0.6,0.7,0.85,0.8,0.75,0.65,0.7], twin:{who:'Priya',rating:5,note:'The big idea lands cleaner on a re-watch.'}, criticLine:{q:'Science fiction as quiet revelation.', src:'— Justin Chang, LA Times'} },
  { id:5, title:'Whiplash', year:2014, runtime:106, dir:'Damien Chazelle', genre:'Drama', poster:TMDB('/7fn624j5lj3xTme2SgiLCeuedmO.jpg'), ff:92, critic:94, audience:94, fit:{tense:0.92,slow:0.40,tender:0.20,cerebral:0.50,cozy:0.05,bittersweet:0.35,mythic:0.20,restless:0.85}, arc:'Tense → tenser → explosive.', arcPoints:[0.55,0.6,0.65,0.72,0.78,0.85,0.88,0.92,0.98,0.85], twin:{who:'Marco',rating:5,note:'Best ending of the decade.'}, criticLine:{q:'A hundred and six minutes of breath-held cinema.', src:'— David Edelstein'} },
  { id:6, title:'Her', year:2013, runtime:126, dir:'Spike Jonze', genre:'Romance', poster:TMDB('/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg'), ff:86, critic:94, audience:81, fit:{tense:0.15,slow:0.78,tender:0.86,cerebral:0.62,cozy:0.45,bittersweet:0.88,mythic:0.45,restless:0.55}, arc:'Warm → wistful → a real ache.', arcPoints:[0.4,0.42,0.5,0.5,0.55,0.65,0.75,0.85,0.8,0.7], twin:{who:'Marco',rating:5,note:'Soft, devastating. Phoenix never better.'}, criticLine:{q:'Tender enough to break your composure.', src:'— Manohla Dargis, NYT'} },
  { id:7, title:'Spirited Away', year:2001, runtime:125, dir:'Hayao Miyazaki', genre:'Animation', poster:TMDB('/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'), ff:91, critic:97, audience:97, fit:{tense:0.20,slow:0.55,tender:0.70,cerebral:0.45,cozy:0.92,bittersweet:0.40,mythic:0.95,restless:0.30}, arc:'Cozy → mythic → cozy.', arcPoints:[0.4,0.5,0.6,0.7,0.75,0.7,0.6,0.55,0.5,0.45], twin:{who:'Jules',rating:5,note:'Healed something I didn’t know was hurting.'}, criticLine:{q:'A film for every age, then.', src:'— Roger Ebert'} },
  { id:8, title:'Oldboy', year:2003, runtime:120, dir:'Park Chan-wook', genre:'Thriller', poster:TMDB('/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg'), ff:89, critic:81, audience:94, fit:{tense:0.90,slow:0.60,tender:0.10,cerebral:0.55,cozy:0.04,bittersweet:0.45,mythic:0.30,restless:0.80}, arc:'Tense throughout. Ending will floor you.', arcPoints:[0.5,0.55,0.65,0.75,0.82,0.85,0.88,0.92,0.95,0.85], twin:{who:'Theo',rating:5,note:'Hammer corridor, all-time top 10.'}, criticLine:{q:'Vengeance as poetry.', src:'— Variety'} },
  { id:9, title:'In the Mood for Love', year:2000, runtime:98, dir:'Wong Kar-wai', genre:'Romance', poster:TMDB('/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg'), ff:93, critic:92, audience:87, fit:{tense:0.12,slow:0.92,tender:0.92,cerebral:0.55,cozy:0.30,bittersweet:0.95,mythic:0.25,restless:0.40}, arc:'Slow throughout. Patient ache.', arcPoints:[0.35,0.38,0.42,0.45,0.5,0.55,0.6,0.7,0.8,0.7], twin:{who:'Priya',rating:5,note:'Cheung’s eyes alone deserve five stars.'}, criticLine:{q:'Cinema as memory itself.', src:'— Cahiers du Cinéma'} },
  { id:10,title:'Inception', year:2010, runtime:148, dir:'C. Nolan', genre:'Sci-Fi', poster:TMDB('/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg'), ff:84, critic:87, audience:91, fit:{tense:0.70,slow:0.35,tender:0.18,cerebral:0.90,cozy:0.10,bittersweet:0.40,mythic:0.78,restless:0.65}, arc:'Heady build → chase climax → ambiguous.', arcPoints:[0.5,0.55,0.6,0.7,0.78,0.85,0.9,0.92,0.85,0.7], twin:{who:'Marco',rating:4,note:'The hallway scene still rules.'}, criticLine:{q:'Architecture as drama.', src:'— A.O. Scott'} },
  { id:11,title:'La La Land', year:2016, runtime:128, dir:'Damien Chazelle', genre:'Romance', poster:TMDB('/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg'), ff:80, critic:91, audience:81, fit:{tense:0.15,slow:0.50,tender:0.85,cerebral:0.30,cozy:0.55,bittersweet:0.92,mythic:0.40,restless:0.45}, arc:'Bright → bittersweet → quiet acceptance.', arcPoints:[0.55,0.6,0.65,0.7,0.7,0.65,0.6,0.7,0.85,0.75], twin:{who:'Jules',rating:4,note:'"City of Stars" still kills.'}, criticLine:{q:'A musical that earns its swoon.', src:'— Justin Chang'} },
  { id:12,title:'Hereditary', year:2018, runtime:127, dir:'Ari Aster', genre:'Horror', poster:TMDB('/hjlZSXM86wJrfCv5VKfR5DI2VeU.jpg'), ff:85, critic:90, audience:70, fit:{tense:0.96,slow:0.75,tender:0.05,cerebral:0.60,cozy:0.02,bittersweet:0.30,mythic:0.45,restless:0.92}, arc:'Dread → dread → catastrophic.', arcPoints:[0.4,0.5,0.6,0.7,0.8,0.85,0.9,0.95,0.98,0.92], twin:{who:'Theo',rating:4,note:'Watch it once. Then never again.'}, criticLine:{q:'Dread, distilled.', src:'— Variety'} },
];

function Starfield({ tint }) {
  const stars = useMemo(() => {
    const out = [];
    for (let i = 0; i < 110; i++) out.push({ x: Math.random()*100, y: Math.random()*100, size: Math.random()*1.6 + 0.4, delay: Math.random()*8, dur: 6 + Math.random()*8, opacity: 0.25 + Math.random()*0.5, layer: Math.floor(Math.random()*3) });
    return out;
  }, []);
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse 90% 60% at 50% 0%, ${tint}1f, transparent 60%), radial-gradient(ellipse 80% 50% at 50% 100%, ${tint}14, transparent 60%)`, transition:'background 0.8s ease' }} />
      {stars.map((s, i) => (
        <div key={i} style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`, width:s.size*(1+s.layer*0.4), height:s.size*(1+s.layer*0.4), borderRadius:999, background:'#fff', opacity:s.opacity*(1-s.layer*0.15), animation:`ff-twinkle ${s.dur + s.layer*4}s ease-in-out ${s.delay}s infinite`, boxShadow:`0 0 ${s.size*3}px rgba(255,255,255,0.6)` }} />
      ))}
    </div>
  );
}

// Internal Nav removed — AppShell provides the global TopNav.

function useCountUp(target, duration=1400, delay=200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const t0 = setTimeout(() => {
      const tick = (now) => { if (!start) start = now; const elapsed = now - start; const p = Math.min(elapsed / duration, 1); const eased = 1 - Math.pow(1 - p, 3); setV(Math.round(target * eased)); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(t0); if (raf) cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return v;
}

// buildWhyNow removed: the "Why now" box that explained the engine's
// reasoning per intention/mood was one of 4 reason-boxes contributing to
// the OCD/dyslexia clutter. The single "Why this one" proof line above the
// action buttons now carries the reasoning, drawn from real engine signals.

// buildPickProof removed: the multi-signal proof block (director hit, twin
// rating, mood-axis fit, runtime fit, fallback) read as too much text
// alongside the synopsis. Personalisation now lives in the visual signals
// (match ring, mood chips, streaming chip, trailer button). If we bring
// signal-language back later, the helper template is in git history.

// MoodArc removed: the small SVG emotional-arc chart was one of 4 reason
// surfaces contributing to the decision-page clutter. Lives on /movie/:id
// (the Film File) for users who want the deep film-shape read.

// ── Streaming provider chip (single best provider) ──────────────────────────
// Borrowed from home-v2/sections-top.jsx — same compact chip with logo +
// "Streaming on Netflix" / "Rent on Apple TV+" label. Returns null when TMDB
// has no provider for the title; the chip then doesn't render.
function useStreamingProvider(tmdbId) {
  const [provider, setProvider] = useState(null);
  useEffect(() => {
    if (!tmdbId) { setProvider(null); return; }
    const controller = new AbortController();
    let cancelled = false;
    setProvider(null);
    getMovieWatchProviders(tmdbId, { region: 'CA', fallbackRegion: 'US', signal: controller.signal })
      .then(data => {
        if (cancelled) return;
        const p = data?.providers?.[0];
        if (p) setProvider(p);
      })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; controller.abort(); };
  }, [tmdbId]);
  return provider;
}

function StreamingChip({ provider }) {
  if (!provider) return null;
  const label = provider.type === 'flatrate' ? 'Streaming on'
    : provider.type === 'rent' ? 'Rent on'
    : 'Buy on';
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'8px 12px 8px 8px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:`1px solid ${HP.border}`, maxWidth:'100%' }}>
      <img
        src={`https://image.tmdb.org/t/p/w92${provider.logoPath}`}
        alt={provider.name}
        style={{ width:28, height:28, borderRadius:5, objectFit:'cover', flex:'none' }}
        loading="lazy"
      />
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:HP.textFaint, fontFamily:'Outfit', lineHeight:1 }}>{label}</div>
        <div style={{ fontSize:12, fontWeight:600, color:HP.text, fontFamily:'Outfit', lineHeight:1.2, marginTop:3 }}>{provider.name}</div>
      </div>
    </div>
  );
}

// ── YouTube IFrame Player API — singleton loader ────────────────────────────
// Loads https://www.youtube.com/iframe_api once (idempotent). The API
// requires a global `onYouTubeIframeAPIReady` callback that fires after the
// script finishes; we wrap it in a memoized Promise so multiple TrailerModal
// mounts share the same load. Returns a Promise that resolves to window.YT.
let _ytApiPromise = null;
function loadYouTubeApi() {
  if (_ytApiPromise) return _ytApiPromise;
  _ytApiPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const existing = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof existing === 'function') existing();
      resolve(window.YT);
    };
    if (!document.querySelector('script[data-yt-iframe-api]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.dataset.ytIframeApi = '1';
      document.head.appendChild(tag);
    }
  });
  return _ytApiPromise;
}

// ── Inline trailer modal (YouTube IFrame Player) ────────────────────────────
// Uses the official IFrame Player API (not a raw <iframe>) so we can listen
// for the ENDED state and auto-close. That keeps the user on /discover after
// the trailer instead of staring at YouTube's end-card with related-video
// thumbnails (a brand leak). Click-on-overlay also closes — common modal
// pattern users expect alongside Esc + the explicit X button.
function TrailerModal({ open, youtubeKey, title, onClose }) {
  const closeBtnRef = useRef(null);
  const playerRef = useRef(null);
  const playerSlotRef = useRef(null);
  // Latest onClose held in a ref so the player effect's deps stay stable —
  // otherwise the parent's inline `() => setTrailerOpen(false)` would
  // re-create the player on every parent re-render.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Body scroll lock + Escape + initial focus
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open]);

  // Mount the YouTube player + listen for ENDED
  useEffect(() => {
    if (!open || !youtubeKey) return;
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !YT || !playerSlotRef.current) return;
      // new YT.Player replaces the slot div with an iframe sized to the
      // parent (which is our 16/9 wrapper).
      playerRef.current = new YT.Player(playerSlotRef.current, {
        videoId: youtubeKey,
        playerVars: {
          autoplay: 1,
          rel: 0,            // limit related videos to same channel
          modestbranding: 1, // smaller YouTube logo
          playsinline: 1,    // iOS inline play (no fullscreen takeover)
        },
        events: {
          onStateChange: (e) => {
            // YT.PlayerState.ENDED === 0. Hardcoded to avoid an extra
            // import; the constant is stable in the YouTube API.
            if (e.data === 0) onCloseRef.current?.();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try { playerRef.current.destroy(); } catch { /* ignore */ }
      }
      playerRef.current = null;
    };
  }, [open, youtubeKey]);

  if (!open || !youtubeKey) return null;

  // Overlay click → close (only when target is the overlay itself, not the
  // inner iframe wrapper — stopPropagation on the wrapper prevents clicks
  // inside the player from triggering close).
  const onOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  // Portal to <body> so the modal escapes any parent stacking context.
  // AppShell's main container creates a z:10 stacking context which would
  // otherwise trap the modal beneath the z:50 fixed header — the close X
  // was rendering but hidden behind the header bar. Portaling to body lifts
  // the modal to the root stacking layer where z:300 actually means z:300.
  return createPortal(
    // Overlay click → close is a standard modal-dismiss pattern. Keyboard
    // equivalent is the Escape key (handled in the effect above) + the
    // explicit X close button (auto-focused on mount). The two a11y rules
    // disabled here flag the click-on-overlay convention; suppress for
    // this single modal — the dialog role + Escape handler cover the
    // accessibility intent.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      role="dialog" aria-modal="true" aria-label={`${title} trailer`}
      onClick={onOverlayClick}
      style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(20px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', cursor:'pointer' }}
    >
      {/* Close X — bumped to opaque dark-glass so it reads against any
         video frame (the older near-transparent treatment vanished
         against bright content). Solid black background + brighter
         white outline + slightly larger touch target. */}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label="Close trailer"
        className="ff-trailer-close"
        style={{ position:'absolute', top:20, right:20, width:44, height:44, borderRadius:999, background:'rgba(0,0,0,0.75)', border:'1px solid rgba(255,255,255,0.28)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', transition:'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease' }}
      >
        <X size={22} strokeWidth={2.2} />
      </button>
      {/* Esc-to-close hint — fades in for ~3s then out. Surfaces the
         keyboard shortcut once on open (common in fullscreen video
         players like YouTube + Netflix) without lingering. Pure
         decoration once dismissed; sub-100ms CPU cost. */}
      <div
        aria-hidden="true"
        style={{ position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:2, fontSize:11, fontFamily:'Outfit', fontWeight:500, color:'rgba(255,255,255,0.6)', letterSpacing:'0.06em', opacity:0, animation:'ff-titlecard 3.6s ease forwards', pointerEvents:'none', whiteSpace:'nowrap' }}
      >
        Press <span style={{ padding:'1px 6px', borderRadius:4, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.22)', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:10, marginLeft:4, marginRight:4, color:'#fff' }}>Esc</span> to close
      </div>
      {/* stopPropagation prevents overlay close when clicking inside the
         iframe area. Pure click-intercept, no keyboard action expected. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position:'relative', width:'100%', maxWidth:1080, aspectRatio:'16/9', borderRadius:8, overflow:'hidden', boxShadow:'0 24px 60px -16px rgba(0,0,0,0.8)', cursor:'default' }}
      >
        {/* Slot div — YT.Player replaces this with the actual iframe.
           Sized to fill the 16/9 wrapper above. */}
        <div ref={playerSlotRef} style={{ width:'100%', height:'100%' }} />
      </div>
    </div>,
    document.body
  );
}

function moodFilter(moodId) {
  if (moodId === 'tense') return { cardFilter:'saturate(0.88)', overlay:'repeating-linear-gradient(0deg, rgba(239,68,68,0.04) 0px, rgba(239,68,68,0.04) 1px, transparent 1px, transparent 3px)' };
  if (moodId === 'cozy')  return { overlay:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' };
  if (moodId === 'mythic')return { overlay:'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.06), transparent 25%)' };
  if (moodId === 'slow')  return { kenBurns:true };
  if (moodId === 'bittersweet') return { cardFilter:'sepia(0.15) saturate(0.95)' };
  if (moodId === 'cerebral')    return { cardFilter:'hue-rotate(-6deg) saturate(0.95)' };
  if (moodId === 'tender')      return { halo:true };
  return {};
}

// ── Alternate card — compact preview of an alternate pick. Click promotes
// it to the top slot (the page crossfades and this card swaps places with
// whatever was currently top). Title + meta + because-line; no match %,
// no action buttons — those belong only on the focused top pick. Keeping
// the alternates lightweight matches the "pick between three" intent
// without multiplying decision load.
function AlternateCard({ film, profile, selected, onPick }) {
  const because = buildBecauseLine({ film, profile, selected, isAlt: true });
  return (
    <button
      type="button"
      onClick={onPick}
      className="ff-alt-card"
      style={{
        display:'grid', gridTemplateColumns:'auto 1fr', gap:14,
        padding:14, borderRadius:12,
        background:HP.surface, border:`1px solid ${HP.border}`,
        textAlign:'left', cursor:'pointer',
        transition:'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
      }}
    >
      <img
        src={film.poster}
        alt={film.title}
        loading="lazy"
        style={{ width:84, height:126, objectFit:'cover', borderRadius:6, display:'block' }}
      />
      <div style={{ minWidth:0, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'2px 0' }}>
        <div>
          <h3 style={{ fontFamily:'Outfit', fontSize:16, fontWeight:500, color:HP.text, margin:0, letterSpacing:'-0.015em', lineHeight:1.2 }}>
            {film.title}
          </h3>
          <div style={{ marginTop:6, fontFamily:'Outfit', fontSize:11, color:HP.textMuted, letterSpacing:'0.03em' }}>
            {film.dir} &middot; {film.year} &middot; {film.runtime} min
          </div>
        </div>
        {because && (
          <p style={{ marginTop:8, marginBottom:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:12, fontStyle:'italic', color:HP.textSoft, lineHeight:1.5, textWrap:'pretty' }}>
            {because}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Stage 3 — Pick swiper (top pick + 2 alternates) ──
function StagePick({ selected, who, energy, intention, results, profile, sessionShownIds, onRestart, onBack, blendHex }) {
  // Session-only "hidden" set — when the user skips or marks watched, that
  // film's id lands here and the visible picks filter it out. The next-best
  // queued pick auto-advances into the top slot. Resets only when `results`
  // changes (user tweaked inputs or started over). Pool depth is set by
  // MAX_PICKS below — deep enough to feel like a real swipe deck without
  // dropping into low-confidence territory.
  const [hiddenTopIds, setHiddenTopIds] = useState(() => new Set());
  // User can also manually pin one of the picks via the alternate cards
  // ("pick from these" intent). null = use default (first non-hidden).
  // Cleared on skip/watched so default takes over after dismissal.
  const [selectedTopId, setSelectedTopId] = useState(null);
  useEffect(() => { setHiddenTopIds(new Set()); setSelectedTopId(null); }, [results]);

  // Pool of 15 picks — enough that the user can keep skipping without
  // hitting exhausted prematurely, but capped before the engine starts
  // returning weaker matches. 15 is a deep-enough swipe deck without
  // becoming a feed.
  const MAX_PICKS = 15;
  // How many alternate cards to render below the focused top pick. The
  // rest are "queued" — they auto-promote when the user skips/watches.
  // 2 visible cards keeps the row scannable; deeper queue surfaces via
  // the count in the section kicker.
  const ALTERNATES_VISIBLE = 2;

  const initialPicks = useMemo(() => results.slice(0, MAX_PICKS), [results]);
  const visibleResults = useMemo(
    () => initialPicks.filter(r => !hiddenTopIds.has(r.id)),
    [initialPicks, hiddenTopIds]
  );
  const top = useMemo(() => {
    if (selectedTopId) {
      const pinned = visibleResults.find(r => r.id === selectedTopId);
      if (pinned) return pinned;
    }
    return visibleResults[0];
  }, [selectedTopId, visibleResults]);
  // Visible alternates (rendered as cards) vs total remaining in the
  // queue (rendered as a count in the kicker). When the user skips, the
  // queue shrinks and the first queued film slides into the alternate
  // slot. After all 15 are exhausted, falls through to the exhausted state.
  const remainingAfterTop = useMemo(
    () => visibleResults.filter(r => r.id !== top?.id),
    [visibleResults, top]
  );
  const alternates = useMemo(
    () => remainingAfterTop.slice(0, ALTERNATES_VISIBLE),
    [remainingAfterTop]
  );
  const queuedCount = Math.max(0, remainingAfterTop.length - alternates.length);
  const exhausted = !top;

  const cName = constellationName(selected);
  // Mood fit % — answers "how well does this film match what I asked for
  // tonight?". Mean of the user's selected mood-axis fits against the
  // film's fit vector, clamped 0-99. This is the headline ring number
  // because the user JUST answered the mood question — the result page
  // should reflect that answer. The taste % (top.match — calibrated
  // baseScore via computeMatchPercent) is demoted to a meta-row chip,
  // honoring both signals: "tonight" (mood-fit) and "you" (taste).
  const moodFit = useMemo(() => {
    if (!top?.fit || !selected || selected.length === 0) return null;
    const sum = selected.reduce((a, id) => a + (top.fit[id] || 0), 0);
    return Math.max(0, Math.min(99, Math.round((sum / selected.length) * 100)));
  }, [top, selected]);
  const matchAnim = useCountUp(moodFit ?? top?.match ?? 0, 1400, 250);
  const [savedState, setSavedState] = useState('idle'); // idle | saving | saved | error
  const [watchedState, setWatchedState] = useState('idle'); // idle | watched
  const [trailerOpen, setTrailerOpen] = useState(false);
  // Per-film Saved + Watched state — when the user clicks Save or Mark
  // Watched, the button confirms success ("Saved", "Watched"). On
  // auto-advance to a new film, both reset to idle so the new top can be
  // saved/marked too.
  useEffect(() => { setSavedState('idle'); setWatchedState('idle'); }, [top?.id]);
  // Session-shown tracking — add every film that appears as top OR alt to
  // the parent's sessionShownIds ref. diversifyTop3 reads this ref on
  // each allResults recomputation (i.e., whenever user changes inputs)
  // and demotes seen films so the next scenario surfaces fresh picks.
  // Mutating a ref doesn't re-render — intentional; we only want the
  // penalty applied on the NEXT input change, not within the current view.
  useEffect(() => {
    if (!sessionShownIds?.current) return;
    if (top?.id) sessionShownIds.current.add(top.id);
    for (const alt of (visibleResults || [])) {
      if (alt?.id) sessionShownIds.current.add(alt.id);
    }
  }, [top?.id, visibleResults, sessionShownIds]);
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuthSession();
  // Streaming provider (top 1 — flatrate first, then rent/buy). Hides cleanly
  // when TMDB has nothing for this title.
  const provider = useStreamingProvider(top?.tmdbId);
  // "Because…" line — one signal that proves the engine knows the user.
  // Recomputes whenever the top changes (manual pin or auto-advance).
  const becauseLine = useMemo(
    () => buildBecauseLine({ film: top, profile, selected }),
    [top, profile, selected]
  );
  // Mood/tone chips: genre + the 2 strongest mood/tone tags. Tells the user
  // what KIND of film this is at a glance, complementing the proof line
  // (which says why it fits THEM). Capitalize + replace underscores so DB
  // tags like "slow_burn" read as "Slow burn".
  const chips = useMemo(() => {
    if (!top) return [];
    const out = [];
    if (top.genre && top.genre !== 'Drama') out.push(top.genre); // skip plain "Drama" as too generic
    else if (top.genre) out.push(top.genre);
    const tags = [...(top._raw?.mood_tags || []), ...(top._raw?.tone_tags || [])]
      .filter(Boolean)
      .slice(0, 2)
      .map(t => String(t).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    return [...out, ...tags].slice(0, 3);
  }, [top]);
  useEffect(() => {
    const fn = (e) => { const cx = window.innerWidth/2, cy = window.innerHeight/2; setMx((e.clientX - cx)/cx); setMy((e.clientY - cy)/cy); };
    window.addEventListener('mousemove', fn); return () => window.removeEventListener('mousemove', fn);
  }, []);

  // === Action handlers ===
  // Stage 2 context shared across all interaction logs so the engine can
  // learn from POSITIVE actions (save, watch, click), not just negative
  // ones (skip). Previously Skip was the only handler writing
  // user_interactions with mood/intention/energy/who — the engine had a
  // negative bias because positive signals lost their full context.
  const interactionContext = (action) => ({
    movieId: top?.id,
    source: 'discover',
    metadata: { action, moods: selected, intention, energy, who },
  });

  // "See more" navigates to the deep film page (/movie/:tmdbId) where the
  // user finds extended synopsis, providers, similar films, etc. Fires
  // updateImpression('clicked') so the engine learns conversion AND
  // trackInteraction('click', …) so the engine sees the full Stage 2
  // context that drove the click — same metadata shape as Skip uses.
  const handleSeeMore = () => {
    if (!top?.tmdbId) return;
    if (user?.id && top?.id) {
      updateImpression(user.id, top.id, 'clicked').catch(() => {})
      trackInteraction('click', interactionContext('see_more')).catch(() => {})
    }
    navigate(`/movie/${top.tmdbId}`);
  };
  const handleSaveForLater = async () => {
    if (!user?.id || !top?.id || savedState !== 'idle') return;
    const filmId = top.id;
    setSavedState('saving');
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({ user_id: user.id, movie_id: filmId });
      if (error && error.code !== '23505') throw error; // 23505 = unique violation (already in list)
      setSavedState('saved');
      // Engine learning: flip the impression's added_to_watchlist flag
      // AND log the interaction with Stage 2 context. Both fire after
      // the watchlist write succeeds so we don't credit a failed save.
      updateImpression(user.id, filmId, 'saved').catch(() => {})
      trackInteraction('save', interactionContext('save_for_later')).catch(() => {})
    } catch (e) {
      console.error('[Discover.saveForLater]', e);
      setSavedState('error');
    }
  };
  // Skip Tonight — auto-advances to the next pick instead of bouncing home.
  // The page now behaves as a 3-pick swiper: skip the top → alternate #1
  // becomes top → alternate #2 becomes top → exhausted state. Each skip
  // still fires:
  //   1. user_interactions ('dismiss', source 'discover') — analytics log
  //   2. recommendation_impressions.skipped = true → engine's negative-
  //      signal model penalises matching directors/genres next /discover run
  // The skipped film also lands in hiddenTopIds for the rest of this
  // session AND gets a 30-day hard exclusion via useDiscoverData's
  // recent-skip query.
  const handleNotTonight = () => {
    if (!top?.id) return;
    trackInteraction('dismiss', {
      movieId: top.id,
      source: 'discover',
      metadata: {
        action: 'not_tonight',
        moods: selected,
        intention,
        energy,
        who,
      },
    }).catch(() => {})
    if (user?.id) {
      updateImpression(user.id, top.id, 'skipped').catch(() => {})
    }
    setHiddenTopIds(prev => new Set([...prev, top.id]));
    setSelectedTopId(null);
  };

  // Click an alternate card to promote it to top. AnimatePresence
  // crossfades the spread; the alternate that was promoted swaps places
  // with whatever was currently top. No-op if clicked the current top.
  const handlePickAlternate = (altId) => {
    if (!altId || altId === top?.id) return;
    setSelectedTopId(altId);
  };

  // Mark Watched — user has already seen this film. Closes the loop both
  // for the recommendation engine (don't surface this again) and the
  // user's own library. The button flips to "Watched" for a beat of
  // confirmation, then auto-advances to the next pick. Capture top.id in
  // a closure so the setTimeout still fires against the right film even
  // after the state change starts swapping in the next pick.
  const markWatchedTimeoutRef = useRef(null);
  useEffect(() => () => {
    if (markWatchedTimeoutRef.current) clearTimeout(markWatchedTimeoutRef.current);
  }, []);
  const handleMarkWatched = async () => {
    if (!top?.id || !user?.id || watchedState !== 'idle') return;
    const filmId = top.id;
    setWatchedState('watched');
    try {
      // 23505 (unique violation) = already in history; treat as success
      const { error } = await supabase
        .from('user_history')
        .insert({ user_id: user.id, movie_id: filmId, source: 'discover_marked' });
      if (error && error.code !== '23505') throw error;
    } catch (e) {
      console.error('[Discover.markWatched]', e);
      // Even on insert failure, hide locally so the user can move on
    }
    updateImpression(user.id, filmId, 'watched').catch(() => {});
    trackInteraction('watch', interactionContext('mark_watched')).catch(() => {});
    // 600ms holds "Watched ✓" long enough to register as confirmation
    // before the crossfade swap (180ms) carries the next pick in. Cleared
    // on unmount so a quick Tweak inputs / Start over click during the
    // hold doesn't fire a setState on an unmounted component.
    markWatchedTimeoutRef.current = setTimeout(() => {
      setHiddenTopIds(prev => new Set([...prev, filmId]));
      setSelectedTopId(null);
      markWatchedTimeoutRef.current = null;
    }, 600);
  };

  // Stage 3 impression log — fires per current top pick. The page now
  // behaves as a 3-pick swiper (skip → alt #1 becomes top → alt #2 becomes
  // top → exhausted), so each new top deserves its own impression row
  // under placement='discover'. Alternates are not logged as separate
  // impressions until they're promoted to top — they're queued, not yet
  // seen as a "pick" by the user. Per-day-deduped by the table's unique
  // key, so re-visits don't inflate counts.
  const topId = top?.id
  useEffect(() => {
    if (!user?.id || !topId || !top) return
    logSurfaceImpressions({
      userId: user.id,
      films: [{ id: top.id, engineScore: top.match, _pickReasonLabel: 'discover_top_pick' }],
      placement: 'discover',
      pickReasonType: 'discover_reveal',
      pickReasonLabel: `Discover · ${cName}`,
    })
    // top.id pins the impression — when the swiper auto-advances we log
    // the new top as its own row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, topId])

  const filter = moodFilter(selected[0]);

  // Exhausted state — user skipped/watched all 3 initial picks. Editorial
  // dead-end with two doors: tweak inputs (revisit Stage 2 — same
  // constellation, different night-shape answers) or start over (back to
  // Stage 0 — fresh moods). Matches the design language with eyebrow +
  // italic accent + brand-gradient primary action. No new picks magic-
  // refilled here; that would feel like infinite scroll, which the OCD/
  // dyslexia cleanup is explicitly against.
  if (exhausted) {
    return (
      <section className="ff-discover-section" style={{ position:'relative', minHeight:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px', textAlign:'center', animation:'ff-fade 0.5s ease' }}>
        <AudioToggle />
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:blendHex, marginBottom:18, fontFamily:'Outfit', display:'inline-flex', alignItems:'center', gap:10 }}>
          <span style={{ height:1, width:22, background:blendHex, opacity:0.6 }} />
          End of edition
        </div>
        <h2 style={{ fontFamily:'Outfit', fontSize:'clamp(36px, 5vw, 62px)', lineHeight:1.02, fontWeight:200, letterSpacing:'-0.04em', color:HP.text, margin:0, maxWidth:760, textWrap:'balance' }}>
          That&rsquo;s <em style={{ fontStyle:'italic', fontWeight:300, color:HP.textSoft }}>everything</em> for tonight.
        </h2>
        <p style={{ marginTop:18, fontFamily:'Outfit, Inter, sans-serif', fontSize:14, color:HP.textMuted, fontStyle:'italic', maxWidth:480, lineHeight:1.6 }}>
          Tweak what you told me &mdash; or start fresh. New picks are seconds away.
        </p>
        <div style={{ marginTop:32, display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
          <button onClick={onBack} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 22px', borderRadius:10, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:700, letterSpacing:'0.01em', cursor:'pointer', boxShadow:'0 10px 26px -10px rgba(236,72,153,0.55)' }}>&larr; Tweak inputs</button>
          <button onClick={onRestart} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}>Start over</button>
        </div>
      </section>
    );
  }

  // Synopsis — TMDB's real overview. Gracefully degrades: if the film row
  // has no overview (rare; some films missing it, or fallback set), we hide
  // the article paragraph entirely rather than fall back to the older
  // templated ffTake prose, which was the same wording for every film with
  // only the director swapped (read as curator voice but was a Mad Lib).
  const synopsis = top.overview && top.overview.trim().length > 20 ? top.overview.trim() : null;

  // Title words for typesetting
  const titleWords = top.title.split(' ');

  return (
    <section className="ff-discover-section" style={{ position:'relative', animation:'ff-fade 0.7s ease' }}>
      <AudioToggle />
      {/* Film grain + vignette overlays */}
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, opacity:0.045, mixBlendMode:'overlay', backgroundImage:'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")', animation:'ff-grain 1.6s steps(6) infinite' }} />
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, background:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />
      {/* No mast banner — the user is already on /discover; the brand
         chrome ("FeelFlick · The Discover Edition") + curator note
         ("Tonight's film, for your constellation X") were two rows of
         magazine theater that added cognitive load before the decision.
         The constellation name still pays off in /movie/:tmdbId if the
         user wants to read deep. */}

      {/* Spread — two columns on desktop, single linear flow on mobile.
         Wrapped in AnimatePresence keyed on top.id so that when the user
         skips or marks Watched it, the current pick fades out and the
         next pick fades in. Without this the swap was a jarring snap —
         posters changed mid-page with no continuity. mode="wait" keeps
         the layout stable (next pick doesn't mount until current finishes
         exiting), and 180ms duration keeps total swap snappy (~360ms). */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={top.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
      <div className="ff-stage3-spread">
        {/* LEFT PAGE — poster + match ring only. The film strip ribbon,
           pairing notes, and IN THIS ISSUE TOC sidebar all gone — pure
           magazine chrome with no decision payload. The spine gutter is
           also gone (it framed a 2-page magazine; without the surrounding
           chrome it now just marks an arbitrary divide). */}
        <div className="ff-stage3-spread__left" style={{ position:'relative', transform:`translate(${mx*-6}px, ${my*-4}px)`, transition:'transform 0.4s cubic-bezier(.2,.7,.2,1)' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-14, borderRadius:14, background:`radial-gradient(ellipse at center, ${blendHex}55, transparent 70%)`, filter:'blur(30px)', animation: filter.halo ? 'ff-bloom-pulse-strong 4s ease-in-out infinite' : 'ff-bloom-pulse 4s ease-in-out infinite' }} />
            <div style={{ position:'relative', overflow:'hidden', borderRadius:8, boxShadow:`0 30px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px ${blendHex}33` }}>
              <img src={top.poster} alt={top.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block', filter: filter.cardFilter || 'none', animation: filter.kenBurns ? 'ff-kenburns 14s ease-in-out infinite alternate' : 'ff-poster-in 1s cubic-bezier(.2,.7,.2,1)' }} />
              {filter.overlay && <div style={{ position:'absolute', inset:0, background:filter.overlay, pointerEvents:'none', mixBlendMode:'overlay' }} />}
            </div>
            {/* Match ring */}
            <div style={{ position:'absolute', right:-22, bottom:-22, width:104, height:104, borderRadius:999, background:`conic-gradient(${blendHex} ${matchAnim*3.6}deg, rgba(255,255,255,0.07) 0)`, display:'flex', alignItems:'center', justifyContent:'center', padding:5, boxShadow:`0 0 32px ${blendHex}66` }}>
              <div style={{ width:'100%', height:'100%', borderRadius:999, background:HP.bgDeep, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:'Outfit', fontSize:26, fontWeight:300, color:HP.text, letterSpacing:'-0.04em', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{matchAnim}<span style={{ fontSize:11, color:HP.textMuted }}>%</span></div>
                <div style={{ fontSize:7, color:HP.textMuted, letterSpacing:'0.2em', textTransform:'uppercase', fontFamily:'Outfit', marginTop:2 }}>Mood fit</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PAGE */}
        <div className="ff-stage3-spread__right" style={{ transform:`translate(${mx*-3}px, ${my*-2}px)`, transition:'transform 0.4s cubic-bezier(.2,.7,.2,1)' }}>
          {/* Because-line — the one signal that proves the engine knows
             the user. Tinted to the mood-blend hex so it reads as part
             of the user's constellation, not engine chrome. Hides when
             no honest signal exists (cold-start with no mood) rather
             than printing filler. */}
          {becauseLine && (
            <div style={{ marginBottom:14, fontFamily:'Outfit, Inter, sans-serif', fontSize:13, fontStyle:'italic', fontWeight:400, color:blendHex, letterSpacing:'0.01em', textWrap:'balance', opacity:0, animation:'ff-fade 0.5s ease 0.15s forwards' }}>
              {becauseLine}
            </div>
          )}
          {/* Title (no kicker, no byline — the page IS the pick, no need to
             pre-announce it). Word-by-word reveal animation kept; it's pure
             motion, not content load. */}
          <h1 style={{ fontFamily:'Outfit', fontSize:'clamp(44px, 5.6vw, 76px)', lineHeight:0.96, fontWeight:300, letterSpacing:'-0.045em', color:HP.text, margin:0, textWrap:'balance' }}>
            {titleWords.map((w, i) => <span key={i} style={{ display:'inline-block', opacity:0, animation:`ff-word-in 0.55s cubic-bezier(.2,.7,.2,1) ${0.2 + i*0.08}s forwards`, marginRight:'0.2em' }}>{w}</span>)}
          </h1>

          {/* Meta — director · year · runtime · taste %. The taste % was
             demoted from the headline ring (which now shows mood-fit, the
             number that actually answers what the user just asked) into
             this quiet meta row. Both signals stay visible: "tonight"
             (mood-fit, big) and "you" (taste, small). textFaint colour
             keeps it from competing with the director name. */}
          <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', fontFamily:'Outfit', fontSize:13, color:HP.textMuted, letterSpacing:'0.04em', opacity:0, animation:'ff-fade 0.6s ease 0.7s forwards' }}>
            <span>{top.dir}</span>
            <span style={{ color:HP.textFaint }}>·</span>
            <span>{top.year}</span>
            <span style={{ color:HP.textFaint }}>·</span>
            <span>{top.runtime} min</span>
            {Number.isFinite(top.match) && (
              <>
                <span style={{ color:HP.textFaint }}>·</span>
                <span style={{ color:HP.textFaint }} title="How well this film fits your stable taste profile">{top.match}% taste</span>
              </>
            )}
          </div>

          {/* Mood/tone chips — what KIND of film this is at a glance.
             3 chips max: primary genre + 2 strongest mood/tone tags.
             Complements the italic proof line below (which says why it
             fits the USER) by saying what it IS. No background — borders
             only, so visually quieter than the action buttons. */}
          {chips.length > 0 && (
            <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:7, opacity:0, animation:'ff-fade 0.6s ease 0.8s forwards' }}>
              {chips.map((c, i) => (
                <span key={`${c}-${i}`} style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:999, border:`1px solid ${HP.border}`, fontFamily:'Outfit', fontSize:11, fontWeight:500, color:HP.textSoft, letterSpacing:'0.02em' }}>
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* No FOR YOU prose block — the proof lines (mood-axis hit,
             runtime fit, fallback) read as "a lot to read" alongside the
             synopsis. The match ring (calibrated %) + mood chips + trailer
             button already convey personalisation visually. Deeper signal
             readout lives on /movie/:tmdbId for users who want it. */}

          {/* Synopsis — real TMDB overview, plain paragraph, no drop-cap.
             Demoted below the FOR YOU block because it's generic info every
             recommender has; the personal proof above is what makes this
             feel like FeelFlick. Drop-cap was cut earlier (fragments
             reading for dyslexic users). Max-width 580 caps line length
             for readability. Hides when no overview exists. */}
          {synopsis && (
            <p style={{ marginTop:22, marginBottom:0, fontFamily:'Inter, sans-serif', fontSize:14.5, color:HP.textMuted, lineHeight:1.7, textWrap:'pretty', maxWidth:580, opacity:0, animation:'ff-fade 0.7s ease 1.2s forwards' }}>
              {synopsis}
            </p>
          )}

          {/* Streaming provider — one chip with logo + "Streaming on Netflix"
             style label. Renders only when TMDB has a provider for this
             title. Tells the user in one glance whether the recommendation
             is even reachable tonight, removing a click of friction at the
             most decision-critical moment. Detailed provider list (Stream
             / Rent / Buy categories) lives on /movie/:tmdbId. */}
          {provider && (
            <div style={{ marginTop:18, opacity:0, animation:'ff-fade 0.7s ease 1.3s forwards' }}>
              <StreamingChip provider={provider} />
            </div>
          )}

          {/* Action buttons. Primary = gradient "See More" → /movie/:tmdbId
             (deep film page; "Watch now" used to lie because the button
             didn't play the film). Secondary row: Trailer (when YouTube
             key exists), Save, Mark Watched, Skip for tonight. Save +
             Mark Watched both flip to a confirmed state ("Saved" /
             "Watched"); Mark Watched + Skip both auto-advance the swiper
             (positive history write vs. negative dismiss signal). Style:
             rounded-rectangle pills (12px radius) with icons on the left,
             dark surface fill, bolder typography — same shape language as
             the briefing action bar. */}
          <div className="ff-stage3-actions" style={{ opacity:0, animation:'ff-fade 0.7s ease 1.4s forwards' }}>
            <button
              type="button"
              onClick={handleSeeMore}
              style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 22px', borderRadius:10, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:700, letterSpacing:'0.01em', cursor:'pointer', boxShadow:'0 10px 26px -10px rgba(236,72,153,0.55)' }}
            >
              See More &rarr;
            </button>
            {top.trailerKey && (
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                title="Watch the trailer"
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.borderStrong}`, color:HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}
              >
                <Play size={14} fill="currentColor" />
                <span>Trailer</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleMarkWatched}
              disabled={watchedState === 'watched'}
              title="I've already seen this one"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background: watchedState === 'watched' ? `${HP.green}14` : HP.surface, border:`1px solid ${watchedState === 'watched' ? HP.green + '66' : HP.borderStrong}`, color: watchedState === 'watched' ? HP.green : HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor: watchedState === 'idle' ? 'pointer' : 'default' }}
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{watchedState === 'watched' ? 'Watched' : 'Mark Watched'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveForLater}
              disabled={savedState === 'saving' || savedState === 'saved'}
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background: savedState === 'saved' ? `${HP.green}14` : HP.surface, border:`1px solid ${savedState === 'saved' ? HP.green + '66' : HP.borderStrong}`, color: savedState === 'saved' ? HP.green : HP.text, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor: savedState === 'idle' ? 'pointer' : 'default' }}
            >
              <Bookmark size={14} fill={savedState === 'saved' ? 'currentColor' : 'none'} strokeWidth={2} />
              <span>
                {savedState === 'idle' && 'Save'}
                {savedState === 'saving' && 'Saving…'}
                {savedState === 'saved' && 'Saved'}
                {savedState === 'error' && 'Try again'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleNotTonight}
              title="Skip — not tonight"
              style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', borderRadius:10, background:HP.surface, border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}
            >
              <SkipForward size={14} />
              <span>Skip for tonight</span>
            </button>
          </div>
          {/* No depth zone — the match ring + mood chips + streaming chip
             carry the reasoning visually. The deeper magazine treatment
             (diary callback, why-now, emotional arc, taste twin) was 4
             boxes of competing chrome — OCD-hostile and dyslexia-hostile.
             Users who want a deep read on the film have /movie/:tmdbId
             waiting (linked from the See More button). */}
        </div>
      </div>

      {/* Alternates row — two smaller cards for the other 2 picks from
         this batch. Click to promote to top (crossfade swap). Each card
         carries its own because-line so the user can see WHY each is
         on the table. No match %, no action buttons — those belong only
         to the focused top pick. Hides when no alternates are visible
         (after skip/watched bring the count down to 1). */}
      {alternates.length > 0 && (
        <div style={{ marginTop:48, maxWidth:1080, marginLeft:'auto', marginRight:'auto', padding:'0 24px' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.textMuted, marginBottom:16, fontFamily:'Outfit', display:'inline-flex', alignItems:'center', gap:10 }}>
            <span style={{ height:1, width:22, background:HP.textMuted, opacity:0.5 }} />
            <span>Or pick from these</span>
            {queuedCount > 0 && (
              <span style={{ color:HP.textFaint, letterSpacing:'0.18em' }} title={`${queuedCount} more films queued — skip or mark watched to see them`}>
                &middot; {queuedCount} more queued
              </span>
            )}
          </div>
          <div className="ff-stage3-alternates">
            {alternates.map(alt => (
              <AlternateCard
                key={alt.id}
                film={alt}
                profile={profile}
                selected={selected}
                onPick={() => handlePickAlternate(alt.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer — Tweak inputs / Start over, the two ways back into the
         flow without committing to the current pick. Quiet pills, not
         primary buttons — the action gravity belongs on the spread above. */}
      <div style={{ marginTop:56, paddingTop:24, borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'center', gap:10, maxWidth:1080, margin:'56px auto 0' }}>
        <button onClick={onBack}    style={{ padding:'9px 14px', borderRadius:8, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:500, cursor:'pointer' }}>← Tweak inputs</button>
        <button onClick={onRestart} style={{ padding:'9px 14px', borderRadius:8, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:500, cursor:'pointer' }}>Start over</button>
      </div>
        </motion.div>
      </AnimatePresence>

      <TrailerModal open={trailerOpen} youtubeKey={top.trailerKey} title={top.title} onClose={() => setTrailerOpen(false)} />
    </section>
  );
}

// Commit the user's Stage 2 selections to user_discover_preferences —
// increments the count for each selected option in each dimension, plus
// total_commits. Uses an upsert path: read current row (or default to
// empty counts), increment in JS, write back. JSONB ops in Postgres
// (jsonb_set with COALESCE) would be cleaner but require a function
// rather than a raw client call; the read-modify-write here is fine
// because writes are infrequent (once per Stage 2 commit, ~per session).
// Fires fire-and-forget — never blocks the UI transition to Stage 3.
async function commitDiscoverPreferences({ userId, intention, time, who, energy }) {
  if (!userId) return
  try {
    const { data: existing } = await supabase
      .from('user_discover_preferences')
      .select('intention_counts, time_counts, who_counts, energy_counts, total_commits')
      .eq('user_id', userId)
      .maybeSingle()

    const bump = (counts, key) => {
      const next = { ...(counts || {}) }
      next[key] = (next[key] || 0) + 1
      return next
    }

    const row = {
      user_id: userId,
      intention_counts: bump(existing?.intention_counts, intention),
      time_counts:      bump(existing?.time_counts,      time),
      who_counts:       bump(existing?.who_counts,       who),
      energy_counts:    bump(existing?.energy_counts,    energy),
      total_commits:    (existing?.total_commits || 0) + 1,
    }

    const { error } = await supabase
      .from('user_discover_preferences')
      .upsert(row, { onConflict: 'user_id' })
    if (error) throw error
  } catch (e) {
    // Non-fatal — pre-selection just doesn't improve this session.
    // Don't show user-facing error; the Stage 2 → 3 flow continues.
    console.error('[Discover.commitDiscoverPreferences]', e)
  }
}

function DiscoverBody() {
  const [stage, setStage]       = useState(0);
  const [selected, setSelected] = useState([]);
  const [time, setTime]         = useState('std');
  const [who, setWho]           = useState('alone');
  const [energy, setEnergy]     = useState('steady');
  const [intention, setIntention] = useState('move');
  const [bursts, setBursts]     = useState([]);
  // Stage 2 wizard step — lifted to parent so "Tweak inputs" from Stage 3
  // returns to the summary view (stepIndex === 4) instead of restarting
  // the wizard from question 1. Reset to 0 when the user restarts the
  // whole flow from Stage 0 (Start over).
  const [stage2StepIndex, setStage2StepIndex] = useState(0);
  // Films that have appeared as top OR alternate in THIS /discover session
  // (one mount lifetime). diversifyTop3 demotes these so users who tweak
  // moods get genuinely fresh picks across scenarios instead of seeing
  // the same broad-mood films (e.g., Gladiator) win every constellation.
  // Resets naturally when the user leaves /discover and returns.
  const sessionShownIds = useRef(new Set());
  useEffect(() => { if (stage === 0) setStage2StepIndex(0); }, [stage]);
  const { films: liveFilms, profile, baselineMoods, learnedPrefs, recentSaves } = useDiscoverData();
  const { user } = useAuthSession();
  const location = useLocation();
  const fromOnboardingRef = useRef(location.state?.fromOnboarding === true);

  // First-visit pre-select (audit #7). Onboarding asked the user for their
  // baseline moods 30 seconds ago; not re-asking on the first /discover
  // is the smaller of two awkwardnesses. We soft-pre-select the #1
  // baseline mood mapped through the bridge; user can tap to deselect or
  // add up to 2 more before continuing.
  //
  // Subsequent visits start empty — the user's right-now mood is a session
  // signal, distinct from their stable taste baseline. Gated on
  // location.state.fromOnboarding so manual /discover navigations don't
  // get the nudge.
  //
  // The ref prevents the effect from re-firing if the user navigates
  // away/back during this session — fromOnboarding stays true on that
  // location.state until the user manually leaves /discover.
  const didPreSelectRef = useRef(false);
  useEffect(() => {
    if (didPreSelectRef.current) return
    if (!fromOnboardingRef.current) return
    if (selected.length > 0) return
    if (!baselineMoods || baselineMoods.length === 0) return
    const mapped = baselineMoods.map(k => ONBOARDING_TO_DISCOVER[k]).filter(Boolean)
    if (mapped.length === 0) return
    setSelected([mapped[0]])
    didPreSelectRef.current = true
  }, [baselineMoods, selected.length])

  // Stage 2 pre-selection — fires once per /discover mount, after profile
  // loads AND user has at least one mood picked (Stage 1 done). Replaces
  // the hardcoded `move / std / steady` defaults with predictions from
  // signals we already have. User can override any field; the ref
  // prevents the effect from re-applying and clobbering their choices.
  const didPredictDefaultsRef = useRef(false)
  // Reset the prediction gate when the user starts a fresh session
  // (Stage 0 / Start over) so predictions re-apply for the next round.
  useEffect(() => { if (stage === 0) didPredictDefaultsRef.current = false }, [stage])
  useEffect(() => {
    if (didPredictDefaultsRef.current) return
    if (!profile) return
    if (selected.length === 0) return
    // Don't overwrite picks the user has already started making in the
    // stacked wizard (rare race: profile loads while user is mid-flow).
    if (stage2StepIndex > 0) return
    const predicted = predictDiscoverDefaults({
      selected,
      profile,
      hourOfDay: new Date().getHours(),
      learnedPrefs,
    })
    setIntention(predicted.intention)
    setTime(predicted.time)
    setEnergy(predicted.energy)
    setWho(predicted.who)
    didPredictDefaultsRef.current = true
  }, [profile, selected, learnedPrefs, stage2StepIndex])

  // Commit the user's Stage 2 picks to user_discover_preferences when
  // they advance to Stage 3 (treat reaching Stage 3 as "they committed
  // to these filters"). Fire-and-forget — never blocks the transition.
  // Wrapped as a memoised callback so the Stage 2 onNext closure stays
  // stable across re-renders.
  const handleCommitStage2 = useCallback(() => {
    if (user?.id) {
      commitDiscoverPreferences({
        userId: user.id,
        intention,
        time,
        who,
        energy,
      })
    }
  }, [user?.id, intention, time, who, energy])

  // Use live candidates from `movies`; fall back to the editorial seed set
  // only when the query hasn't returned anything (offline / empty DB).
  const films = (liveFilms && liveFilms.length > 0) ? liveFilms : FILMS_FALLBACK;

  const fireBurst = (id, hex) => {
    const t = Date.now();
    setBursts(b => [...b, { id, hex, t }]);
    setTimeout(() => setBursts(b => b.filter(x => x.t !== t)), 900);
  };

  const blendHex = useMemo(() => {
    if (selected.length === 0) return HP.purple;
    return MOODS.find(m => m.id === selected[0])?.hex || HP.purple;
  }, [selected]);

  const allResults = useMemo(() => {
    const runtimeBand = TIME_OPTIONS.find(t => t.id === time)?.v || [0,300];
    // Save-affinity lookup sets — directors and primary_genres the user
    // has saved (user_watchlist) in the last 90 days. Built once per
    // useMemo run, then probed inside the per-film loop for an O(1)
    // saveBoost. The engine learns from positive signals via this layer.
    const savedDirs = new Set((recentSaves || []).map(s => s.director).filter(Boolean));
    const savedGenres = new Set((recentSaves || []).map(s => s.genre).filter(Boolean));
    const moodIds = selected.length > 0 ? selected : ['slow','tender'];
    const scored = films.map(f => {
      // === Base score: real engine when we have a profile, mood-tag overlap as cold-start fallback ===
      // scoreMovieForUser can return null when a content-boundary hard
      // filter hits. Discover already applied prefs.avoidGenres at fetch
      // time; for boundary-filtered films we drop to the cold-start
      // mood-overlap score so the film still ranks (its low score
      // pushes it to the back).
      const engineScored = (profile && f._raw) ? scoreMovieForUser(f._raw, profile, 'default') : null
      const baseScore = engineScored
        ? engineScored.score
        : (moodIds.reduce((a, id) => a + (f.fit[id] || 0), 0) / moodIds.length) * 100;

      // === Mood selection boost ============================================
      // The user's mood selection is the strongest RIGHT-NOW signal — they
      // told us 30 seconds ago what shape they want tonight. Without an
      // explicit boost, the engine's stable-taste signals (director
      // affinity, genre preference, rating history) can outrank a film's
      // actual mood fit — surfacing picks that match the user's PROFILE
      // but not what they ASKED for. Result: low mood-fit % on Stage 3.
      //
      // 40pt swing: a perfect-mood-fit film (avg 1.0 across selected moods)
      // gets +40, a poor-mood-fit (avg 0.2) gets only +8. Combined with the
      // bumped intention/energy mods below, mood + Stage 2 selections become
      // the dominant signal at the top of the deck while taste/runtime/etc
      // still shape ranking beyond the displayed 3 picks.
      const moodFitRaw = moodIds.reduce((a, id) => a + (f.fit[id] || 0), 0) / moodIds.length;
      const moodBoost = moodFitRaw * 40;

      // === UI modifiers layered on top of the engine score ===
      // The engine already accounts for runtime band, but here we expose the
      // user's *explicit* time choice (90 min vs 3 hr) which the engine
      // doesn't know about — so we re-apply a runtime penalty.
      const inBand = f.runtime >= runtimeBand[0] && f.runtime <= runtimeBand[1];
      const runtimePenalty = inBand ? 0 : Math.min(Math.abs(f.runtime - (runtimeBand[0]+runtimeBand[1])/2) / 4, 25);

      // Intention / energy / who tilt — additive points on top of engine
      // score. Multipliers bumped ~50% (12 → 18, 10 → 15, 8 → 12) so the
      // user's Stage 2 night-shape answers carry real weight in ranking,
      // not just a tie-breaker. Pairs with the mood boost above to make
      // the full Stage 1 + 2 input set the dominant ranking signal.
      let intMod = 0;
      if (intention === 'move')     intMod = (Math.max(f.fit.tender, f.fit.bittersweet) - 0.3) * 18;
      if (intention === 'think')    intMod = (f.fit.cerebral - 0.3) * 18;
      if (intention === 'distract') intMod = (Math.max(f.fit.tense, f.fit.restless) - 0.3) * 15;
      if (intention === 'comfort')  intMod = (f.fit.cozy - 0.3) * 18;
      if (intention === 'laugh')    intMod = (f.fit.cozy - 0.3) * 15 - (f.fit.tense * 10);
      if (intention === 'surprise') intMod = ((100 - f.ff) / 100) * 14;
      let energyMod = 0;
      if (energy === 'wiped') energyMod = (1 - (f.fit.cozy || 0.3)) * -12;
      if (energy === 'wired') energyMod = (1 - (f.fit.restless || f.fit.tense || 0.3)) * -12;
      let audMod = 0;
      if (who === 'friends' && f.fit.tense > 0.8 && f.fit.cozy < 0.2) audMod = -10;

      // Save-affinity boost — films sharing a director or primary_genre
      // with the user's recent saves get a small bonus, so the engine
      // actually rewards positive signals (not just demotes negative
      // ones via skips). +12 for director match (rare, high signal),
      // +6 for genre match (more common). Capped at 18 total so a user
      // who's saved many films of the same director+genre doesn't get a
      // runaway boost that drowns mood/intention.
      let saveBoost = 0;
      if (f.dir && savedDirs.has(f.dir)) saveBoost += 12;
      if (f.genre && savedGenres.has(f.genre)) saveBoost += 6;
      if (saveBoost > 18) saveBoost = 18;

      const finalScore = baseScore + moodBoost + saveBoost - runtimePenalty + energyMod + audMod + intMod;

      const topMood = moodIds.map(id => ({ id, v: f.fit[id] || 0 })).sort((a,b) => b.v - a.v)[0];
      const moodLabel = MOODS.find(m => m.id === topMood.id)?.label.toLowerCase();
      const reasons = [
        `${moodLabel.charAt(0).toUpperCase() + moodLabel.slice(1)} ${Math.round(topMood.v*100)}% — your strongest signal, met head-on.`,
        `Fits the ${moodLabel} shape you asked for, and your runtime window.`,
        `A patient ${moodLabel} pick — ${f.dir} at their most controlled.`,
        `${f.dir}’s ${moodLabel} register, in ${f.runtime} minutes.`,
        `The ${moodLabel} answer your night was reaching for.`,
      ];
      const reason = reasons[f.id % reasons.length];

      // === Display match % vs internal ranking score ===========================
      // Two numbers, two purposes:
      //   • _rankScore — full finalScore (base engine + UI mods). Used to
      //     SORT picks. Includes intention/energy/who/time tilts so the
      //     winning pick reflects the user's right-now context, not just
      //     their stable taste.
      //   • match — calibrated display % via the shared `computeMatchPercent`
      //     helper. Fed from the BASE engine score (no UI mods) so it
      //     matches what /home, /movie/:id, /watchlist show for the same
      //     (film, user) pair. The helper has piecewise-linear curves
      //     tuned per confidence tier so typical top picks land 82-90%
      //     and 100% is reserved for genuine outliers. This replaces the
      //     old `Math.min(100, finalScore)` which saturated at 100% for
      //     every well-fitting pick (the "why does it always show 100%?"
      //     bug).
      // Fallback `null → clamped finalScore` covers films below the
      // helper's floor (engineScore < 50) — rare on /discover since the
      // candidate pool is already pre-filtered by ff_audience_rating ≥ 72.
      const calibrated = computeMatchPercent({ engineScore: baseScore, profile })
      const match = calibrated ?? Math.max(0, Math.min(99, Math.round(finalScore)))
      // moodFitRaw — same 0-1 value used by the moodBoost above. Attached
      // so diversifyTop3 can enforce a minimum mood-fit on the top pick
      // (no headline film below the floor, even if taste rank-score is high).
      return { ...f, match, _rankScore: finalScore, reason, moodFitRaw };
    });
    scored.sort((a,b) => b._rankScore - a._rankScore);
    // Diversity pass — guarantee the top 3 displayed picks span distinct
    // primary_genres when possible. Also passes sessionShownIds so films
    // already shown in this /discover session get demoted, giving the
    // user fresh picks when they tweak moods/inputs across scenarios.
    return diversifyTop3(scored, sessionShownIds.current);
  }, [selected, time, who, energy, intention, films, profile, recentSaves]);

  return (
    <div className="ff-discover" style={{ minHeight:'100vh', background:HP.bgDeep, color:HP.text, fontFamily:'Inter, sans-serif', position:'relative', overflow:'hidden' }}>
      <Starfield tint={blendHex} />
      <div style={{ position:'relative', zIndex:1, maxWidth:1440, margin:'0 auto' }}>
        {stage === 0   && <StageHero onBegin={()=>setStage(1)} onSurprise={()=>{ setSelected(['slow','tender']); FFAudio.whoom(); setStage(2.3); }} />}
        {stage === 1   && <StageMood selected={selected} setSelected={setSelected} onNext={()=>setStage(2)} onBack={()=>setStage(0)} blendHex={blendHex} bursts={bursts} fireBurst={fireBurst} audioToggle={<AudioToggle />} playMoodCue={(id)=>FFAudio.pluck(id)} playContinueCue={()=>FFAudio.whoom()} />}
        {stage === 2   && <StageNightStacked stepIndex={stage2StepIndex} setStepIndex={setStage2StepIndex} time={time} setTime={setTime} who={who} setWho={setWho} energy={energy} setEnergy={setEnergy} intention={intention} setIntention={setIntention} onNext={()=>{ handleCommitStage2(); setStage(2.3); }} onBack={()=>setStage(1)} blendHex={blendHex} playOptionCue={()=>FFAudio.pluck('cozy')} playContinueCue={()=>FFAudio.whoom()} />}
        {stage === 2.3 && <StageBreath onDone={()=>setStage(2.5)} />}
        {stage === 2.5 && <StageReveal selected={selected.length>0?selected:['slow','tender']} onDone={()=>setStage(2.7)} />}
        {stage === 2.7 && <StageTitleCard title={(allResults[0]||{}).title || ''} onDone={()=>setStage(3)} playTitleCue={()=>FFAudio.chord()} />}
        {stage === 3   && <StagePick selected={selected.length>0?selected:['slow','tender']} who={who} energy={energy} intention={intention} results={allResults} profile={profile} sessionShownIds={sessionShownIds} onRestart={()=>{ setStage(0); setSelected([]); }} onBack={()=>setStage(2)} blendHex={blendHex} />}
      </div>
    </div>
  );
}

export default function Discover() {
  usePageMeta({ title: 'Discover — FeelFlick' })
  const location = useLocation()
  const reduced = useReducedMotion()
  // Snapshot the fromOnboarding flag once on mount so navigating back to
  // /discover later in the session doesn't replay the overlay.
  //
  // The overlay below bridges the celebration → /discover seam. Pairing:
  //   • Onboarding fades celebration content over 900ms to a black backdrop
  //   • Router commits + Discover paints under this overlay
  //   • Overlay holds for 350ms (head-start so React commits cleanly)
  //   • Overlay fades opacity 1 → 0 over 2.0s with an ease-in-out curve
  //     that holds the dark in the first half, then reveals through the
  //     middle, settling near the end. Without this curve the reveal felt
  //     "front-loaded" — /discover popped in early and just brightened,
  //     which read as the color seam the user reported.
  //
  // Visual: not pure black. A very faint purple-pink radial bleed at center
  // mirrors the celebration's mood-ambient so the eye doesn't notice the
  // moment Onboarding's ambient ends and the overlay takes over.
  //
  // Skipped entirely for prefers-reduced-motion.
  const fromOnboardingRef = useRef(location.state?.fromOnboarding === true)
  const [handoffOverlayVisible, setHandoffOverlayVisible] = useState(
    () => fromOnboardingRef.current && !reduced,
  )
  return (
    <DiscoverDataProvider>
      <DiscoverBody />
      {handoffOverlayVisible && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-9998"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 45%, rgba(167,139,250,0.08) 0%, transparent 65%),
              radial-gradient(ellipse 60% 45% at 50% 55%, rgba(236,72,153,0.05) 0%, transparent 60%),
              #000000
            `,
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.0, ease: [0.65, 0, 0.35, 1], delay: 0.35 }}
          onAnimationComplete={() => setHandoffOverlayVisible(false)}
        />
      )}
    </DiscoverDataProvider>
  );
}
