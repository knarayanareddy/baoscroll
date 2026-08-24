# Clockmaker Phase 4 — Impossible Gear Tower QA

## Required action proof

```text
run across gear teeth
→ catch pendulum
→ climb rotating machinery
→ reach fractured-minute-hand chamber
```

## Contact constraints implemented

- [x] Gear teeth expose dynamic tread positions calculated from the gear's current rotation.
- [x] Apprentice left-foot anchor is corrected to active gear tread during climb.
- [x] Pendulum exposes a world-space grip anchor.
- [x] Apprentice right-hand anchor is corrected to pendulum grip during catch.
- [x] Red thread route only appears after climb begins.
- [x] City state remains visible below tower and changes with arrival state.

## Required browser QA

- [ ] Scroll 0→100→0: moving tread positions must remain finite.
- [ ] Foot must remain planted on an active tooth in climb screenshots.
- [ ] Hand must remain on pendulum grip at 35–50% progress.
- [ ] Camera must show city depth below and chamber fracture above.
- [ ] Capture baselines at 0%, 25%, 50%, 75%, 100%.
- [ ] Verify reduced motion and low-DPR query variants.
