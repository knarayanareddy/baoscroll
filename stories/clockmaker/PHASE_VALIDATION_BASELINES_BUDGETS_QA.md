# Clockmaker validation, baseline, and budget QA

## Implemented automation

- [x] Generic production browser smoke harness.
- [x] Six chapter-specific smoke entry scripts.
- [x] Forward/reverse scrub and finite-state assertions.
- [x] Candidate screenshot folders for all six chapters.
- [x] Approved baseline folder structure tracked with `.gitkeep`.
- [x] Pixel-diff engine: 2% warning, 4% failure.
- [x] Per-chapter low/medium/high draw-call, triangle, and particle budget file.
- [x] GitHub Actions workflow with Chrome installation, build, six smoke runs, and artifact upload.

## Approval procedure

1. Run Clockmaker QA on a Chrome-enabled environment.
2. Review candidate screenshots in `stories/clockmaker/visual-baselines/candidates/<chapter>/`.
3. Move approved candidates into `stories/clockmaker/visual-baselines/<chapter>/`.
4. Commit approved runtime PNGs.
5. Re-run smoke: pixel diffs now enforce warning/failure thresholds.
6. Replace provisional budget ceilings with captured approved profile values.

## Browser limitation

This sandbox cannot currently download Puppeteer Chrome due TLS/network restrictions. No fake or art-bible images are committed as baselines. Candidate capture and CI workflow are implemented; browser approval remains the only pending manual step.
