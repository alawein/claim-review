# Results, October 13, 2026

Baseline source5e05d87:96 tests in11files; npm check passed before edits. Implementation source700e91b:108 unit tests in15files and96 browser cases passed in fresh hosted CI. Windows fresh clone7bf3870 passed107unit tests,96browser cases, schema/tokens/bench/study/native Croissant and3LHCI runs. Final PR checks bind any later documentation-only head.

## Integrity task

Reproduce: `python benchmarks/fetch.py`, then `make bench` (or `npm run bench`). Raw measured snapshot: benchmarks/results.snapshot.json. Node22.23.2, Windows11 build26300, AMD Ryzen7 8845HS with Radeon780M. RSS is whole runner process, not isolated core peak memory.

Core span conversions:8/8; naive code-point-as-UTF16 baseline6/8. Changed-source detection8/8; tampered-hash rejection8/8. Normalization-only cases3/3, with reviews remaining stale. Dev/test each4cases. Thirty repetitions per split: dev p503.68ms, p959.76ms; test p503.96ms, p959.10ms. Whole-process RSS46,948,352bytes.

External ALCE: dev9claims/14citation items, test4claims/6items. All20 original supplied numeric attribution labels are retained separately from review inputs. Source hashes/schema/migration are validated. Semantic accuracy is null: the tool does not predict attribution. This is external gold preservation plus an integrity benchmark, not a new model or human semantic evaluation. Original source-page revision lineage and compound screening remain incomplete.

## Scripted UI task

Four real offline workflows per vibe,16 scripted saves total,0 save-status errors. Supplied rationale explicitly says synthetic scripted task. Throughput is automation speed, not human review productivity.

| Vibe | Local file LCP ms | Max observed event ms | Scripted reviews/min | Post-workflow mean RAF fps | Frame p95 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| cartoon | 1096 | 88 | 276.4 | 60.00 | 16.80 |
| calm | 160 | 56 | 200.6 | 60.00 | 16.80 |
| pixel | 144 | 96 | 201.1 | 60.00 | 16.80 |
| lab | 156 | 56 | 211.2 | 60.00 | 16.80 |

RAF cadence is a1.5-second window after scripted saves, not frame timing during each interaction. This workstation is identified; no generic midrange-laptop60fps certification is claimed. Max event duration is a laboratory observation, not field INP. INP remains unavailable. Small deterministic stress suites do not justify population confidence intervals; timing quantiles describe observed repetitions only. The existing human-study protocol defines cluster bootstrap intervals when actual labels exist; none were fabricated.

## Lighthouse CI

Three loopback desktop Lighthouse runs after removing synchronous first-paint WebGL setup. All configured assertions passed. This checks local HTTP, separately from Playwright file-URL LCP.

| Run | Performance | Accessibility | LCP ms | TBT ms |
| --- | ---: | ---: | ---: | ---: |
| 1 | 0.75 | 1.00 | 461.0 | 656.0 |
| 2 | 1.00 | 1.00 | 431.4 | 0.0 |
| 3 | 1.00 | 1.00 | 442.2 | 23.5 |

The first implementation failed TBT200ms with375-704ms because WebGL initialized before interaction. The bounded fix keeps a static CSS hero first and initializes WebGL on viewer interaction/completion. Later changes require fresh checks; the snapshot is dated evidence, not a perpetual guarantee.

## Limits and audits

No independent human collection, adoption, production ownership, semantic accuracy or model-as-judge result. ALCE model execution is omitted; original labels/scores are provenance, not our baseline judge. Human consent/independence follow studies/ais-pilot/README.md. Dataset ZIP remains local, not published to HF or a new release.

Before adding dev-only axe/LHCI, npm audit reported5 findings (2moderate,3high). The expanded dev graph reported22 (2low,6moderate,14high) on installation; current report-only audit is the authoritative latest snapshot. Production dependency audit has no runtime dependencies. No automatic dependency fix or Dependabot changes were applied. Audit success/failure alone is not a security guarantee.

Schema integration caught a Node-ESM Unicode helper require; explicit ESM generation repaired it. A concurrent UI/browser run also hit Windows Firefox software-compositor teardown failures; the complete single-worker96-case run passed without retries. Software WebGL contexts with major performance caveats now use static fallback. Dataset text writes explicitly use LF after the initial hosted Croissant hash check exposed Windows newline differences. No failing check was bypassed.

## Verification binding

Implementation head `700e91b4912bbe297ff5d6e1b98ed7555b6dff26`: [CI run38382973636](https://github.com/alawein/claim-review/actions/runs/38382973636) and [Browser workflows run38382972867](https://github.com/alawein/claim-review/actions/runs/38382972867) succeeded. Browser workflow executes96cases across3engines, token/bundle gates and3Lighthouse runs with the runner system Chrome version recorded in its log. CodeRabbit reports a green status but explicitly skipped this draft; it is not completed independent review.

Local clean clone was created with --no-local at7bf3870 and a fresh npm ci:107unit tests,96browser cases,4example+2external packet validations,1token contrast/generated-byte test,10study tests, native Croissant parse, benchmark and3LHCI runs passed. Source700e91b adds the bounded-schema-diagnostics regression (108tests) and sandboxed system Chrome CI selection. The malformed100-record case generated902diagnostics before short-circuit validation; the new test bounds diagnostics to8or fewer.

Measurement tables and4GIFs are recorded from7bf3870 UI behavior. They are dated laboratory evidence, not a claim that every later source head has identical timings. Final700e91b hosted LCP/TBT/accessibility/bundle assertions passed. A transient concurrent-run2120ms event maximum was observed before rejecting software WebGL major-performance-caveat contexts and isolating verification; it is not omitted as field INP evidence.

The deterministic dataset ZIP recreated in the working checkout and clean clone has identical SHA256 `5d91ac6b2b47b7ac988a82049f4edff7b4591d2f2aa694422b9dcbec3aee2130`. Its checksums.json verifies15payload files, including split/answer-key data, cards, license and schemas, and is itself included as the16thentry. No archive upload occurred.

## Stale-motion contrast follow-up

Independent review identified that the first stale-animation frame faded text to opacity0.45. Real canonical compositing gave contrast3.9677:1in dark and2.9364:1in light, below4.5:1. Two node tests failed before the fix. Six browser cases (both appearances in all3engines) also failed on the prior built HTML while the actual CSS animation was paused at currentTime0, observing opacity0.45. This was a product defect despite reduced-motion axe checks passing.

The fix removes both text-opacity keyframes and retains only translation plus the dashed stale border. The suite now has110unit tests in16files. New browser regressions pause the actual stale state at frame0, assert full text opacity and calculated AA contrast, and run axe while still paused. No delay or reduced-motion override conceals the initial frame. Final source-head results belong to PR24 checks.
