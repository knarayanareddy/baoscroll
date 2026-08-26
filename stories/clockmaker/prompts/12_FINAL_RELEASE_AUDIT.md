# Sequential Prompt 12 — Clockmaker final release audit

## Instruction

> Conduct the **Clockmaker final release audit** using Section 8 of `stories/clockmaker/QA_DESIGN_COMPLETENESS.md`. Review all six production chapters across narrative, character, environment, camera, material/effects, technical, and accessibility lenses. Run all browser smoke tests, pixel diffs, budgets, quality tiers, narration/read mode checks, and full 0→100→0 scrub. Fix every failed criterion. Do not declare Clockmaker complete until every release-gate checkbox has evidence of completion.

---

## Required audit artifacts

```text
stories/clockmaker/FINAL_RELEASE_AUDIT.md
scripts/clockmaker-release-audit.mjs
stories/clockmaker/visual-baselines/<chapter>/00..100 PNGs
artifacts/clockmaker-visual-diff/
stories/clockmaker/performance-budgets.json
```

## Review lenses

| Lens | Required proof |
|---|---|
| Narrative | Hero goal, Unspent Hour obstacle, and consequence legible at each chapter milestone |
| Character | Contact anchors, action silhouette, force response, prop behavior reviewed in screenshots |
| Environment | Unique spatial proposition and material response per chapter |
| Camera | No collision/occlusion at five milestone shots per chapter |
| Material/effects | Clockmaker systems clarify story, reverse correctly, and survive low quality tier |
| Technical | All smoke tests, budgets, finite-state checks, quality tiers, and reverse scrubs pass |
| Accessibility | Narration, captions, read mode, pause/mute, reduced motion, and keyboard dialog flow pass |

## Release gate

Clockmaker cannot be marked complete until:

- [ ] All six chapters have approved screenshot baselines.
- [ ] All six chapter smoke scripts pass in Chrome CI.
- [ ] Pixel diffs pass under threshold.
- [ ] All low/medium/high budgets are measured and enforced.
- [ ] All seven review lenses score at least 4/5 for every chapter.
- [ ] Full 0→100→0 scrub is clean.
- [ ] No open visual/contact/camera QA blocker remains.
