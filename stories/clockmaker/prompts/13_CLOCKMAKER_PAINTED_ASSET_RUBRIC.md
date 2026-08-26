# Sequential Prompt 13 — Clockmaker painted asset and mask production rubric

## Instruction

> Create and integrate the complete **Clockmaker painted asset and mask pack** needed to close the visual-material gap identified in `stories/clockmaker/QA_DESIGN_COMPLETENESS.md`. Use this rubric as the definition of done. Produce original, legally usable assets that match `stories/clockmaker/art-direction/VISUAL_BIBLE.md`; integrate them through a centralized Clockmaker asset loader/material registry; add low/medium/high texture budgets; and prove every production chapter uses the appropriate asset class. Do not move to the next task until all asset-pack, integration, QA, and visual-review criteria below are met or any remaining browser-review blocker is explicitly documented.

---

# 1. Art-direction constraints

All assets must follow this material hierarchy:

```text
warm oxidized brass
ivory enamel
ink-blue held time
blueprint paper
walnut work
red thread
peach/cream civic dawn
```

## Prohibitions

Do not create:

```text
photorealistic chrome
clean generic steampunk metal
random gear textures
unreadable clutter
Elden Ring/Bao/Lighthouse copied assets
text/logos/watermarks
```

Assets must look like they belong to the Clockmaker visual bible:

```text
watercolor wash
+ gouache body color
+ charcoal contour detail
+ handmade paper grain
+ controlled brass/enamel highlights
```

---

# 2. Required asset pack

Create the assets below under:

```text
public/textures/clockmaker/
```

and document them in:

```text
stories/clockmaker/ASSET_MANIFEST.md
```

## A. Painted brass masks

### Required files

```text
brass-base.webp
brass-verdigris-mask.png
brass-scratch-mask.png
brass-strike-glow-mask.png
```

### Use

```text
master clock housing
gear teeth
pendulum
key
clock crown
brass rails
city gear towers
```

### Criteria

- warm ochre brass base;
- irregular green verdigris only in seams/low points;
- fine circular lathe/scratch direction;
- strike mask readable under warm additive light;
- tileable base/masks where needed;
- no large recognisable repeated blotches.

---

## B. Enamel crack and healing masks

### Required files

```text
enamel-base.webp
enamel-crazing-mask.png
enamel-fracture-mask.png
enamel-heal-mask.png
```

### Use

```text
street clocks
master clock
Unspent Hour dial
fractured minute-hand chamber
final red-hand placement
```

### Criteria

- ivory base has subtle uneven glaze;
- crazing is fine/background, not a single repeated crack;
- fracture mask contains large narrative cracks;
- heal mask supports a clear thread-driven closure direction;
- cracks can reverse without visible popping;
- supports low-quality fallback without shader-only loss of meaning.

---

## C. Blueprint fold and alpha masks

### Required files

```text
blueprint-paper.webp
blueprint-grid-mask.png
blueprint-fold-mask.png
blueprint-tear-mask.png
blueprint-route-mask.png
```

### Use

```text
workshop-to-city transition
city route sheets
tower blueprint ribbons
remembered workshop diagrams
```

### Criteria

- cream paper base with blue-grey technical ink;
- fold mask has distinct crease directions;
- route mask reserves red thread for narrative route only;
- tear mask supports transition boundaries without generic torn-edge noise;
- blueprint folds physically map to city/tower geometry;
- no readable fake technical text required.

---

## D. Painted clock-face atlas

### Required files

```text
clock-face-atlas.webp
clock-numeral-mask.png
clock-hand-mask.png
clock-shadow-mask.png
```

### Required variants inside atlas

```text
workshop clock
street clock
master clock
Unspent Hour dial
resolved civic clock
```

### Criteria

- clear hierarchy of scale and age;
- numerals remain legible at intended camera distance;
- master dial is the most refined, not merely larger;
- Unspent Hour variant has missing/sealed-hand language;
- resolved civic variant carries dawn warmth without losing enamel identity.

---

## E. Painted tool atlas expansion

### Required files

```text
tool-atlas.webp
tool-alpha-mask.png
tool-brass-mask.png
tool-shadow-mask.png
```

### Required tools

```text
clock key
screwdriver
fine pliers
tweezers
calipers
spring coil
gear cluster
oiler
watch case
red thread spool
```

### Criteria

- tools are visually distinct at macro and mid-distance;
- atlas coordinates are documented;
- tool masks support interaction/highlight state;
- no generic floating icon appearance;
- active tool in hand matches the static bench atlas item.

---

## F. Time-fracture texture set

### Required files

```text
time-fracture-noise.webp
stopped-second-dust.png
fractured-numeral-atlas.webp
time-ripple-mask.png
```

### Use

```text
Unspent Hour
city tempo disagreement
gear tower hostility
remembered hour refusal
```

### Criteria

- ink-blue / blue-violet time language;
- dust particles have varied scale and directional drift;
- fractured numerals remain abstract enough not to become decorative text;
- ripple can be used in reverse without a one-way baked animation;
- visual density scales by quality tier.

---

## G. City roof, window, and civic mask atlas

### Required files

```text
city-roof-atlas.webp
city-window-atlas.webp
city-window-glow-mask.png
city-road-grid-mask.png
city-smoke-mask.png
```

### Use

```text
City Disagrees
Gear Tower city depth
Final Hour city consequence
New Clock Ticks dawn city
```

### Criteria

- roofs carry blueprint-paper / enamel / brass vocabulary;
- windows support sequential synchronization wave;
- road grid supports disagreement misalignment and repaired alignment;
- smoke is soft paper/gouache, not realistic volumetric cloud;
- city remains a clockwork model, not a generic fantasy town.

---

## H. Pendulum, gear, and mechanism wear textures

### Required files

```text
gear-tooth-wear-mask.png
pendulum-brass-mask.png
pendulum-shadow-mask.png
oil-stain-mask.png
clockwork-dust.png
```

### Use

```text
Gear Tower
master clock chamber
workshop machinery
```

### Criteria

- wear follows mechanical contact edges;
- pendulum shadow supports perceived mass/swing;
- oil stains appear at pivots/teeth, not randomly;
- dust supports route/action depth and low-tier fallback.

---

# 3. Technical specifications

## File format / size

| Asset type | Format | Target resolution | Budget |
|---|---|---:|---:|
| Painted base textures | WebP | 1024×1024 | ≤ 350 KB each |
| Alpha/mask texture | PNG/WebP alpha | 512×512 | ≤ 180 KB each |
| Atlas | WebP | 2048×2048 max | ≤ 700 KB each |
| Particle sprite | PNG alpha | 256–512px | ≤ 100 KB each |

## Material registry

Create:

```text
stories/clockmaker/src/production/ClockmakerAssetLoader.js
stories/clockmaker/src/production/ClockmakerMaterialRegistry.js
```

Required behavior:

```text
load production painted assets
→ configure color space and wrapping
→ expose typed names
→ provide procedural fallback if loading fails
→ cache materials
→ retain low/medium/high texture options
```

No scene may load its own texture ad hoc.

---

# 4. Integration matrix

| Asset class | Workshop | City | Tower | Memory | Final | Dawn |
|---|---|---|---|---|---|---|
| Brass masks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Enamel masks | clocks | clocks | chamber | fragments | master dial | civic clock |
| Blueprint masks | ✓ | ✓ | ✓ | ✓ | transition | final bench |
| Clock atlas | ✓ | ✓ | ✓ | memory clocks | master dial | civic clock |
| Tool atlas | ✓ | optional | — | ✓ | — | final bench |
| Time fracture | dormant | discordant | hostile | refusal | release | residual |
| City atlas | — | ✓ | depth | — | consequence | ✓ |
| Gear/pendulum wear | workshop | — | ✓ | tools | chamber | residual |

---

# 5. Quality tier requirements

| Tier | Texture rule | Particle/mask rule |
|---|---|---|
| High | full atlas and all masks | full dust/time fragment detail |
| Medium | same base atlas, reduced secondary masks | 60–70% particle count |
| Low | 512px reduced atlas / base+critical mask only | 25–40% particle count, preserve contact clarity |

No quality tier may remove:

```text
red thread
Unspent Hour identity
hero contact object
master clock state
city synchronization state
```

---

# 6. QA and evidence

## Automated checks

- [ ] Asset manifest lists every file, material key, resolution, format, and scene use.
- [ ] Loader handles missing asset fallback.
- [ ] No texture fetch error occurs during six chapter smoke run.
- [ ] All texture budgets are verified in CI.
- [ ] Low/medium/high runs have no missing material key.

## Visual checks

- [ ] Painted asset appears at intended camera scale; atlas seams are not obvious.
- [ ] Material states read differently in dormant/hostile/releasing/resolved time moods.
- [ ] Enamel fracture/heal and blueprint fold are visible at screenshot milestones.
- [ ] City synchronization wave uses city masks, not only light opacity.
- [ ] Gear/pedulum wear supports physical action.

## Completion condition

Do not declare this asset pass complete until:

```text
asset pack committed
+ manifest complete
+ registry/loader integrated
+ all six scenes use required assets
+ production build passes
+ Chrome smoke passes
+ screenshot review confirms material improvement
+ quality tier/fallback evidence exists
```
