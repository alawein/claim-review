# Proposed attribution annotation study

This is an executable study plan, not completed research. No participants,
annotations, agreement statistics or comparative results are fabricated here.
Synthetic repository judgments are workflow fixtures, not human gold labels.

## Question and material

Can independent reviewers use the tool to produce reproducible, source-bound
attribution judgments, and how do those judgments relate to automatic ALCE
citation recall and precision? Use the two-stage human guidelines in
[AIS](https://arxiv.org/abs/2112.12870v2): first assess whether a claim can be
interpreted in context, then assess attribution to the supplied source. AIS and
this tool's four verdict labels are not identical; preregister an explicit mapping
and retain both original AIS labels and the tool's verdict/rationale.

Before collecting data, freeze a rights-cleared set of answers, claims and cited
source texts. Record inclusion/exclusion rules, answer IDs, dataset/version,
selection procedure, exact raw and NFC hashes and citation boundaries. Include
fully supported, partially supported, contradicted and insufficient-evidence
examples. Record missing source material as unavailable, not contradicted. Use
no private client material without its separate consent. Keep annotator labels
pseudonymous and document that tool identity is self-reported.

## Collection protocol

1. Preregister primary outcomes, sample-size rationale, the number of independent
   annotators, claim segmentation rules and handling of ambiguous/compound claims.
   Select sample sizes through a pilot and precision/power analysis; no achieved
   numbers are asserted in advance.
2. Train reviewers on a disjoint pilot and a frozen rubric. Refine the rubric
   before the main study, then freeze it and report the changes.
3. Have at least two reviewers independently annotate each main-study item,
   blinded to one another's labels and automatic scores. Randomize presentation
   order and preserve separate native packet exports and append history.
4. Collect interpretability, AIS attribution label, tool verdict, exact passage,
   rationale and annotation time. Keep unavailable citations and abstentions in
   the denominator. Source changes create stale records requiring a new judgment,
   not automatic reanchoring.
5. Freeze independent annotations before adjudication. A separate adjudicator
   resolves disagreements with a written rationale; never replace independent
   labels silently. Retain adjudication as a separate analysis layer.

## Measures and comparison

Report the full label counts and disagreement/confusion table. Report raw percent
agreement and nominal Krippendorff alpha with uncertainty intervals clustered by
answer, so claims from one answer are not treated as independent. Cohen kappa can
be a secondary pairwise measure when exactly two reviewers supply complete labels.
Document assumptions, class imbalance, missing-label handling and the unit of
analysis. Agreement establishes consistency, not truth or source authenticity.

[ALCE](https://arxiv.org/abs/2305.14627v2) defines automatic citation-quality measures,
including citation recall and precision. Freeze the upstream implementation
commit, automatic evaluator/model version, parameters and source-text conversion.
Run it outside this offline tool on the same frozen answers, with authentic scores
and run metadata. This tool has no automatic scoring or model invocation.

Compare ALCE recall/precision separately to independent human labels and to the
adjudicated layer. Preregister whether analysis is at claim, citation or answer
level and how multiple citations are aggregated; distinguish answer completeness
(recall) from whether cited sources support attributed content (precision).
Report calibration/error tables and confidence intervals, not only correlation.
Do not turn the four tool verdicts into invented ALCE values. Inspect failures
caused by compound claims, citation combinations, source truncation and NLI errors.
Report disagreement and abstention rates alongside measured automatic scores.

## Reproducibility and limits

Publish the rubric, preregistration, rights/consent basis, anonymized packets,
exact source hashes, collection timestamps, evaluator version, analysis code and
all inclusion/exclusion counts when permitted. Test exported selectors before
sharing; record stale/unavailable entries explicitly. Native packets remain the
resumable history; JSON-LD provides selector-based annotation exports.

A study requires actual consented annotations and independent analysis. The
current tool proves deterministic formatting and integrity checks over supplied
inputs. It does not establish a research contribution, semantic accuracy,
annotator reliability, authentication, adoption or production readiness.
