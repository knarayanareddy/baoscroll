# Clockmaker Phase 3 runtime QA

## Multi-page runtime

The benchmark is a separate Vite entry:

```text
/stories/clockmaker/
```

It mounts a dedicated `ClockmakerExperience` instead of borrowing Lighthouse scene state.

## Verification completed

- [x] `npm run build` emits Lighthouse and Clockmaker HTML entries.
- [x] Clockmaker benchmark has its own fixed WebGL canvas and 720vh scroll track.
- [x] Scroll progress routes directly to `RememberedHourScene.update(progress, time, dt)`.
- [x] Camera state is controlled by phase-three shot keyframes.
- [x] Benchmark has visible progress and current beat copy for review.
- [x] Time reconstruction, mentor memory, watch contact, red-thread state, and collapse are present in one runtime scene.

## Browser QA required before art approval

- [x] Automated scrub 0→100→0 validates finite reconstruction state.
- [x] Automated milestone assertions validate mentor, red-thread and fragment state.
- [ ] Verify apprentice hand/watch contact visually at the resistance beat.
- [ ] Verify camera does not clip bench, mentor, or fragment field.
- [ ] Review and approve candidate screenshots at 0/25/50/75/100.
- [ ] Check physical mobile viewport and reduced-motion preference.

## Automated capture

```bash
npm run preview -- --host 127.0.0.1 &
CLOCKMAKER_URL=http://127.0.0.1:4173/stories/clockmaker/?dpr=1 npm run clockmaker:smoke
```

The smoke command writes five candidate frames to:

```text
stories/clockmaker/visual-baselines/candidates/
```

Approved images must be moved into `stories/clockmaker/visual-baselines/` and committed before Phase 3 can be marked visually approved.

## Launch

```bash
npm run dev
# open /stories/clockmaker/
```
