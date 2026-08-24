# Clockmaker Phase 3 — Remembered Hour benchmark QA

## Benchmark intent

The scene must prove that Clockmaker can stage emotional time reversal without using a generic reverse filter.

```text
broken state
→ local scroll reconstruction
→ mentor paper-light appears
→ apprentice contacts pocket watch
→ tries to hold the hour
→ reconstruction fails gracefully
→ red thread remains
```

## Required integration checks

- [x] `TimeReversalSystem` registers individual objects with broken/whole states.
- [x] Reconstruction is a pure function of local progress.
- [x] Mentor is non-physical additive paper-light, never a resurrected body.
- [x] Apprentice watch anchor is constrained to PocketWatch world position during resistance beat.
- [x] Camera includes macro/contact insert between workshop-wide shots.
- [x] Red thread appears only during the resistance/choice beat.
- [x] Story light intensity follows reconstruction and resistance state.
- [ ] Integrate scene into dedicated Clockmaker runtime shell.
- [ ] Capture visual baseline screenshots at 0%, 25%, 50%, 75%, 100%.
- [ ] Conduct hero/camera collision review in browser.

## Static verification

```bash
node --check stories/clockmaker/src/ClockmakerSceneBase.js
node --check stories/clockmaker/src/RememberedHourScene.js
```

## Phase 3 acceptance criteria

The benchmark cannot advance if the image reads as:

```text
random tools floating backward around an apprentice
```

It must read as:

```text
an apprentice tries to hold a specific inherited watch
while a workshop memory reconstructs around them,
then understands that the memory cannot remain.
```
