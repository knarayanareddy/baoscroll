// Single source of truth for the story timeline and the color journey.

export const CHAPTERS = [
  {
    index: 0,
    id: 'harbor',
    numeral: '一',
    title: 'Harbor at Dusk',
    caption: 'At dusk, the keeper opens the book of names.',
    vh: 720
  },
  {
    index: 1,
    id: 'first-name',
    numeral: '二',
    title: 'The First Name',
    caption: 'Elias Rune vanishes from a page that has held for a hundred years.',
    vh: 640
  },
  {
    index: 2,
    id: 'storm-wall',
    numeral: '三',
    title: 'The Storm Wall',
    caption: 'The sea rises in a wall of rain and asks the lighthouse to forget.',
    vh: 840
  },
  {
    index: 3,
    id: 'wrecks',
    numeral: '四',
    title: 'What the Water Kept',
    caption: 'Beneath the waves, stolen memories drift among the wrecks.',
    vh: 700
  },
  {
    index: 4,
    id: 'beacon',
    numeral: '五',
    title: 'The Lamp Rekindled',
    caption: 'The keeper turns its lamp into a vessel for every spoken name.',
    vh: 780
  },
  {
    index: 5,
    id: 'dawn',
    numeral: '六',
    title: 'Birds of Morning',
    caption: 'At dawn, the names leave as birds and find the living shore.',
    vh: 880
  }
];

// Normalized [start, end) scroll ranges for each chapter.
export function chapterRanges() {
  const total = CHAPTERS.reduce((s, c) => s + c.vh, 0);
  let acc = 0;
  return CHAPTERS.map((c) => {
    const start = acc / total;
    acc += c.vh;
    return { start, end: acc / total };
  });
}

// Color journey (from the visual bible):
// mineral dusk blue -> lamplit interior with red ink -> ink-black storm
// -> drowned teal with gold memory -> brass and lamp-gold -> peach dawn.
//
// Three rules hold across every chapter:
//   gold  = memory, beacon, restoration (never ambient decoration)
//   blue  = physical sea or glass
//   ink   = threat and loss
export const PALETTES = {
  harbor: {
    bg: '#3b6c84',
    fog: '#789ba0',
    paper: '#efe2c8',
    paperShade: '#d7c4a3',
    wood: '#6b4b3c',
    woodDark: '#4c382f',
    sea: '#276b7a',
    seaDeep: '#17414f',
    coral: '#b8584b',
    window: '#ffd782',
    ink: '#182b32'
  },
  firstName: {
    bg: '#243843',
    fog: '#526a70',
    timber: '#6b4b3c',
    timberDark: '#4a352b',
    paper: '#ecdfc5',
    glass: '#83a9ad',
    rain: '#b8dcda',
    redInk: '#8c3940',
    brass: '#c69a54',
    ink: '#101c27'
  },
  storm: {
    bg: '#101d29',
    fog: '#2e4856',
    inkDeep: '#0b1a24',
    inkWall: '#0e2736',
    swell: '#194859',
    foam: '#b7d3d0',
    rope: '#c2a071',
    rain: '#9fc4c6',
    ember: '#ffd27a'
  },
  wrecks: {
    bg: '#0b3444',
    fog: '#1d5464',
    abyss: '#062430',
    water: '#12586a',
    silt: '#2c4b4e',
    hull: '#34302a',
    gold: '#f1bb63',
    memory: '#ffe6ab',
    paper: '#e6d8bb'
  },
  beacon: {
    bg: '#192d38',
    fog: '#41626b',
    timber: '#6d513b',
    timberDark: '#4c382f',
    brass: '#bf8d43',
    brassDark: '#8a6329',
    glass: '#9fc3c4',
    gold: '#ffd47b',
    core: '#fff5c9',
    ink: '#0e1a22'
  },
  dawn: {
    bg: '#e5a576',
    fog: '#eac08f',
    peach: '#efad76',
    cream: '#f7e2bd',
    sea: '#6ba5ae',
    seaDeep: '#3d7f8b',
    paper: '#f2e3c4',
    coral: '#b75c4b',
    gold: '#ffd680',
    bird: '#513a35'
  }
};

// Width (in global progress units) of the ink wipe at chapter boundaries.
export const TRANSITION_WIDTH = 0.012;
