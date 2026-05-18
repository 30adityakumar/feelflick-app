import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { scoreMovieForUser } from '@/shared/services/recommendations'
import { currentEdition } from '@/features/home-v2/edition'
import { DiscoverDataProvider, useDiscoverData } from './useDiscoverData'
import './discover-v5.css'

// /discover v5 — Magazine + the immersion senses
// Adds: Web Audio cue layer (plucks/whooms/chord), breath pause,
// black title-card cut, mouse parallax + film grain + vignette on the spread.

// ── Web Audio cue layer ───────────────────────────────────────────────────────
const FFAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;
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
  function setMuted(v) { muted = v; if (masterGain) masterGain.gain.value = v ? 0 : 0.45; }
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

// ── Original v4 imports below ──

const HP = {
  bgDeep:'#06060a', surface:'#120d1c', paper:'#0d0b13',
  border:'rgba(255,255,255,0.08)', borderStrong:'rgba(255,255,255,0.14)',
  text:'#FAFAFA', textSoft:'rgba(250,250,250,0.72)', textMuted:'rgba(250,250,250,0.45)', textFaint:'rgba(250,250,250,0.28)',
  purple:'#A78BFA', purpleDeep:'#9333ea', pink:'#EC4899', amber:'#F59E0B', red:'#EF4444', green:'#34D399',
};
const HP_GRAD = 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)';
const TMDB = (p) => `https://image.tmdb.org/t/p/w500${p}`;

const MOODS = [
  { id:'tender',     label:'Tender',      hex:'#F472B6', x:18, y:32, hint:'For nights that ache softly.' },
  { id:'tense',      label:'Tense',       hex:'#EF4444', x:78, y:24, hint:'Pulse up. Held breath.' },
  { id:'slow',       label:'Slow-burn',   hex:'#A78BFA', x:34, y:62, hint:'Long takes. Patient escalation.' },
  { id:'cerebral',   label:'Cerebral',    hex:'#7DD3FC', x:62, y:70, hint:'Big idea, quiet pace.' },
  { id:'cozy',       label:'Cozy',        hex:'#FBBF24', x:14, y:74, hint:'Low-stakes. Soft landing.' },
  { id:'bittersweet',label:'Bittersweet', hex:'#FB7185', x:48, y:18, hint:'Sad and beautiful in one breath.' },
  { id:'mythic',     label:'Mythic',      hex:'#0EA5E9', x:84, y:62, hint:'Epic. Otherworldly.' },
  { id:'restless',   label:'Restless',    hex:'#34D399', x:52, y:44, hint:"When you can't sit still." },
];

const TIME_OPTIONS = [
  { id:'short', label:'~ 90 min', sub:'A quick one',  v:[60,99] },
  { id:'std',   label:'~ 2 hrs',  sub:'Standard',     v:[100,130] },
  { id:'long',  label:'~ 2.5 hrs',sub:'Settle in',    v:[131,160] },
  { id:'epic',  label:'3 hrs+',   sub:'Cinematic',    v:[161,300] },
];
const WHO_OPTIONS = [
  { id:'alone',   label:'Alone',     sub:'My night',     icon:'○' },
  { id:'partner', label:'Partner',   sub:'Just us two',  icon:'○○' },
  { id:'friends', label:'Friends',   sub:'A few',        icon:'○○○' },
];
const ENERGY_OPTIONS = [
  { id:'wiped',  label:'Wiped',  sub:'Comfort, please' },
  { id:'steady', label:'Steady', sub:'Whatever fits' },
  { id:'wired',  label:'Wired',  sub:'Give me edges' },
];
const INTENTIONS = [
  { id:'distract', label:'Distract me',    sub:'Take me out of my head' },
  { id:'move',     label:'Move me',        sub:'I want to feel something' },
  { id:'think',    label:'Make me think',  sub:'I want to chew on it' },
  { id:'laugh',    label:'Make me laugh',  sub:'Lift me up' },
  { id:'surprise', label:'Surprise me',    sub:'Show me something new' },
  { id:'comfort',  label:'Comfort me',     sub:'No surprises, please' },
];

const CONSTELLATION_NAMES = {
  'tender':'Soft Focus','tense':'Held Breath','slow':'The Long Take','cerebral':'The Question',
  'cozy':'Comfort Reel','bittersweet':'Pretty Hurt','mythic':'Big Sky','restless':"Won't Sit Still",
  'slow,tender':'The Quiet Ache','bittersweet,tender':'The Long Goodbye','cozy,tender':'Home Cinema',
  'restless,tense':'Live Wire','cerebral,tense':'Cold Logic','bittersweet,tense':'Wound Up',
  'cerebral,slow':'The Long Question','mythic,slow':'Slow Magic','restless,slow':'Patient Storm',
  'cerebral,mythic':'The Cathedral','bittersweet,cerebral':'Late Night Math','cerebral,restless':'Mind Adrift',
  'bittersweet,cozy':'Soft Endings','cozy,mythic':'Fireside Epic','bittersweet,mythic':'Old Light',
  'mythic,restless':'Quest Mode','bittersweet,restless':'Wired & Wistful',
  'slow,tense':'Coiled Spring','cozy,tense':'Strange Comfort','mythic,tense':'Dark Myth',
  'restless,tender':'The Almost','mythic,tender':'Quiet Wonder','cerebral,tender':'The Thinking Heart',
  'cozy,slow':'Slow Sunday','cozy,cerebral':'Cosy Puzzle','cozy,restless':'Sugar Static',
  'bittersweet,slow':'The Long Goodbye',
};
const constellationName = (selected) => {
  if (selected.length === 0) return 'Your night';
  if (selected.length === 1) return CONSTELLATION_NAMES[selected[0]] || 'Your night';
  if (selected.length === 2) {
    const k = selected.slice().sort().join(',');
    return CONSTELLATION_NAMES[k] || selected.map(s => MOODS.find(m=>m.id===s)?.label).join(' × ');
  }
  const labels = selected.map(s => MOODS.find(m=>m.id===s)?.label);
  return `${labels[0]}, ${labels[1]} & ${labels[2]}`;
};

// Rotating Stage 0 epigraphs
const EPIGRAPHS = [
  { q:'You’re a hopeless romantic.',                                      src:'— Mia, La La Land' },
  { q:'I am thinking it’s a sign that things are not totally hopeless.',  src:'— Charlie, Adaptation' },
  { q:'The past is a foreign country. They do things differently there.',     src:'— L. P. Hartley, The Go-Between' },
  { q:'We accept the love we think we deserve.',                              src:'— The Perks of Being a Wallflower' },
  { q:'Cinema is the most beautiful fraud in the world.',                     src:'— Godard' },
  { q:'A film is a ribbon of dreams.',                                        src:'— Orson Welles' },
  { q:'Tomorrow is another day.',                                             src:'— Scarlett, Gone with the Wind' },
];

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

// Pairing concierge notes — by dominant mood
const PAIRING = {
  tense:      'A glass of something strong. The phone face-down. Lights low.',
  slow:       'A glass of red. Ninety minutes of nothing else. No commentary.',
  tender:     'A quiet chair. Tissues, just in case. Someone you trust nearby.',
  cerebral:   'A clear head. The phone in another room. Time to sit afterwards.',
  cozy:       'A blanket. Something warm to drink. The heat up.',
  bittersweet:'A glass of red. Someone you trust nearby. Room to sit after.',
  mythic:     'The biggest screen you have. Headphones on. Phone away.',
  restless:   'Comfortable shoes. The option to pace. Don’t commit to a chair.',
};

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

// ── Stage 0 — Hero with rotating epigraph ──
function StageHero({ onBegin, onSurprise }) {
  const greeting = useMemo(() => {
    const d = new Date();
    const h = d.getHours();
    const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
    const part = h < 6 ? 'late' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night';
    return { day, part };
  }, []);
  const epi = useMemo(() => EPIGRAPHS[Math.floor(Math.random() * EPIGRAPHS.length)], []);
  const { edition } = useMemo(() => currentEdition(), []);
  return (
    <section style={{ position:'relative', minHeight:'82vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center', animation:'ff-fade 0.6s ease' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.36em', textTransform:'uppercase', color:HP.purple, marginBottom:32 }}>· Discover · Edition Nº {edition} ·</div>
      {/* Epigraph */}
      <div style={{ maxWidth:540, marginBottom:36, opacity:0, animation:'ff-fade 0.7s ease 0.2s forwards' }}>
        <p style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:18, color:HP.textSoft, fontStyle:'italic', lineHeight:1.5, margin:0, letterSpacing:'-0.005em' }}>&ldquo;{epi.q}&rdquo;</p>
        <div style={{ marginTop:8, fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>{epi.src}</div>
      </div>
      <div style={{ fontFamily:'Outfit', fontSize:16, color:HP.textMuted, marginBottom:18 }}>It’s <span style={{ color:HP.textSoft }}>{greeting.day} {greeting.part}.</span></div>
      <h1 style={{ fontFamily:'Outfit', fontSize:'clamp(54px, 8vw, 104px)', lineHeight:0.94, fontWeight:200, letterSpacing:'-0.05em', color:HP.text, margin:0, maxWidth:1000, textWrap:'balance' }}>How do <em style={{ fontStyle:'italic', fontWeight:300, color:HP.textSoft }}>you</em> feel?</h1>
      <p style={{ marginTop:24, fontFamily:'Outfit, Inter, sans-serif', fontSize:16, color:HP.textMuted, fontStyle:'italic', maxWidth:520, lineHeight:1.55 }}>Three short questions. One film for your night.</p>
      <div style={{ marginTop:40, display:'flex', gap:14 }}>
        <button onClick={onBegin} style={{ padding:'15px 32px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:14, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', boxShadow:'0 16px 36px -10px rgba(236,72,153,0.45)' }}>Begin →</button>
        <button onClick={onSurprise} style={{ padding:'15px 28px', borderRadius:999, background:'rgba(255,255,255,0.05)', border:`1px solid ${HP.border}`, color:HP.textSoft, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor:'pointer' }}>or, surprise me</button>
      </div>
    </section>
  );
}

function ParticleBurst({ hex }) {
  const dots = useMemo(() => Array.from({length:12}, (_,i) => ({ a: (i/12)*Math.PI*2, r: 60 + Math.random()*40, s: 2 + Math.random()*3, dly: Math.random()*60 })), []);
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {dots.map((d, i) => (
        <span key={i} style={{ position:'absolute', top:'50%', left:'50%', width:d.s, height:d.s, borderRadius:999, background:hex, boxShadow:`0 0 ${d.s*2}px ${hex}`, animation:`ff-burst 0.8s cubic-bezier(.2,.7,.2,1) ${d.dly}ms forwards`, '--tx': `${Math.cos(d.a)*d.r}px`, '--ty': `${Math.sin(d.a)*d.r}px` }} />
      ))}
    </div>
  );
}

function StageMood({ selected, setSelected, onNext, onBack, blendHex, bursts, fireBurst }) {
  const toggle = (id, hex) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else if (selected.length < 3) { setSelected([...selected, id]); fireBurst(id, hex); FFAudio.pluck(id); }
  };
  const lines = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i+1; j < selected.length; j++) {
      const a = MOODS.find(m => m.id === selected[i]);
      const b = MOODS.find(m => m.id === selected[j]);
      if (a && b) lines.push({ a, b, key:`${a.id}-${b.id}` });
    }
  }
  const cName = constellationName(selected);
  return (
    <section style={{ position:'relative', minHeight:'80vh', padding:'24px 88px 80px', animation:'ff-fade 0.5s ease' }}>
      <AudioToggle />
      <div style={{ textAlign:'center', marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:HP.purple, marginBottom:14 }}>Step 1 of 3</div>
        <h2 style={{ fontFamily:'Outfit', fontSize:'clamp(36px, 5vw, 56px)', lineHeight:1, fontWeight:300, letterSpacing:'-0.04em', color:HP.text, margin:0 }}>What’s the <em style={{ fontStyle:'italic', fontWeight:400, color:blendHex, transition:'color 0.5s ease' }}>shape</em> of your mood?</h2>
        <p style={{ marginTop:14, fontFamily:'Outfit, Inter, sans-serif', fontSize:14, color:HP.textMuted, fontStyle:'italic' }}>Tap 1–3 moods. Form your constellation.</p>
      </div>
      <div style={{ position:'relative', width:'100%', maxWidth:1080, aspectRatio:'16/9', margin:'24px auto 0', borderRadius:18, background:'rgba(255,255,255,0.012)', border:`1px solid ${HP.border}`, overflow:'hidden' }}>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
          <defs><linearGradient id="ff-grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#A78BFA" stopOpacity="0.9" /><stop offset="100%" stopColor="#EC4899" stopOpacity="0.9" /></linearGradient></defs>
          {lines.map(({ a, b, key }) => (
            <line key={key} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke="url(#ff-grad)" strokeWidth="1.4" strokeDasharray="400" strokeDashoffset="400" style={{ animation:'ff-draw 0.7s cubic-bezier(.2,.7,.2,1) forwards' }} />
          ))}
        </svg>
        {MOODS.map(m => {
          const on = selected.includes(m.id);
          const order = selected.indexOf(m.id) + 1;
          const burst = bursts.find(b => b.id === m.id);
          return (
            <div key={m.id} style={{ position:'absolute', left:`${m.x}%`, top:`${m.y}%`, transform:'translate(-50%, -50%)' }}>
              {burst && <ParticleBurst hex={m.hex} key={burst.t} />}
              <button onClick={()=>toggle(m.id, m.hex)} title={m.hint} style={{ position:'relative', border:'none', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:10, padding:0 }}>
                <div style={{ position:'relative', width: on?72:54, height: on?72:54, borderRadius:999, background:`radial-gradient(circle at 35% 30%, ${m.hex}, ${m.hex}66 60%, ${m.hex}11)`, boxShadow: on?`0 0 32px ${m.hex}aa, 0 0 64px ${m.hex}44`:`0 0 12px ${m.hex}33`, transition:'all 0.4s ease', animation: on?'none':'ff-pulse 4s ease-in-out infinite', border: on?`2px solid ${m.hex}`:'none' }}>
                  {on && <span style={{ position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:999, background:'#06060a', border:`1px solid ${m.hex}`, color:m.hex, fontFamily:'Outfit', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{order}</span>}
                </div>
                <div style={{ fontFamily:'Outfit', fontSize: on?15:13, fontWeight: on?600:500, color: on?HP.text:HP.textSoft, transition:'all 0.3s ease' }}>{m.label}</div>
                {on && <div style={{ fontSize:10, color:m.hex, fontFamily:'Outfit', fontStyle:'italic', maxWidth:140, textAlign:'center' }}>{m.hint}</div>}
              </button>
            </div>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop:18, textAlign:'center', animation:'ff-fade 0.5s ease' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit', marginBottom:4 }}>Your constellation</div>
          <div style={{ fontFamily:'Outfit', fontSize:24, fontStyle:'italic', fontWeight:400, color:blendHex, transition:'color 0.5s ease' }}>&ldquo;{cName}&rdquo;</div>
        </div>
      )}
      <div style={{ marginTop:24, display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:1080, margin:'24px auto 0' }}>
        <button onClick={onBack} style={{ padding:'10px 20px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:12, fontWeight:500, cursor:'pointer' }}>← Back</button>
        <div style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.06em' }}>{selected.length} of 3 selected</div>
        <button onClick={()=>{ FFAudio.whoom(); onNext(); }} disabled={selected.length===0} style={{ padding:'12px 26px', borderRadius:999, background: selected.length>0?HP_GRAD:'rgba(255,255,255,0.04)', border: selected.length>0?'none':`1px solid ${HP.border}`, color: selected.length>0?'#fff':HP.textFaint, fontFamily:'Outfit', fontSize:13, fontWeight:600, letterSpacing:'0.04em', cursor: selected.length>0?'pointer':'not-allowed' }}>Continue →</button>
      </div>
    </section>
  );
}

function StageNight({ time, setTime, who, setWho, energy, setEnergy, intention, setIntention, onNext, onBack, blendHex }) {
  const Tile = ({ on, hex, onClick, label, sub, icon, small }) => (
    <button onClick={onClick} style={{ flex:1, padding: small?'14px 14px':'20px 18px', borderRadius:10, textAlign:'left', background: on ? `${hex||HP.purple}1f` : 'rgba(255,255,255,0.025)', border:`1px solid ${on ? (hex||HP.purple) + '88' : HP.border}`, color: on ? HP.text : HP.textSoft, cursor:'pointer', transition:'all 0.25s ease', boxShadow: on ? `0 0 24px ${(hex||HP.purple)}33` : 'none' }}>
      {icon && <div style={{ fontSize:20, marginBottom:8, color: on?(hex||HP.purple):HP.textMuted, letterSpacing:'0.1em' }}>{icon}</div>}
      <div style={{ fontFamily:'Outfit', fontSize: small?14:17, fontWeight:500, letterSpacing:'-0.015em' }}>{label}</div>
      <div style={{ marginTop:3, fontSize: small?11:12, color: on?(hex||HP.purple):HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>{sub}</div>
    </button>
  );
  const Row = ({ label, children }) => (
    <div>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit', marginBottom:10 }}>{label}</div>
      <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>{children}</div>
    </div>
  );
  return (
    <section style={{ position:'relative', minHeight:'82vh', padding:'24px 88px 80px', animation:'ff-fade 0.5s ease' }}>
      <div style={{ textAlign:'center', marginBottom:30 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.32em', textTransform:'uppercase', color:HP.purple, marginBottom:14 }}>Step 2 of 3</div>
        <h2 style={{ fontFamily:'Outfit', fontSize:'clamp(36px, 5vw, 56px)', lineHeight:1, fontWeight:300, letterSpacing:'-0.04em', color:HP.text, margin:0 }}>What do you <em style={{ fontStyle:'italic', fontWeight:400, color:blendHex }}>need</em> tonight?</h2>
        <p style={{ marginTop:14, fontFamily:'Outfit, Inter, sans-serif', fontSize:14, color:HP.textMuted, fontStyle:'italic' }}>Atmosphere is the mood. Intention is what you want from the film.</p>
      </div>
      <div style={{ maxWidth:1080, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>
        <Row label="Tonight’s intention">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:9, width:'100%' }}>
            {INTENTIONS.map(o => <Tile key={o.id} on={intention===o.id} onClick={()=>setIntention(o.id)} label={o.label} sub={o.sub} small />)}
          </div>
        </Row>
        <Row label="How much time do you have?">{TIME_OPTIONS.map(o => <Tile key={o.id} on={time===o.id} onClick={()=>setTime(o.id)} label={o.label} sub={o.sub} small />)}</Row>
        <Row label="Who’s here?">{WHO_OPTIONS.map(o => <Tile key={o.id} on={who===o.id} onClick={()=>setWho(o.id)} label={o.label} sub={o.sub} icon={o.icon} small />)}</Row>
        <Row label="Your energy?">{ENERGY_OPTIONS.map(o => <Tile key={o.id} on={energy===o.id} onClick={()=>setEnergy(o.id)} label={o.label} sub={o.sub} small />)}</Row>
      </div>
      <div style={{ marginTop:36, display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:1080, margin:'36px auto 0' }}>
        <button onClick={onBack} style={{ padding:'10px 20px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:12, fontWeight:500, cursor:'pointer' }}>← Back</button>
        <div style={{ fontSize:11, color:HP.textFaint, fontFamily:'Outfit' }}>Optional · skip what doesn’t apply</div>
        <button onClick={()=>{ FFAudio.whoom(); onNext(); }} style={{ padding:'12px 28px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', boxShadow:'0 12px 30px -10px rgba(236,72,153,0.5)' }}>Compose my edition →</button>
      </div>
    </section>
  );
}

// ── Stage 2.4 — Breath pause ──
function StageBreath({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <section style={{ position:'relative', minHeight:'82vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
      <div style={{ position:'relative', width:140, height:140, marginBottom:32 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(167,139,250,0.35)', animation:'ff-breath 2.2s ease-in-out forwards' }} />
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'radial-gradient(circle at center, rgba(167,139,250,0.18), transparent 65%)', animation:'ff-breath-bloom 2.2s ease-in-out forwards' }} />
      </div>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.32em', textTransform:'uppercase', color:'rgba(167,139,250,0.85)', fontFamily:'Outfit', marginBottom:10 }}>Take a breath</div>
      <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:300, color:'rgba(250,250,250,0.65)', fontStyle:'italic', letterSpacing:'-0.015em' }}>The room is yours.</div>
    </section>
  );
}

// ── Black title-card cut ──
function StageTitleCard({ title, onDone }) {
  useEffect(() => { FFAudio.chord(); const t = setTimeout(onDone, 1400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:90, display:'flex', alignItems:'center', justifyContent:'center', animation:'ff-titlecard 1.4s ease forwards' }}>
      <div style={{ fontFamily:'Outfit', fontSize:'clamp(40px, 6vw, 72px)', fontWeight:200, color:'#fafafa', letterSpacing:'-0.045em', textAlign:'center', textWrap:'balance', animation:'ff-titleword 1.4s ease forwards' }}>{title}</div>
    </div>
  );
}

function StageReveal({ selected, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  const blendHex = MOODS.find(m=>m.id===selected[0])?.hex || HP.purple;
  const lines = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i+1; j < selected.length; j++) {
      const a = MOODS.find(m => m.id === selected[i]);
      const b = MOODS.find(m => m.id === selected[j]);
      if (a && b) lines.push({ a, b, key:`${a.id}-${b.id}` });
    }
  }
  const burstDots = useMemo(() => Array.from({length:24}, (_,i) => ({ a: (i/24)*Math.PI*2, r: 180 + Math.random()*120, s: 2 + Math.random()*3, dly: 1100 + Math.random()*200 })), []);
  return (
    <section style={{ position:'relative', minHeight:'82vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
      <div style={{ position:'relative', width:'min(560px, 80vw)', aspectRatio:'1' }}>
        <div style={{ position:'absolute', inset:0, animation:'ff-collapse-long 2.6s cubic-bezier(.5,0,.4,1) forwards' }}>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle at center, ${blendHex}99, ${blendHex}22 40%, transparent 70%)`, filter:'blur(20px)', animation:'ff-bloom-long 2.6s cubic-bezier(.5,0,.4,1) forwards' }} />
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
            {lines.map(({ a, b, key }) => <line key={key} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke={blendHex} strokeWidth="1.6" style={{ opacity:0.8 }} />)}
          </svg>
          {selected.map(id => {
            const m = MOODS.find(x => x.id === id);
            if (!m) return null;
            return <div key={m.id} style={{ position:'absolute', left:`${m.x}%`, top:`${m.y}%`, transform:'translate(-50%,-50%)', width:48, height:48, borderRadius:999, background:`radial-gradient(circle at 35% 30%, ${m.hex}, ${m.hex}66 60%, ${m.hex}11)`, boxShadow:`0 0 32px ${m.hex}aa` }} />;
          })}
        </div>
        {burstDots.map((d, i) => (
          <span key={i} style={{ position:'absolute', top:'50%', left:'50%', width:d.s, height:d.s, borderRadius:999, background:blendHex, boxShadow:`0 0 ${d.s*3}px ${blendHex}`, opacity:0, animation:`ff-burst-late 1.4s cubic-bezier(.2,.7,.2,1) ${d.dly}ms forwards`, '--tx': `${Math.cos(d.a)*d.r}px`, '--ty': `${Math.sin(d.a)*d.r}px` }} />
        ))}
      </div>
      <div style={{ marginTop:32, fontSize:11, fontWeight:600, letterSpacing:'0.28em', textTransform:'uppercase', color:blendHex, fontFamily:'Outfit', opacity:0, animation:'ff-fade-late 2.6s ease forwards' }}>M. is reading the room…</div>
    </section>
  );
}

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

function buildWhyNow(selected, time, energy, who, intention) {
  const m = selected[0];
  const moodLabel = MOODS.find(x=>x.id===m)?.label || 'this mood';
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'late night';
  if (intention === 'move')     return `You asked to be moved — this is the emotional swing the engine bet on.`;
  if (intention === 'think')    return `You wanted to think — a film built to leave a residue.`;
  if (intention === 'distract') return `Distraction-mode + ${moodLabel.toLowerCase()} → this pulls you in fast.`;
  if (intention === 'comfort')  return `Comfort-mode says no surprises — a known-good ${moodLabel.toLowerCase()}.`;
  if (intention === 'surprise') return `You asked for novelty — we biased toward less-trafficked picks.`;
  if (intention === 'laugh')    return `You wanted lift — a film that lands gentle, not sappy.`;
  if (m === 'slow' || m === 'tender') return `You haven’t done a ${moodLabel.toLowerCase()} in 12 days. Time to come home.`;
  return `It’s ${part} — your sweet spot for ${moodLabel.toLowerCase()} films.`;
}

function MoodArc({ points, hex, runtime }) {
  if (!points || points.length === 0) return null;
  const W = 280, H = 56, PAD = 4;
  const stepX = (W - PAD*2) / (points.length - 1);
  const ptStr = points.map((p, i) => `${PAD + i*stepX},${H - PAD - p * (H - PAD*2)}`).join(' ');
  const path = `M ${ptStr}`.replace(/(\d+\.?\d*),(\d+\.?\d*) /g, '$1,$2 L ');
  let peak = 0; for (let i=1; i<points.length; i++) if (points[i] > points[peak]) peak = i;
  const peakX = PAD + peak*stepX, peakY = H - PAD - points[peak] * (H - PAD*2);
  const startLbl = points[0] > 0.6 ? 'Tense' : points[0] > 0.45 ? 'Steady' : 'Quiet';
  const endLbl   = points[points.length-1] > 0.7 ? 'Devastating' : points[points.length-1] > 0.55 ? 'Bittersweet' : points[points.length-1] > 0.4 ? 'Settled' : 'Quiet';
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit' }}>Emotional arc</div>
        <div style={{ fontSize:10, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.06em' }}>{runtime} min</div>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
        <defs>
          <linearGradient id="ff-arc-grad" x1="0" x2="1"><stop offset="0%" stopColor={hex} stopOpacity="0.6" /><stop offset="100%" stopColor="#EC4899" stopOpacity="0.95" /></linearGradient>
          <linearGradient id="ff-arc-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={hex} stopOpacity="0.25" /><stop offset="100%" stopColor={hex} stopOpacity="0" /></linearGradient>
        </defs>
        <path d={`M ${PAD},${H-PAD} L ${path.slice(2)} L ${W-PAD},${H-PAD} Z`} fill="url(#ff-arc-fill)" />
        <path d={path} fill="none" stroke="url(#ff-arc-grad)" strokeWidth="1.6" strokeLinecap="round" style={{ strokeDasharray:600, strokeDashoffset:600, animation:'ff-draw-arc 1.4s cubic-bezier(.2,.7,.2,1) 1.3s forwards' }} />
        <circle cx={peakX} cy={peakY} r="2.5" fill="#EC4899" style={{ opacity:0, animation:'ff-fade 0.4s ease 2.6s forwards' }} />
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:9.5, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>
        <span>{startLbl}</span><span style={{ color:HP.pink }}>Peak</span><span>{endLbl}</span>
      </div>
    </div>
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

// ── End-credits modal ──
function CreditsScroll({ title, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
  const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  const { edition } = currentEdition();
  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', animation:'ff-fade 0.4s ease' }}>
      <button onClick={onClose} style={{ position:'absolute', top:24, right:24, padding:'8px 14px', borderRadius:999, background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.5)', fontFamily:'Outfit', fontSize:11, letterSpacing:'0.1em', cursor:'pointer', zIndex:101 }}>Skip</button>
      <div style={{ width:'100%', textAlign:'center', animation:'ff-credits 6s ease forwards' }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.36em', textTransform:'uppercase', color:'rgba(255,255,255,0.45)', marginBottom:18, fontFamily:'Outfit' }}>FeelFlick presents</div>
        <div style={{ fontFamily:'Outfit', fontSize:'clamp(36px, 6vw, 64px)', fontWeight:200, color:'#fafafa', letterSpacing:'-0.04em', marginBottom:48 }}>{title}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Curated for you</div>
        <div style={{ fontFamily:'Outfit', fontStyle:'italic', fontSize:16, color:'rgba(255,255,255,0.7)', marginBottom:14 }}>Edition Nº {edition} · {day} · {time}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'Outfit', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>Read the room</div>
        <div style={{ fontFamily:'Outfit', fontSize:14, color:'rgba(255,255,255,0.55)', fontStyle:'italic', marginBottom:48 }}>M., your curator</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)', fontFamily:'Outfit', letterSpacing:'0.18em', textTransform:'uppercase' }}>Enjoy the film.</div>
        <div style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,0.32)', fontFamily:'Outfit', letterSpacing:'0.18em', textTransform:'uppercase' }}>Come back tomorrow.</div>
      </div>
    </div>
  );
}

// ── Stage 3 — MAGAZINE SPREAD ──
function StagePick({ selected, time, who, energy, intention, results, allResults, onRestart, onBack, blendHex }) {
  const top = results[0];
  const alternates = results.slice(1, 3);
  const cName = constellationName(selected);
  const matchAnim = useCountUp(top?.match || 0, 1400, 250);
  const [credits, setCredits] = useState(false);
  const [savedState, setSavedState] = useState('idle'); // idle | saving | saved | error
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const { diaryQuotes } = useDiscoverData();
  const { edition } = currentEdition();
  useEffect(() => {
    const fn = (e) => { const cx = window.innerWidth/2, cy = window.innerHeight/2; setMx((e.clientX - cx)/cx); setMy((e.clientY - cy)/cy); };
    window.addEventListener('mousemove', fn); return () => window.removeEventListener('mousemove', fn);
  }, []);

  // === Action handlers ===
  const handleWatch = () => {
    setCredits(true);
    // After the credits-scroll finishes (~6s), the modal calls onClose. We
    // also stash the tmdbId so the user can deep-link into the magazine
    // detail surface when the modal closes.
  };
  const handleCreditsClose = () => {
    setCredits(false);
    if (top?.tmdbId) navigate(`/movie/${top.tmdbId}`);
  };
  const handleSaveForLater = async () => {
    if (!user?.id || !top?.id || savedState !== 'idle') return;
    setSavedState('saving');
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({ user_id: user.id, movie_id: top.id });
      if (error && error.code !== '23505') throw error; // 23505 = unique violation (already in list)
      setSavedState('saved');
    } catch (e) {
      console.error('[DiscoverV5.saveForLater]', e);
      setSavedState('error');
    }
  };
  const handleNotTonight = () => navigate('/home');

  const confidence = useMemo(() => {
    if (!top || !alternates.length) return 90;
    const gap = top.match - alternates[0].match;
    if (gap >= 15) return 94; if (gap >= 8) return 86; if (gap >= 4) return 76; return 67;
  }, [top, alternates]);
  const lowConf = confidence < 80;
  const whyNow = useMemo(() => buildWhyNow(selected, time, energy, who, intention), [selected, time, energy, who, intention]);
  const antiRec = useMemo(() => {
    const sorted = allResults.slice().sort((a,b) => a.match - b.match);
    const f = sorted[0]; if (!f) return null;
    const reasons = [`Your ${energy} energy will hate this. Save it.`, `Wrong shape for the night you described.`, `Beautiful film. Not for this constellation.`, `Match was 23 points below. The engine pushed back.`];
    return { ...f, why: reasons[f.id % reasons.length] };
  }, [allResults, energy]);

  const filter = moodFilter(selected[0]);
  if (!top) return null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
  const dayStr = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];

  // The engine's diary lookback — keyed by dominant mood. Live data
  // (user_ratings.review_text) wins; falls back to the curated defaults.
  const diary = diaryQuotes[selected[0]] || diaryQuotes.tender;
  const pairing = PAIRING[selected[0]] || PAIRING.tender;

  // FF Take — magazine prose
  const ffTake = `For all its surface restraint, this is the kind of film that doesn’t ask for your attention; it earns it, frame by frame, until you can’t quite remember the moment you stopped checking the time. ${top.dir} works in the small registers — a held look, a stretched silence — and trusts you to follow.`;

  // Title words for typesetting
  const titleWords = top.title.split(' ');

  return (
    <section style={{ position:'relative', padding:'24px 88px 80px', animation:'ff-fade 0.7s ease' }}>
      <AudioToggle />
      {/* Film grain + vignette overlays */}
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, opacity:0.045, mixBlendMode:'overlay', backgroundImage:'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")', animation:'ff-grain 1.6s steps(6) infinite' }} />
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:2, background:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)' }} />
      {/* Mast banner */}
      <div style={{ textAlign:'center', borderBottom:`1px solid ${HP.border}`, padding:'4px 0 18px', marginBottom:32 }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.36em', textTransform:'uppercase', color:HP.purple }}>FeelFlick · The Discover Edition</div>
        <div style={{ marginTop:8, fontFamily:'Outfit', fontStyle:'italic', fontSize:14, color:HP.textMuted }}>Tonight&rsquo;s film, for your constellation <em style={{ color:blendHex, fontStyle:'italic' }}>&ldquo;{cName}&rdquo;</em></div>
      </div>

      {/* Magazine spread */}
      <div style={{ maxWidth:1080, margin:'0 auto', display:'grid', gridTemplateColumns:'360px 1fr', gap:0, position:'relative' }}>
        {/* Vertical "gutter" spine */}
        <div style={{ position:'absolute', left:'360px', top:0, bottom:0, width:1, background:`linear-gradient(180deg, transparent, ${HP.border}, transparent)`, marginLeft:-1 }} />

        {/* LEFT PAGE */}
        <div style={{ paddingRight:36, position:'relative', transform:`translate(${mx*-6}px, ${my*-4}px)`, transition:'transform 0.4s cubic-bezier(.2,.7,.2,1)' }}>
          {/* Film strip ribbon along left edge */}
          <div aria-hidden style={{ position:'absolute', top:0, left:-22, bottom:80, width:14, display:'flex', flexDirection:'column', gap:6, opacity:0.35 }}>
            {Array.from({length:14}).map((_, i) => (
              <div key={i} style={{ flex:1, background:`url(${top.poster})`, backgroundSize:'cover', backgroundPosition:`center ${i*7}%`, borderRadius:1 }} />
            ))}
          </div>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', inset:-14, borderRadius:14, background:`radial-gradient(ellipse at center, ${blendHex}55, transparent 70%)`, filter:'blur(30px)', animation: filter.halo ? 'ff-bloom-pulse-strong 4s ease-in-out infinite' : 'ff-bloom-pulse 4s ease-in-out infinite' }} />
            <div style={{ position:'relative', overflow:'hidden', borderRadius:6, boxShadow:`0 30px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px ${blendHex}33` }}>
              <img src={top.poster} alt={top.title} style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block', filter: filter.cardFilter || 'none', animation: filter.kenBurns ? 'ff-kenburns 14s ease-in-out infinite alternate' : 'ff-poster-in 1s cubic-bezier(.2,.7,.2,1)' }} />
              {filter.overlay && <div style={{ position:'absolute', inset:0, background:filter.overlay, pointerEvents:'none', mixBlendMode:'overlay' }} />}
            </div>
            {/* Match ring */}
            <div style={{ position:'absolute', right:-22, bottom:-22, width:104, height:104, borderRadius:999, background:`conic-gradient(${blendHex} ${matchAnim*3.6}deg, rgba(255,255,255,0.07) 0)`, display:'flex', alignItems:'center', justifyContent:'center', padding:5, boxShadow:`0 0 32px ${blendHex}66` }}>
              <div style={{ width:'100%', height:'100%', borderRadius:999, background:HP.bgDeep, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:'Outfit', fontSize:26, fontWeight:300, color:HP.text, letterSpacing:'-0.04em', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{matchAnim}<span style={{ fontSize:11, color:HP.textMuted }}>%</span></div>
                <div style={{ fontSize:7, color:HP.textMuted, letterSpacing:'0.2em', textTransform:'uppercase', fontFamily:'Outfit', marginTop:2 }}>Match</div>
              </div>
            </div>
          </div>

          {/* Sidebar — pairing notes */}
          <div style={{ marginTop:40, padding:'18px 18px 18px 20px', borderLeft:`2px solid ${blendHex}44`, opacity:0, animation:'ff-fade 0.7s ease 1.6s forwards' }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.24em', textTransform:'uppercase', color:blendHex, fontFamily:'Outfit', marginBottom:8 }}>Pairs with</div>
            <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:13, color:HP.textSoft, fontStyle:'italic', lineHeight:1.6, textWrap:'pretty' }}>{pairing}</p>
          </div>

          {/* Sidebar — In this issue */}
          <div style={{ marginTop:24, padding:'14px 0 0 0', borderTop:`1px solid ${HP.border}`, opacity:0, animation:'ff-fade 0.7s ease 1.75s forwards' }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.24em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit', marginBottom:10 }}>In this issue</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, fontFamily:'Outfit', color:HP.textSoft }}><span>The Feature</span><span style={{ color:HP.textFaint }}>p. 01</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, fontFamily:'Outfit', color:HP.textSoft }}><span>M. Remembers</span><span style={{ color:HP.textFaint }}>p. 02</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, fontFamily:'Outfit', color:HP.textSoft }}><span>Emotional Arc</span><span style={{ color:HP.textFaint }}>p. 03</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, fontFamily:'Outfit', color:HP.textSoft }}><span>From your circle</span><span style={{ color:HP.textFaint }}>p. 04</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, fontFamily:'Outfit', color:HP.textSoft }}><span>Almost got</span><span style={{ color:HP.textFaint }}>p. 05</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT PAGE */}
        <div style={{ paddingLeft:48, transform:`translate(${mx*-3}px, ${my*-2}px)`, transition:'transform 0.4s cubic-bezier(.2,.7,.2,1)' }}>
          {/* Byline */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${HP.border}`, paddingBottom:12, marginBottom:22 }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.24em', textTransform:'uppercase', color:HP.textMuted, fontFamily:'Outfit' }}>The Feature · p. 01</div>
            <div style={{ fontSize:11, fontFamily:'Outfit', fontStyle:'italic', color:HP.textMuted }}>Curated for you · {timeStr}, {dayStr}</div>
          </div>

          {/* Kicker + Title */}
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.28em', textTransform:'uppercase', color:blendHex, fontFamily:'Outfit', marginBottom:14 }}>Tonight’s pick</div>
          <h1 style={{ fontFamily:'Outfit', fontSize:'clamp(44px, 5.6vw, 76px)', lineHeight:0.96, fontWeight:300, letterSpacing:'-0.045em', color:HP.text, margin:0, textWrap:'balance' }}>
            {titleWords.map((w, i) => <span key={i} style={{ display:'inline-block', opacity:0, animation:`ff-word-in 0.55s cubic-bezier(.2,.7,.2,1) ${0.2 + i*0.08}s forwards`, marginRight:'0.2em' }}>{w}</span>)}
          </h1>
          <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', fontFamily:'Outfit', fontSize:13, color:HP.textMuted, letterSpacing:'0.04em', opacity:0, animation:'ff-fade 0.6s ease 0.7s forwards' }}>
            <span style={{ fontStyle:'italic' }}>directed by {top.dir}</span>
            <span style={{ color:HP.textFaint }}>·</span>
            <span>{top.year}, {top.runtime} min, {top.genre}</span>
            <span style={{ color:HP.textFaint }}>·</span>
            <span>Critics {top.critic} / Audience {top.audience}</span>
          </div>

          {/* The article — drop cap */}
          <div style={{ marginTop:26, opacity:0, animation:'ff-fade 0.7s ease 0.9s forwards' }}>
            <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:15.5, color:HP.textSoft, lineHeight:1.65, textWrap:'pretty' }}>
              <span style={{ float:'left', fontFamily:'Outfit', fontSize:78, lineHeight:0.78, fontWeight:300, color:blendHex, marginRight:10, marginTop:6, marginBottom:-4, letterSpacing:'-0.06em' }}>{ffTake.charAt(0)}</span>
              {ffTake.slice(1)}
            </p>
          </div>

          {/* Pull-quote — critic line. Hidden when no real critic data exists. */}
          {top.criticLine && (
            <blockquote style={{ margin:'30px 0 0 0', padding:'18px 24px', borderLeft:`3px solid ${blendHex}99`, borderRight:`1px solid ${HP.border}`, background:`${blendHex}08`, opacity:0, animation:'ff-fade 0.7s ease 1.05s forwards' }}>
              <p style={{ margin:0, fontFamily:'Outfit', fontSize:22, lineHeight:1.3, fontWeight:300, fontStyle:'italic', color:HP.text, letterSpacing:'-0.015em', textWrap:'balance' }}>&ldquo;{top.criticLine.q}&rdquo;</p>
              <div style={{ marginTop:8, fontSize:11, color:HP.textMuted, fontFamily:'Outfit', letterSpacing:'0.08em', textTransform:'uppercase' }}>{top.criticLine.src}</div>
            </blockquote>
          )}

          {/* M. Remembers — diary callback */}
          <div style={{ marginTop:28, padding:'18px 20px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${HP.border}`, opacity:0, animation:'ff-fade 0.7s ease 1.2s forwards' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:22, height:22, borderRadius:999, background:HP_GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, fontSize:11, color:'#fff' }}>M</div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.24em', textTransform:'uppercase', color:HP.purple, fontFamily:'Outfit' }}>M. remembers</div>
            </div>
            <p style={{ margin:0, fontFamily:'Outfit, Inter, sans-serif', fontSize:14, color:HP.textSoft, lineHeight:1.6, textWrap:'pretty' }}>
              You wrote <em style={{ color:HP.text, fontStyle:'italic' }}>&ldquo;{diary.quote}&rdquo;</em> after {diary.after}. This will land in that same place.
            </p>
          </div>

          {/* Why now */}
          <div style={{ marginTop:18, display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', borderRadius:8, background:`${blendHex}10`, border:`1px solid ${blendHex}33`, opacity:0, animation:'ff-fade 0.7s ease 1.3s forwards' }}>
            <div style={{ width:22, height:22, borderRadius:999, background:`${blendHex}22`, border:`1px solid ${blendHex}66`, color:blendHex, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:blendHex, fontFamily:'Outfit', marginBottom:3 }}>Why now</div>
              <div style={{ fontFamily:'Outfit, Inter, sans-serif', fontSize:13.5, color:HP.text, lineHeight:1.5 }}>{whyNow}</div>
            </div>
          </div>

          {/* Mood arc */}
          <div style={{ marginTop:24, opacity:0, animation:'ff-fade 0.7s ease 1.4s forwards' }}>
            <MoodArc points={top.arcPoints} hex={blendHex} runtime={top.runtime} />
            <div style={{ marginTop:8, fontSize:12, color:HP.textMuted, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic' }}>{top.arc}</div>
          </div>

          {/* Taste twin */}
          {top.twin && (
            <div style={{ marginTop:22, display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', borderRadius:8, background:`${blendHex}10`, border:`1px solid ${blendHex}33`, opacity:0, animation:'ff-fade 0.7s ease 1.5s forwards' }}>
              <div style={{ width:32, height:32, borderRadius:999, background:blendHex, color:HP.bgDeep, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit', fontWeight:700, fontSize:13, flexShrink:0 }}>{top.twin.who.charAt(0)}</div>
              <div>
                <div style={{ fontFamily:'Outfit', fontSize:12, color:HP.text }}><span style={{ fontWeight:600 }}>{top.twin.who}</span> <span style={{ color:HP.textMuted }}>(87% taste match)</span> rated this <span style={{ color:blendHex, fontWeight:700 }}>{top.twin.rating}☆</span></div>
                <div style={{ marginTop:4, fontSize:12.5, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', lineHeight:1.5 }}>&ldquo;{top.twin.note}&rdquo;</div>
              </div>
            </div>
          )}

          {/* Confidence + actions */}
          <div style={{ marginTop:22, display:'flex', alignItems:'center', gap:12, opacity:0, animation:'ff-fade 0.7s ease 1.6s forwards' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 10px', borderRadius:999, background: lowConf?'rgba(245,158,11,0.12)':'rgba(52,211,153,0.10)', border:`1px solid ${lowConf?HP.amber+'44':HP.green+'44'}` }}>
              <span style={{ width:6, height:6, borderRadius:999, background: lowConf?HP.amber:HP.green, boxShadow:`0 0 6px ${lowConf?HP.amber:HP.green}` }} />
              <span style={{ fontSize:11, fontFamily:'Outfit', fontWeight:600, color: lowConf?HP.amber:HP.green }}>{confidence}% confident</span>
            </div>
          </div>
          <div style={{ marginTop:18, display:'flex', gap:10, flexWrap:'wrap', opacity:0, animation:'ff-fade 0.7s ease 1.7s forwards' }}>
            <button type="button" onClick={handleWatch} style={{ padding:'13px 28px', borderRadius:999, background:HP_GRAD, border:'none', color:'#fff', fontFamily:'Outfit', fontSize:13, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', boxShadow:'0 12px 28px -10px rgba(236,72,153,0.5)' }}>Watch now &rarr;</button>
            <button
              type="button"
              onClick={handleSaveForLater}
              disabled={savedState === 'saving' || savedState === 'saved'}
              style={{ padding:'13px 22px', borderRadius:999, background: savedState === 'saved' ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.06)', border:`1px solid ${savedState === 'saved' ? HP.green + '66' : HP.borderStrong}`, color: savedState === 'saved' ? HP.green : HP.textSoft, fontFamily:'Outfit', fontSize:13, fontWeight:600, cursor: savedState === 'idle' ? 'pointer' : 'default' }}
            >
              {savedState === 'idle' && 'Save for later'}
              {savedState === 'saving' && 'Saving…'}
              {savedState === 'saved' && 'Saved ✓'}
              {savedState === 'error' && 'Try again'}
            </button>
            <button type="button" onClick={handleNotTonight} style={{ padding:'13px 18px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:13, fontWeight:500, cursor:'pointer' }}>Not tonight</button>
          </div>
        </div>
      </div>

      {/* Almost got + Anti-rec */}
      <div style={{ marginTop:72, maxWidth:1080, margin:'72px auto 0', opacity:0, animation:'ff-fade 0.8s ease 1.9s forwards' }}>
        <div style={{ borderTop:`1px solid ${HP.border}`, paddingTop:28 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:32 }}>
            <div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.textMuted, marginBottom:14, fontFamily:'Outfit' }}>Almost got · p. 05</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {alternates.map(f => (
                  <article key={f.id} style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:14, padding:'12px 14px', borderRadius:8, background:'rgba(255,255,255,0.025)', border:`1px solid ${HP.border}` }}>
                    <img src={f.poster} alt="" style={{ width:52, height:78, objectFit:'cover', borderRadius:4 }} />
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontFamily:'Outfit', fontSize:14, fontWeight:500, color:HP.text }}>{f.title}</span>
                        <span style={{ fontFamily:'Outfit', fontSize:11, color:HP.purple, fontWeight:600 }}>{f.match}%</span>
                      </div>
                      <p style={{ margin:'5px 0 0 0', fontSize:12, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', lineHeight:1.5 }}>{f.reason}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            {antiRec && (
              <div>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.28em', textTransform:'uppercase', color:HP.amber, marginBottom:14, fontFamily:'Outfit', display:'inline-flex', alignItems:'center', gap:8 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                  Skip tonight
                </div>
                <article style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:14, padding:'14px 16px', borderRadius:8, background:`${HP.amber}0a`, border:`1px solid ${HP.amber}33` }}>
                  <img src={antiRec.poster} alt="" style={{ width:52, height:78, objectFit:'cover', borderRadius:4, filter:'grayscale(0.7) opacity(0.8)' }} />
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'Outfit', fontSize:14, fontWeight:500, color:HP.text, textDecoration:'line-through', textDecorationColor:`${HP.amber}88` }}>{antiRec.title}</span>
                      <span style={{ fontFamily:'Outfit', fontSize:11, color:HP.amber, fontWeight:600 }}>{antiRec.match}%</span>
                    </div>
                    <p style={{ margin:'5px 0 0 0', fontSize:12, color:HP.textSoft, fontFamily:'Outfit, Inter, sans-serif', fontStyle:'italic', lineHeight:1.5 }}>{antiRec.why}</p>
                  </div>
                </article>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop:56, paddingTop:24, borderTop:`1px solid ${HP.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:1080, margin:'56px auto 0', paddingBottom:0 }}>
        <div style={{ fontSize:10, color:HP.textFaint, fontFamily:'Outfit', letterSpacing:'0.18em', textTransform:'uppercase' }}>FeelFlick · Edition Nº {edition}</div>
        <div style={{ display:'flex', gap:14 }}>
          <button onClick={onBack}    style={{ padding:'9px 16px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:500, cursor:'pointer' }}>← Tweak inputs</button>
          <button onClick={onRestart} style={{ padding:'9px 16px', borderRadius:999, background:'transparent', border:`1px solid ${HP.border}`, color:HP.textMuted, fontFamily:'Outfit', fontSize:11, fontWeight:500, cursor:'pointer' }}>Start over</button>
        </div>
      </div>

      {credits && <CreditsScroll title={top.title} onClose={handleCreditsClose} />}
    </section>
  );
}

function DiscoverV5Body() {
  const [stage, setStage]       = useState(0);
  const [selected, setSelected] = useState([]);
  const [time, setTime]         = useState('std');
  const [who, setWho]           = useState('alone');
  const [energy, setEnergy]     = useState('steady');
  const [intention, setIntention] = useState('move');
  const [bursts, setBursts]     = useState([]);
  const { films: liveFilms, profile } = useDiscoverData();

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
    const moodIds = selected.length > 0 ? selected : ['slow','tender'];
    const scored = films.map(f => {
      // === Base score: real engine when we have a profile, mood-tag overlap as cold-start fallback ===
      const baseScore = (profile && f._raw)
        ? scoreMovieForUser(f._raw, profile, 'default').score
        : (moodIds.reduce((a, id) => a + (f.fit[id] || 0), 0) / moodIds.length) * 100;

      // === UI modifiers layered on top of the engine score ===
      // The engine already accounts for runtime band, but here we expose the
      // user's *explicit* time choice (90 min vs 3 hr) which the engine
      // doesn't know about — so we re-apply a runtime penalty.
      const inBand = f.runtime >= runtimeBand[0] && f.runtime <= runtimeBand[1];
      const runtimePenalty = inBand ? 0 : Math.min(Math.abs(f.runtime - (runtimeBand[0]+runtimeBand[1])/2) / 4, 25);

      // Intention/energy/who tilt — additive points on top of engine score
      let intMod = 0;
      if (intention === 'move')     intMod = (Math.max(f.fit.tender, f.fit.bittersweet) - 0.3) * 12;
      if (intention === 'think')    intMod = (f.fit.cerebral - 0.3) * 12;
      if (intention === 'distract') intMod = (Math.max(f.fit.tense, f.fit.restless) - 0.3) * 10;
      if (intention === 'comfort')  intMod = (f.fit.cozy - 0.3) * 12;
      if (intention === 'laugh')    intMod = (f.fit.cozy - 0.3) * 10 - (f.fit.tense * 6);
      if (intention === 'surprise') intMod = ((100 - f.ff) / 100) * 8;
      let energyMod = 0;
      if (energy === 'wiped') energyMod = (1 - (f.fit.cozy || 0.3)) * -8;
      if (energy === 'wired') energyMod = (1 - (f.fit.restless || f.fit.tense || 0.3)) * -8;
      let audMod = 0;
      if (who === 'friends' && f.fit.tense > 0.8 && f.fit.cozy < 0.2) audMod = -10;

      const finalScore = baseScore - runtimePenalty + energyMod + audMod + intMod;

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

      // Clamp to 0–100 display range. Engine raw scores typically land 60–130.
      return { ...f, match: Math.max(0, Math.min(100, Math.round(finalScore))), reason };
    });
    scored.sort((a,b) => b.match - a.match);
    return scored;
  }, [selected, time, who, energy, intention, films, profile]);

  return (
    <div style={{ minHeight:'100vh', background:HP.bgDeep, color:HP.text, fontFamily:'Inter, sans-serif', position:'relative', overflow:'hidden' }}>
      <Starfield tint={blendHex} />
      <div style={{ position:'relative', zIndex:1, maxWidth:1440, margin:'0 auto' }}>
        {stage === 0   && <StageHero onBegin={()=>setStage(1)} onSurprise={()=>{ setSelected(['slow','tender']); FFAudio.whoom(); setStage(2.3); }} />}
        {stage === 1   && <StageMood selected={selected} setSelected={setSelected} onNext={()=>setStage(2)} onBack={()=>setStage(0)} blendHex={blendHex} bursts={bursts} fireBurst={fireBurst} />}
        {stage === 2   && <StageNight time={time} setTime={setTime} who={who} setWho={setWho} energy={energy} setEnergy={setEnergy} intention={intention} setIntention={setIntention} onNext={()=>setStage(2.3)} onBack={()=>setStage(1)} blendHex={blendHex} />}
        {stage === 2.3 && <StageBreath onDone={()=>setStage(2.5)} />}
        {stage === 2.5 && <StageReveal selected={selected.length>0?selected:['slow','tender']} onDone={()=>setStage(2.7)} />}
        {stage === 2.7 && <StageTitleCard title={(allResults[0]||{}).title || ''} onDone={()=>setStage(3)} />}
        {stage === 3   && <StagePick selected={selected.length>0?selected:['slow','tender']} time={time} who={who} energy={energy} intention={intention} results={allResults} allResults={allResults} onRestart={()=>{ setStage(0); setSelected([]); }} onBack={()=>setStage(2)} blendHex={blendHex} />}
      </div>
    </div>
  );
}

export default function DiscoverV5() {
  return (
    <DiscoverDataProvider>
      <DiscoverV5Body />
    </DiscoverDataProvider>
  );
}

