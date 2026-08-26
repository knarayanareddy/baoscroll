# Sequential Prompt 2 — Clockmaker Apprentice production expansion

## Instruction

> Expand the Clockmaker Apprentice to **Keeper-level action/contact depth**. Use Section 3 of `stories/clockmaker/QA_DESIGN_COMPLETENESS.md` as the definition of done. Rebuild the production Apprentice rig with the required body hierarchy, props, contact shadow/air state, anchors, action API, and force/secondary-motion behavior. Integrate exact anchor-driven contacts for key winding, tool repair, pendulum catch, gear climb, watch holding, red-thread placement, minute-hand placement, and final watch placement. Add deterministic contact validation to the Clockmaker smoke tests. Do not move to the next task until every contact contract is implemented and testable.

---

## Scope

Only touch Clockmaker Apprentice systems and direct contact integrations. Do not begin shader, narration, scene art, or unrelated Lighthouse/Bao work.

## Required production rig

### Body hierarchy

```text
body root
head / gaze
hair silhouette
coat body
coat tail panels
rolled sleeves
satchel
key ring
thread spool
left/right shoulder
left/right elbow
left/right hand
left/right hip
left/right knee
left/right foot
contact shadow
```

### Required anchor API

```js
apprentice.leftHand
apprentice.rightHand
apprentice.leftFoot
apprentice.rightFoot
apprentice.keyAnchor
apprentice.toolAnchor
apprentice.watchAnchor
apprentice.threadAnchor
apprentice.pendulumGripAnchor
apprentice.gearFootAnchor
apprentice.minuteHandAnchor
```

Backward-compatible aliases required by current scenes:

```js
apprentice.left.anchor
apprentice.right.anchor
apprentice.leftLeg.anchor
apprentice.rightLeg.anchor
```

### Required action API

```js
idle
walk
run
windKey
repair
catchPendulum
hangPendulum
climbGear
holdWatch
reachMemory
releaseHand
threadMinuteHand
setWatchDown
lookUp
brace
```

The previous aliases must remain valid:

```js
wind
catch
climb
watch
thread
place
```

### Required contact contract

Each production scene must use a real world-space contact target for:

| Chapter | Hero anchor | Target |
|---|---|---|
| Workshop | keyAnchor | pocket-watch crown |
| City | keyAnchor | street-clock crown |
| City chase | rightHand | loose minute hand |
| Gear Tower | both hands / pendulumGripAnchor | pendulum grip |
| Gear Tower | alternating feet / gearFootAnchor | moving gear teeth |
| Remembered Hour | watchAnchor | inherited pocket watch |
| Final Hour release | minuteHandAnchor | sealed hand anchor |
| Final Hour thread | threadAnchor | red minute-hand thread anchor |
| New Clock Ticks | leftHand | final watch/blueprint anchor |

## Force and secondary-motion requirements

`setForce(force, time, direction)` must drive:

```text
coat tail panels
satchel swing
key ring
thread spool
pocket-watch chain
held prop sway
contact shadow
```

## Determinism rules

- Poses are pure functions of action, time, phase, and force.
- Contact uses actual anchor world positions plus a computed correction delta.
- No per-frame allocations in hot contact loops.
- Reversing scroll restores the same hero/prop state exactly.

## Completion evidence

- [ ] All required anchors exist and are documented.
- [ ] All required actions are implemented and aliases work.
- [ ] All nine scene contact contracts are anchor-driven.
- [ ] Contact distance is recorded in scene debug state.
- [ ] Smoke test checks finite contact state / contact distance thresholds.
- [ ] Low-DPR and reduced-motion behavior preserve readable action.
- [ ] Build and syntax checks pass.
- [ ] Browser screenshot review requirements are documented.
