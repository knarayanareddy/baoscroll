# Seeds of the Sky Garden
## Production plan, phase gates, and success rubric

**Objective:** create a six-chapter scroll-driven animated short film with the production depth of Bao and the stronger Lighthouse rebuild, while preventing prototype drift, generic scene reuse, unreviewed visual claims, and premature phase completion.

---

# 1. Non-negotiable production principle

A Sky Garden chapter is not accepted because it has clouds, flowers, or a pastel palette.

It must communicate:

```text
Gardener objective
→ physical plant/weather contact
→ wind/sun/cloud obstacle
→ material growth response
→ camera consequence
→ changed sky-garden state
```

At every key scroll position, a reviewer must be able to answer:

1. Where is the gardener?
2. What are they tending, carrying, planting, or protecting?
3. What does the wind/weather/sun do back?
4. What has materially changed because of the gardener’s action?

If the answer is only “the colors changed” or “more flowers appeared,” the chapter fails.

---

# 2. Core story contract

| Role | Definition |
|---|---|
| Hero | Small cloud gardener: practical, gentle, visually legible silhouette; rain cape, seed satchel, watering tool, boots. |
| Narrator | Sentient watering can, occasionally joined by a chorus of raindrops. Playful, observant, never sarcastic at the gardener’s expense. |
| Antagonistic force | The Dry Sun / evaporating sky: not evil, but too intense and out of balance. Represented through heat shimmer, fading clouds, sun-thread rays, and brittle plant states. |
| Central prop | Seed satchel containing six impossible seeds; each seed has a distinct plant/material behavior. |
| Transformation object | Last cloud reservoir, which begins depleted and ends as a living rain system. |
| Material language | Pastel watercolor clouds, felt/fibre flowers, tissue-paper light, kite cloth, translucent rain beads, pollen, wet pigment. |
| Interaction rule | Scroll is the canonical story clock. Scroll velocity may affect transient wind/bend/spray feedback but must never create persistent non-reversible state. |

## Required recurring systems

```text
Cloud Gardener
Seed Satchel
Watering Can narrator
Last Cloud Reservoir
Wind Field
Dry Sun / heat field
Plant Growth System
Rain Return System
```

---

# 3. Reversibility rule for speed interaction

The Sky Garden hook uses scroll speed, but must preserve Bao-style reversible scrubbing.

## Allowed use of scroll velocity

```text
plant bend amplitude
pollen scatter density
kite flutter
wind sound intensity
cloud drift speed
rain bead streak length
momentary seed orbit
```

## Not allowed

```text
permanent seed loss
persistent branch breakage
randomly changed path topology
one-time growth events that cannot be undone
history-dependent route availability
```

Every structural world state must remain a pure function of:

```text
chapter local progress
+ normalized wind strength
+ reduced-motion state
```

Velocity can modulate a frame, but cannot decide permanent story state.

---

# 4. Six chapter action map

## I. The Dry Cloud Nursery — **Find the last seeds**

**Spatial proposition:** intimate cloud nursery suspended above a dry world far below.

```text
Gardener checks empty reservoirs
→ discovers six seeds in a folded satchel
→ waters the first seed
→ cloud reservoir reveals its final droplets
```

| Progress | Hero action | World response |
|---:|---|---|
| 0–.20 | Gardener walks nursery beds | dry leaves curl; cloud reservoir drips once |
| .20–.50 | Opens seed satchel | seed colours identify future chapters |
| .50–.78 | Waters first seed | first root line appears through cloud soil |
| .78–1 | Follows root toward edge | root becomes bridge transition |

**Required contact:** watering can/spout → first seed; seed → cloud soil.

---

## II. The First Seed — **Grow a bridge**

**Spatial proposition:** wide floating-island gap crossed by one growing vine.

```text
Gardener plants seed
→ vine reacts to water/wind
→ bridge grows across void
→ gardener crosses as it weaves itself
```

| Progress | Hero action | World response |
|---:|---|---|
| 0–.25 | Plants first seed at island edge | cloud soil darkens/wets |
| .25–.55 | Waters and guides vine | vine grows in visible segments |
| .55–.82 | Crosses growing bridge | flowers open beneath feet |
| .82–1 | Reaches next island | wind begins destabilizing path |

**Required contact:** both feet → vine bridge segments; hand → vine guide/tendril.

---

## III. The Wind Maze — **Cross moving islands**

**Spatial proposition:** lateral kite-island maze with shifting wind lanes.

```text
Gardener catches a kite sail
→ wind lanes move island paths
→ scroll velocity bends visual world
→ gardener threads through gusts
```

| Progress | Hero action | World response |
|---:|---|---|
| 0–.24 | Reads wind ribbons | islands drift, kites pull at anchors |
| .24–.54 | Grabs a kite sail | wind lane becomes traversable route |
| .54–.80 | Runs/floats across path | fast scroll intensifies bend/spray feedback |
| .80–1 | Reaches thunder orchard gate | distant thunder lights branches |

**Required contact:** hand → kite grip; feet → moving island platform.

---

## IV. The Thunder Orchard — **Harvest a storm**

**Spatial proposition:** vertical orchard of thunder fruit, rain stored in seed pods, and high branches.

```text
Gardener climbs branch ladder
→ catches thunder fruit
→ releases contained rain into reservoir
→ first real storm returns to sky
```

| Progress | Hero action | World response |
|---:|---|---|
| 0–.22 | Enters dry orchard | fruit glows faintly, branches sag |
| .22–.55 | Climbs wet branch/ladder | branches wake and grow leaves |
| .55–.78 | Catches thunder fruit | lightning travels through felt veins |
| .78–1 | Opens fruit over cloud reservoir | local rain begins, sun retreats briefly |

**Required contact:** feet/hands → branches; hands → thunder fruit; fruit → reservoir.

This is the **technical benchmark chapter**. Do not build other runtime scenes before it is approved.

---

## V. The Garden Meets the Sun — **Ask the sky to soften**

**Spatial proposition:** high exposed sun terrace; heat rays are physical threads the gardener must weave through.

```text
Gardener brings rain/flower system to sun
→ heat strips cloud colour away
→ gardener plants final seed in direct light
→ sun and cloud system rebalance
```

| Progress | Hero action | World response |
|---:|---|---|
| 0–.28 | Approaches hot terrace | plants bleach, heat distortion rises |
| .28–.58 | Protects seed with canopy | cloud/felt layers shade it |
| .58–.82 | Plants final seed in sunlight | sun rays become root-like threads |
| .82–1 | Seed blooms into rain halo | heat becomes warm light transition |

**Required contact:** hands → seed/canopy; seed → sun-thread field.

---

## VI. Rain Returns — **Let the world drink**

**Spatial proposition:** aerial pullback through all restored sky-garden layers to the dry world below.

```text
reservoir overflows
→ plants release rain
→ islands synchronize as one garden
→ gardener watches rain reach ground
```

| Progress | Hero action | World response |
|---:|---|---|
| 0–.25 | Opens final reservoir valve | first rain bead falls |
| .25–.58 | Gardener watches garden respond | blooms, bridges, kites, orchard synchronize |
| .58–.84 | Rain crosses cloud layer | dry world below gains colour/wet reflection |
| .84–1 | Camera pulls away | gardener remains small, rain system continues |

**Required contact:** hand → reservoir valve; rain → world below.

---

# 5. Phase plan

## Phase 0 — Story contract and production constraints

**Deliverable:** story brief, chapter action map, material hierarchy, narrator identity, interaction reversibility rules.

**Gate:** no code until all six chapters have objective/contact/obstacle/consequence/transition definitions.

---

## Phase 1 — Visual bible

**Deliverables:**

```text
Gardener turnaround/action sheet
Watering-can narrator design
seed/plant action sheet
material and colour board
six cinematic keyframes
six camera/beat boards
```

**Gate:**

- hero silhouette consistent across all keyframes;
- dry/wet/sun/wind materials distinguishable;
- each keyframe has foreground, hero action midground, and narrative background;
- no generic fantasy-cloud filler;
- visual review approves all six before code.

---

## Phase 2 — Shared production foundation

**Required systems:**

```text
SkyGardenKit
CloudGardener rig
SeedSatchel
WateringCan
WindField
CloudReservoir
PlantGrowthSystem
DrySunSystem
RainSystem
```

**Gate:**

- every planned contact has a named hero/prop/environment anchor;
- plant growth and wind are pure scroll functions;
- quality tier contracts exist;
- no scene runtime code before these systems are testable.

---

## Phase 3 — Benchmark: Thunder Orchard

Build Chapter IV first.

It must prove:

```text
vertical branch/ladder contact
thunder fruit contact
wind field response
lightning through organic material
water transfer to reservoir
local rain consequence
reversible growth/weather state
```

**Gate:** Chapter IV must score 4/5 across all review lenses before another chapter runtime is built.

---

## Phase 4 — Unified six-chapter shell

Build one fixed WebGL canvas with six native scroll sections, one story router, shared camera, transitions, narration/audio interfaces, smoke hooks, quality tiers, and baseline folders.

**Gate:** Chapter IV must mount into the shell and survive 0→100→0 scrub before production scenes are added.

---

## Phase 5 — Action/challenge chapters

Build in this order:

```text
III. Wind Maze
V. Garden Meets the Sun
II. First Seed
I. Dry Cloud Nursery
VI. Rain Returns
```

Do not create shallow blockout pages. Each chapter must use shared systems and satisfy chapter-specific contact/camera/world-response criteria.

---

## Phase 6 — Narration, audio, and transitions

Narration belongs to the watering can.

Required:

```text
user gesture opt-in
chapter-addressed cues
caption overlay
aria-live text
ambient ducking
read-mode transcript
reversible transition language
```

Transition language:

| Boundary | Transition |
|---|---|
| Nursery → First Seed | root line grows across paper |
| First Seed → Wind Maze | vine braid becomes wind ribbon |
| Wind Maze → Orchard | kite cloth becomes thunder leaves |
| Orchard → Sun | rain bead becomes sun lens |
| Sun → Rain | sun thread becomes rain halo |

---

## Phase 7 — Browser QA, baselines, and release audit

Required:

```text
six production smoke scripts
0/25/50/75/100 screenshot candidates per chapter
approved committed baselines
pixel diff warning/failure thresholds
low/medium/high draw/triangle/particle budgets
full 0→100→0 browser scrub
mobile / reduced-motion proof
```

---

# 6. Review rubric

Each chapter receives 1–5 scores across:

| Lens | Pass question |
|---|---|
| Narrative | Is gardener objective/obstacle/consequence readable in three seconds? |
| Character | Are action, body weight, and anchors visibly convincing? |
| Environment | Does the sky garden have a unique spatial proposition and respond materially? |
| Camera | Are setup/contact/consequence/exit shots readable and collision-free? |
| Materials | Do cloud, felt, sun, rain, pollen, and plant effects explain story state? |
| Technical | Is reverse scroll deterministic and within tier budget? |
| Accessibility | Are narration/read mode/reduced motion equivalent in meaning? |

**Production threshold:** every lens must score at least 4/5.

---

# 7. Non-negotiable QA criteria

## Contacts

| Beat | Required contact |
|---|---|
| Water first seed | can spout → seed anchor |
| Grow bridge | hand → vine guide; feet → bridge segment |
| Wind maze | hand → kite grip; feet → island platform |
| Thunder orchard | hands/feet → branch; hands → fruit; fruit → reservoir |
| Sun terrace | hands → canopy/seed; seed → sun thread |
| Rain finale | hand → valve; water particle → ground layer |

## Performance

- All plant, pollen, leaf, rain, and cloud counts must use high/medium/low tier contracts.
- Fast scroll may affect transient wind only; it cannot create persistent state.
- No per-frame particle allocation in hot loops.

## Asset and material quality

- Plants/flowers must use painted/felt/fibre atlas, not generic spheres.
- Clouds need paper/tissue material and depth layers.
- Thunder fruit needs a specific material/state system.
- Dry Sun needs heat thread/bleach system, not a global yellow overlay.
- Rain needs bead/paint wash/world reflection states.

---

# 8. Definition of done

Seeds of the Sky Garden is ready only when:

- [ ] all six scenes meet the 4/5 rubric threshold;
- [ ] Thunder Orchard benchmark is screenshot approved;
- [ ] gardener contacts are verified at every key action;
- [ ] wind-speed feedback is reversible and non-persistent;
- [ ] sun, cloud, plant, fruit, and rain systems are distinct and material-specific;
- [ ] narration/read mode/audio transitions are complete;
- [ ] visual baselines and performance budgets are approved;
- [ ] full browser 0→100→0 scrub passes at every quality tier;
- [ ] final rain is a visibly earned consequence of the gardener’s actions.
