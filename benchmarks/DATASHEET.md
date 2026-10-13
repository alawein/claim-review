# Siftgrain Cite integrity benchmark v1

## Motivation
Measure Unicode coordinate conversion, hash staleness and migration integrity. It does not automate semantic attribution.

## Composition
Eight original CC0 AI-assisted synthetic Unicode stress strings, four dev and four test. They cover astral characters, combining marks, Arabic/Hebrew RTL, CRLF, normalization and zero-width joins. Answer keys live separately in v1/answer-keys. This small fixed corpus supplements fast-check property tests; it is not population representative.

External: the first eight sorted ASQA answers in the first sorted model of pinned ALCE human citation evaluation, split by answer (first four dev, next four test). Original citation labels are preserved separately. No fresh human labels are generated. Compound screening and independent study collection remain pending.

## Collection and preprocessing
Run `python benchmarks/fetch.py` explicitly once, then `make bench` (or `npm run bench`). The product and benchmark core never fetch sources. External text is not committed: the local archive includes titles and source attribution; preserve Wikipedia CC BY-SA obligations. ALCE repository MIT does not replace underlying passage rights. Download checksum: cfed9293752413d7c7631f36524dd4ee9ef58b209cdf9c63f6fc1e280b43cca6. Version: 246c476a4edfc564266b7346b6e29ef4861ae937. Access: 2026-10-13; exact source-page revision dates unknown.

## Uses and distribution
Use for regression and reviewer protocol rehearsal. Do not claim semantic accuracy or independent annotator reliability. Local downloadable ZIP: artifacts/siftgrain-cite-v1.zip. No external publication performed. Separate keys are separation of files, not secure blinding. Sources can contain original model errors and biased content.

## Maintenance
Version the split before changing examples. Preserve checksums, original labels and cited passage titles. Human consent/recruitment/anonymization and repeated-review independence follow ../docs/study-protocol.md and ../studies/ais-pilot/README.md.
