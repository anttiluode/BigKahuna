# First benchmark: asking helps; adaptive direction selection does not win

Protocol: seeds 101–120, 1,200 ordinary predictions each, observation noise 0.12. Standard switching probability 0.035 and question price 0.025. Rapid switches use 0.30; expensive questions use price 0.5. See [the full protocol](docs/protocol.md) and [all seed-level receipts](results/benchmark.json).

## Mean charged loss (lower is better)

| World | Feedback only | Fixed probe | Random probe | Questioning needle |
| --- | ---: | ---: | ---: | ---: |
| Directional | 0.016928 | **0.012671** | 0.013084 | 0.012974 |
| Rotations | 0.031698 | 0.019404 | 0.019404 | 0.019404 |
| Identical | 0.000006 | 0.000006 | 0.000006 | 0.000006 |
| Rapid switches | 0.095385 | **0.023440** | 0.030792 | 0.043348 |
| Expensive | 0.016928 | 0.016881 | 0.016881 | 0.016881 |

Rotations and expensive questions have negligible differences hidden by rounding. These are means across paired seeds, not claims of exact equality or statistical significance.

## The gate failed

The predeclared directional gate required at least 5% lower mean charged loss than **every** baseline and at least 15 wins out of 20 paired seeds against each.

| Needle compared with | Relative reduction in mean loss | Paired wins / 20 |
| --- | ---: | ---: |
| Feedback only | 23.4% | 20 |
| Fixed probe | −2.4% (worse) | 0 |
| Random probe | 0.8% | 7 |

The directional needle's loss is 0.012974 ± 0.002132 (sample standard deviation across seeds); fixed is 0.012671 ± 0.002165. The mean paired needle-minus-fixed difference is +0.000303, with sample SD 0.000237. This is descriptive evidence under the declared experiment, not a hypothesis test.

On the directional world, mean queries per 1,200 predictions are 198.8 fixed, 198.9 random and 199.4 adaptive. The gain over feedback-only survives the explicit question charge. It is not explained by giving the adaptive method a uniquely generous query allowance: the fixed method asks slightly fewer questions and does better.

Identical-world agents ask zero questions at the standard price. At price 0.5 the directional agents average just 0.15 queries per run, so “expensive” suppresses almost all querying, not every query. Hidden-route accuracy is not meaningful for identical true rules; their predictions are equivalent.

## What this tells us

An extra diagnostic observation can improve retrieval among already-learned rules. In this environment a fixed direction already provides a strong diagnostic. Recomputing a direction from the current belief adds no demonstrated benefit. The much larger adaptive loss under rapid switching is a reason to investigate the selection rule, not to quietly remove that control.

A possible explanation is that maximum response variance need not select the observation that best separates plausible hypotheses or most reduces error on the current ordinary input. This is a hypothesis, not an established causal finding. The present gate also ignores the expected information in the proposed answer.

The next justified step is to keep the fixed probe and inspect failures of the adaptive rule. If further work is warranted, compare actual expected posterior prediction risk against variance selection on a new, declared holdout protocol. Do not tune on these 20 seeds and present the improvement as independent evidence.

## Limits

Four tiny linear maps are a diagnostic sandbox. The experiment assumes known noise and transition probabilities, stable dynamics during the query/prediction round, and separately labeled calibration. It does not measure wall-clock cost, reward long-term exploration, learn new records during evaluation, or establish transfer to images, language or physical materials. The ordinary prediction target is the noiseless expected output; noisy feedback is what selectors observe.
