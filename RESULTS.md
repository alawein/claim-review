# Results, October 13, 2026

Baseline source5e05d87:96 tests in11files; npm check passed before edits. Final exact-source verification is recorded in the PR/checks and docs/requirements.md.

## Integrity task

Reproduce: `python benchmarks/fetch.py`, then `make bench` (or `npm run bench`). Raw measured snapshot: benchmarks/results.snapshot.json. Node22.23.2, Windows11 build26300, AMD Ryzen7 8845HS with Radeon780M. RSS is whole runner process, not isolated core peak memory.

Core span conversions:8/8; naive code-point-as-UTF16 baseline6/8. Changed-source detection8/8; tampered-hash rejection8/8. Normalization-only cases3/3, with reviews remaining stale. Dev/test each4cases. Thirty repetitions per split: dev p502.57ms, p954.75ms; test p502.39ms, p953.53ms. Whole-process RSS48,697,344bytes.

External ALCE: dev9claims/14citation items, test4claims/6items. All20 original supplied numeric attribution labels are retained separately from review inputs. Source hashes/schema/migration are validated. Semantic accuracy is null: the tool does not predict attribution. This is external gold preservation plus an integrity benchmark, not a new model or human semantic evaluation. Original source-page revision lineage and compound screening remain incomplete.

## Scripted UI task

Four real offline workflows per vibe,16 scripted saves total,0 save-status errors. Supplied rationale explicitly says synthetic scripted task. Throughput is automation speed, not human review productivity.

| Vibe | Local file LCP ms | Max observed event ms | Scripted reviews/min | Post-workflow mean RAF fps | Frame p95 ms |
|---|---:|---:|---:|---:|---:|
| cartoon | 308 | 48 | 195.0 | 60.00 | 16.80 |
| calm | 156 | 48 | 218.0 | 60.01 | 16.80 |
| pixel | 136 | 48 | 217.0 | 60.00 | 16.70 |
| lab | 140 | 40 | 218.4 | 60.00 | 16.70 |

RAF cadence is a1.5-second window after scripted saves, not frame timing during each interaction. This workstation is identified; no generic midrange-laptop60fps certification is claimed. Max event duration is a laboratory observation, not field INP. INP remains unavailable. Small deterministic stress suites do not justify population confidence intervals; timing quantiles describe observed repetitions only. The existing human-study protocol defines cluster bootstrap intervals when actual labels exist; none were fabricated.

## Lighthouse CI

Three loopback desktop Lighthouse runs after removing synchronous first-paint WebGL setup. All configured assertions passed. This checks local HTTP, separately from Playwright file-URL LCP.

| Run | Performance | Accessibility | LCP ms | TBT ms |
|---|---:|---:|---:|---:|
| 1 | 1.00 | 1.00 | 337.6 | 24.0 |
| 2 | 1.00 | 1.00 | 309.0 | 0.0 |
| 3 | 1.00 | 1.00 | 295.2 | 10.0 |

The first implementation failed TBT200ms with375-704ms because WebGL initialized before interaction. The bounded fix keeps a static CSS hero first and initializes WebGL on viewer interaction/completion. Later changes require fresh checks; the snapshot is dated evidence, not a perpetual guarantee.

## Limits and audits

No independent human collection, adoption, production ownership, semantic accuracy or model-as-judge result. ALCE model execution is omitted; original labels/scores are provenance, not our baseline judge. Human consent/independence follow studies/ais-pilot/README.md. Dataset ZIP remains local, not published to HF or a new release.

Before adding dev-only axe/LHCI, npm audit reported5 findings (2moderate,3high). The expanded dev graph reported22 (2low,6moderate,14high) on installation; current report-only audit is the authoritative latest snapshot. Production dependency audit has no runtime dependencies. No automatic dependency fix or Dependabot changes were applied. Audit success/failure alone is not a security guarantee.
