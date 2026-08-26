# Sequential Prompt 5 — Clockmaker validation, baselines, and budgets

## Instruction

> Implement the complete **Clockmaker browser QA, screenshot baseline, pixel-diff, and performance budget system** from Section 6 of `stories/clockmaker/QA_DESIGN_COMPLETENESS.md`. Add the six required production smoke scripts, candidate screenshot capture, approved baseline folder structure, pixel-diff enforcement, CI Chrome installation, and low/medium/high quality performance budget reporting/enforcement. Do not use placeholder or fake baseline images. If screenshots cannot be captured in the environment, build the complete harness and document the exact approval action needed. Do not move to the next task until all automatable QA infrastructure is complete.

---

## Required executable outputs

```text
scripts/clockmaker-production-smoke.mjs
scripts/clockmaker-production-workshop-smoke.mjs
scripts/clockmaker-production-city-smoke.mjs
scripts/clockmaker-production-tower-smoke.mjs
scripts/clockmaker-production-remembered-hour-smoke.mjs
scripts/clockmaker-production-final-hour-smoke.mjs
scripts/clockmaker-production-dawn-smoke.mjs
scripts/clockmaker-production-visual-regression.mjs
stories/clockmaker/performance-budgets.json
stories/clockmaker/visual-baselines/
```

## Smoke contract

Each chapter smoke command must:

1. launch the production shell in a browser with `?dpr=1&quality=low`;
2. scroll to chapter-local 0/25/50/75/100 points;
3. capture candidate screenshots;
4. capture draw calls/triangles/active chapter/contact debug data;
5. scrub 100→0;
6. fail on browser/page/console/request errors;
7. fail on non-finite state or broken chapter-specific contact state;
8. enforce the configured budget for the selected quality tier.

## Visual-baseline contract

```text
candidate screenshots
→ human visual approval
→ committed approved baseline PNGs
→ pixel diff produces artifacts
→ warning above 2%
→ failure above 4%
```

No AI art keyframe, placeholder image, or synthetic fake screenshot may be used as a runtime baseline.

## Quality budget contract

Every chapter has measured budgets for:

```text
draw calls
triangles
particles
```

for:

```text
low
medium
high
```

Budgets begin as provisional ceilings, then are tightened only after approved real-browser capture.

## Completion evidence

- [ ] All six smoke scripts are generated from one generic production harness.
- [ ] All six chapter-specific assertions exist.
- [ ] Candidate directory structure exists and is ignored by Git.
- [ ] Approved baseline structure exists and is tracked by Git.
- [ ] Pixel diff has 2% warning / 4% failure thresholds.
- [ ] Budget report and enforcement work for low/medium/high.
- [ ] CI workflow installs Chrome, runs smoke, captures candidate/diff artifacts.
- [ ] Local browser limitation and exact approval procedure are documented if Chrome is unavailable.
