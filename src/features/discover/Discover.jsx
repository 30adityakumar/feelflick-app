import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { supabase } from '@/shared/lib/supabase/client'
import { useAuthSession } from '@/shared/hooks/useAuthSession'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { scoreMovieForUser } from '@/shared/services/recommendations'
import { computeMatchPercent } from '@/shared/services/matchScore'
import { DiscoverDataProvider, useDiscoverData } from './useDiscoverData'
import { MOODS, ONBOARDING_TO_DISCOVER, diversifyTop3, predictDiscoverDefaults } from './derive'
import { HP, TIME_OPTIONS } from './constants'
import StageMood from './sections/StageMood'
import StageNightContext from './sections/StageNightContext'
import StageBreath from './sections/StageBreath'
import StageReveal from './sections/StageReveal'
import StageTitleCard from './sections/StageTitleCard'
import StagePick from './sections/StagePick'
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
  // /discover opens directly on the mood front door (stage 1) — the separate
  // hero/"How do you feel?" launch screen was removed in F3.5 (it re-asked mood
  // a third time after onboarding). There is no stage 0 anymore.
  const [stage, setStage]       = useState(1);
  const [selected, setSelected] = useState([]);
  const [time, setTime]         = useState('std');
  const [who, setWho]           = useState('alone');
  const [energy, setEnergy]     = useState('steady');
  const [intention, setIntention] = useState('move');
  const [bursts, setBursts]     = useState([]);
  // Films that have appeared as top OR alternate in THIS /discover session
  // (one mount lifetime). diversifyTop3 demotes these so users who tweak
  // moods get genuinely fresh picks across scenarios instead of seeing
  // the same broad-mood films (e.g., Gladiator) win every constellation.
  // Resets naturally when the user leaves /discover and returns.
  const sessionShownIds = useRef(new Set());
  const { films: liveFilms, profile, baselineMoods, learnedPrefs, recentSaves } = useDiscoverData();
  const { user } = useAuthSession();
  const location = useLocation();
  const fromOnboardingRef = useRef(location.state?.fromOnboarding === true);

  // First-visit handoff from onboarding (F3.5). Onboarding asked the user for
  // their baseline moods ~30 seconds ago, so on the FIRST /discover visit we
  // seed the constellation from those moods rather than re-asking cold: map ALL
  // baseline moods through the bridge, deduplicate while preserving order, and
  // take at most three (the selection cap). The user can deselect or swap before
  // continuing.
  //
  // ORDINARY/DIRECT visits start empty — the user's right-now mood is a session
  // signal distinct from their stable taste baseline, and we don't invent a
  // "recent mood" that isn't stored. Gated on location.state.fromOnboarding so
  // manual /discover navigations don't get the seed.
  //
  // The ref prevents the effect from re-firing if the user navigates away/back
  // during this session — fromOnboarding stays true on that location.state until
  // the user manually leaves /discover.
  const didPreSelectRef = useRef(false);
  useEffect(() => {
    if (didPreSelectRef.current) return
    if (!fromOnboardingRef.current) return
    if (selected.length > 0) return
    if (!baselineMoods || baselineMoods.length === 0) return
    const mapped = baselineMoods.map(k => ONBOARDING_TO_DISCOVER[k]).filter(Boolean)
    if (mapped.length === 0) return
    // dedup (preserve order) + cap at the 3-mood maximum
    const seeded = [...new Set(mapped)].slice(0, 3)
    setSelected(seeded)
    didPreSelectRef.current = true
  }, [baselineMoods, selected.length])

  // Predicted defaults (F3.6). Discover pre-fills intention / time / who / energy
  // from signals it already has (selected moods, profile runtime, current hour,
  // learned prefs) so the night-context surface lands on a ready starting point —
  // no forced confirmation taps. Two refs protect intent:
  //   • contextTouchedRef — set once the user MANUALLY edits any detail. After that
  //     a late profile / learned-pref / mood update must never overwrite their pick.
  //   • didPredictDefaultsRef — the per-round prediction gate: reset on Start over /
  //     return to the mood front door, and re-opened by a fresh mood mix while the
  //     user hasn't edited context yet.
  const didPredictDefaultsRef = useRef(false)
  const contextTouchedRef = useRef(false)
  // Reset the prediction gate when the user returns to the mood front door.
  useEffect(() => { if (stage === 1) didPredictDefaultsRef.current = false }, [stage])
  // A new mood mix re-opens prediction — but only BEFORE the user has manually
  // edited a context detail (after that, their picks are frozen for the session).
  useEffect(() => { if (!contextTouchedRef.current) didPredictDefaultsRef.current = false }, [selected])
  useEffect(() => {
    if (contextTouchedRef.current) return   // user edited a detail → never overwrite
    if (didPredictDefaultsRef.current) return
    if (!profile) return
    if (selected.length === 0) return
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
  }, [profile, selected, learnedPrefs])

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
        {stage === 1   && <StageMood selected={selected} setSelected={setSelected} onNext={()=>setStage(2)} blendHex={blendHex} bursts={bursts} fireBurst={fireBurst} audioToggle={<AudioToggle />} playMoodCue={(id)=>FFAudio.pluck(id)} playContinueCue={()=>FFAudio.whoom()} />}
        {stage === 2   && <StageNightContext time={time} setTime={setTime} who={who} setWho={setWho} energy={energy} setEnergy={setEnergy} intention={intention} setIntention={setIntention} onUserEdit={()=>{ contextTouchedRef.current = true }} onNext={()=>{ handleCommitStage2(); setStage(2.3); }} onBack={()=>setStage(1)} blendHex={blendHex} playOptionCue={()=>FFAudio.pluck('cozy')} playContinueCue={()=>FFAudio.whoom()} />}
        {stage === 2.3 && <StageBreath onDone={()=>setStage(2.5)} />}
        {stage === 2.5 && <StageReveal selected={selected.length>0?selected:['slow','tender']} onDone={()=>setStage(2.7)} />}
        {stage === 2.7 && <StageTitleCard title={(allResults[0]||{}).title || ''} onDone={()=>setStage(3)} playTitleCue={()=>FFAudio.chord()} />}
        {stage === 3   && <StagePick selected={selected.length>0?selected:['slow','tender']} who={who} energy={energy} intention={intention} results={allResults} profile={profile} sessionShownIds={sessionShownIds} onRestart={()=>{ setStage(1); setSelected([]); contextTouchedRef.current = false; didPredictDefaultsRef.current = false; setIntention('move'); setTime('std'); setWho('alone'); setEnergy('steady'); }} onBack={()=>setStage(2)} blendHex={blendHex} audioToggle={<AudioToggle />} />}
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
