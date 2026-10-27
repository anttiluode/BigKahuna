# Questioning Needle Implementation Plan

> Implement inline using executing-plans; finish with a fresh whole-branch reviewer.

**Goal:** A reproducible, public static laboratory for the value of diagnostic queries.
**Architecture:** One pure JavaScript engine shared by browser and Node. Deterministic training/environment streams, selectors that cannot see hidden labels, UI consuming completed round receipts.
**Tech Stack:** HTML, CSS, Canvas, vanilla JS, Node built-in test runner.
**Spec:** docs/design.md

## Global constraints
No runtime dependencies, no API calls, no secret target access for selectors. Preserve existing Pages workflow. Keep costs and limitations visible.

## Review focus
Completed-run controls; identical rules; extreme noise/price; mobile canvas sizing; target leakage or query-dependent data generation.

### Task 1 — Scientific engine
- [ ] Write and run failing tests for learned records, phase order, cost accounting, reproducibility, control conditions and query budgets.
- [ ] Implement core.js: trainRecords, Agent(prior-only query choice and observed-feedback update), Experiment.step/report, run.
- [ ] Run node --test tests/*.test.cjs. Verify no target-dependent pre-feedback choices.

### Task 2 — Browser instrument
- [ ] Implement index.html, style.css, app.js with responsive instrument, controls, chart, ranking, explanations and export.
- [ ] Run browser checks for play/pause/reset/finish/export, presets, mobile overflow and console errors.

### Task 3 — Evidence and delivery
- [ ] Fix benchmark protocol before first run; implement bench.cjs, save all 20 seeds for five presets.
- [ ] Report outcomes faithfully in README and RESULTS; add Node test job before deployment.
- [ ] Fresh review, resolve important findings, run final tests and publish fast-forward to main. Verify Pages deployment.
