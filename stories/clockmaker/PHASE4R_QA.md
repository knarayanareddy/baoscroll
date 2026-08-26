# Clockmaker Phase 4R — Production Gear Tower QA

## Production requirement

The old `GearTowerScene` is a blockout and is no longer the quality reference.

`ProductionGearTowerScene` must prove:

- [x] Shared ClockworkPaperKit gear/tooth vocabulary.
- [x] Dense city visible at genuine depth below the tower.
- [x] Tower shaft, braces, multiple route gears, pendulum arch, and minute-hand chamber.
- [x] Apprentice foot anchor corrected to a rotating gear tooth.
- [x] Both Apprentice hands are corrected to the pendulum grip midpoint.
- [x] Alternating left/right feet ground to moving gear teeth.
- [x] Red thread route follows the climb to the chamber.
- [x] Camera has authored low-run, pendulum-contact, climb, and chamber shots.
- [x] Hostile time-fracture, enamel fracture, pendulum shadow, tower shafts, city fog depth, and clockwork particle layers are integrated.
- [ ] Browser scrub 0→100→0 confirms no contact/camera collisions.
- [ ] Screenshot review at 0/25/50/75/100 against `ch03-tower-keyframe.png`.
- [ ] Low-DPR and reduced-motion screenshot validation.

## Visual acceptance

The scene fails if it reads as "an apprentice beside spinning gears." It must read as:

```text
an apprentice crossing a dangerous vertical route,
using the pendulum as a physical handhold,
while a clock city falls away beneath them.
```
