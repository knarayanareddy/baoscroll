# Clockmaker Phase 2 — system QA

## Delivered systems

| System | Contract | QA status |
|---|---|---|
| ClockworkKit | Gear, clock face, pendulum, blueprint, red thread factories | Pass: all repeatable scene assets originate from one kit. |
| Apprentice | Action rig with hand, foot, watch, key and thread anchors | Pass: every planned interaction has a named contact anchor. |
| PocketWatch | Dial, crown, hands, light and glow | Pass: time/power are deterministic values. |
| TimeReversalSystem | Broken-to-whole transform reconstruction | Pass: local progress interpolates state with no one-time events. |
| MasterClock | Enamel dial, sealed hand, red final hand, light | Pass: final hour and minute-hand placement have explicit runtime state. |
| ClockworkCity | Miniature buildings, clocks and train | Pass: city disagreement is a controllable world response. |

## Static verification

Run before integrating Phase 3 scenes:

```bash
node --check stories/clockmaker/src/ClockworkKit.js
node --check stories/clockmaker/src/Apprentice.js
node --check stories/clockmaker/src/PocketWatch.js
node --check stories/clockmaker/src/TimeReversalSystem.js
node --check stories/clockmaker/src/MasterClock.js
node --check stories/clockmaker/src/ClockworkCity.js
```

## Phase 2 gate

- [x] No scene-specific clock primitive is required for the six planned chapters.
- [x] Apprentice has named anchors for every planned key, thread, watch, hand and foot interaction.
- [x] Time reconstruction is a reversible state system rather than reverse playback.
- [x] Master clock can switch from sealed hand to red minute hand.
- [x] Clockwork city exposes disagreement/synchronization state.
- [ ] Phase 3 benchmark scene integration.
- [ ] Runtime contact tests and screenshot review.
