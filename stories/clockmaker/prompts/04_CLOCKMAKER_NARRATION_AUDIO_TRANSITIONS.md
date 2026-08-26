# Sequential Prompt 4 — Clockmaker narration, audio, and transitions

## Instruction

> Build the full **Clockmaker narration/audio/transition system** using Section 5 of `stories/clockmaker/QA_DESIGN_COMPLETENESS.md` as the completion contract. Implement a pocket-watch narrator, user-gesture opt-in, chapter-addressed voice clips, captions, aria-live text, ambient ducking, pause/mute support, read-mode transcript, and the five specified reversible transition languages. Use original Clockmaker scripts and a legally distinct narration voice. Do not copy Lighthouse or Bao narration assets/identity. Do not move to the next task until every audio/narration/transition QA check is implemented and tested.

---

## Scope boundary

Only modify Clockmaker production narration, audio, transition, caption/read-mode UI, voice assets, tests, and QA documentation.

## Required architecture

```text
ClockmakerAudioController
├── procedural workbench tick / spring bed
├── city clock / train / bridge bed
├── tower gear / pendulum bed
├── memory reverse / mentor-light bed
├── master clock strike / red thread cue
└── dawn civic rhythm bed

ClockmakerNarrationController
├── user-gesture opt-in
├── chapter-addressed cue
├── chapter-change interruption
├── caption overlay
├── aria-live output
├── ambience ducking
├── pause/mute integration
└── read transcript state

ClockmakerTransitionController
├── blueprint fold
├── city grid lift
├── minute-hand fracture
├── fragment-to-thread converge
└── strike-wave-to-dawn
```

## Required chapter narration lines

| Chapter | Cue |
|---|---|
| Workshop | “The first spring was not broken. It was waiting.” |
| City | “Every clock had chosen a different way to be afraid.” |
| Tower | “Above the city, a second could become a fall.” |
| Memory | “The past came back perfectly, except for the part that mattered.” |
| Final | “An hour cannot be kept. It can only be given its place.” |
| Dawn | “The city did not remember the goodbye. It remembered the rhythm.” |

## Required QA

- [ ] Narration starts only through a user gesture.
- [ ] Current chapter line starts immediately when narration is enabled.
- [ ] Prior line stops at every chapter boundary.
- [ ] Captions and aria-live text exactly match active line.
- [ ] Ambience ducks and restores smoothly.
- [ ] Pause/mute handle narration and ambience coherently.
- [ ] Read mode has equivalent complete story content.
- [ ] All five transitions reverse correctly.
- [ ] Browser smoke validates no overlapping audio/caption state.
- [ ] Low-DPR/reduced-motion state retains story meaning.
