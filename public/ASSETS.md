# Production asset drop-in guide

The experience ships fully procedural. Each row is a straight swap — keep the
cache/loader name, replace the generator with a file load, and everything
downstream is untouched.

## Textures → `/public/textures/`

| Cache name | Asset type | Resolution | Format | Loaded in |
| --- | --- | --- | --- | --- |
| `paper` | scanned washi / rice paper, tileable | 1024×1024 | WebP | `src/core/AssetLoader.js` → `paper()` |
| `cloud` | soft cloud cutout with alpha | 512×512 | PNG | `AssetLoader.cloud()` |
| `glow` | radial glow sprite | 256×256 | PNG | `AssetLoader.glow()` |
| `inkblot` | wet ink blot with alpha | 512×512 | PNG | `AssetLoader.inkblot()` |
| `shard` | torn paper scrap with alpha | 256×256 | PNG | `AssetLoader.shard()` |
| `streak` | loose brush streak | 512×64 | PNG | `AssetLoader.streak()` |
| `glyph0..3` | brush calligraphy strokes (abstract) | 256×256 | PNG | `AssetLoader.glyph()` |
| `koi` | painted koi body | 512×512 | WebP | `AssetLoader.koi()` |

## Models → `/public/models/`

| File | Asset type | Budget | Format | Loaded in |
| --- | --- | --- | --- | --- |
| `bao.glb` | rigged Bao (walk/run/jump/climb/sit clips) | < 2 MB, < 15k tris | glTF + Draco | `src/characters/Bao.js` (map clips onto the `setPose` API) |
| `guardian.glb` | ink guardian with blendshape "mood" | < 3 MB | glTF + Draco | `src/characters/InkGuardian.js` |

## Audio → `/public/audio/`

| File | Asset type | Spec | Loaded in |
| --- | --- | --- | --- |
| `wind.ogg` | looping wind bed | 44.1 kHz, −18 LUFS, seamless loop | `src/core/AudioController.js` (wind gain node) |
| `water.ogg` | looping river bed | same | `AudioController` (water gain node) |
| `chimes.ogg` | sparse chime/pluck one-shots | same | `AudioController._pluck()` |

## Fonts → `/public/fonts/`

| File | Asset type | Format | Loaded in |
| --- | --- | --- | --- |
| display webfont | licensed brush/fude display face | WOFF2 | `@font-face` in `src/styles/global.css` (`--font-display`) |

## Images → `/public/images/`

Reserved for og-image / favicon set (1200×630 JPG + 512px PNG favicon).
