# Clockmaker material and shader QA

## Reusable production systems

| Effect | Runtime API | Quality behavior |
|---|---|---|
| Blueprint fold | `setFold(progress,time)` | mesh segments high 24 / medium 12 / low 6 |
| Enamel fracture | `setEnamel(fracture,heal)` | shader-only; same narrative state across tiers |
| Time fracture | `setTimeFracture(hostility,time)` | shader-only; same narrative state across tiers |
| Red thread glow | `setThread(progress)` | glow intensity scales without adding particles |
| Tick wave | `setTick(progress)` | high 4 / medium 3 / low 2 rings |
| Brass wear | `brassWear(material,amount)` | static material adjustment |
| Dawn wash | `dawnWash(target,amount)` | reversible base-color interpolation |

## Production chapter hooks

- [x] Workshop: blueprint fold, time fracture, red thread glow.
- [x] City: route fold, time fracture, red thread glow.
- [x] Tower: enamel fracture, hostile time fracture, red thread glow.
- [x] Remembered Hour: time fracture, reverse material reconstruction, red thread glow.
- [x] Final Hour: enamel healing, red thread glow, tick wave.
- [x] New Clock Ticks: tick wave and reversible dawn wash.

## Automated/static verification

- [x] Shader/effect module syntax checks pass.
- [x] Production build includes all six scene hooks.
- [x] Effects use local chapter progress and time only.
- [x] Dawn wash stores/reuses base material color to avoid one-way mutation.

## Browser visual approval pending

- [ ] Screenshot each effect at its chapter 0/25/50/75/100 milestone.
- [ ] Verify material effects remain visible at `?quality=low`.
- [ ] Verify reverse scrub restores blueprint, enamel, time fracture, thread, tick, and dawn states.
- [ ] Verify effects clarify action rather than obscure contact composition.
