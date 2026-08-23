# Beacon benchmark review — pass 1

**Reference:** `art-direction/ch05-lamp-keyframe.png`  
**Runtime scene:** `src/scenes/BeaconScene.js`  
**Status:** **Not approved. Do not use as quality bar yet.**

## Review panel

| Lens | Score | What works | Why it fails the Bao / keyframe bar |
|---|---:|---|---|
| Film direction | 3/5 | The climb → turn → ignition chain is understandable. | The camera does not create enough anticipation, close hand detail, or decisive payoff framing. |
| Character animation | 2/5 | Keeper has a climb and wheel-turn pose. | Feet do not convincingly plant on individual steps; hands do not lock to wheel; weight and coat motion are too generic. |
| Environment art | 2/5 | Circular room, weather, lamp and stairs establish place. | Visible primitive geometry and repeated materials do not match the layered watercolor/brass/glass keyframe. |
| Material/effects | 2.5/5 | Rain glass, name stream, prism segments, storm opening are causally connected. | The Fresnel lens lacks prismatic refraction/bloom; storm opening is still plane movement rather than a convincing exterior. |
| Technical direction | 3.5/5 | Scroll state is reversible and the local action windows are explicit. | Scene allocates temporary vectors during name-stream update; no low-tier reduction for rain/name particles. |
| Accessibility | 2/5 | Chapter shell, reduced-motion control, and fallback exist. | No scene transcript/captions describe the keeper's climb, name insertion, wheel turn, or storm opening. |

## Composite

**2.5 / 5.0** — a valid action blockout, not a polished benchmark.

## Highest-impact fixes, in order

### 1. Replace primitive keeper contact with authored anchors

- Add `leftHandAnchor`, `rightHandAnchor`, and `footAnchors` to `Keeper`.
- Build a wheel-grip pose that aligns both hands to wheel handles.
- Parameterize stair positions and snap feet/body progression to step centers.
- Add coat-tail secondary motion from climb/turn velocity.

**Acceptance:** freeze-frame at the wheel must read as a person applying force, not a character standing near a prop.

### 2. Rebuild lens chamber silhouette from the reference

- Replace open ring stack with a large segmented Fresnel silhouette.
- Add chunky brass pedestal, lens housing, rails, glass brackets, and warm rim light.
- Frame the lens as the dominant midground object, with keeper at lower-left / wheel foreground.

**Acceptance:** a still at 70% chapter progress should resemble the reference composition before particles are considered.

### 3. Produce real storm parallax outside glass

- Use three to five illustrated cloud/sea layers with separate depth, not flat rectangles.
- Add brief white spray/lightning flashes and beam-shaped clearing corridor.
- Keep rain on glass and exterior rain as separate systems.

**Acceptance:** storm opening reads through window depth and beam direction, not as objects fading.

### 4. Camera polish

- Use at least six camera keyframes, including low stair follow, over-shoulder wheel shot, close lens-core insert, and final exterior-through-glass release.
- Add constrained FOV changes rather than a single broad orbit.

### 5. Narrative and accessibility layer

- Add per-beat caption/transcript text tied to progress ranges.
- Reduced motion switches stair movement to static stepped poses and suppresses flashing/spray.

## Review pass 2 — after interaction/material/camera updates

| Lens | Pass 1 | Pass 2 | Assessment |
|---|---:|---:|---|
| Film direction | 3/5 | 3.5/5 | Climb, turn, alignment and storm opening now have a readable causal chain; the final composition needs more breathing room. |
| Character animation | 2/5 | 3/5 | Step grounding, wheel-grip motion and force response improve readability, but there is still no genuine hand IK or coat simulation. |
| Environment art | 2/5 | 2.5/5 | Rain glass and storm layers help; primitive stairs/floor/housing remain visibly blockout-level. |
| Material/effects | 2.5/5 | 3.5/5 | Prismatic lens, rain glass, routed names, core bloom, and painted storm depth now cooperate. Beam needs actual light scattering on objects. |
| Technical direction | 3.5/5 | 3.5/5 | Reversibility remains intact. Remove temporary vector allocations in name-stream update before final benchmark signoff. |
| Accessibility | 2/5 | 2/5 | Still blocked: no beat transcript/caption layer and no Beacon-specific reduced-motion staging. |

**Composite: 3.0 / 5.0 — improved action prototype, still not benchmark-ready.**

## Gate result

**Rejected for benchmark status.** The next work must not move to another chapter until these blockers are addressed:

1. Replace blockout architecture (floor, staircase, lens pedestal) with the reference's shaped, textured, layered silhouette.
2. Add exact keeper-to-wheel contact (IK or authored contact offsets), plus a reference-quality turn keyframe.
3. Add a chapter transcript/read mode and reduced-motion staging.
4. Add beam-scattering light cards on rails, floor, keeper coat and rain-glass—not only a cone and point light.

## Review pass 3 — after architecture, surface, beam and accessibility work

| Lens | Pass 2 | Pass 3 | Assessment |
|---|---:|---:|---|
| Film direction | 3.5/5 | 4/5 | The action chain is now unambiguous: climb, grip, align, gather, release, storm opening. The exterior consequence needs a stronger final shot. |
| Character animation | 3/5 | 3/5 | Design silhouette, step grounding, turn rhythm and force motion improve the read. Exact hand grip/foot IK and better body deformation remain unresolved. |
| Environment art | 2.5/5 | 3/5 | Layered floor, rails, pedestal, braces and painted storm add authored structure. The room remains visibly procedural rather than keyframe-quality. |
| Material/effects | 3.5/5 | 3.75/5 | Paper grain, rain glass, prisms, name routing, scatter cards and storm parting form one material story. Beam still needs cast-light and volumetric occlusion. |
| Technical direction | 3.5/5 | 4/5 | Reversible local state remains sound; name-stream allocation issue is removed. Add a low-tier cap for scatter/name particle counts. |
| Accessibility | 2/5 | 3.5/5 | Beat narration and reduced-motion staging now exist. A permanent transcript/read mode is still required. |

**Composite: 3.55 / 5.0 — acceptable vertical slice, not yet the visual benchmark.**

## Gate result

**Conditionally accepted as the interaction benchmark; rejected as the final visual benchmark.**

The scene now demonstrates the correct Lighthouse grammar and may inform Wreck Memories, but Beacon must return for a final art pass after the following work:

1. Character hand/foot contact refinement and coat deformation.
2. Illustrated texture set / art-directed geometry replacement for stair, floor, housing and rails.
3. Beam cast-light and haze/occlusion pass.
4. Transcript/read mode shared across all chapters.
5. Exterior final release shot with a readable opened-storm vista.

## Exit condition

Beacon may become the project visual benchmark only when every review lens is **4/5 or above** and film direction/character animation both reach **5/5**.
