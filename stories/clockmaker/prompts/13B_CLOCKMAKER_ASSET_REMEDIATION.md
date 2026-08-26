# Clockmaker painted asset remediation prompt

## Instruction

> Remediate every remaining gap in the Clockmaker painted asset rubric. Use `stories/clockmaker/prompts/13_CLOCKMAKER_PAINTED_ASSET_RUBRIC.md`, `stories/clockmaker/ASSET_MANIFEST.md`, and `stories/clockmaker/PHASE_ASSET_PACK_QA.md` as the completion contract. Create the missing mask families, integrate them through the centralized Clockwork asset registry, connect each mask to its production material/effect scene hooks, enforce format and size budgets, add asset-fetch validation across all six chapters and quality tiers, and update the manifest and QA evidence. Do not move to another task until every gap below is complete or any unavailable browser-only evidence is precisely documented.

## Required missing assets

```text
brass-scratch-mask
brass-strike-glow-mask
enamel-heal-mask
blueprint-tear-mask
blueprint-route-mask
clock-numeral-mask
clock-shadow-mask
gear-pendulum-wear-mask
oil-stain-mask
clockwork-dust sprite
```

## Required integration

| Mask | System hook |
|---|---|
| Brass scratch / verdigris | brass material registry, gear/pedulum/master clock surfaces |
| Brass strike glow | Final Hour strike propagation |
| Enamel heal | Final Hour / MasterClock enamel healing |
| Blueprint tear / route | Workshop fold, City route, Tower ribbons |
| Clock numeral / shadow | clock-face atlas variants and Unspent Hour dial |
| Gear wear / oil | Workshop, Gear Tower, Final Hour gear train |
| Dust sprite | Gear Tower, Remembered Hour, Final Hour, Dawn particles |

## Asset rules

- Original Clockmaker-only material language; no third-party/copy assets.
- WebP for base/masks unless alpha quality requires PNG.
- Base ≤350 KB; mask ≤180 KB; atlas ≤700 KB; particle ≤100 KB.
- Load via `ClockworkPaperKit`/asset registry only; no ad hoc scene fetch.
- All masks have procedural fallback.
- Effects must reverse deterministically with local scroll progress.

## Done rubric

- [ ] All ten assets exist, are optimized, and are listed in the manifest.
- [ ] Registry exposes typed keys and fallback textures.
- [ ] Workshop, City, Tower, Remembered Hour, Final Hour, and Dawn each use required new mask hooks.
- [ ] Browser smoke reports no failed texture request at low/medium/high.
- [ ] Asset byte budgets pass.
- [ ] Candidate screenshots show material contribution without seams/overlays obscuring contact.
- [ ] Remaining browser-only evidence, if unavailable, is documented without fabricating baselines.
