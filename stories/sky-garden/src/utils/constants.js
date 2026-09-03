// Chapter table — order, names, propositions, beat lists and accent colors.
// Seed colors intentionally identify the future chapters (plan ch. I, .20-.50).
export const CHAPTERS = [
  {
    index: 0, numeral: 'I', title: 'The Dry Cloud Nursery', proposition: 'Find the last seeds',
    accent: '#d8c9a3', seed: '#c9a86a',
    beats: [
      [0, 0.2, 'Gardener walks the nursery beds — dry leaves curl; the reservoir drips once'],
      [0.2, 0.5, 'Opens the seed satchel — six seed colors identify the chapters ahead'],
      [0.5, 0.78, 'Waters the first seed — a root line appears through the cloud soil'],
      [0.78, 1, 'Follows the root to the edge — the root becomes the bridge transition']
    ]
  },
  {
    index: 1, numeral: 'II', title: 'The First Seed', proposition: 'Grow a bridge',
    accent: '#9fbf8f', seed: '#7fae6e',
    beats: [
      [0, 0.25, 'Plants the first seed at the island edge — the cloud soil darkens and wets'],
      [0.25, 0.55, 'Waters and guides the vine — it grows in visible segments across the void'],
      [0.55, 0.82, 'Crosses the growing bridge — flowers open beneath the feet'],
      [0.82, 1, 'Reaches the next island — wind begins destabilizing the path']
    ]
  },
  {
    index: 2, numeral: 'III', title: 'The Wind Maze', proposition: 'Cross moving islands',
    accent: '#8fb3c9', seed: '#5f93b8',
    beats: [
      [0, 0.24, 'Reads the wind ribbons — islands drift, kites pull at their anchors'],
      [0.24, 0.54, 'Grabs a kite sail — the wind lane becomes a traversable route'],
      [0.54, 0.8, 'Runs and floats across the path — fast scroll intensifies bend and spray'],
      [0.8, 1, 'Reaches the thunder orchard gate — distant thunder lights the branches']
    ]
  },
  {
    index: 3, numeral: 'IV', title: 'The Thunder Orchard', proposition: 'Harvest a storm',
    accent: '#7f8fb8', seed: '#5a6ea8',
    beats: [
      [0, 0.22, 'Enters the dry orchard — fruit glows faintly, branches sag'],
      [0.22, 0.55, 'Climbs the wet branch ladder — branches wake and grow leaves'],
      [0.55, 0.78, 'Catches the thunder fruit — lightning travels through the felt veins'],
      [0.78, 1, 'Opens the fruit over the cloud reservoir — local rain begins, the sun retreats']
    ]
  },
  {
    index: 4, numeral: 'V', title: 'The Garden Meets the Sun', proposition: 'Ask the sky to soften',
    accent: '#e0b45e', seed: '#d99a3d',
    beats: [
      [0, 0.28, 'Approaches the hot terrace — plants bleach, heat distortion rises'],
      [0.28, 0.58, 'Protects the seed with a canopy — cloud and felt layers shade it'],
      [0.58, 0.82, 'Plants the final seed in sunlight — sun rays become root-like threads'],
      [0.82, 1, 'The seed blooms into a rain halo — heat becomes a warm-light transition']
    ]
  },
  {
    index: 5, numeral: 'VI', title: 'Rain Returns', proposition: 'Let the world drink',
    accent: '#8fa8bf', seed: '#6f93b8',
    beats: [
      [0, 0.25, 'Opens the final reservoir valve — the first rain bead falls'],
      [0.25, 0.58, 'Watches the garden respond — blooms, bridges, kites and orchard synchronize'],
      [0.58, 0.84, 'Rain crosses the cloud layer — the dry world below gains color and wet reflection'],
      [0.84, 1, 'The camera pulls away — the gardener stays small, the rain system continues']
    ]
  }
];
export const chapterRanges = () => CHAPTERS.map((c) => c.index);
// transition language per boundary (plan Phase 6 table)
export const TRANSITIONS = [
  { from: 0, to: 1, name: 'root-line',    accent: '#9fbf8f' }, // root line grows across paper
  { from: 1, to: 2, name: 'vine-ribbon',  accent: '#8fb3c9' }, // vine braid becomes wind ribbon
  { from: 2, to: 3, name: 'kite-leaf',    accent: '#7f8fb8' }, // kite cloth becomes thunder leaves
  { from: 3, to: 4, name: 'bead-lens',    accent: '#e0b45e' }, // rain bead becomes sun lens
  { from: 4, to: 5, name: 'thread-halo',  accent: '#8fa8bf' }  // sun thread becomes rain halo
];
