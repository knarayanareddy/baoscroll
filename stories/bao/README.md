# Bao narration anthology module

This module adds chapter-addressed narration to a Bao-compatible scroll story without copying the source project's narration, voice asset, or unlicensed source code.

## Assets

Voice clips are in:

```text
public/audio/narration/bao/
```

Each clip is original Lighthouse anthology production audio and maps one-to-one to Bao's six chapter indices.

## Integration

```js
import { BaoNarrationAdapter } from './stories/bao/NarrationAdapter.js';

const narration = new BaoNarrationAdapter(experience.audio);

// in the story tick, after global scroll is mapped to chapter/local progress
narration.update(chapterIndex, localProgress);

// from a user-gesture voice button
narration.setEnabled(true);

// when story animation is paused
narration.setPaused(true);
```

The adapter always starts the narration for the current chapter. Entering a new chapter stops the active line and starts the corresponding chapter line; returning to a previous chapter starts that chapter's line again.

## Rights boundary

This package does not include the third-party Bao runtime, its source assets, its original narration, or any imitation of a third-party narrator. It is an original narration integration layer for an anthology module that has access to a Bao-compatible runtime.
