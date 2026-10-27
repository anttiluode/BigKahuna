# BigKahuna — The questioning needle

**[Open the experiment](https://anttiluode.github.io/BigKahuna/)** · [Protocol](docs/protocol.md) · [Results](RESULTS.md)

Four learned records, one switching world, and an ambiguous cue. Can a reader ask a useful question before predicting which familiar rule is active—and does the answer justify its price?

BigKahuna is a static browser laboratory. No install, account, server, external assets or API calls. Run it, step through decisions, change the world/noise/price, and export the run as JSON. The browser and benchmark use the same JavaScript engine.

## What happened

The first benchmark **fails the predeclared adaptive-advantage criterion**. On the directional world, the questioning needle lowers charged loss by 23.4% relative to feedback-only tracking, but costs 2.4% more than the calibrated fixed probe. It loses to fixed on all 20 paired seeds. Under rapid switching the fixed probe wins by much more. The simple method earns the next iteration's baseline position.

This is evidence for useful extra observations in this small environment, not evidence that this adaptive direction rule is better. All outcomes, including failures, are retained in [results/benchmark.json](results/benchmark.json).

## Method

1. Learn four separate 2×2 linear maps from identified training examples (512 per map). Freeze their weights.
2. Start a hidden switching environment. Each ordinary input is a 2D vector; the active map produces a noisy output. No selector receives the hidden map identity.
3. Before predicting, a query policy may buy one extra observation using a unit diagnostic input. The world remains unchanged during this query and prediction.
4. Predict with the posterior-weighted mixture of records. Then **all methods** receive ordinary feedback for the next round.

The four methods are feedback-only Bayesian tracking, a calibrated fixed probe, a random probe and the questioning needle. The needle selects the direction of greatest posterior-weighted response disagreement from 16 directions. The fixed probe maximizes the same disagreement once, under a uniform prior. All query methods ask when predicted output variance on the ordinary input exceeds the price. This gate is a heuristic, not an optimal value-of-information calculation.

Charged loss = mean per-coordinate squared error against the noiseless expected output + price × queries / ordinary predictions. Query price is a declared utility penalty, not measured latency or energy. Query methods can take more actions and perform more computation; both are recorded. The prominent selected record is a MAP diagnostic; actual predictions use a mixture.

Known noise and switching probability are supplied equally to all methods. Calibration error is handled with a likelihood standard-deviation floor of 0.025. Random streams for world, observation noise and policy choices are separated. UI truth badges are evaluator-only information.

## Five worlds

| World | Purpose |
| --- | --- |
| Different directions | Rules differ along different input directions |
| Rotation control | Exact rotations have no preferred unit probe direction |
| Identical records | Hidden identity has no useful predictive distinction |
| Fast-changing world | Test the cost of rapidly stale beliefs |
| Expensive questions | Check that querying mostly switches off |

Training produces slightly different estimates even in the controls. “Identical” describes the true world maps, not perfectly identical learned coefficients.

## Run and reproduce

Open `index.html` directly, or serve this directory with `python -m http.server 8000`. The committed summary loads without fetching any data.

With Node.js 22 or newer:

```sh
node --test tests/*.test.cjs
node bench.cjs
```

The benchmark overwrites `results/benchmark.json` and `results/summary.js`: 20 seeds × 1,200 rounds × five worlds, with four methods per world. The browser defaults to a shorter, adjustable single-seed run. The protocol was written before the first benchmark; it was not changed after the negative result. This is a local predeclared criterion, not an externally registered study.

## Scope and lineage

This follows [Kahuna](https://github.com/anttiluode/Kahuna)'s records-and-needle question. It deliberately separates learning from retrieval: the bank is already learned using identified curricula. It does **not** solve discovering new contexts, allocating records from ambiguous cues, continual learning, selective writing, or memory protection. The cue during evaluation is uninformative; there is no cue-based shortcut.

The wave/ETH discussion prompted this experiment, but BigKahuna implements neither proof. It makes no wave-theorem, complex-time, SAT-speedup, or polynomial-interpolation claim. Its ingredients are ordinary linear system identification, Bayesian filtering and disagreement-based experimental design.

`core.js` owns the experiment; `app.js` only renders and controls it. `bench.cjs` runs the frozen protocol. GitHub Pages deploys the static files after the engine tests pass.
