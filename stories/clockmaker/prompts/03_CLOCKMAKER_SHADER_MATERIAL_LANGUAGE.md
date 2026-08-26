# Sequential Prompt 3 — Clockmaker shader and material language

## Instruction

> Build the Clockmaker-specific **shader and material effects** required by Section 4 of `stories/clockmaker/QA_DESIGN_COMPLETENESS.md`. Implement blueprint folding, enamel fracture/healing, brass wear/verdigris, time fracture, reverse material reconstruction, red-thread glow, tick wave, and dawn enamel/water wash as reusable production systems. Integrate them only where each effect has a defined narrative/material purpose. Add low/medium/high quality behavior and reversible scroll validation. Do not move to the next task until the shader/material QA checks are completed and each production chapter has the required effect hooks.

---

## Scope boundary

Only modify Clockmaker production material/shader systems, their scene hooks, tests, and QA documentation. Do not begin narration/audio, unrelated chapter geometry, or Lighthouse/Bao changes.

## Required reusable systems

```text
ClockmakerMaterialEffects
├── blueprint fold material
├── enamel fracture / healing material
├── brass wear / verdigris material modifier
├── Unspent Hour time-fracture field
├── reverse material reconstruction modifier
├── red-thread glow ribbon
├── clock strike / tick wave
└── dawn enamel wash
```

## Required chapter hooks

| Chapter | Required material/effect hooks |
|---|---|
| Workshop | blueprint fold, brass wake, stopped-second time fracture |
| City | blueprint route fold, discordant enamel clock faces, time fracture |
| Gear Tower | hostile time fracture, enamel crack chamber, brass wear, red thread glow |
| Remembered Hour | reverse reconstruction material response, mentor paper-light, time fracture |
| Final Hour | enamel healing, red thread glow, clock strike / tick wave, brass light propagation |
| New Clock | dawn enamel wash, tick wave, warm city material propagation |

## Non-negotiable rules

- Every effect must be driven by chapter-local scroll state.
- Every effect must reverse exactly when scrolling upward.
- Effects may clarify a prop/action/material; they may not be decorative filler.
- Quality tiers must reduce field density, distortion detail, and particle count without changing narrative meaning.
- Existing painted material maps remain the base; shaders enhance them rather than replace the world with generic glow.

## Completion evidence

- [ ] All eight reusable effects exist with documented API.
- [ ] Each production chapter invokes required effects.
- [ ] Material state is visible in debug/smoke state.
- [ ] Low/medium/high effect counts are deterministic.
- [ ] Reverse-scroll smoke validates finite uniforms/geometry.
- [ ] Screenshot review criteria are documented per effect/chapter.
- [ ] Build and syntax checks pass.
