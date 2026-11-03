# baoscroll — remediation plan

Source findings: [./REVIEW.md](./REVIEW.md)

Planned only. No commands below were executed in this review session. Keep or strengthen existing gates.

## Phase 0 — baseline and historical failure triage
**Entry criteria:** pinned-SHA review accepted; owner approves read-only Actions/Pages access if deeper triage is wanted.  
**Exit criteria:** each sampled failed run is tied to its own SHA, with cause observed or honestly left unknown.

**BAO-T1** — historical deploy triage ([BAO-1](./REVIEW.md#3-findings-ledger))  
Prerequisites: owner-approved read-only access to Actions/Pages logs.  
Observed paths: `.github/workflows/deploy.yml`; `evidence/baoscroll/snapshot.json` run metadata.
1. Pull the three sampled failed runs separately and record them as `33737340624 @ 87fe...`, `33016450713 @ 8bb6...`, and `32665891903 @ 51ef...` before drawing any cross-run conclusion.
2. Identify the exact failing step, missing artifact, or missing permission for each run; if the evidence differs by SHA, preserve the differences.
3. If logs still do not explain the failure, state `cause unknown from retained evidence` and list the missing observability.
Expected output: run-history memo with SHA-bound evidence.  
Verification: every claim cites its own run URL and SHA; no failing step is inferred.  
DoD: [ ] each historical run has its own SHA; [ ] cause is evidenced or marked unknown; [ ] missing observability is called out.

## Phase 1 — correct the confirmed bug and settle asset rights
**Entry criteria:** BAO-T1 complete or explicitly blocked.  
**Exit criteria:** the Clockmaker dialog path has a regression plan, and every tracked MP3 has a release disposition plus rights status.

**BAO-T2** — Clockmaker Read/dialog ID repair and regression ([BAO-2](./REVIEW.md#3-findings-ledger))  
Prerequisites: none beyond access to the Clockmaker production source.  
Observed paths: `stories/clockmaker/production/index.html`; `stories/clockmaker/src/productionMain.js`. Proposed path: a regression test or smoke extension under existing Clockmaker browser tooling.
1. Assign unique ids and selectors for the Read trigger and the dialog.
2. Add a browser-level regression for open, Close, Escape, and focus return.
3. Add one deliberate negative control, such as restoring the duplicate id or mutating the dialog selector, and require failure.
Expected output: corrected markup/bootstrap plus a lasting regression for open/close/keyboard/focus return.  
Verification: the positive path passes only when ids/selectors are unique, and the broken variant fails.  
DoD: [ ] unique ids are used; [ ] open/close/Escape/focus-return are checked; [ ] negative control proves the regression is not tautological.

**BAO-T3** — tracked-audio inventory, provenance, and release disposition ([BAO-3](./REVIEW.md#3-findings-ledger))  
Prerequisites: owner input or repository records for audio origin and rights.  
Observed paths: `README.md`; tracked MP3 paths under `stories/sky-garden/public/audio/narration/sky-garden/`. Proposed path: asset inventory/provenance record near existing asset docs.
1. Enumerate each tracked MP3 and classify it as intentionally shipped, tracked-only, replace-before-release, or unknown pending owner evidence.
2. For each intentionally shipped file, record authorship/source, license or permission basis, and target release surface; if evidence is missing, escalate it as unresolved.
3. Update docs so they distinguish runtime-generated claims from tracked assets and say when deployment inclusion remains unverified.
Expected output: per-file audio inventory with rights status and release disposition, plus corrected docs.  
Verification: README and asset records no longer deny the tracked audio files, and no MP3 is treated as releasable without documented rights or an explicit block.  
DoD: [ ] every tracked MP3 has a status; [ ] unknown rights are escalated, not waived; [ ] docs distinguish tracked assets from built/deployed assets.

## Phase 2 — decide shared inputs, then wire the gates
**Entry criteria:** BAO-T2 and BAO-T3 planned or completed.  
**Exit criteria:** shared-input scope is documented before trigger edits, and runtime gating covers the documented preview/browser flow with negative controls.

**BAO-T4** — shared-input decision record for story QA ([BAO-5](./REVIEW.md#3-findings-ledger))  
Prerequisites: none.  
Observed paths: `.github/workflows/clockmaker-qa.yml`; `vite.config.js`; `package.json`; shared scripts under `scripts/`.
1. Review which root-level files can change Clockmaker or other story outputs, including `vite.config.js`, package manifests, shared scripts, and shared runtime/style inputs.
2. Produce a trigger matrix labeling each shared input as retriggered here, covered elsewhere, or manual-only with rationale.
3. Get owner approval on that matrix before changing workflow filters.
Expected output: approved shared-input decision record and trigger matrix.  
Verification: every trigger change points back to an approved matrix row; no root-file coverage is added or omitted by guesswork.  
DoD: [ ] shared inputs are listed; [ ] coverage owner is assigned for each; [ ] trigger edits are blocked until the matrix is approved.

**BAO-T5** — deploy smoke gate and trigger implementation ([BAO-4](./REVIEW.md#3-findings-ledger), [BAO-5](./REVIEW.md#3-findings-ledger))  
Prerequisites: BAO-T4 approved; BAO-T1 available if deploy history exposed workflow limits.  
Observed paths: `.github/workflows/deploy.yml`; `.github/workflows/clockmaker-qa.yml`; `README.md`; `package.json`.
1. Encode the README-described lighthouse smoke sequence in CI: build, browser setup if required, `npm run preview`, readiness check, then browser-driven smoke; do not assume `npm run smoke` is self-contained.
2. Apply the BAO-T4 trigger matrix so Clockmaker PR QA covers approved shared root inputs, or document the stronger parent gate that makes separate path widening unnecessary.
3. Define observable controls for the two gate types separately: (a) a positive trigger control where an approved root-only shared-input change schedules the intended Clockmaker PR check; (b) a trigger negative control where reverting or breaking that approved filter demonstrably omits the expected run or trips a dedicated coverage assertion; and (c) a separate runtime negative control such as a base-path/route mutation for lighthouse smoke.
Expected output: CI/workflow changes that run the documented smoke path before publish and align PR triggers with the approved shared-input map.  
Verification: an approved root-only shared-input change schedules the intended Clockmaker PR check; reverting or breaking that filter either omits the expected run or fails the coverage assertion; and the deliberate route/base-path break fails the runtime smoke gate.  
DoD: [ ] preview/browser setup is part of the planned smoke gate; [ ] trigger changes follow the approved matrix; [ ] a root-only approved shared-input change schedules the intended check; [ ] the broken/reverted filter omits the expected run or fails coverage; [ ] the runtime negative control fails separately.

## Phase 3 — security/provenance gate, restore plan, and independent acceptance
**Entry criteria:** correctness, asset-rights, and trigger/gating tasks are complete or explicitly blocked.  
**Exit criteria:** release cannot proceed without security/provenance evidence, a future restore path, and independent acceptance.

**BAO-T6** — client-side security and provenance release gate (preventive requirement `BAO-SEC-1`)  
Prerequisites: BAO-T3 for asset-rights status; BAO-T5 for final workflow shape.  
Observed paths: `src/main.js`; `stories/clockmaker/src/productionMain.js`; workflow files; `package-lock.json` in tree. Proposed path: release checklist and CI/security job additions.
1. Review sampled client text/HTML sinks and preserve safe patterns such as `textContent`; if richer markup is introduced, require a documented sanitization or trusted-template rule.
2. Add integrity/provenance checks for dependency and automation inputs: lockfile-consistent install, pinned action provenance review, and a secret/data exposure sweep appropriate to a public client repo.
3. Add negative controls, such as a seeded unsafe HTML payload, a deliberately altered lockfile/install mismatch, or a seeded canary secret.
Expected output: explicit release-security/provenance checklist and supporting CI jobs or scripted checks.  
Verification: unsafe HTML remains inert or is blocked, integrity drift is caught, and the secret/data scan fails on a seeded canary.  
DoD: [ ] text/HTML sink policy is written; [ ] dependency/action integrity is checked; [ ] at least one seeded negative control proves the gate is live.

**BAO-T7** — release dossier, future restore, and independent acceptance (preventive requirement `BAO-OPS-1`)  
Prerequisites: BAO-T1 through BAO-T6 complete. Owner acknowledgement may record blocked items, but it does not waive any production-acceptance or release-policy blocker.  
Observed paths: deploy workflow. Proposed paths: release record, restore runbook, acceptance checklist.
1. Create a release dossier that records the exact source SHA, resulting artifact identity, asset-rights disposition, and the CI evidence used to approve promotion.
2. Define and exercise a future restore path against a known-good artifact or revision in an authorized environment, and record observed results.
3. Require an independent acceptance pass by someone other than the implementation author that reproduces the applicable negative controls, records the observed failures, reviews the evidence ledger and blocked items, and rejects promotion until every hard blocker in the acceptance checklist is cleared.
Expected output: release dossier plus restore runbook and independent acceptance record.  
Verification: artifact identity and restore outcome are directly observed; the independent reviewer directly observes or reproduces the applicable negative-control failures and reviews that evidence before promotion; owner acknowledgement of blocked items does not override unresolved checklist blockers.  
DoD: [ ] release record binds artifact to SHA; [ ] restore path is observed, not inferred; [ ] independent reviewer reproduces applicable negative controls and records the failures; [ ] independent reviewer cannot sign off around unresolved checklist blockers.

## Dependency map
| Task | Depends on | Why |
|---|---|---|
| BAO-T1 | — | Historical failure evidence baseline |
| BAO-T2 | — | Confirmed static defect can be fixed independently |
| BAO-T3 | — | Asset-rights decision must start early and can block release |
| BAO-T4 | — | Shared-input scope must be decided before workflow edits |
| BAO-T5 | BAO-T4, BAO-T1 | Trigger changes need the approved matrix; deploy-history context may inform implementation |
| BAO-T6 | BAO-T3, BAO-T5 | Security/provenance gate must reflect actual asset disposition and final workflow shape |
| BAO-T7 | BAO-T1, BAO-T2, BAO-T3, BAO-T5, BAO-T6 | Independent acceptance and restore only make sense after release blockers are addressed |

## Production acceptance checklist
- [ ] Each sampled failed Pages run is documented with its own SHA and observed cause, or explicitly marked unknown.
- [ ] Clockmaker Read/dialog ids are unique and the regression covers open, close, Escape, and focus return.
- [ ] Every tracked Sky Garden MP3 has a rights/disposition record; unresolved rights block release.
- [ ] Shared root inputs are approved in a trigger matrix before workflow filters change.
- [ ] The lighthouse deploy path includes the documented build + preview + browser smoke sequence.
- [ ] Negative controls fail for the dialog regression, the runtime smoke path, the trigger-coverage gate, and the security/provenance gate.
- [ ] Restore/rollback is observed in an authorized environment, not assumed from workflow structure.
- [ ] Independent acceptance reproduces the applicable negative controls, reviews the recorded failures and blocked items, and does not waive unresolved checklist blockers.

## Owner approvals required
- Read-only Actions/Pages access for deeper historical failure triage.
- Audio authorship/license evidence and release disposition for the six tracked MP3 files.
- Shared-input trigger matrix, especially for root files such as `vite.config.js`.
- Browser/accessibility baseline for lighthouse and Clockmaker production acceptance.
- Any staging or restore environment access needed to observe artifact identity and rollback.

## Release / restore policy
- Do not publish while tracked-audio rights are unknown or while the release dossier cannot bind artifact to source SHA.
- Do not weaken PR or deploy gates to recover speed; replace only with a narrower, proven-equivalent gate.
- Owner acknowledgement of a blocked item records the blocker; it does not convert missing rights, missing restore evidence, missing artifact identity, or failed/unrun required controls into an acceptable release state.
- Treat restore as a first-class release requirement: if there is no known-good target and no observed restore path, stop and establish one before promotion.
