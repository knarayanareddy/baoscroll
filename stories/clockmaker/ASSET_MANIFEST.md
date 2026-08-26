# Clockmaker painted asset manifest

| File | Material key | Scenes | Runtime use | Fallback |
|---|---|---|---|---|
| `blueprint-paper.webp` | paper | I–VI | blueprint, paper, route material map | generated paper canvas |
| `brass-base.webp` | brass | I–VI | brass gear/housing/key map | generated brass canvas |
| `brass-verdigris-mask.webp` | brass mask | I–VI | seam/wear registry input | static brass color |
| `brass-scratch-mask.webp` | brass scratch | I, III, V | gear/pendulum/brass wear input | static brass color |
| `brass-strike-glow-mask.webp` | strike glow | V, VI | strike material input | additive tick wave |
| `enamel-base.webp` | enamel | I–VI | dial/enamel material map | generated enamel canvas |
| `enamel-fracture-mask.webp` | enamel fracture | III, V | fracture/heal shader source | procedural fracture shader |
| `enamel-heal-mask.webp` | enamel heal | V | thread-driven enamel repair overlay | procedural heal shader |
| `blueprint-fold-mask.webp` | blueprint fold | I–III | fold transition source | procedural fold shader |
| `blueprint-tear-mask.webp` | blueprint tear | I–IV | tear/fold registry input | procedural fold shader |
| `blueprint-route-mask.webp` | blueprint route | I–III | route overlay input | red thread fallback |
| `clock-face-atlas.webp` | clock atlas | I–VI | refined face atlas / future UV mapping | generated dial geometry |
| `tool-atlas.webp` | workshop tools | I, IV, VI | bench tool cards | generated workshop atlas |
| `time-fracture-noise.webp` | time fracture | I–V | Unspent Hour / fracture source | procedural time shader |
| `city-roof-window-atlas.webp` | city atlas | II, III, V, VI | city roof/window source | production kit building materials |
| `clock-numeral-mask.webp` | numeral mask | I–VI | clock-face registry input | generated dial ticks |
| `clock-shadow-mask.webp` | clock shadow | I–VI | clock-face registry input | generated dial shadow |
| `gear-pendulum-wear-mask.webp` | gear wear | I, III, V | gear overlay material input | static brass wear |
| `oil-stain-mask.webp` | oil stain | I, III, V | pivot/gear registry input | static walnut/brass color |
| `clockwork-dust.webp` | dust sprite | I–VI | particle registry input | procedural motes |

All images are original Clockmaker production assets generated for this repository; none contain third-party IP, logos, or copied character imagery.

## Missing final-source assets

The rubric additionally calls for dedicated scratch, strike-glow, tear, route, numeral, smoke, and gear-wear masks. Current procedural/shader fallbacks remain active until those specific painted masks are generated and integrated in a later asset capture pass.
