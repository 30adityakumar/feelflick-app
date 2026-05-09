// FeelFlick — Home v2 data layer.
// Production-leaning shape; swap with real API/Supabase later.

const TMDB = (path, size = 'w500') => `https://image.tmdb.org/t/p/${size}${path}`;

// Real TMDB ids + canonical poster paths (matched against Supabase movies table).
// `tmdbId` powers /movie/:id navigation from this page. `id` is a stable local key.
export const FILMS = {
  parasite:       { id: 1,  tmdbId: 496243, title: 'Parasite',                year: 2019, runtime: 132, director: 'Bong Joon-ho',         poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
  past_lives:     { id: 2,  tmdbId: 666277, title: 'Past Lives',              year: 2023, runtime: 105, director: 'Celine Song',          poster: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg' },
  drive:          { id: 3,  tmdbId:  64690, title: 'Drive',                   year: 2011, runtime: 100, director: 'Nicolas Winding Refn', poster: '/602vevIURmpDfzbnv5Ubi6wIkQm.jpg' },
  arrival:        { id: 4,  tmdbId: 329865, title: 'Arrival',                 year: 2016, runtime: 116, director: 'Denis Villeneuve',     poster: '/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg' },
  paddington:     { id: 5,  tmdbId: 346648, title: 'Paddington 2',            year: 2017, runtime: 103, director: 'Paul King',            poster: '/1OJ9vkD5xPt3skC6KguyXAgagRZ.jpg' },
  her:            { id: 6,  tmdbId: 152601, title: 'Her',                     year: 2013, runtime: 126, director: 'Spike Jonze',          poster: '/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg' },
  whiplash:       { id: 7,  tmdbId: 244786, title: 'Whiplash',                year: 2014, runtime: 106, director: 'Damien Chazelle',      poster: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg' },
  the_handmaiden: { id: 8,  tmdbId: 290098, title: 'The Handmaiden',          year: 2016, runtime: 145, director: 'Park Chan-wook',       poster: '/dLlH4aNHdnmf62umnInL8xPlPzw.jpg' },
  before_sunrise: { id: 9,  tmdbId:     76, title: 'Before Sunrise',          year: 1995, runtime: 101, director: 'Richard Linklater',    poster: '/kf1Jb1c2JAOqjuzA3H4oDM263uB.jpg' },
  spirited:       { id: 10, tmdbId:    129, title: 'Spirited Away',           year: 2001, runtime: 125, director: 'Hayao Miyazaki',       poster: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
  oldboy:         { id: 11, tmdbId:    670, title: 'Oldboy',                  year: 2003, runtime: 120, director: 'Park Chan-wook',       poster: '/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg' },
  amelie:         { id: 12, tmdbId:    194, title: 'Amélie',                  year: 2001, runtime: 122, director: 'Jean-Pierre Jeunet',   poster: '/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg' },
  call_me:        { id: 13, tmdbId: 398818, title: 'Call Me By Your Name',    year: 2017, runtime: 132, director: 'Luca Guadagnino',      poster: '/mZ4gBdfkhP9tvLH1DO4m4HYtiyi.jpg' },
  blade_2049:     { id: 14, tmdbId: 335984, title: 'Blade Runner 2049',       year: 2017, runtime: 164, director: 'Denis Villeneuve',     poster: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg' },
  moonlight:      { id: 15, tmdbId: 376867, title: 'Moonlight',               year: 2016, runtime: 111, director: 'Barry Jenkins',        poster: '/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg' },
  in_bruges:      { id: 16, tmdbId:   8321, title: 'In Bruges',               year: 2008, runtime: 107, director: 'Martin McDonagh',      poster: '/vz3Vd6nfq9YZrVvyYx5RHFaYKV3.jpg' },
};
export const POSTER = (key) => TMDB(FILMS[key].poster);

export const HP = {
  bg:'#000000', bgDeep:'#06060a',
  panel:'rgba(255,255,255,0.04)',
  border:'rgba(255,255,255,0.08)', borderStrong:'rgba(255,255,255,0.14)',
  text:'#FAFAFA', textSoft:'rgba(250,250,250,0.72)', textMuted:'rgba(250,250,250,0.45)', textFaint:'rgba(250,250,250,0.28)',
  purple:'#A78BFA', purpleDeep:'#7C3AED', pink:'#EC4899', amber:'#F59E0B',
};
export const HP_GRAD = 'linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)';

export const USER = { name:'Aditya', watched: 7 };

export const MOODS = [
  { id:'tender',     label:'Tender',     hex:'#F59FA8', tint:'pink',
    pool:['past_lives','her','before_sunrise','moonlight','call_me'],
    rationale:{ past_lives:'Two-handers, slow-burning, often bittersweet — your three deepest signals.', her:"Closest to Past Lives in the catalog. You haven't logged Spike Jonze yet.", before_sunrise:'Pure two-hander. The Linklater foundation for everything tender.', moonlight:"Quiet endings — a motif you've returned to four times.", call_me:'Sun-drenched, aching. Your aesthetic in summer.' } },
  { id:'thrilled',   label:'Thrilled',   hex:'#EF4444', tint:'pink',
    pool:['parasite','oldboy','whiplash','drive','the_handmaiden'],
    rationale:{ parasite:'Tense, surprising, beautifully built — your highest-rated thriller.', oldboy:'Park Chan-wook again. You loved The Handmaiden.', whiplash:'Intense, driven. 106 minutes of held breath.', drive:'Slow-burn, cool. A different kind of thrill.', the_handmaiden:'Sumptuous, twisty. Your kind of trap.' } },
  { id:'curious',    label:'Curious',    hex:'#A78BFA', tint:'purple',
    pool:['arrival','blade_2049','her','parasite','spirited'],
    rationale:{ arrival:'Contemplative sci-fi. Big idea, quiet pace.', blade_2049:'Vast, lonely. 164 patient minutes.', her:"Sci-fi that's really about loneliness.", parasite:'Class tension is one of your recurring motifs.', spirited:'Magical, gentle. Curiosity in pure form.' } },
  { id:'cozy',       label:'Cozy',       hex:'#FBBF24', tint:'amber',
    pool:['paddington','amelie','spirited','before_sunrise','her'],
    rationale:{ paddington:'When in doubt, choose kindness. Universally beloved.', amelie:'Whimsical, bright. Joy, concentrated.', spirited:'No bad mood survives Miyazaki.', before_sunrise:'Two people, one night, talking. Cozy in disguise.', her:'Soft melancholy. The cozy edge of sad.' } },
  { id:'melancholy', label:'Melancholy', hex:'#7DD3FC', tint:'indigo',
    pool:['past_lives','her','moonlight','call_me','blade_2049'],
    rationale:{ past_lives:'A love letter to roads not taken.', her:'Melancholy, soft. Loneliness rendered tender.', moonlight:'Three chapters, three silences.', call_me:'Sun-drenched ache. The ending alone.', blade_2049:'Lonely as architecture. Vast, patient, cold.' } },
  { id:'witty',      label:'Witty',      hex:'#34D399', tint:'purple',
    pool:['in_bruges','parasite','amelie','oldboy','paddington'],
    rationale:{ in_bruges:'Dark, funny. Pure McDonagh.', parasite:"The funniest thriller you've seen.", amelie:'Wit as warmth. French and pointed.', oldboy:'Twisted comedy of cruelty.', paddington:'Sweetly arch. Hugh Grant alone is worth it.' } },
];

export const SLOT_LABELS = {
  tender:["Tonight's pick","Mood match","From your DNA"],
  thrilled:["Tonight's pick","Highest signal","Director match"],
  curious:["Tonight's pick","Slow-thinking","From your DNA"],
  cozy:["A soft choice","Pure comfort","Quietly funny"],
  melancholy:["Tonight's pick","Earns its silence","Beautifully sad"],
  witty:["Tonight's pick","Sharp & quick","From your DNA"],
};

export const CONTINUE = { film:'blade_2049', progress:0.42, timeLeft:'1h 35m left', lastWatched:'Tuesday' };
export const RECENT = [
  { key:'parasite',   rating:5, when:'2 days ago',  note:'Held my breath the whole second act.' },
  { key:'spirited',   rating:4, when:'last Friday', note:null },
  { key:'paddington', rating:5, when:'last week',   note:'Healed something.' },
  { key:'whiplash',   rating:4, when:'last week',   note:null },
];
export const DNA = {
  progress:0.23, filmsLogged:7, filmsToNext:3,
  topMoods:[{label:'Tender',weight:0.84},{label:'Slow-burn',weight:0.71},{label:'Curious',weight:0.52}],
  directors:['Bong Joon-ho','Patterns forming…'],
  runtime:{value:'108',unit:'min',note:'shorter than average'},
  motifs:['Quiet endings','Class tension','Two-handers'],
};
export const FRIENDS = [
  { name:'Marco', match:87, avatarBg:'#A78BFA', last:'Past Lives', lastWhen:'2d', overlap:'Both loved Parasite, Whiplash' },
  { name:'Priya', match:79, avatarBg:'#F59FA8', last:'Whiplash',   lastWhen:'5d', overlap:'Both loved Spirited Away' },
  { name:'Theo',  match:64, avatarBg:'#7DD3FC', last:'Drive',      lastWhen:'1w', overlap:'Crime/thriller overlap' },
];
export const LISTS = [
  { id:'silences',         title:'Films that earn their silences',  count:6, cover:'past_lives',     blurb:'When dialogue stops, meaning begins.', palette:['#7C3AED','#1e1b4b'] },
  { id:'bad-days',         title:'For when the day was a lot',      count:5, cover:'paddington',     blurb:"Soft, kind, no surprises you don't want.", palette:['#F59E0B','#451a03'] },
  { id:'romance-skeptics', title:'Romance for skeptics',            count:7, cover:'before_sunrise', blurb:'Talky, tender, never saccharine.',     palette:['#EC4899','#831843'] },
  { id:'made-you-think',   title:"You'll think about for a week",   count:8, cover:'arrival',        blurb:'Big ideas with patience to match.',     palette:['#06B6D4','#164e63'] },
];
export const META = { issueNum:'012', volume:'I', edition:`For ${USER.name}` };

// Deterministic poster fallback gradient
const FILM_GRADIENTS = [
  ['#7C3AED','#1e1b4b'],['#EC4899','#831843'],['#F59E0B','#451a03'],['#10B981','#064e3b'],
  ['#3B82F6','#1e3a8a'],['#EF4444','#7f1d1d'],['#A78BFA','#312e81'],['#06B6D4','#164e63'],
  ['#F472B6','#500724'],['#FBBF24','#78350f'],['#34D399','#14532d'],['#60A5FA','#172554'],
  ['#C084FC','#581c87'],['#FB923C','#7c2d12'],['#A3E635','#365314'],['#F87171','#7f1d1d'],
];
export const gradFor = (key) => FILM_GRADIENTS[(FILMS[key]?.id ?? 0) % FILM_GRADIENTS.length];
