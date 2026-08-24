# The Clockmaker's Last Hour — Visual Bible v1

## Phase 1 status

**Complete:** hero action sheet, material board, six chapter keyframes, chapter shot grammar, visual QA review, and consistency corrections.

**Not started:** production scene code. No runtime Clockmaker geometry should be built until this bible is accepted.

---

# 1. Art direction

## One-sentence visual statement

> A hand-painted clockwork city unfolds from ivory blueprint paper at ink-blue night, where warm brass time and a single red thread push back against the temptation to preserve the past.

## Medium

```text
watercolor wash
+ gouache brass/enamel highlights
+ charcoal contour line
+ ivory blueprint paper
+ layered mechanical cut-paper depth
```

The target is not generic steampunk, polished CGI metal, or visual clutter. Brass is hand-worked and tarnished; diagrams visibly fold into streets and machinery; every mechanical part has a narrative job.

## Palette rules

| Color/material | Meaning | Use |
|---|---|---|
| Ink-blue / blue-black | night, stalled time, grief | distant city, tower void, outer workshop edges |
| Warm brass / gold | craft, time, memory in motion | gears, keys, pocket watch, master clock |
| Ivory enamel | fragile measured time | clock faces, dial, drawings, repaired surfaces |
| Blueprint cream | possibility / instruction | maps, plans, folding city geometry |
| Red thread | continuity, choice, new minute hand | route, key prop, final transformation only |
| Walnut brown | lived-in work | bench, tools, workshop support structure |

### Prohibitions

- Gold is never filler decoration.
- Red appears only on thread, the spindle, route accents, and the final minute hand.
- No random gear field: repeated gears require a route, climb surface, timing mechanism, or transition role.
- No clean chrome or plastic. Use brass, enamel, paper, timber, and worn steel.

---

# 2. Apprentice

Reference: `apprentice-design-sheet.png`

## Silhouette

- compact young apprentice;
- loose, curly brown hair;
- ink-blue work coat with rolled sleeves;
- warm ochre undershirt;
- dark cropped trousers and work boots;
- leather tool satchel crossing the torso;
- brass keys / pocket watch and red thread spool are asymmetrical silhouette identifiers.

## Action vocabulary

| Runtime pose | Keyframe reference |
|---|---|
| windKey | winds standing clock in action sheet |
| repair | bench gear repair |
| run | gear-tooth crossing |
| catchPendulum | pocket-watch/pendulum catch silhouette |
| climbGear | vertical tower climbing study |
| holdWatch | intimate pocket watch study |
| reachThread | final minute-hand installation |
| setWatchDown | resolved workbench ending |

## Consistency QA

The first Remembered Hour generation drifted into a brown-coat silhouette. It was rejected and regenerated against the design sheet. The accepted replacement preserves:

```text
curly brown hair
+ ink-blue coat
+ ochre shirt
+ satchel
+ red thread spool
+ brass pocket watch
```

This correction establishes the rule: all future art/keyframes must use the action sheet as a visual reference, not merely the text description.

---

# 3. Materials

Reference: `material-bible.png`

## Runtime material targets

| Visual target | Runtime requirement |
|---|---|
| Brass | painted base map, verdigris/rub mask, warm rim response, no pure metallic chrome |
| Enamel dial | ivory crack/age map, separate numeral/hand layers, reversible fracture state |
| Blueprint paper | fibre map, fine line texture, fold/tear masks, diagram line particles |
| Red thread | curve/tube path, tension state, anchored at hero hand and dial/hook points |
| Gear | tooth geometry with low-poly bevel silhouette, brass map, individual rotation state |
| Workshop wood | wet/worn walnut grain, tool scratches, low warm reflection |
| Time fragments | paper/enamel/brass shard classes; never generic white particles |

---

# 4. Chapter keyframes and shot grammar

## I. The Workshop Wakes

Reference: `ch01-workshop-keyframe.png`

**Read:** warm pocket watch at a dark workbench wakes the sleeping workshop.

```text
foreground: key, spring, tools, blueprint edge
midground: apprentice winding watch
background: master clock and dormant clock faces
```

Required shot progression:

1. macro tool/gear drift;
2. pocket-watch winding hand insert;
3. over-shoulder master-clock discovery;
4. blueprint folds into city map.

## II. The City Disagrees

Reference: `ch02-city-keyframe.png`

**Read:** miniature city becomes a route puzzle; red thread shows the only way upward.

```text
foreground: large clock face/street clock
midground: apprentice route and repair point
background: miniature city and distant gear tower
```

Required shot progression:

1. overhead city model;
2. street-level clock repair;
3. loose minute-hand chase;
4. map rotates into vertical tower.

## III. The Impossible Gear Tower

Reference: `ch03-tower-keyframe.png`

**Read:** the apprentice is small against dangerous vertical timing machinery.

```text
foreground: oversized gear teeth / pendulum sweep
midground: apprentice run and catch
background: city far below, tower mechanism above
```

Required shot progression:

1. side-on gear run;
2. pendulum catch contact insert;
3. ascending gear climb;
4. fractured minute-hand chamber.

## IV. The Remembered Hour

Reference: `ch04-memory-keyframe.png`

**Read:** reconstruction of the past is beautiful and unbearable; mentor is only light/memory.

```text
foreground: reverse-moving tool and enamel fragments
midground: apprentice holding pocket watch
background: mentor memory across workbench
```

Required shot progression:

1. reversed fragment fall;
2. intimate apprentice / mentor-memory two-shot;
3. pocket-watch hand stop insert;
4. room unbuilds, leaving red thread.

## V. The Final Hour

Reference: `ch05-final-hour-keyframe.png`

**Read:** choice is mechanical and emotional: release a sealed hand, install the red minute hand.

```text
foreground: red hand / brass mechanism
midground: apprentice two-hand thread placement
background: monumental enamel dial and gear chamber
```

Required shot progression:

1. quiet approach to master dial;
2. two-handed release/placement contact;
3. dial orbital transformation;
4. warm clock-strike transition.

## VI. A New Clock Ticks

Reference: `ch06-new-clock-keyframe.png`

**Read:** the city continues; mentor’s watch becomes memory, not a prison.

```text
foreground: pocket watch on blueprint
midground: apprentice/workshop window
background: synchronized city and civic clock
```

Required shot progression:

1. first new tick macro;
2. city sequence waking outward;
3. watch placed down;
4. aerial dawn pullback.

---

# 5. Quality gates before Phase 2

Phase 2 is blocked until all statements are true:

- [x] Apprentice silhouette is stable across all six chapter references.
- [x] Mentor appears as translucent paper-light, never a physical resurrection.
- [x] Brass/enamel/blueprint/red thread visual hierarchy is explicit.
- [x] Each chapter has a unique spatial proposition and visual composition.
- [x] Each keyframe has foreground, action midground, and story background.
- [x] Every keyframe supports a physical hero contact point.
- [x] Red thread is reserved for route/choice/final minute-hand meaning.
- [x] No keyframe uses generic steampunk filler as its primary visual idea.

## Phase 2 entry criteria

Before code begins, create these reusable systems in this order:

```text
ClockworkKit
Apprentice rig and anchors
PocketWatch prop
TimeReversalSystem
MasterClock prop
Clockwork city model
```

No scene should be created until the contact contracts for the key system are defined.
