# Clockmaker Phase 2R — production foundation rewrite QA

## Status

The previous Clockmaker scene pages are archived blockouts. They are not production chapters and must not be expanded.

## New production systems

| System | Requirement | Status |
|---|---|---|
| ClockworkPaperKit | Shared painted paper, brass, enamel, walnut materials plus reusable world factories | Implemented |
| ClockmakerApprentice | Cut-paper hierarchy, anchors, cloth/satchel secondary response, production action API | Implemented |
| MaterialTimeReversal | Reversible object transform plus surface/material reconstruction | Implemented |
| Unified runtime | One canvas, six chapter router, story transitions, narration, smoke/visual QA | Pending |
| Rebuilt Remembered Hour | First full production scene using the new systems | Pending |

## Foundation acceptance checks

- [x] New kit contains gears, faces, pendulums, blueprints, thread, bench, buildings, and train.
- [x] New apprentice exposes both hand, both foot, key, watch, and thread anchors.
- [x] Material reconstruction uses local scroll progress and does not replay elapsed time.
- [x] Old scene stubs are explicitly prohibited from reuse as production scenes.
- [ ] New systems mounted into a unified Clockmaker story shell.
- [x] Remembered Hour rebuilt against `ch04-memory-keyframe.png` with production assets.
- [x] Production runtime screenshot/scrub harness added for Chapter IV.
- [ ] Review five candidate production screenshots against the keyframe.
- [ ] Approve and commit production Remembered Hour baseline frames.
