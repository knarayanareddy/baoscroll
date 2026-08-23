# The Lighthouse That Remembered Names — production plan

## Product intent

A six-chapter, scroll-scrubbed interactive sea fable. The reader does not watch a linear video: their position in the document is the reversible story clock. Moving down the page raises the tide and reveals the sea's stolen memories; moving upward drains the coast and restores the harbor exactly.

**Narrating voice:** the lighthouse, an old keeper with dry warmth. The writing is intimate rather than explanatory: it witnessed the sailors, maintains the book, resists the storm, and finally understands that remembering means releasing.

## Emotional spine

| Chapter | Reader feeling | Story movement | Visual state |
|---|---|---|---|
| I. Harbor at Dusk | Safety and curiosity | The keeper introduces its duty. | Mineral blue dusk, warm windows, quiet water. |
| II. The First Name | Unease | Elias Rune vanishes from the book. | A red ink line begins to erase a name. |
| III. The Storm Wall | Threat and resolve | The sea demands the remaining names. | Ink-black wave wall, rain, rotating but weakened beam. |
| IV. What the Water Kept | Wonder and grief | The keeper finds memories under the water. | Rising tide, floating name cards, wreck silhouette, fog. |
| V. The Lamp Rekindled | Catharsis | The keeper makes the beacon a vessel for names. | Full warm rotating beam cuts through weather. |
| VI. Birds of Morning | Release | Names leave as birds, carried into daylight. | Peach dawn, birds, receding dark water. |

## Visual system

- **Material language:** watercolor washes, translucent fog, wet ink darkness, weathered paper grain, pale lamp-gold.
- **Primary composition:** fixed canvas plus six semantic scroll sections. The UI acts as restrained nautical book design, not an app dashboard.
- **Depth:** distant coast and village, foreground pier, lighthouse cliff, water surface, underwater memory plane, fog, rain, vignette and grain.
- **Signature transition:** the lighthouse beam rotates continuously. It begins as an imperfect warning and becomes a powerful narrative instrument when the beacon reignites.
- **Color journey:** dusk blue → ink/navy storm → blue-green abyss → lamp gold → peach and cream dawn.

## Interaction contract

1. Scroll is the canonical timeline; no chapter state depends on one-time events.
2. Forward scroll raises the waterline. Reverse scroll lowers it.
3. Underwater memories, wrecks, storm density, the lamp beam, and bird release use only normalized progress and time, so they remain reversible.
4. Pointer position produces a small lighthouse parallax shift; it is suppressed in reduced-motion mode.
5. Sound is opt-in after a user gesture. It uses a procedurally generated low wind bed, so no recording downloads are required.

## Implemented MVP

- Responsive full-viewport Canvas 2D renderer with DPR cap.
- Six authored chapter beats, narrated copy, chapter progress and book UI.
- Procedural coast, houses, lighthouse, beam, sea waves, rain, fog, underwater name cards, wreck, stars and dawn birds.
- Opt-in Web Audio wind ambience.
- System-motion preference support plus a user-controlled soft-motion toggle.
- Semantic chapter headings for screen-reader navigation and a no-JS story fallback.
- Static Vite build suitable for GitHub Pages or any static host.

## Next production passes

### Narrative
- Commission/author a complete 900–1,400 word transcript and make it available in a dedicated read mode.
- Record a warm older narrator; provide captions and a mute-by-default mix.
- Name sailors consistently and attach each to a specific recovered visual memory.

### Art
- Replace procedural grain with licensed scanned cotton-paper textures.
- Add hand-painted harbor, wreck, and lighthouse texture sets; retain generated fallback visuals.
- Introduce layered glass refraction and ink-in-water distortion shaders if moving to WebGL.
- Add a true logbook interaction: chapter pages, marginalia, dates and recovered objects.

### Engineering
- Move the Canvas renderer into scene modules, with a `StoryManifest` shared by future anthology stories.
- Add Playwright scroll screenshots at every chapter midpoint and a mobile device matrix.
- Use dynamic scene loading and adaptive quality based on frame time for WebGL versions.
- Add analytics/error capture only after a privacy review and consent design.

## Success criteria

- The story is understandable with visuals disabled through a transcript/read path.
- On a typical mobile device, scrolling remains responsive and the first meaningful frame appears quickly.
- Readers can scrub in either direction without discontinuities in tide, transition, or narrative state.
- The final dawn creates a distinctly different emotional and visual payoff from the initial harbor.
