# Bao forensic study — the standard Lighthouse must meet

> **Historical.** This teardown was written against the first Lighthouse build,
> which was a re-skin of the Bao reference. It is kept because it is the brief
> that drove the rebuild — the six chapters, the Keeper pose API, the antagonist
> and the paper kit all exist because of the gaps named here. Statements below
> about "the current build" describe that earlier state, not this one.

## Purpose

This is not an inspiration board. It is a code-and-experience teardown of the Bao reference implementation, written before further Lighthouse art work. The current Lighthouse build fails this standard because it has backdrop art and set dressing, but no protagonist with agency, no interaction grammar, and no chapter-specific traversal.

## Review disciplines

| Discipline | Question | Bao finding | Lighthouse consequence |
|---|---|---|---|
| Creative direction | What is the reader emotionally watching? | A young hero moves through a changing fable, not through color palettes. | The keeper needs a visible job, body language, obstacles, and resolution. |
| Character animation | Does the protagonist act on the world? | Bao has a pose API for walk, run, jump, fall, climb, sit, breathe, and a scroll-fragment prop. | Build a `Keeper` puppet with idle, page-turn, brace, run, climb-stairs, lamp-light, and release-birds poses. |
| Scene design | Does every chapter introduce a new place/action? | Six independently authored scene classes have unique set geometry and effects. | Remove the shared recolored lighthouse set. Build six dedicated Lighthouse scene classes. |
| Camera | Does the camera tell the action? | Every chapter owns an explicit keyframe camera path via `evalPath`; FOV/roll are deliberate story beats. | Camera must move from harbor-wide, to intimate book close-up, to storm-wide, to dive, to lantern interior, to dawn pullback. |
| Effects | Do effects respond to story motion? | Ink spreads, particles, parallax, transition wipe, and water shader are all tied to chapter-local progress. | Rain, fog, rising sea, ink erasure, bubbles, beam dust, and birds must have progress windows—not idle looping decoration. |
| Transitions | Is a chapter boundary an event? | `TransitionManager` uses an ink bell curve: scene swap happens while fully covered. | The lighthouse beam sweep must mask scene changes; it cannot simply cut between palettes. |
| Sound | Does sound change narrative state? | Procedural ambience is chapter-aware, opt-in, paused with story time, and punctuated by chimes. | Build harbor creak/gulls, rain/thunder, submerged muffling, Fresnel hum, and birds/dawn into `AudioController`. |
| Performance | Can the cinematic world run on weaker devices? | Lazy chapter builds, pooled particles, instancing, cached materials, and three quality tiers are systemic. | Lighthouse must use the existing lifecycle and only introduce assets that have low/mobile fallbacks. |
| Accessibility | Does the interaction remain controllable? | Semantic long sections, fallback, reduced-motion, UI controls and chapter navigation are integrated. | Lighthouse needs a transcript/read mode plus reduced-motion versions of storm, dive, and beam sequences. |

---

## 1. What Bao does structurally

Bao is a fixed WebGL canvas above six tall native sections. Lenis owns the document scroll; the GSAP ticker drives Lenis; `Experience.tick()` converts global progress to a chapter index and chapter-local progress.

```text
native scroll
  -> Lenis progress
  -> Experience.chapterAt(progress)
  -> activeScene.update(localProgress, storyTime, dt)
  -> camera + hero pose + world effects + transition overlay
```

The critical rule is **no irreversible event state**. A jump, splash, impact, or reveal is represented by a function of `localProgress`. Reverse scroll is therefore a legitimate reverse film, not a reset-prone animation sequence.

Relevant source units in the Bao reference:

- `core/Experience.js`: orchestration, lazy build, active-scene render loop.
- `core/ScrollController.js`: Lenis/GSAP bridge.
- `core/Camera.js`: camera smoothing, pointer sway, roll, FOV.
- `characters/Bao.js`: poseable, reusable hero puppet.
- `scenes/*.js`: individually authored chapters.
- `effects/TransitionManager.js`: boundary masking.
- `effects/PaperParticleSystem.js`: shared pooled atmosphere.
- `shaders/*`: art-direction-specific water and ink surfaces.

## 2. Why Bao feels rich

### 2.1 It has a hero in the frame

Bao is not scenery. The reader continually tracks a recognizable silhouette: small, light/dark, gestural, and legible at a distance. Story beats are physical: run, jump, shield, chase, climb, rest, transform.

The Lighthouse prototype has no equivalent. The first non-negotiable correction is a keeper character—not a distant static silhouette.

### 2.2 The hero changes the environment

Bao's local-progress actions are causal. Character pose, camera path, particles, props, lights, and overlays change together. The story has verbs.

Lighthouse must have verbs:

| Chapter | Keeper verb | Environmental response |
|---|---|---|
| Harbor | records / tends | windows wake, tide glitters, beacon turns slowly |
| First Name | reaches / tries to hold | ink spreads and page fibres lift into wind |
| Storm Wall | runs / braces / ties | ropes strain, rain lashes glass, water breaches dock |
| Wrecks | descends / swims through memory | letters open, objects glow, current moves the body |
| Beacon | climbs / ignites | Fresnel rings align, names rise, beam cuts the storm |
| Dawn | releases / watches | birds form from ink, harbor regains movement |

### 2.3 Each Bao chapter has a different spatial proposition

Paper Valley is a broad intro; Ink Storm compresses threat; Bamboo Forest gives lateral speed; River changes viewpoint and fluidity; Temple turns vertical; finale releases into space.

The Lighthouse equivalent spatial sequence must be:

1. wide horizontal harbor;
2. intimate circular lantern room;
3. exposed dock and vertical water wall;
4. descending underwater wreck corridor;
5. spiral lighthouse stair and lens chamber;
6. aerial dawn pullback across the whole restored coast.

### 2.4 Bao uses material changes, not just color changes

Paper, ink, cutout, watercolor, torn edge, and glow have different geometry and shader behavior. A scene feels handcrafted because surface behavior changes.

Lighthouse material vocabulary:

- salt-stained paper for architecture;
- translucent wet glass for lantern room;
- black ink-water for storm;
- suspended letter fibres and watercolor caustics underwater;
- brass, prismatic glass, gold dust for the Fresnel lamp;
- dry warm paper and feather-like brush marks at dawn.

---

## 3. Required Lighthouse replacement architecture

Do not extend the current generic `LighthouseScenes.js` further. Replace it with these units:

```text
characters/
  Keeper.js                 # articulated paper puppet and pose API
props/
  KeepingBook.js            # page, ink erasure, name glyph systems
  FresnelLamp.js            # rotating rings, glass, beam and name release
scenes/
  HarborDuskScene.js
  FirstNameScene.js
  StormWallScene.js
  WreckMemoriesScene.js
  BeaconScene.js
  BirdsDawnScene.js
effects/
  RainSheet.js
  SeaSurface.js
  FogVolume.js
  BeamTransition.js
  MemoryLetterSystem.js
shaders/
  seaVertex.glsl
  seaFragment.glsl
  wetInkFragment.glsl
  glassFragment.glsl
```

### Shared story contracts

- Every scene extends `BaseScene` and has a strict `build / setVisible / update` lifecycle.
- Every `update(p, storyTime, dt)` uses progress windows (`smoothstep`, bell, arcs) rather than timers for story beats.
- `Keeper.setPose(name, amount)` is scene-independent.
- `FresnelLamp.setBeam(progress, power)` is the global chapter transition visual.
- The only cross-scene carryover props are keeper, book, lamp/name light, and the sea.

## 4. Shot map for the real Lighthouse film

### Chapter I — Harbor at Dusk (0.00–0.17)

**Camera:** broad establishing dolly from waterline to the keeper walking the dock.

**Action:** keeper checks mooring rope, takes book from a satchel, walks up toward lighthouse.

**Progress windows:**
- 0.00–0.25: sea reflection and title;
- 0.25–0.60: dock walk and village windows;
- 0.60–0.90: keeper reaches lens room; one distant wave darkens the horizon.

### Chapter II — The First Name (0.17–0.33)

**Camera:** passes through rain-streaked lantern glass into close interior.

**Action:** keeper turns a page; an ink name begins to dissolve; keeper grabs the page as letters pull upward into wind.

**Progress windows:**
- book opens;
- name shakes, blurs, separates into wet fibres;
- room goes dark as the beacon stutters;
- beam sweep masks transition to storm exterior.

### Chapter III — The Storm Wall (0.33–0.50)

**Camera:** low dock-level side track followed by a whip to the water wall.

**Action:** keeper runs through rain, ties a boat line, then braces against the beam as water breaches the dock.

**Progress windows:**
- rain density rises;
- dock flexes; rope tenses;
- storm wall appears in depth;
- a broken beam carves a temporary safe corridor.

### Chapter IV — What the Water Kept (0.50–0.66)

**Camera:** follows keeper/lantern light down through broken water surface.

**Action:** keeper swims or is carried past the wreck; touches letters; each contact reveals a short visual memory in a floating paper-glass bubble.

**Progress windows:**
- surface distortion transitions to submerged muffling;
- cards rotate/settle in current;
- wreck becomes visible through particulate fog;
- recovered names spiral toward lens above.

### Chapter V — The Lamp Rekindled (0.66–0.83)

**Camera:** ascends spiral stair behind keeper, then circles the Fresnel lamp.

**Action:** keeper climbs, inserts recovered name-light into lamp, turns a brass wheel. Rings align; names become beam particles.

**Progress windows:**
- stair climb;
- lamp ring mechanism rotates into alignment;
- light intensifies and breaks the storm;
- beam is the transition into dawn.

### Chapter VI — Birds of Morning (0.83–1.00)

**Camera:** begins beside keeper, then retreats through lamp glass to an aerial coast-wide view.

**Action:** names leave lamp as birds. Keeper does not “win” by keeping them; they fly into the returned village and sea.

**Progress windows:**
- storm drains away;
- first bird appears;
- flock sweeps across foreground;
- final wide frame, title/closing line.

## 5. Acceptance criteria before the next preview

Do not present another preview as the real art pass until all are true:

1. A visible keeper is present and animated in every chapter.
2. At least one unique environmental interaction exists in every chapter.
3. No chapter relies on palette swapping to communicate its identity.
4. Camera path changes spatial logic chapter-to-chapter.
5. Chapter transitions are beam-driven and reversible.
6. The story can be described through actions, not only aesthetics.
7. Mobile tier still renders the story coherently.
