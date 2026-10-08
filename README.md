# Claim Review

Review claims against exact source passages and export the reasoning.

![Evidence review](assets/label-purpose.svg)
![TypeScript](assets/label-stack.svg)
![Offline browser](assets/label-runtime.svg)

Import source text, select a passage, and record whether it supports, partly
supports, contradicts, or cannot verify a claim. Export the packet to preserve
your review history. No account, model, or server.

![Claim review with the packet builder open over the synthetic example](docs/screenshots/app.png)

## Use

Build this checkout with `npm ci` and `npm run build`, then open `dist/index.html`.
Published GitHub Pages and release downloads can predate this source version.
Start with **New packet** (type sources and claims; hashes are computed in the
page and pasted CRLF arrives as LF), **Load synthetic example**, or **Import packet**.
Choose a claim/citation, select source text with **Use selected span** or enter
UTF-16 offsets, choose a verdict, write rationale and reviewer label, then save.
**Export packet** preserves all history. Reimport that JSON to continue. Existing
v0.2 packets load and migrate to the enriched native format.

**Export W3C JSON-LD** exports review annotations with exact quoted text and
code-point positions. [Offline interoperability checks](docs/interoperability.md)
use `jsonld` 9.0.0 and a pinned W3C context outside the product bundle.
It does not replace the resumable native packet. Legacy
stale history without original selectors must use native export; the W3C button
reports this limitation. [Packet schema](schema/claim-review-packet.v1.json) and
[contract](docs/contract.md) describe the formats and validation boundaries.

Processing stays in memory unless you check **Save draft on this device**.
There is no local storage access unless you opt in or explicitly restore/clear
an existing draft. Saving is off on each page load; **Restore saved draft** is
an explicit action. Blocked storage leaves review and export usable. Stored drafts
can contain sensitive text, are specific to the browser/origin, and may be erased
by the browser. Local-file storage behavior varies by browser. Export remains the
portable copy; the unsaved-close guard remains even with draft saving enabled.

Closing without export or an available saved draft loses work. No upload, source
fetch, telemetry or background service. Reviewer labels are self-reported; the
packet explicitly records `reviewer_identity_assurance: "self-reported"`. Source
rights and exported file sharing remain your responsibility.

## What it verifies

SHA-256 of exact supplied valid Unicode source text, a separate SHA-256 of its
NFC form, span boundaries, references, field structure and history integrity.
Original text and raw hashes are preserved. A raw hash change keeps old reviews
stale; matching NFC hashes label them **normalization-only stale** without moving
the judgment to new text. Old passages are never quoted from changed sources.
Latest means last appended per claim/citation pair.

Native offsets stay UTF-16 for textarea compatibility. Each available judgment
also carries a TextQuoteSelector with up to 32 code points of prefix/suffix and
a TextPositionSelector with code-point offsets. Conversions reject surrogate
splits. Combining marks are separate code points; grapheme boundaries are
preferred but not enforced. Plain text remains literal, including CRLF.

Hash consistency is not truth, authorship or semantic entailment. These are human
judgments, not automated accuracy scores. JSON-LD export follows the W3C selector
and annotation structures tested against published examples and the named offline
JSON-LD consumer; arbitrary W3C import
and compatibility with third-party annotation systems are unverified. English UI
preserves Unicode/Arabic text; manual screen-reader coverage is unverified.
[Evaluation](docs/evaluation.md), [study protocol](docs/study-protocol.md),
[bounded usefulness](docs/usefulness.md), [provenance](docs/provenance.md).
Publication preparation and observed security settings are documented in
[release readiness](RELEASE_READY.md) and [security settings](SECURITY_SETTINGS.md).

v0.3.0 merged in [PR19](https://github.com/alawein/claim-review/pull/19) and has an
immutable [GitHub Release](https://github.com/alawein/claim-review/releases/tag/v0.3.0).
Its npm [publish attempt](https://github.com/alawein/claim-review/actions/runs/37799350424)
failed with `ENEEDAUTH`; registry publication is not established. v0.3.1 adds
interoperability and study preparation checks plus a canonical artifact pipeline,
and its canonical hosted assets are published on GitHub. Its npm attempt failed with EALLOWGIT from an ambiguous relative tarball path; v0.3.2 corrected that invocation, published canonical GitHub assets and
passed hosted provenance checks in run 37828847596; npm then failed with
ENEEDAUTH. Pages run 37828847613 succeeded at merged revision 6759ad7. Independent study labels remain pending.

## Develop

Node 22.23.2 (minimum 22.12), locked dev-only dependencies:

```sh
npm ci
npm run check
npm run validate:schema
npx playwright install chromium firefox webkit
npm run test:browser
```

To validate another packet, run `npm run validate:schema -- path/to/packet.json`.
The development validator combines JSON Schema 2020-12 structure checks with
runtime hash, reference, uniqueness, UTF-16 limits and selector checks. Standard
JSON Schema alone cannot establish those semantic invariants.

Build creates `dist/index.html` with inline CSS, one classic bundled script and a
CSP permitting only their exact hashes, with `default-src 'none'`. `node scripts/serve.mjs`
serves that build at 127.0.0.1:4173. No runtime package or shared-repo dependency.
Tests cover native round trips, invalid-input preservation, randomized Unicode,
exact selectors, guarded drafts, inert active text and offline local-file operation
in Chromium, Firefox and WebKit.

For stack naming and structure, follow the
[shared repository conventions](https://github.com/alawein/.github/blob/main/docs/system/repos.md#stack-conventions)
alongside this project's local instructions and contract.

## Related work and how this differs

The [W3C Web Annotation Data Model](https://www.w3.org/TR/annotation-model/)
defines the selector and JSON-LD structures used by the export adapter. Its
published quote and position examples are exercised as literal test cases.
The [Selectors and States note](https://www.w3.org/TR/selectors-states/) provides
additional selector guidance. Claim Review keeps exact supplied plain text,
hash-bound review history and an offline interface; it does not retrieve web
documents or implement a general annotation service.
[AIS](https://arxiv.org/abs/2112.12870v2) defines attribution and a two-stage human
annotation protocol. [ALCE](https://arxiv.org/abs/2305.14627v2) evaluates generated
answers with automatic citation-quality measures, including recall and precision.
This tool records supplied human judgments; it does not execute those evaluations
or establish agreement between annotators. The study protocol describes proposed
measurement without fabricated annotations or results.

MIT code; original CC0 synthetic AI-assisted non-client examples. Demand, adoption,
production ownership, annotator reliability and semantic accuracy remain unproven.
