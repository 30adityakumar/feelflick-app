// /people v2 — data.

export { HP, HP_GRAD } from '@/shared/lib/tokens'

export const USER = { name:'Aditya', following:24, followers:31, taste:'Patient class-coded thrillers' };

// "Twins" — strongest taste matches
export const TWINS = [
  { id:1, name:'Marco Reyes',    handle:'@marco',    initial:'M', match:87, films:142, mood:'Slow-burn obsessed',     overlap:['Parasite','Past Lives','Whiplash'], avatarBg:'#A78BFA', recent:'Past Lives · 5★ · 2d', following:true,  bio:'Tarkovsky apologist. Spreadsheet of every long take.' },
  { id:2, name:'Priya Shah',     handle:'@priya',    initial:'P', match:79, films:218, mood:'Late-night cerebral',    overlap:['Arrival','Her','Drive'],            avatarBg:'#F472B6', recent:'Arrival · 5★ · 5d', following:true,  bio:'Sci-fi mostly. Will fight you about Tenet.' },
  { id:3, name:'Theo Lin',       handle:'@theo',     initial:'T', match:64, films:91,  mood:'Crime + thriller',       overlap:['Drive','Oldboy'],                   avatarBg:'#7DD3FC', recent:'Drive · 4★ · 1w',   following:false, bio:'Refn is a religion. Don\u2019t @ me.' },
  { id:4, name:'Jules Carter',   handle:'@jules',    initial:'J', match:58, films:64,  mood:'Festival darlings',      overlap:['Past Lives','Aftersun'],            avatarBg:'#FBBF24', recent:'Aftersun · 5★ · 1w',following:true,  bio:'Sundance to Cannes. Will recommend you something quiet.' },
];

// "On the rise" — newer matches, less data
export const RISING = [
  { id:5, name:'Soren Vale',  handle:'@soren', initial:'S', match:71, films:18,  mood:'Building taste',   avatarBg:'#34D399', recent:'Spirited Away · 4★ · 3d', following:false },
  { id:6, name:'Mira Day',    handle:'@mira',  initial:'M', match:68, films:42,  mood:'Hopeful & warm',   avatarBg:'#F59FA8', recent:'Paddington 2 · 5★ · 4d',  following:false },
  { id:7, name:'Anya Vossen', handle:'@anya',  initial:'A', match:62, films:106, mood:'Foreign films',    avatarBg:'#C084FC', recent:'In the Mood · 5★ · 1w',   following:false },
];

// Friend activity feed
export const ACTIVITY = [
  { who:'Marco', whoBg:'#A78BFA', action:'rated', film:'Past Lives',          rating:5, when:'2 hours ago', note:'I keep returning to the airport scene. Five stars holds.' },
  { who:'Priya', whoBg:'#F472B6', action:'added to watchlist', film:'Decision to Leave', when:'5 hours ago' },
  { who:'Marco', whoBg:'#A78BFA', action:'rated', film:'Whiplash',            rating:5, when:'Yesterday', note:'Re-watch. Still my favorite ending.' },
  { who:'Theo',  whoBg:'#7DD3FC', action:'started a list',    film:'Refn-coded',         when:'Yesterday', sub:'8 films · public' },
  { who:'Jules', whoBg:'#FBBF24', action:'rated', film:'Aftersun',            rating:5, when:'2 days ago' },
];

// Top crew / actors among friends
export const CREW_OVERLAP = [
  { name:'Park Chan-wook', friends:12, you:'5\u2606 avg · 6 films' },
  { name:'Bong Joon-ho',   friends:15, you:'4.8\u2606 avg · 5 films' },
  { name:'Wong Kar-wai',   friends:8,  you:'5\u2606 avg · 3 films' },
  { name:'Lee Chang-dong', friends:6,  you:'4.5\u2606 avg · 2 films' },
];

// People you might also know
export const SUGGESTED = [
  { name:'Lex Park',  handle:'@lex',  initial:'L', mutuals:5, mood:'Slow-burn', avatarBg:'#C084FC' },
  { name:'Maya Doe',  handle:'@maya', initial:'M', mutuals:4, mood:'Cerebral',  avatarBg:'#7DD3FC' },
  { name:'Iris Ng',   handle:'@iris', initial:'I', mutuals:3, mood:'Tender',    avatarBg:'#F472B6' },
];

