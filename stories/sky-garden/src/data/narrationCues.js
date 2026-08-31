// Watering-can narrator cues (Phase 6: "narration belongs to the watering
// can. Playful, observant, never sarcastic at the gardener's expense").
// Chapter-addressed; one line per chapter boundary crossing. Clips land
// in public/audio/narration/sky-garden/ (module-local; the integration
// line mirrors them to the repo-root public for the whole-site build).
export const NARRATION_CUES = [
  [{ id: 'sg-nursery', file: 'nursery.mp3', caption: "I've been waiting by the dry taps, little gardener. Whatever you find today — water it well." }],
  [{ id: 'sg-seed', file: 'seed.mp3', caption: 'One drop for the seed, one breath for the vine. Bridges are just roots that decided to cross.' }],
  [{ id: 'sg-wind', file: 'wind.mp3', caption: 'The wind moves the islands, not the path. Watch the ribbons and let the gust do the carrying.' }],
  [{ id: 'sg-orchard', file: 'orchard.mp3', caption: 'Thunder fruit keeps the storm in a pod. Catch it gently — the rain inside is still asleep.' }],
  [{ id: 'sg-sun', file: 'sun.mp3', caption: 'Even the sun wants the garden to last. Plant in the light, but never without a shade of cloud.' }],
  [{ id: 'sg-rain', file: 'rain.mp3', caption: "Open the valve and let the world drink. A garden's last job is to give the water back." }]
];
