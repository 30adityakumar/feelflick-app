// FeelFlick — Browse v3 data layer.
// /browse v5 — data layer.

import { HP as baseHP, ROSE } from '@/shared/lib/tokens'

// Browse keeps a deeper page bg, extra text tiers, and a couple of accents;
// spread the shared core and override only those (explicit, not drift).
export const HP = {
  ...baseHP,
  bg: '#06060a', surface: '#0e0b18',
  border: 'rgba(255,255,255,0.07)', textFaint: 'rgba(250,250,250,0.32)',
  purpleDeep: '#9333ea',
  textHi: 'rgba(250,250,250,0.92)', textMid: 'rgba(250,250,250,0.72)', textLow: 'rgba(250,250,250,0.5)',
  blue: '#7DD3FC',
}
export { ROSE }
export const TMDB = (p) => `https://image.tmdb.org/t/p/w500${p}`;

export const MOODS = [
  { id:'all',       label:'All moods', hex:ROSE, hint:'Ranked by your overall taste DNA' },
  { id:'tense',     label:'Tense',     hex:'#EF4444', hint:'Pulse up. Held breath.' },
  { id:'slow',      label:'Slow-burn', hex:'#A78BFA', hint:'Patient escalation. Long takes.' },
  { id:'tender',    label:'Tender',    hex:'#F472B6', hint:'Two-handers. Soft ache.' },
  { id:'cerebral',  label:'Cerebral',  hex:'#7DD3FC', hint:'Big idea, quiet pace.' },
  { id:'cozy',      label:'Cozy',      hex:'#FBBF24', hint:'Low-stakes. Soft landing.' },
  { id:'melancholy',label:'Melancholy',hex:'#0EA5E9', hint:'Beautifully sad.' },
];

export const SORT_OPTIONS = [
  { value:'ff_rating.desc',           label:'FeelFlick rating' },
  { value:'popularity.desc',          label:'Most popular' },
  { value:'vote_average.desc',        label:'Highest rated' },
  { value:'vote_count.desc',          label:'Most reviewed' },
  { value:'release_date.desc',        label:'Newest first' },
  { value:'release_date.asc',         label:'Oldest first' },
  { value:'discovery_potential.desc', label:'Hidden gems' },
  { value:'cult_status_score.desc',   label:'Cult classics' },
];

export const DECADE_OPTIONS = [
  {value:'',label:'Any era'},{value:'2020',label:'2020s'},{value:'2010',label:'2010s'},
  {value:'2000',label:'2000s'},{value:'1990',label:'1990s'},{value:'1980',label:'1980s'},
  {value:'1970',label:'1970s'},{value:'pre1970',label:'Before 1970'},
];
export const LANG_OPTIONS = [
  {value:'',label:'Any language'},{value:'en',label:'English'},{value:'ko',label:'Korean'},
  {value:'ja',label:'Japanese'},{value:'hi',label:'Hindi'},{value:'fr',label:'French'},
  {value:'es',label:'Spanish'},{value:'de',label:'German'},{value:'zh',label:'Chinese'},
];
export const GENRE_OPTIONS = [
  {value:'',label:'All genres'},{value:'Drama',label:'Drama'},{value:'Thriller',label:'Thriller'},
  {value:'Sci-Fi',label:'Sci-Fi'},{value:'Romance',label:'Romance'},{value:'Comedy',label:'Comedy'},
  {value:'Crime',label:'Crime'},{value:'Horror',label:'Horror'},{value:'Animation',label:'Animation'},
  {value:'Mystery',label:'Mystery'},{value:'Music',label:'Music'},
];
export const RUNTIME_OPTIONS = [{value:'',label:'Any length'},{value:'short',label:'Short · under 90m'},{value:'medium',label:'Standard · 90–130m'},{value:'long',label:'Long · 130–180m'},{value:'epic',label:'Epic · 180m+'}];
export const PACING_OPTIONS   = [{value:'',label:'Any pacing'},{value:'slow',label:'Slow burn'},{value:'fast',label:'Fast-paced'}];
export const INTENSITY_OPTIONS= [{value:'',label:'Any intensity'},{value:'chill',label:'Chill'},{value:'intense',label:'Intense'}];
export const DEPTH_OPTIONS    = [{value:'',label:'Any depth'},{value:'surface',label:'Easy watch'},{value:'deep',label:'Thought-provoking'}];
export const DIALOGUE_OPTIONS = [{value:'',label:'Any'},{value:'heavy',label:'Dialogue-heavy'},{value:'light',label:'Visual / action'}];
export const ATTENTION_OPTIONS= [{value:'',label:'Any'},{value:'low',label:'Easy to multitask'},{value:'high',label:'Needs full focus'}];
export const GAP_OPTIONS      = [{value:'',label:'Off'},{value:'critic_picks',label:"Critics' picks"},{value:'crowd_pleasers',label:'Crowd-pleasers'}];
export const VIBE_OPTIONS = [
  {value:'hidden',label:'Hidden gem',symbol:'◇'},
  {value:'cult',label:'Cult classic',symbol:'☾'},
  {value:'spectacle',label:'Visually epic',symbol:'✦'},
  {value:'accessible',label:'Easy to watch',symbol:'○'},
];

export const PRESETS = [
  { id:'hidden_gems',  label:'Hidden gems',   icon:'gem',     filters:{ sortBy:'discovery_potential.desc', vibe:['hidden'] } },
  { id:'cozy_night',   label:'Cozy night',    icon:'moon',    filters:{ intensity:'chill', depth:'surface', runtime:'medium' } },
  { id:'mind_bending', label:'Mind-bending',  icon:'brain',   filters:{ depth:'deep', attention:'high' } },
  { id:'high_energy',  label:'High energy',   icon:'zap',     filters:{ pacing:'fast', intensity:'intense' } },
  { id:'world_cinema', label:'World cinema',  icon:'globe',   filters:{ language:'ko' } },
  { id:'cult_classics',label:'Cult classics', icon:'flame',   filters:{ sortBy:'cult_status_score.desc', vibe:['cult'] } },
  { id:'easy_watch',   label:'Easy watch',    icon:'smile',   filters:{ attention:'low', intensity:'chill' } },
  { id:'short_films',  label:'Short & sharp', icon:'clock',   filters:{ runtime:'short' } },
];

export const FILMS = [
  { id:1,  title:'Parasite',             year:2019, runtime:132, dir:'Bong Joon-ho',     genre:'Thriller', lang:'ko', poster:TMDB('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'), ff:97, vote:8.5, critic:99, audience:90, cult:32, hidden:25, pacing:6, intensity:8.5, depth:9, dialogue:'heavy', attention:'high', vibes:['accessible'], fit:{tense:0.94,slow:0.78,tender:0.20,cerebral:0.70,cozy:0.05,melancholy:0.30}, rationale:{tense:'Tense 0.94 · Class-tension motif',slow:'Slow-burn 0.78 · Patient escalation',tender:'Tender 0.20',cerebral:'Cerebral 0.70',cozy:'Cozy 0.05',melancholy:'Mel 0.30'}, available:true, twinsLoved:true },
  { id:2,  title:'Past Lives',           year:2023, runtime:105, dir:'Celine Song',      genre:'Drama',    lang:'en', poster:TMDB('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg'), ff:94, vote:7.9, critic:96, audience:84, cult:18, hidden:55, pacing:2, intensity:3, depth:9, dialogue:'heavy', attention:'high', vibes:[], fit:{tense:0.10,slow:0.86,tender:0.94,cerebral:0.40,cozy:0.20,melancholy:0.78}, rationale:{tense:'Tense 0.10',slow:'Slow-burn 0.86 · Patient ache',tender:'Tender 0.94 · Deepest signal',cerebral:'Cerebral 0.40',cozy:'Cozy 0.20',melancholy:'Mel 0.78'}, available:true, twinsLoved:true },
  { id:3,  title:'Drive',                year:2011, runtime:100, dir:'N. W. Refn',       genre:'Crime',    lang:'en', poster:TMDB('/602vevIURmpDfzbnv5Ubi6wIkQm.jpg'), ff:88, vote:7.8, critic:80, audience:78, cult:72, hidden:42, pacing:3, intensity:8, depth:7, dialogue:'light', attention:'high', vibes:['cult','spectacle'], fit:{tense:0.74,slow:0.90,tender:0.18,cerebral:0.30,cozy:0.05,melancholy:0.55}, rationale:{tense:'Tense 0.74',slow:'Slow-burn 0.90 · Long takes of cool',tender:'Tender 0.18',cerebral:'Cerebral 0.30',cozy:'Cozy 0.05',melancholy:'Mel 0.55'}, available:true, twinsLoved:false },
  { id:4,  title:'Arrival',              year:2016, runtime:116, dir:'Denis Villeneuve', genre:'Sci-Fi',   lang:'en', poster:TMDB('/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg'), ff:90, vote:7.9, critic:94, audience:82, cult:28, hidden:38, pacing:3, intensity:5, depth:9, dialogue:'heavy', attention:'high', vibes:['accessible'], fit:{tense:0.30,slow:0.82,tender:0.40,cerebral:0.95,cozy:0.10,melancholy:0.62}, rationale:{tense:'Tense 0.30',slow:'Slow-burn 0.82',tender:'Tender 0.40',cerebral:'Cerebral 0.95 · Top cerebral pick',cozy:'Cozy 0.10',melancholy:'Mel 0.62'}, available:true, twinsLoved:true },
  { id:5,  title:'Whiplash',             year:2014, runtime:106, dir:'Damien Chazelle',  genre:'Drama',    lang:'en', poster:TMDB('/7fn624j5lj3xTme2SgiLCeuedmO.jpg'), ff:92, vote:8.5, critic:94, audience:94, cult:38, hidden:18, pacing:8, intensity:9, depth:7, dialogue:'light', attention:'high', vibes:[], fit:{tense:0.92,slow:0.40,tender:0.20,cerebral:0.50,cozy:0.05,melancholy:0.35}, rationale:{tense:'Tense 0.92 · 106 min of held breath',slow:'Slow-burn 0.40',tender:'Tender 0.20',cerebral:'Cerebral 0.50',cozy:'Cozy 0.05',melancholy:'Mel 0.35'}, available:false, twinsLoved:true },
  { id:6,  title:'Her',                  year:2013, runtime:126, dir:'Spike Jonze',      genre:'Romance',  lang:'en', poster:TMDB('/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg'), ff:86, vote:8.0, critic:94, audience:81, cult:42, hidden:32, pacing:2, intensity:3, depth:8, dialogue:'heavy', attention:'high', vibes:['accessible'], fit:{tense:0.15,slow:0.78,tender:0.86,cerebral:0.62,cozy:0.45,melancholy:0.90}, rationale:{tense:'Tense 0.15',slow:'Slow-burn 0.78',tender:'Tender 0.86 · Soft ache',cerebral:'Cerebral 0.62',cozy:'Cozy 0.45',melancholy:'Mel 0.90 · Top match'}, available:true, twinsLoved:true },
  { id:7,  title:'Spirited Away',        year:2001, runtime:125, dir:'Hayao Miyazaki',   genre:'Animation',lang:'ja', poster:TMDB('/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'), ff:91, vote:8.6, critic:97, audience:97, cult:60, hidden:30, pacing:4, intensity:4, depth:8, dialogue:'light', attention:'low', vibes:['spectacle','accessible'], fit:{tense:0.20,slow:0.55,tender:0.70,cerebral:0.45,cozy:0.92,melancholy:0.40}, rationale:{tense:'Tense 0.20',slow:'Slow-burn 0.55',tender:'Tender 0.70',cerebral:'Cerebral 0.45',cozy:'Cozy 0.92 · No bad mood survives Miyazaki',melancholy:'Mel 0.40'}, available:true, twinsLoved:true },
  { id:8,  title:'Oldboy',               year:2003, runtime:120, dir:'Park Chan-wook',   genre:'Thriller', lang:'ko', poster:TMDB('/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg'), ff:89, vote:8.4, critic:81, audience:94, cult:78, hidden:40, pacing:6, intensity:9, depth:8, dialogue:'heavy', attention:'high', vibes:['cult'], fit:{tense:0.90,slow:0.60,tender:0.10,cerebral:0.55,cozy:0.04,melancholy:0.45}, rationale:{tense:'Tense 0.90 · Vengeance unwound',slow:'Slow-burn 0.60',tender:'Tender 0.10',cerebral:'Cerebral 0.55',cozy:'Cozy 0.04',melancholy:'Mel 0.45'}, available:true, twinsLoved:false },
  { id:9,  title:'In the Mood for Love', year:2000, runtime:98,  dir:'Wong Kar-wai',     genre:'Romance',  lang:'zh', poster:TMDB('/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg'), ff:93, vote:8.1, critic:92, audience:87, cult:68, hidden:58, pacing:1, intensity:3, depth:9, dialogue:'light', attention:'high', vibes:['hidden','spectacle'], fit:{tense:0.12,slow:0.92,tender:0.92,cerebral:0.55,cozy:0.30,melancholy:0.85}, rationale:{tense:'Tense 0.12',slow:'Slow-burn 0.92 · Foundational',tender:'Tender 0.92',cerebral:'Cerebral 0.55',cozy:'Cozy 0.30',melancholy:'Mel 0.85'}, available:true, twinsLoved:true },
  { id:10, title:'Inception',            year:2010, runtime:148, dir:'C. Nolan',         genre:'Sci-Fi',   lang:'en', poster:TMDB('/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg'), ff:84, vote:8.4, critic:87, audience:91, cult:42, hidden:8,  pacing:7, intensity:7, depth:8, dialogue:'heavy', attention:'high', vibes:['spectacle'], fit:{tense:0.70,slow:0.35,tender:0.18,cerebral:0.90,cozy:0.10,melancholy:0.40}, rationale:{tense:'Tense 0.70',slow:'Slow-burn 0.35',tender:'Tender 0.18',cerebral:'Cerebral 0.90',cozy:'Cozy 0.10',melancholy:'Mel 0.40'}, available:true, twinsLoved:false },
  { id:11, title:'La La Land',           year:2016, runtime:128, dir:'Damien Chazelle',  genre:'Romance',  lang:'en', poster:TMDB('/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg'), ff:80, vote:8.0, critic:91, audience:81, cult:24, hidden:15, pacing:5, intensity:4, depth:6, dialogue:'light', attention:'low', vibes:['spectacle','accessible'], fit:{tense:0.15,slow:0.50,tender:0.85,cerebral:0.30,cozy:0.55,melancholy:0.75}, rationale:{tense:'Tense 0.15',slow:'Slow-burn 0.50',tender:'Tender 0.85',cerebral:'Cerebral 0.30',cozy:'Cozy 0.55',melancholy:'Mel 0.75'}, available:true, twinsLoved:false },
  { id:12, title:'Hereditary',           year:2018, runtime:127, dir:'Ari Aster',        genre:'Horror',   lang:'en', poster:TMDB('/hjlZSXM86wJrfCv5VKfR5DI2VeU.jpg'), ff:85, vote:7.3, critic:90, audience:70, cult:52, hidden:35, pacing:4, intensity:10, depth:8, dialogue:'heavy', attention:'high', vibes:['cult'], fit:{tense:0.96,slow:0.75,tender:0.05,cerebral:0.60,cozy:0.02,melancholy:0.55}, rationale:{tense:'Tense 0.96 · Dread architecture',slow:'Slow-burn 0.75',tender:'Tender 0.05',cerebral:'Cerebral 0.60',cozy:'Cozy 0.02',melancholy:'Mel 0.55'}, available:true, twinsLoved:false },
];

export const INITIAL_WATCHED   = new Set([3, 5, 7, 10, 11]);
export const INITIAL_WATCHLIST = new Set([4, 6, 8, 9]);

