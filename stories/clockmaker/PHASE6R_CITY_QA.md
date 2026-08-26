# Clockmaker City Disagrees — Production QA

## Required production proof

```text
city clocks disagree
→ apprentice repairs street-clock crown
→ bridges/train react
→ loose minute hand escapes
→ red route points toward tower
```

## Implemented

- [x] 64 miniature buildings, 21 street clocks, grid map, train, bridges, street clock, loose minute hand, tower horizon, dust, and city lighting.
- [x] Key anchor aligns to real street-clock crown.
- [x] Apprentice right hand follows loose minute-hand anchor during chase.
- [x] City clock, bridge, building, and train states are tied to repair progress.
- [x] Red thread route only appears in the tower-route window.
- [x] Six-shot city camera path from overhead model to tower reveal.

## Required visual approval

- [ ] Screenshot 0/25/50/75/100 against `ch02-city-keyframe.png`.
- [ ] Verify key/crown contact and loose-hand chase staging.
- [ ] Verify city reads as tabletop model before tower reveal.
- [ ] Reverse scrub without route/bridge/city drift.
- [ ] Low-DPR and reduced-motion validation.
