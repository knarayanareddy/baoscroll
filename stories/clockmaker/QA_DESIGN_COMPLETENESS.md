# The Clockmaker's Last Hour
## Production completeness and QA design document

**Purpose:** define the non-negotiable completeness criteria before the second Clockmaker production pass begins.

**Current assessment:** Clockmaker has a valid visual bible, a unified six-chapter runtime shell, and production-scene foundations. It does not yet have the shared antagonist, hero depth, shader/material language, audio/narration system, or evidence-based QA needed to reach the stronger Lighthouse/Bao quality bar.

---

# 1. Completion rule

A Clockmaker chapter is not complete because it has:

```text
gears
+ brass
+ blue lighting
+ a protagonist
```

It is complete only when this causal chain is visually legible in forward and reverse scroll:

```text
apprentice objective
→ exact physical contact
→ Unspent Hour resists or distorts the world
→ time/material state changes
→ camera reveals consequence
→ transition hands off the changed state
```

## Per-chapter pass condition

Every chapter must score at least **4/5** across all review lenses:

| Lens | Question |
|---|---|
| Narrative | Can a reader identify the apprentice’s goal, obstacle, and consequence in three seconds? |
| Character | Do silhouette, body weight, hand/foot contacts, and props sell the action? |
| Environment | Does the world have a unique spatial proposition and respond materially to action? |
| Camera | Are establishment, action, contact, consequence, and exit shots clear and collision-free? |
| Material/effects | Do shaders/effects describe time, paper, brass, enamel, or blueprint behavior rather than visual filler? |
| Technical | Does 0→100→0 scrub remain deterministic, finite, and inside performance budget? |
| Accessibility | Do read mode, narration/captions, reduced motion, and keyboard behavior preserve story meaning? |

A scene may not progress to final approval if any category is below 4/5.

---

# 2. Unspent Hour: cross-chapter antagonist system

## Narrative role

The Unspent Hour is not a missing minute hand. It is a visible force that represents the apprentice’s wish to preserve the mentor’s goodbye.

It must appear in every chapter and change shape as the story progresses:

| Chapter | Unspent Hour manifestation | Response to apprentice |
|---|---|---|
| Workshop Wakes | stopped master dial; missing hand; seconds caught in dust | reveals the sealed hour after winding begins |
| City Disagrees | clocks run conflicting tempos; routes misalign | turns repairs into temporary, unstable order |
| Gear Tower | fractured time teeth; pendulum timing is hostile | locks gear teeth behind apprentice / fractures minute hand |
| Remembered Hour | reverse reconstruction field | provides beautiful memory, then refuses to remain |
| Final Hour | sealed hand and frozen dial | yields only when apprentice releases control |
| New Clock Ticks | absent as threat; residual reflection in pocket watch | transforms into civic rhythm rather than possession |

## Required runtime system

Create:

```text
stories/clockmaker/src/production/UnspentHour.js
```

### Required API

```js
unspentHour.setMood('dormant' | 'discordant' | 'hostile' | 'remembering' | 'releasing' | 'resolved')
unspentHour.setProgress(localProgress)
unspentHour.attachTo(target)
unspentHour.update(time, delta, motion)
```

### Required visual layers

- incomplete enamel dial;
- missing/sealed hand;
- stopped-second dust field;
- fractured numeral shards;
- ink-blue time fog;
- red-thread exclusion/attraction behavior;
- chapter-specific sound cue hook;
- material distortion hook for affected clock faces and blueprint lines.

### QA checks

- [ ] Unspent Hour appears in all six chapters.
- [ ] Each mood is visually distinguishable without UI text.
- [ ] Its material/particle state is deterministic under reverse scroll.
- [ ] It never obscures hero contact composition.
- [ ] Resolved state removes threat without simply deleting all visual history.
- [ ] Screenshot comparison proves each chapter’s manifestation is unique.

---

# 3. Apprentice: Keeper-level action and contact depth

## Required expansion

The Apprentice must become a full production rig, not a pose skeleton.

### Required body systems

```text
body root / breathing
head and gaze
coat body
coat tail panels
rolled sleeves
satchel
key ring
tool belt
pocket watch chain
red thread spool
left/right arm → elbow → hand
left/right leg → knee → foot
contact shadow / air state
```

### Required anchors

```text
leftHand
rightHand
leftFoot
rightFoot
keyAnchor
watchAnchor
threadAnchor
toolAnchor
pendulumGripAnchor
gearFootAnchor
minuteHandAnchor
```

### Required action API

```text
idle
walk
run
windKey
repair
catchPendulum
hangPendulum
climbGear
holdWatch
reachMemory
releaseHand
threadMinuteHand
setWatchDown
lookUp
brace
```

### Required action contracts

| Action | Contact requirement | Environment response |
|---|---|---|
| Wind key | key anchor → watch/clock crown | spring, tick, light, tool wake |
| Repair | tool anchor → gear/crown | clock tempo stabilizes temporarily |
| Run gear | alternating feet → moving gear teeth | teeth lock / slip behind hero |
| Catch pendulum | both hands → pendulum grip | pendulum slows/changes camera force |
| Climb | alternating foot/hand anchors | gear route moves under hero |
| Hold watch | both hands → pocket watch | memory field gathers around watch |
| Thread hand | both hands → thread + dial hand | red minute hand becomes physical |
| Set watch down | hand → blueprint bench position | city receives final rhythm |

### QA checks

- [ ] No focal interaction uses a hardcoded nearby position.
- [ ] At least one hand/foot anchor drives every hero action beat.
- [ ] Contact distance is measured and logged in smoke test.
- [ ] Coat/satchel/thread respond to force, direction, and time state.
- [ ] Hero silhouette remains readable at the widest camera shot.
- [ ] Contact screenshots at every chapter milestone are reviewed.

---

# 4. Clockmaker shader and material effects

## Required shaders

| Shader/effect | Narrative use | Required chapters |
|---|---|---|
| Blueprint fold | diagrams fold into streets, tower routes, and chamber plans | I, II, III |
| Enamel fracture | stopped / released time cracks and heals in dial material | III, V |
| Brass wear/verdigris | tangible old craft, not chrome | all chapters |
| Time fracture | Unspent Hour freezes/skips objects and clock faces | I–V |
| Reverse reconstruction | material fragments reconstruct with depth/light response | IV |
| Red thread glow | route, choice, final minute hand | I–VI |
| Tick wave | clock strike propagates through city | V, VI |
| Dawn enamel/water wash | civic rhythm becomes warm continuation | VI |

## Material rules

```text
brass      = craft / mechanism / responsibility
enamel     = measured time / fragility
blueprint  = possibility / instruction
red thread = continuity / chosen future
ink blue   = held time / grief / Unspent Hour
walnut     = work / inheritance
```

## QA checks

- [ ] Effects are not generic bloom/filter overlays.
- [ ] Every shader is tied to a story state or prop state.
- [ ] Low/medium/high quality versions exist for every particle-heavy effect.
- [ ] Material effect remains legible in reduced motion.
- [ ] Screenshot review confirms shaders improve contact/meaning rather than obscure it.
- [ ] No visual effect introduces non-reversible state.

---

# 5. Full Clockmaker narration, audio, and transition system

## Narrator

The inherited pocket watch narrates.

**Voice direction:** precise, intimate, warm, lightly mechanical; distinct from Lighthouse keeper and Bao narrator.

## Audio architecture

```text
ClockmakerAudioController
├── workbench tick / spring / tool beds
├── city clock / train / bridge beds
├── tower gear / pendulum / wind beds
├── memory reverse / mentor-light bed
├── master clock strike / red thread cue
└── dawn civic rhythm / city ambience

ClockmakerNarrationController
├── user-gesture opt-in
├── chapter-addressed voice cue
├── caption overlay
├── aria-live narration text
├── ambience ducking
├── chapter-transition interruption
└── read-mode transcript
```

## Chapter narration cues

| Chapter | Core line |
|---|---|
| Workshop | “The first spring was not broken. It was waiting.” |
| City | “Every clock had chosen a different way to be afraid.” |
| Tower | “Above the city, a second could become a fall.” |
| Memory | “The past came back perfectly, except for the part that mattered.” |
| Final Hour | “An hour cannot be kept. It can only be given its place.” |
| New Clock | “The city did not remember the goodbye. It remembered the rhythm.” |

## Transition language

| Boundary | Transition |
|---|---|
| Workshop → City | blueprint folds/rotates into model streets |
| City → Tower | map grid rises into vertical gear teeth |
| Tower → Memory | fractured minute hand becomes reverse fragments |
| Memory → Final | fragments converge into red thread / master dial |
| Final → Dawn | strike wave expands into city sunrise |

## QA checks

- [ ] Audio begins only after user gesture.
- [ ] Narration always corresponds to active chapter.
- [ ] Active narration stops when chapter changes.
- [ ] Caption and aria-live text match audio line.
- [ ] Ambience ducks during narration and returns after.
- [ ] Read mode contains equivalent complete story content.
- [ ] Transitions are reversible in both directions.

---

# 6. Browser smoke, visual baselines, and budgets

## Required test scripts

```text
scripts/clockmaker-production-smoke.mjs
scripts/clockmaker-production-tower-smoke.mjs
scripts/clockmaker-production-final-smoke.mjs
scripts/clockmaker-production-workshop-smoke.mjs
scripts/clockmaker-production-city-smoke.mjs
scripts/clockmaker-production-dawn-smoke.mjs
```

Each script must:

1. launch production build with `?dpr=1`;
2. capture 0/25/50/75/100 milestone frames;
3. scrub forward and reverse;
4. fail on page/console/request errors;
5. validate finite positions and key contact state;
6. report draw calls and triangles;
7. write candidates to the corresponding baseline folder.

## Visual baselines

```text
stories/clockmaker/visual-baselines/
├── workshop/
├── city/
├── tower/
├── remembered-hour/
├── final-hour/
└── dawn/
```

Each folder must contain approved:

```text
00-*.png
25-*.png
50-*.png
75-*.png
100-*.png
```

Pixel-diff policy:

```text
warning: > 2.0% changed pixels
failure: > 4.0% changed pixels
manual review: any contact/camera/keyframe composition change
```

## Performance budgets

Define per chapter and quality tier:

```json
{
  "low": { "drawCalls": 0, "triangles": 0, "particles": 0 },
  "medium": { "drawCalls": 0, "triangles": 0, "particles": 0 },
  "high": { "drawCalls": 0, "triangles": 0, "particles": 0 }
}
```

Budgets are not accepted until captured from a visual-approved baseline run on:

```text
software GL smoke
low DPR browser
medium desktop
high desktop
```

## QA checks

- [ ] All six smoke scripts run in CI with installed Chrome.
- [ ] All baseline images are committed and reviewed.
- [ ] Pixel-diff thresholds are enforced in CI.
- [ ] Low/medium/high budgets are measured, committed, and enforced.
- [ ] No scene exceeds a budget without an explicit visual approval note.

---

# 7. Second production art pass by chapter

## Workshop Wakes

- [ ] Replace procedural tools with painted tool atlas / textured parts.
- [ ] Make blueprint folds visibly form City streets.
- [ ] Add first Unspent Hour stopped-second field.
- [ ] Refine key-to-crown contact and clock wake chain.

## City Disagrees

- [ ] Make city routes physically fold/misalign.
- [ ] Add Unspent Hour tempo distortion to street clocks.
- [ ] Turn loose minute hand into a real chase/contact object.
- [ ] Improve model-to-tower scale transition.

## Impossible Gear Tower

- [ ] Add time-fracture shader to gear teeth and chamber dial.
- [ ] Add pendulum catch follow-through and two-hand contact.
- [ ] Add depth light shafts / city fog / tower shadow layers.
- [ ] Refine gear path and foot alternation.

## Remembered Hour

- [ ] Add material reconstruction shader and mentor-memory light choreography.
- [ ] Improve watch contact and reconstruction object classes.
- [ ] Make the Unspent Hour’s refusal visually inevitable.

## Final Hour

- [ ] Strengthen sealed hand release and two-handed thread placement.
- [ ] Make strike visibly travel through chamber/city systems.
- [ ] Add enamel crack healing and material light propagation.

## New Clock Ticks

- [ ] Strengthen watch placement contact and mentor reflection.
- [ ] Make city synchronization propagate in readable waves.
- [ ] Add final dawn/civic rhythm visual payoff.

---

# 8. Final release gate

Clockmaker is not ready for release until:

- [ ] Six production scenes have passed all seven review lenses at 4/5 or above.
- [ ] Unspent Hour is visible and emotionally coherent across all chapters.
- [ ] Apprentice interactions are anchor-correct and screenshot-approved.
- [ ] Clockmaker-specific shader/material language is present.
- [ ] Narration/audio/read mode are complete.
- [ ] All visual baselines, smoke tests, pixel diffs, and budgets are committed and enforced.
- [ ] Full 0→100→0 story scrub is clean at every quality tier.
- [ ] Final production review confirms the story reads as an authored cinematic scroll film, not a set of clockwork demos.
