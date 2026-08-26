# Clockmaker Apprentice action/contact QA

## Implemented rig

- [x] Body, head/gaze, hair, coat body, coat tail panels, rolled sleeves, satchel, key ring, thread spool, pocket-watch chain, arms/elbows/hands, hips/knees/feet, and contact shadow.
- [x] Required anchors plus scene-compatible aliases.
- [x] Required action API plus legacy aliases.
- [x] Force response drives coat, satchel, key ring, thread spool, and watch chain.
- [x] Contact snapshots are emitted into every production scene `debugState`.
- [x] `clockmaker-apprentice-contacts-smoke.mjs` validates crown, pendulum, gear foot, watch, release-hand, thread, and set-down contact distances.

## Browser approval still required

- [ ] Review all action silhouettes at contact screenshot milestones.
- [ ] Check alternating feet during gear climb at frame level.
- [ ] Check two-hand pendulum contact and two-hand thread placement visually.
- [ ] Validate force motion on low-DPR and reduced-motion settings.
