# The Lighthouse That Remembered Names — Visual Bible, v1

## Approved direction

**Medium:** hand-painted watercolor, gouache, charcoal linework, and torn handmade-paper collage. The world is tactile and constructed, but it must never read as generic low-poly, plastic 3D, photorealism, or a flat illustrated slideshow.

**Compositional rule:** every shot has three depths:

1. a tangible foreground object the keeper can touch;
2. a midground action zone containing the keeper;
3. a painterly distant world carrying weather, light, or memory.

The real-time implementation should reproduce this depth with illustrated planes, cut-paper meshes, textured materials, volumetric particles, and camera parallax. The keyframes are targets—not backgrounds to place behind generic geometry.

## Hero: The Keeper

Reference: `keeper-design-sheet.png`

- Elderly, white-bearded, calm but physically capable.
- Navy knit cap, long indigo oilskin coat, rust scarf, dark trousers, weathered boots.
- Brass lantern in right hand; brown leather Keeping Book under left arm.
- Silhouette priority: long coat hem, cap/beard shape, asymmetrical lantern/book read.
- All runtime poses must preserve these recognition cues.

## Material language

Reference: `material-bible.png`

| Material | Visual instruction | Runtime interpretation |
|---|---|---|
| Paper architecture | salt-stained fibre, torn contour, muted wash | textured cutout meshes and edge cards |
| Dock/boat wood | dark wet grain, charcoal outline | hand-painted wood texture, visible ropes and posts |
| Water | layered indigo wash, soft foam, light reflection | shader displacement + foam/spray cards + reflective gradient |
| Storm | ink black, torn cloud layers, rain diagonals | layered planes, particles, volume fog, intermittent light |
| Glass | cold blue/grey transparent panes, rain streaks | refraction plane, low-opacity streaks, warm interior contrast |
| Lamp | oxidized brass, prismatic gold, paper-light bloom | ring mesh, glass segments, point light, beam dust/name particles |
| Dawn | peach/cream wash, dry brush feather marks | warm grade, birds, low fog, widened camera |

## Chapter keyframes

| Chapter | Reference | Essential read |
|---|---|---|
| Harbor at Dusk | `ch01-harbor-keyframe.png` | Keeper crosses working harbor; ordinary life is tangible. |
| The First Name | `ch02-first-name-keyframe.png` | Keeper fails to hold a dissolving name in a rain-lit room. |
| Storm Wall | `ch03-storm-wall-keyframe.png` | Keeper versus impossible sea; rope, boat and beam tell the action. |
| What the Water Kept | `ch04-wreck-keyframe.png` | Keeper retrieves a memory from a suspended wreck world. |
| The Lamp Rekindled | `ch05-lamp-keyframe.png` | Keeper turns wheel; names and lamp become one mechanism. |
| Birds of Morning | `ch06-birds-keyframe.png` | Release, not possession; names fly into a restored dawn. |

## Consistency constraints

- Keeper coat remains indigo; scarf remains rust; lantern remains brass/gold across all chapters.
- The lighthouse is painted off-white with rust/coral weathering, never a generic clean white cylinder.
- Gold only means memory, beacon, or restoration. Do not use it as ambient decoration.
- Blue/teal means physical sea or glass; black ink means threat/loss; peach/cream means release.
- Text in generated reference imagery is non-canonical and must never appear in runtime visuals.

## Implementation gate

Before a chapter is coded, its scene plan must identify:

```text
foreground touch point
keeper pose path
camera keyframes
one physical reaction
one material-specific effect
exit/beam composition
```

A chapter is rejected if it can be described as “the same lighthouse scene in another color.”
