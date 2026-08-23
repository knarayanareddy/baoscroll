# The Lighthouse That Remembered Names

A scroll-driven cut-paper sea fable, rendered in real time.

A lighthouse keeps a book of every sailor the coast has sent out. When the sea
begins taking the names back — one word at a time, out of the page — the keeper
has to turn the lamp into something that can carry them home.

Everything you see is generated at runtime. There are no image, model or audio
files in the repository: textures are painted into canvases at boot, geometry is
assembled from primitives by a shared "paper kit", and the ambience is
synthesised with the Web Audio API.

## The six chapters

Each chapter is a distinct spatial proposition, not a re-skin of the last one.

| # | Chapter | Shape of the shot |
|---|---|---|
| I | Harbor at Dusk | long horizontal read across a working harbour |
| II | The First Name | a closed circle; the camera ends on a macro insert of one line of handwriting |
| III | The Storm Wall | exposed and vertical, camera at dock level under a moving surface |
| IV | What the Water Kept | the only descent — a corridor the reader falls through |
| V | The Lamp Rekindled | a climb, then a rotation; the beam sweep becomes the transition |
| VI | Birds of Morning | the only pull-out; the story ends further away than it started |

## Design rules

Three rules hold across every chapter, and most of the art direction follows
from them:

- **Gold means memory.** It is never ambient decoration. It appears when a name
  is recovered, held or given back, and nowhere else.
- **Blue is physical.** Sea, glass, rain — things that are actually there.
- **Ink is threat.** The erasure, the storm wall, the sea's own face.

The chapter transitions carry the same idea: the first three boundaries close
over in progressively colder ink as the story descends, and the last two open in
gold and then in dawn.

## Scrubbing

The whole story is a pure function of scroll progress. Every pose, prop, light
and particle is evaluated from `(progress, time)` with no accumulated state, so
scrolling backwards runs the story backwards exactly — the ink returns to the
page, the rope goes taut again, the birds fold back into names.

## Accessibility

- Every chapter narrates its beats to an ARIA live region as the reader scrolls,
  so the story is followable without seeing it.
- `prefers-reduced-motion` scales down every animation, suppresses camera roll
  entirely, and calms the lightning.
- A static, fully written fallback renders if WebGL is unavailable.
- Instance counts for rain, foam, silt and flocks scale to a detected device tier.

## Development

```bash
npm install
npm run dev      # vite dev server
npm run build    # production build
npm run preview  # serve the build
```

### Smoke test

`scripts/smoke.mjs` drives the entire story in headless Chrome — down and then
back up — and fails on any console error, page error or failed request. This
catches a typo in a scene that only appears at 80% scroll before a reader does.

```bash
npm run build
npm run preview &
node scripts/smoke.mjs                 # pass/fail
SMOKE_SHOTS=1 node scripts/smoke.mjs   # also writes frames to shots/
```

## Stack

Vite, Three.js, GSAP ScrollTrigger and Lenis.
