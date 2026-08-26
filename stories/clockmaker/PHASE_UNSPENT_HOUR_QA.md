# Clockmaker Unspent Hour cross-chapter QA

## Implemented moods

| Chapter | Mood | Attachment |
|---|---|---|
| Workshop Wakes | dormant | master clock |
| City Disagrees | discordant | street repair clock |
| Impossible Gear Tower | hostile | fractured minute-hand chamber |
| Remembered Hour | remembering | inherited pocket watch |
| Final Hour | releasing | master clock |
| A New Clock Ticks | resolved | inherited pocket watch |

## Automated gates

- [x] One shared `UnspentHour` production component exists.
- [x] Each production chapter creates and updates an instance.
- [x] Each chapter has named mood, particle budget, attachment point, and reversible progress state.
- [x] `clockmaker-unspent-hour-smoke.mjs` checks six mood states, finite particles, and reverse chapter traversal.
- [ ] Browser visual review confirms every manifestation is distinct and does not obscure contact composition.
- [ ] Screenshot baselines show all six antagonist manifestations.

## Browser execution

```bash
npm run preview -- --host 127.0.0.1 &
CLOCKMAKER_PRODUCTION_URL=http://127.0.0.1:4173/stories/clockmaker/production/?dpr=1&quality=low \
  node scripts/clockmaker-unspent-hour-smoke.mjs
```
