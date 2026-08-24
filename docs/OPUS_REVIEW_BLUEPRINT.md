# Lighthouse production blueprint
## Forensic review of the stronger upstream rebuild and the lessons for all future story sections

**Reviewed implementation:** `origin/main`, commit `51ef803d1f1d1a8407979baa6f05ff30bb7f0c49`  
**Reference method:** the Bao scroll-story architecture  
**Purpose:** document exactly why the stronger Lighthouse rebuild is a substantial improvement over the earlier incremental prototype, identify its remaining gaps, and establish a non-negotiable blueprint for future anthology stories.

---

# 1. Executive conclusion

The stronger rebuild succeeds because it changes the **unit of production**.

The weak approach treated a story chapter as a persistent generic scene plus additions:

```text
one generic world
+ a prop
+ a particle effect
+ a backdrop image
+ a color change
+ a camera tweak
```

The stronger approach treats a story chapter as a reversible authored film sequence:

```text
one spatial proposition
+ a character objective
+ an obstacle
+ a prop interaction
+ camera keyframes
+ a shared world response
+ a transition consequence
```

That distinction is the central reason the improved version feels materially more coherent.

The stronger version is not merely a reskin of Bao. It retains Bao's robust engine pattern while giving the Lighthouse story its own:

- protagonist: **the Keeper**;
- antagonist: **the Sea**;
- recurring stakes object: **the Keeping Book**;
- transformation machine: **the Fresnel Lamp**;
- recurring visual language: **salt-stained paper, wet timber, brass, rain glass, ink-water, gold name-light**;
- six distinct spatial/action propositions.

## Honest quality assessment

| Area | Earlier incremental prototype | Stronger rebuild | Aspirational final target |
|---|---:|---:|---:|
| Story / action clarity | 1/5 | 3.5/5 | 5/5 |
| Character integration | 1/5 | 3.5/5 | 5/5 |
| Environment coherence | 1/5 | 3.5/5 | 5/5 |
| Scroll reversibility | 3/5 | 4/5 | 5/5 |
| Scene-specific staging | 1/5 | 3.5/5 | 5/5 |
| Testability / production discipline | 0.5/5 | 3.5/5 | 5/5 |

The stronger rebuild should be treated as the canonical base for future work. It is an **interaction and world-production benchmark**, not yet the final visual ceiling.

---

# 2. The core methodological difference

## 2.1 Weak approach: additive prototype construction

The earlier approach had five persistent failures:

1. **Generic world reuse** — a similar lighthouse composition was reused across chapters, then tinted or decorated differently.
2. **Character afterthought** — the keeper was placed into scenes after environment geometry was made, rather than determining camera, paths, and contact points.
3. **Effects as compensation** — fog, glow, birds, caustics, and image backplates were added to compensate for weak composition.
4. **No visual validation loop** — a build passing was mistaken for a scene working.
5. **Local patches over system contracts** — each new issue generated an isolated patch rather than a shared capability.

The result was visually busy but not cinematically staged.

## 2.2 Strong approach: world-first, contract-first scene production

The stronger rebuild establishes shared contracts first:

```text
AssetLoader / paperKit  → art vocabulary
Keeper                  → hero action vocabulary
TheSea                  → threat / memory vocabulary
KeepingBook             → loss / recovery vocabulary
FresnelLamp             → transformation / release vocabulary
BaseScene               → lifecycle, quality tier, narration contract
Scene class             → chapter-specific spatial/action sequence
Smoke test              → full-story validation contract
```

This makes each scene authored without making each scene isolated.

---

# 3. Structural evidence from the implementation

## 3.1 Scene depth

The stronger rebuild gives every chapter a substantial, dedicated scene module.

| Module | Earlier prototype LOC | Stronger rebuild LOC | What the difference represents |
|---|---:|---:|---|
| `HarborDuskScene` | 44 | 370 | Harbor world, keeper routine, dock/rope/boat response, parallax and camera choreography |
| `FirstNameScene` | 29 | 277 | Closed lantern-room staging, desk/book interaction, rain glass, the Sea's intrusion |
| `StormWallScene` | 25 | 355 | Layered threat, rope/boat/dock action, weather, physical escalation |
| `WreckMemoriesScene` | 39 | 460 | Descent, wreck construction, memory/relic staging, underwater effects, keeper recovery action |
| `BeaconScene` | 78 | 343 | Stair climb, wheel/lamp mechanics, name-light routing, storm clearing, release handoff |
| `BirdsDawnScene` | 31 | 381 | Dawn restoration, name-to-bird release, living coast, final camera pull-out |

Line count is not a quality metric by itself. Here it is evidence that each scene now contains a real production payload: set construction, staging, camera logic, action windows, atmospheric systems, and quality-tier decisions.

## 3.2 Shared art factory

`src/utils/paperKit.js` grows into a genuine scene-production library.

It provides reusable authored set pieces such as:

- headlands;
- sea ridges;
- clouds;
- cottages;
- lighthouses;
- pilings;
- decks;
- dories;
- buoys;
- crates and barrels;
- nets and ropes;
- name cards and glyphs;
- gulls;
- hand lanterns;
- rocks;
- instanced paper shards, foam, rain, and motes.

### Why this matters

Without a shared art kit, each scene uses ad hoc primitives. That creates a visible mismatch in silhouette, material, scale, and density.

With a shared art kit, every new story section inherits a coherent visual grammar without becoming copy-paste scenery.

### Rule for future stories

Before any new chapter is built, add missing reusable set pieces to the story's art kit. Do **not** build one-off raw boxes or cylinders directly in scene code unless they are deliberately temporary blocking geometry.

---

# 4. Why the Keeper works better than the earlier character

## 4.1 The stronger Keeper is a scene API, not a mesh

The stronger `Keeper.js` is roughly 526 lines and exposes a deterministic action vocabulary.

Key characteristics:

- low-segment cut-paper construction matching the art world;
- deliberate silhouette: coat, cap, beard, scarf, lantern, book;
- hand and foot anchors;
- pose API with phase parameter `k`;
- force/secondary-motion API;
- lantern/book state control;
- deterministic time + local progress behavior;
- documented future glTF replacement path.

The important scene-facing pattern is:

```js
keeper.setPose('walk', time)
keeper.setPose('haul', time, phase)
keeper.setPose('reach', time, phase)
keeper.setPose('wheel', time, phase)
keeper.setForce(amount, time)
```

The earlier implementation had a collection of poses, but not a sufficient contract for scene choreography, force, anchors, or consistent prop relationships.

## 4.2 Character contact changes scene quality

A character near a rope is decoration.

A character with a hand anchor that hauls the rope while the boat, rope sag, camera, rain, and body force respond is an action beat.

The stronger rebuild uses anchors and action phases to move toward that relationship. Future work must finish the job with exact contact alignment / IK-like authoring where a hand, wheel, prop, foot, or rail is a focal point.

### Rule for future stories

Every key interaction must define:

```text
hero anchor
prop anchor
approach pose
contact pose
force/reaction pose
exit pose
```

Do not accept “character standing beside object” as an interaction.

---

# 5. Why The Sea is a critical addition

The stronger rebuild adds `src/characters/TheSea.js`.

This is more important than it first appears. The Sea becomes a persistent dramatic entity rather than a water material.

| Chapter | Sea role |
|---|---|
| Harbor | familiar lived environment |
| First Name | distant, intrusive presence beyond rain glass |
| Storm Wall | visible antagonist |
| Wreck | memory archive / pressure / current |
| Beacon | force being opened and transformed by light |
| Dawn | restored horizon and social world |

This produces continuity across chapters. The reader follows one changing force rather than six unrelated visual effects.

### Rule for future stories

Every anthology story should identify:

1. a protagonist;
2. an antagonistic or transformative world force;
3. one recurring emotional prop;
4. one recurring visual/material system.

Future stories should not build chapters as separate disconnected demos.

---

# 6. Why the stronger props work better

## 6.1 Keeping Book

The stronger `KeepingBook.js` treats ink erasure as material behavior:

```text
paper fibre noise
+ wet bleed front
+ dissolving ink
+ lifting flecks
+ reversible erase parameter
```

This is qualitatively better than changing text opacity.

The reader sees a name being physically drawn out of a page, which makes the premise legible without narration.

### Future prop rule

A central prop needs at least three layers:

1. **recognizable static form**;
2. **material-specific transformation**;
3. **scene-level causal effect**.

## 6.2 Fresnel Lamp

The stronger lamp has:

- brass cage;
- vellum/paper prism tiers;
- counter-rotation;
- wheel handles;
- visible gearing;
- core/halo/point-light behavior;
- scene-facing `setPower(power, time)` contract.

The key improvement is that the lamp reads as an object made of the same world materials. It is not a generic glowing sci-fi device.

### Future prop rule

For a transformation object, show the mechanical or magical linkage:

```text
hero action
→ visible mechanism
→ material transformation
→ light / world reaction
```

---

# 7. Scene staging: the biggest experiential leap

## 7.1 Harbor at Dusk

The stronger version has a horizontal spatial proposition:

```text
keeper routine
→ dock traversal
→ rope/boat interaction
→ lighthouse destination
```

The set supports the action: deck, pilings, net, rope, dory, cottages, headlands, clouds, gulls, motes, tower.

The earlier version had a dock and keeper, but the environment did not have enough authored density or a shared set vocabulary to make the harbor feel lived in.

## 7.2 The First Name

The stronger version changes the spatial grammar entirely:

```text
rain exterior
→ glass threshold
→ closed circular interior
→ desk/book close-up
→ lamp intrusion
```

The specific staging correction in the latest upstream commit is important: the camera was moved off-axis so a keeper hand enters frame rather than the back of the keeper's head blocking the book.

That is real cinematography debugging, not just camera movement.

## 7.3 Storm Wall

The stronger version treats the chapter as exposed action and vertical scale:

```text
keeper falls/kneels
→ hauls rope
→ braces
→ runs
```

It adds multiple weather and sea systems: ridges, foam, rain, spray, cloud banks, dock, rope, dory, tower, and The Sea.

The earlier version had a moving wall and rain, but the action was not dense enough to create a genuine threat sequence.

## 7.4 Wreck Memories

The stronger version begins above the water, penetrates the surface, and descends through a wreck. It uses cards, glyphs, relics, bubbles, silt, caustics, letters, self/Sea constructs, and a recovery pose.

The latest staging fixes corrected camera collision with wreck ribs and a caustic hotspot. That shows the scene has been tested as actual spatial cinema.

## 7.5 Beacon

The stronger Beacon is not merely “stairs and lamp.” It has a staged climb, wheel interaction, geared/prismatic lamp, name-light movement, beam motes, rain glass, exterior storm, village context, and a handoff to the finale.

## 7.6 Birds of Morning

The stronger final chapter expands rather than merely adding birds:

```text
storm recedes
→ names/glyphs release
→ birds inherit their paths
→ harbour resumes life
→ camera pulls outward
```

It includes cottages, boats, smoke, headlands, storm bank, dawn bands, lighthouse glass, lamp core, flock, and The Sea.

### Rule for future scenes

A scene must be defined by a unique **spatial proposition**, not a title or palette.

| Good definition | Weak definition |
|---|---|
| “Camera descends through an angled wreck corridor while the hero retrieves objects.” | “Underwater chapter.” |
| “Hero crosses an exposed dock while an object creates tension across the frame.” | “Storm chapter.” |
| “Camera moves through rain glass into a closed room and lands on a hand/page contact.” | “Book chapter.” |

---

# 8. Camera methodology

The improved work shows that camera paths are a first-class scene system.

Each scene should define:

```text
establishing shot
→ action setup
→ contact/impact insert
→ reaction / consequence shot
→ transition composition
```

## Required camera checks

Before a scene can pass review:

- Does the camera see the hero's face/hand when that matters?
- Is the focal prop unobstructed?
- Is the camera outside all collision geometry?
- Does foreground, midground, and background read at the key beat?
- Does a wide shot arrive only after action has earned it?
- Does the transition frame clearly hand off to the next chapter?

The upstream headless scrub discovered exactly these failures: floating village, undersized lantern room, camera inside wreck, keeper blocking book, keeper blocking wheel shot. Those errors are common and must be expected.

---

# 9. Material and effect methodology

## Material hierarchy

The stronger version works because materials correspond to narrative meaning.

| Material | Narrative meaning | Primary use |
|---|---|---|
| Salt paper | place, memory, craft | cottages, lighthouse, cards, sets |
| Wet timber | work, harbor, resistance | docks, boats, pilings, desk |
| Rain glass | threshold, isolation | First Name and Beacon |
| Ink water | loss, Sea threat | storm / erasure / transition |
| Gold name-light | recovered identity | book, memory, lamp, birds |
| Brass | mechanism, responsibility | wheel, Fresnel housing, lantern |
| Peach/cream dawn | release | final coast and birds |

## Effect rules

Every effect must have one of these roles:

1. clarify physical force;
2. reveal material behavior;
3. create depth;
4. signify emotional state;
5. mask a scene handoff.

Do not add effects merely to make a sparse scene feel busier.

---

# 10. Quality tiers and performance discipline

The stronger build consistently uses tiered counts inside scenes:

```js
this.tiered(highCount, mediumCount, lowCount)
```

This affects weather, birds, shards, smoke, foam, silt, bubbles, and other repeated detail.

It also adds:

```text
?quality=low|medium|high
```

This is useful for:

- low-end visual QA;
- headless/software-GL smoke testing;
- manual debugging;
- mobile fidelity decisions.

### Rule for future work

No repeated-object system may be added without declaring its high, medium, and low counts.

Example:

```text
high: 80 gulls / medium: 48 / low: 24
high: 420 rain drops / medium: 240 / low: 120
high: 56 wreck shards / medium: 34 / low: 18
```

Avoid runtime allocation inside frame loops. Reuse vectors, matrices, particle pools, and cached materials.

---

# 11. Validation: the biggest process improvement

The stronger rebuild adds `scripts/smoke.mjs`.

It:

1. launches a headless browser;
2. loads the production story at forced low quality;
3. waits for the loader;
4. rejects WebGL fallback;
5. scrolls through all chapters;
6. optionally captures screenshots;
7. reverse-scrubs upward;
8. collects console errors, page errors, and failed requests;
9. reports scene build state and draw calls.

## Required future validation loop

```text
implement scene
→ npm run build
→ start production preview
→ npm run smoke
→ capture chapter keyframe screenshots
→ inspect composition / collisions / hero contact
→ fix
→ repeat
```

## Required CI improvement

The smoke script currently assumes a Chrome binary exists. CI must explicitly install it before smoke runs:

```bash
npx puppeteer browsers install chrome
npm run smoke
```

The GitHub workflow should add:

```text
npm ci
npm run build
npx puppeteer browsers install chrome
npm run smoke
```

A future visual-regression layer should compare fixed screenshots at chapter milestones against approved baselines.

---

# 12. Remaining gaps in the stronger rebuild

The stronger rebuild is substantially better, but it is not finished production quality.

## 12.1 Art fidelity

The experience is still largely procedural stand-in art.

Highest-value future upgrades:

- scanned handmade paper texture packs;
- painted alpha masks for torn edges and cloud/spray forms;
- detailed painted timber and brass texture atlas;
- rigged keeper glTF or a higher-detail 2.5D puppet;
- recorded ambience and character narration;
- custom brush display font.

## 12.2 Character contact

The Keeper has anchors and better action contracts, but focal moments still need more precise hand/foot alignment:

- rope hand to rope contact;
- page hold to book edge;
- memory reach to card/core;
- wheel hand to wheel handle;
- stair foot placement;
- coat/scarf deformation under force.

The target is not necessarily full physics/IK. Authored deterministic contact offsets are sufficient and safer for reverse scrolling.

## 12.3 Beam and environmental light

The Fresnel system should gain:

- light scatter on timber, rail, coat, and rain glass;
- denser beam dust near lens;
- stronger storm-clearing corridor;
- surface reflections on water;
- visual occlusion where set pieces interrupt beam volume.

## 12.4 Accessibility

Existing chapter announcements and reduced-motion support are good foundations. Still needed:

- permanent transcript/read mode;
- chapter-specific descriptive narration;
- keyboard-accessible chapter jump control verification;
- captions for any future recorded voice;
- no-flash alternative for storm/lightning beats.

## 12.5 Testing

Smoke testing proves runtime health, not art quality.

Add:

- Playwright/Puppeteer screenshot baselines at 0%, 25%, 50%, 75%, 100% of each chapter;
- visual review checklist for camera contact/collision;
- actual mobile device frame-time testing;
- automated low/medium/high quality screenshot pass;
- test that every scene supports forward and reverse scrubbing without console errors.

## 12.6 Bundle and loading

The reviewed production build is approximately:

```text
JavaScript: 800 KB raw / 228 KB gzip
```

This is defensible for a full Three.js story, but future work should explore:

- dynamic imports for later scene modules;
- idle prebuild/preload only for the upcoming chapter;
- texture atlas budgets;
- shader/material reuse;
- measuring actual GPU memory and draw calls on mobile.

---

# 13. Blueprint for future anthology stories

Every future story should follow this production sequence.

## Stage 0 — story contract

Write one page defining:

```text
hero
world force / antagonist
central prop
transformation object
material language
six chapter verbs
final emotional reversal
```

## Stage 1 — visual bible

Approve before coding:

- hero turnaround and action sheet;
- material/color board;
- six cinematic keyframes;
- chapter camera/beat storyboard;
- recurring object sheet.

## Stage 2 — shared story kit

Build reusable factories for:

- terrain/set vocabulary;
- props;
- particles;
- materials;
- character poses;
- world-force behavior;
- transition mechanism.

## Stage 3 — benchmark chapter

Build the most mechanically demanding chapter first. It must prove:

```text
hero contact
camera staging
material behavior
world reaction
transition consequence
quality tiers
reverse scroll
```

Do not build all chapters as weak blockouts first.

## Stage 4 — chapter production

For each chapter:

1. Define spatial proposition.
2. Define one verb/action sequence.
3. Define camera shots.
4. Construct only the geometry supporting that action.
5. Add material-specific effects.
6. Add transition handoff.
7. Test forward and reverse.
8. Review against approved keyframe.

## Stage 5 — validation and polish

Run smoke, inspect screenshots, profile tiers, fix staging, then add sound/accessibility polish.

---

# 14. Non-negotiable acceptance checklist

A future chapter cannot be called complete until all statements are true.

## Narrative and character

- [ ] The hero is visible or deliberately absent for a story reason.
- [ ] The hero has a clear objective.
- [ ] The hero physically contacts a meaningful prop or world element.
- [ ] The world visibly reacts to the hero's action.
- [ ] The final state differs causally from the initial state.

## Staging

- [ ] The chapter has a distinct spatial proposition.
- [ ] Camera has an establishing, action, contact, consequence, and exit shot.
- [ ] No camera collision, prop occlusion, or hero blocking error appears during scrub.
- [ ] Foreground, action midground, and background read at the key beat.

## Art direction

- [ ] Geometry comes from the story art kit or an approved art-specific module.
- [ ] Materials support the world language.
- [ ] Effects express material or action, not visual filler.
- [ ] No generic primitive remains visible in a focal composition unless intentionally stylized.

## Technical

- [ ] Forward and reverse scrubbing are deterministic.
- [ ] Quality tiers reduce all repeated systems.
- [ ] No significant allocations occur per frame in hot loops.
- [ ] `npm run build` passes.
- [ ] `npm run smoke` passes in CI.

## Accessibility

- [ ] Live chapter/beat narration is correct.
- [ ] Reduced-motion version preserves narrative meaning.
- [ ] Transcript/read mode has equivalent story content.
- [ ] Any recorded narration has captions/transcript.

---

# 15. Final directive

For future work, do not ask:

> What decorative element can we add to this scene?

Ask:

> What does the hero do, what does the world do back, and how does the camera make that action tactile?

The stronger rebuild is better because it consistently begins to answer that question through systems, staging, and validation. Every future story section should use this document as its implementation and review standard.
