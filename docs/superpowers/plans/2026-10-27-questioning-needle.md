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
- [x] Write and run failing tests for learned records, phase order, cost accounting, reproducibility, control conditions and query budgets.
- [x] Implement core.js: trainRecords, Agent(prior-only query choice and observed-feedback update), Experiment.step/report, run.
- [x] Run node --test tests/*.test.cjs. Verify no target-dependent pre-feedback choices.

### Task 2 — Browser instrument
- [x] Implement index.html, style.css, app.js with responsive instrument, controls, chart, ranking, explanations and export.
- [x] Check published browser play/pause/reset/finish/export and identical preset. Inspect desktop layout; mobile resizing remains unverified in this browser environment.

### Task 3 — Evidence and delivery
- [x] Fix benchmark protocol before first run; implement bench.cjs, save all 20 seeds for five presets.
- [x] Report outcomes faithfully in README and RESULTS; add Node test job before deployment.
- [x] Fresh review, resolve important findings, run final tests and publish fast-forward to main. Verify Pages deployment.

## Verification record

2026-10-27: all nine engine tests passed locally and in the Pages workflow. Fresh read-only review found no material issues. Published browser checks completed a 600-round directional run and identical-control run, verified zero identical-control queries, and exercised run, pause, reset, step, finish and JSON download. Desktop layout visually inspected. Local automated Chromium installation was unavailable; mobile viewport and offline browser execution were not exercised. The page has no network dependency and includes responsive CSS, but those two modes need separate device checks.
