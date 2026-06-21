// FeelFlick — Browse v3 data layer.
// /browse v5 — data layer.

import { HP as baseHP, ROSE, ROSE_DEEP } from '@/shared/lib/tokens'

// Browse keeps a deeper page bg, extra text tiers, and a couple of accents;
// spread the shared core and override only those (explicit, not drift).
export const HP = {
  ...baseHP,
  bg: 'var(--color-canvas, #15120f)', surface: 'var(--color-surface-1, #1d1814)',
  border: 'rgba(255,255,255,0.07)', textFaint: 'rgba(250,250,250,0.32)',
  purpleDeep: 'var(--color-text-muted, #9333ea)',
  textHi: 'rgba(250,250,250,0.92)', textMid: 'rgba(250,250,250,0.72)', textLow: 'rgba(250,250,250,0.5)',
  blue: '#7DD3FC',
}
export { ROSE, ROSE_DEEP }
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

