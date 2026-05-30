// Posters render at <=240px wide on the landing — w342 is the right TMDB size.
const TMDB=(p)=>`https://image.tmdb.org/t/p/w342${p}`;

export const PICKS=[
  {title:'Past Lives',year:2023,runtime:'1h 45m',dir:'Celine Song',poster:TMDB('/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg'),mood:'Tender',moodHex:'#F472B6',why:'Two strangers in a New York bar — but they were children once, in Seoul. A slow ache that lives in glances.'},
  {title:'Parasite',year:2019,runtime:'2h 12m',dir:'Bong Joon-ho',poster:TMDB('/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'),mood:'Tense',moodHex:'#EF4444',why:'A grift becomes architecture. Bong builds his cage room by room until the gate clicks shut.'},
  {title:'Her',year:2013,runtime:'2h 6m',dir:'Spike Jonze',poster:TMDB('/eCOtqtfvn7mxGl6nfmq4b1exJRc.jpg'),mood:'Bittersweet',moodHex:'#FB7185',why:'Near-future Los Angeles. A man falls for an operating system. Tender, lonely, alive in every frame — Phoenix at his most undone.'},
  {title:'Interstellar',year:2014,runtime:'2h 49m',dir:'Christopher Nolan',poster:TMDB('/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'),mood:'Mythic',moodHex:'#0EA5E9',why:'A father leaves Earth to save it. Time bends around love. Nolan at his largest scale and his most tender.'},
  {title:'PK',year:2014,runtime:'2h 33m',dir:'Rajkumar Hirani',poster:TMDB('/uqoAHhuKZnWxzXbXSUycgpLPmUW.jpg'),mood:'Thoughtful',moodHex:'#FBBF24',why:'An alien lands in Rajasthan and starts asking questions no priest can answer. Aamir Khan, wide-eyed, dismantling certainty.'},
  {title:'The Truman Show',year:1998,runtime:'1h 43m',dir:'Peter Weir',poster:TMDB('/vuza0WqY239yBXOadKlGwJsZJFE.jpg'),mood:'Restless',moodHex:'#34D399',why:'A man discovers his entire life is a televised set. Jim Carrey, unsettlingly tender, pushing against the walls of a manufactured world.'},
];
