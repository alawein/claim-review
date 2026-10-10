# AIS pilot preparation and analysis

This is collection tooling, not a completed study. No new independent human
labels have been supplied. Tests contain explicitly synthetic labels only.
The tools use Python's standard library, read local files and never run a model.
Reviewer identity remains self-reported; different labels do not prove independence.

## Frozen corpus and rights

Use the first eight sorted ASQA answer IDs from the first sorted model in ALCE's
supplied citation-evaluation corpus. Its original outputs, sentence boundaries,
supplied passages, citation labels and automatic scores are preserved in the
coordinator's population file. Sentence-citation pairs are review items; source
passages remain exact. This small pilot currently produces 20 items. It is an
ALCE corpus reviewed with the two-stage AIS rubric, not original AIS annotations.
`original_ais_label` is explicitly null because upstream does not supply it.

Upstream: [princeton-nlp/ALCE](https://github.com/princeton-nlp/ALCE/tree/246c476a4edfc564266b7346b6e29ef4861ae937),
commit `246c476a4edfc564266b7346b6e29ef4861ae937`.
[Corpus](https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/human_eval/human_eval_citations_completed.json)
SHA-256 `cfed9293752413d7c7631f36524dd4ee9ef58b209cdf9c63f6fc1e280b43cca6`.
ALCE's [MIT license](https://github.com/princeton-nlp/ALCE/blob/246c476a4edfc564266b7346b6e29ef4861ae937/LICENSE)
applies to the repository material. Supplied ASQA retrieved passages originate
in Wikipedia and retain their original titles for attribution; underlying text
remains subject to [Wikipedia's CC BY-SA reuse terms](https://en.wikipedia.org/wiki/Wikipedia:Reusing_Wikipedia_content), not this tool's MIT or synthetic
fixture CC0 license. Preserve the source titles and upstream attribution with
any redistribution. This pilot is local research preparation, with no bulk text
committed. ASQA citation source retrieval dates/revision IDs are not supplied by
this file, so exact external-page lineage cannot be independently reconstructed.

Download explicitly outside the product, then run the offline adapter:

```sh
mkdir -p studies/ais-pilot/downloads
curl --fail --location https://raw.githubusercontent.com/princeton-nlp/ALCE/246c476a4edfc564266b7346b6e29ef4861ae937/human_eval/human_eval_citations_completed.json -o studies/ais-pilot/downloads/alce.json
python studies/ais-pilot/prepare_packets.py studies/ais-pilot/downloads/alce.json studies/ais-pilot/collected
npm run validate:schema -- studies/ais-pilot/collected/reviewer_a.json studies/ais-pilot/collected/reviewer_b.json
```

The adapter rejects any changed download checksum. The two packet sets have
fixed independently shuffled claim orders and no upstream labels/scores.
Do not share `population.json` with reviewers. Original answer text and scores
remain coordinator-only until independent collection is frozen.

## Fixed rubric and exclusions

1. Judge interpretability in the original question/answer context, before source
   attribution. Record `interpretable`, `uninterpretable`, `abstain` or null.
2. For interpretable items, record AIS `attributable`, `not_attributable`,
   `abstain` or null separately. Uninterpretable items receive null attribution.
3. Record the tool verdict independently: `supported` for all supplied claim
   content supported, `partial` for some supported content, `contradicted` for
   an explicit conflict, `unverifiable` for insufficient supplied evidence.
   AIS `attributable` corresponds to `supported`; `not_attributable` may be any
   of the other three. Never infer an original AIS label from an ALCE score.
4. Freeze a manual compound-claim screening before main collection. Exclude
   inseparable compound items explicitly using `--exclusions exclusions.json`
   with `{ "item-id": "reason" }`. Do not silently split or paraphrase the
   original answer. Screening is pending; zero automatic exclusions is not
   evidence that no compound claims exist. Regenerate the two sets and freeze
   the new population hash after screening. Run a disjoint training pilot.
5. Each reviewer works independently without seeing upstream scores or the
   other reviewer. Supply separate exports and retain every rationale/history.
   Freeze these exports before a third adjudicator produces a separate export.

Provide generated `reviewer_context.json` with original questions/answers and
no model identities, labels or scores, and provide passage titles as attribution. Agree on consent,
anonymization and a suitable sample-size/precision plan before collecting data.
This repository does not recruit participants or impersonate reviewers.

## Analyze supplied exports

```sh
python studies/ais-pilot/analyze.py studies/ais-pilot/collected/population.json studies/ais-pilot/collected/reviewer_a.json reviewer-a-export.json reviewer-b-export.json analysis.json --corpus studies/ais-pilot/downloads/alce.json
python -m unittest discover -s studies/ais-pilot -p test_analysis.py
```

The original argument is the frozen unreviewed packet. Run the product's full
schema/runtime validator on all reviewer/adjudication exports before analysis.
The analysis requires the checksum-pinned original corpus and checks the frozen
population and supplied scores against it. It also rejects changed source bytes/hashes, claim text, item IDs,
citations, unknown verdicts, stale reviews and invalid spans. Claim ordering
may differ between blinded sets. Latest appended review per item is counted;
missing items remain in the denominator inventory. Explicit abstentions are
recorded in separate AIS files because they are not one of the tool's four
verdicts. Optional `--ais-a` and `--ais-b` files have this shape:

```json
{
  "population_sha256": "the frozen population hash",
  "items": {
    "item-id": { "interpretability": "interpretable", "attribution": "attributable" }
  }
}
```

Include every frozen item, using nulls for missing labels. The script retains
both AIS layers without overwriting them. Optional `--adjudication packet.json`
retains a third separate layer. The main verdict agreement includes complete
non-abstaining pairs; missing and abstaining labels are counted separately.
Raw agreement, nominal Krippendorff alpha, full label/confusion counts,
disagreements and per-answer clusters are emitted. The 95% raw-agreement and alpha intervals
resamples whole answers 1,000 times using seed 20261008. Alpha is null when
undefined (for example one unanimous category), rather than invented.

Authentic upstream automatic citation precision and sentence recall values are
reported alongside each item on the same frozen population, independently for
each reviewer and adjudication. The supplied upstream human citation scores
are a distinct column. No label-to-score substitution, model rerun or causal
claim is made. Comparative calibration/model-run analysis remains pending
actual independent collection and a preregistered aggregation plan.
