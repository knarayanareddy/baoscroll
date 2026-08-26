# Clockmaker Phase 5 — Final Hour QA

## Required transformation proof

```text
sealed hand
→ apprentice releases it
→ red thread becomes minute hand
→ master clock starts
→ city receives synchronized time
```

## Contact constraints implemented

- [x] MasterClock exposes `releaseAnchor` at sealed-hand tip.
- [x] MasterClock exposes `threadAnchor` at final red-hand tip.
- [x] Apprentice right-hand anchor aligns with release/thread targets through the respective action windows.
- [x] Pocket watch is visible during approach and brightens with clock strike.
- [x] City disagreement moves toward synchronization on strike.

## Browser QA required

- [ ] Verify hand contact at sealed hand around 30–50% scroll.
- [ ] Verify thread contact and red minute-hand transition around 50–78% scroll.
- [ ] Verify master dial/city consequence reads in final pullback.
- [ ] Scrub 0→100→0 and verify red hand/thread restore without popping.
- [ ] Capture approved 0/25/50/75/100 screenshot baselines.
- [ ] Check reduced-motion and low-DPR variants.
