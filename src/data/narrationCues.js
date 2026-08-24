export const PROLOGUE = {
  id: 'prologue',
  file: 'prologue.mp3',
  caption: 'On this coast, the sea takes one memory from every sailor who leaves. I keep their names.'
};

// Short foreground lines fit the reversible scroll format better than a
// continuous linear voice track. Each is eligible once per session after its
// local story milestone is crossed; visuals remain fully intelligible muted.
export const CHAPTER_CUES = [
  [{ id: 'harbor-count', at: 0.27, file: 'harbor-count.mp3', caption: 'Every evening, I counted the names before I lit the lamp.' }],
  [{ id: 'first-name', at: 0.58, file: 'first-name.mp3', caption: 'Elias Rune did not fade. He was taken.' }],
  [{ id: 'storm-haul', at: 0.52, file: 'storm-haul.mp3', caption: 'The sea did not want the boat. It wanted the book.' }],
  [{ id: 'wreck-memory', at: 0.76, file: 'wreck-memory.mp3', caption: 'Nothing it takes is ever truly gone.' }],
  [{ id: 'beacon-light', at: 0.77, file: 'beacon-light.mp3', caption: 'A name spoken into light can still find the shore.' }],
  [{ id: 'dawn-release', at: 0.48, file: 'dawn-release.mp3', caption: 'I did not keep them. I carried them home.' }]
];
