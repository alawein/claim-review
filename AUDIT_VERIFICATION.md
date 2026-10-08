# Audit verification

Audit input: compass artifact dated October 8, 2026. This record checks its
claim-review hypotheses against a fresh clone, not adoption or semantic accuracy.

## Phase 0 baseline

- Clone HEAD: e9c96dee96edc91e3bf1844067cae71168ce74bb.
- Node v22.23.2; Python 3.14.7; package version 0.2.0; private true.
- npm lockfile present (v3), SHA-256 f558a0f495dfd5bcb361ea4d68c4bd13377e72bd418f07eaf4d2686026d64a5f.
- npm ci: 135 packages installed, 0 reported vulnerabilities. npm blocked esbuild's
  install script; build outcome is checked independently.
- Baseline check: lint, TypeScript, 43/43 unit tests and build passed. Browser attempt: 24 passed, one Firefox timeout, eight unrun; details below.

## Hypotheses at the clone SHA

| Hypothesis | Status | Source evidence |
| --- | --- | --- |
| Browser performs no source fetch, upload, model or telemetry | Confirmed within inspected runtime | src/app.ts:1-7 uses static imports; app.ts:139,203 parse explicit text. No fetch/XHR/WebSocket/EventSource/sendBeacon/dynamic import matches in src. |
| DOM input is interpreted as text | Confirmed within inspected sinks | app.ts:42,78,95,111,113 use textContent; app.ts:38 uses Option; app.ts:221 assigns a generated blob URL, not user URL. No HTML sinks found. |
| Strict CSP is present | Refuted | src/shell.html:3-12 contains metadata but no CSP; scripts/build.mjs:16-18 injects inline style/script without hashes. |
| Positions follow W3C code points | Refuted | spans.ts:1-16 uses string.length and UTF-16 charCodeAt; shell.html:79 labels code units. It correctly refuses surrogate splits. |
| CRLF selection maps to original source | Confirmed by code and baseline browser tests | spans.ts:19-30 maps textarea LF indices; app.ts:179-180 applies it before saving. |
| Normalization-only edits can be distinguished | Refuted | hash.ts:3 hashes exact UTF-8; packet.ts:171 checks exact hash; reviews.ts:4 compares raw hashes only. No NFC hash or normalization policy. |
| Versioned JSON Schema is published | Refuted | No schema directory/file; packet.ts:155-204 is handwritten runtime validator. |
| Closing without export can lose work | Confirmed | app.ts:69-71 tracks dirty packet; app.ts:232-234 guards beforeunload; no browser storage API matches. Crash protection absent. |
| Reviewer identity is authenticated | Refuted as a product claim; candid disclosure confirmed | packet.ts:24 records arbitrary reviewer string; README explicitly calls it self-reported. |
| Property-based Unicode coverage exists | Refuted | packet.test.ts contains examples only; package.json has no property testing dependency. |
| History is append-only in review operation | Confirmed within product operation | reviews.ts:15-30 rejects duplicate IDs/stale appends and returns a new array; arbitrary imported history cannot prove authorship. |
| Live Pages equals release | Partial/unverified in this scope | Local source/build cannot establish live deployment equality. No deployment is authorized. |
| Research validity/adoption proven | Refuted as an assertion | Synthetic examples and candid README disclaimers do not establish annotator agreement, accuracy or adoption. |
| PR3's odd check establishes a product defect | Partial | Root checks historical Actions separately; a check count alone cannot identify cause. |

## Verification limits

No external annotations, identity authentication, production adoption or semantic
entailment is established. Source rights, authentic observations and human
judgments remain outside hash integrity. Remote history and security-settings
readback are owned by the coordinating agent's reports.

Baseline completion: npm run check exited 0 (43/43 unit tests, lint, TypeScript,
build). Browser attempt: 24 passed; Firefox large valid packet exports within
import byte bound timed out after 1.0 minute and worker teardown stalled. Task
interrupted boundedly; 8 tests unrun, exit 1. Chromium and WebKit each passed all
11 workflows, including standalone HTTP/HTTPS-blocked file operation. This is a
partial browser baseline, not a clean 33/33 pass. Fresh final verification will
revisit the Firefox failure.

Historical PR3 readback by coordinating agent: 31 Actions checks SUCCESS; the
remaining CodeRabbit StatusContext was PENDING. The audit's odd check count does
not establish a failing product test. [PR3 checks](https://github.com/alawein/claim-review/pull/3/checks).

## v0.3.0 verified implementation

Fresh commands in this checkout on October 8, 2026:

- npm run check: exit 0; lint, TypeScript, 72/72 unit tests and single-HTML build.
- npm run validate:schema: exit 0; both packet fixtures accepted as legacy inputs
  and canonical migrated exports. Unit cases reject eleven malformed classes via
  both runtime parsing and the combined structural/semantic path.
- npm run test:browser: exit 0; 48/48 cases, 16 per Chromium, Firefox and WebKit.
  Each engine completes standalone import/review/export/reimport with HTTP and
  HTTPS blocked, strict CSP, inert script/event-handler/javascript-URL text,
  JSON-LD export, opt-in drafts, unavailable/quota-blocked storage, corrupt-draft
  preservation and retained close guard. Default startup/import/save performs
  zero localStorage getter accesses before opt-in.
- Random Unicode seed 20261008: 300 span/conversion trials and 100 hash/export/
  reimport trials passed. Literal W3C quote/alphabet-position examples passed.
- git diff --check: exit 0. No remote publication, deployment or settings mutation
  was performed by this implementer.

Final Firefox large-packet case took 39.2 seconds; draft save/restore case took
43.2 seconds with three workers and a 60-second workflow bound. Earlier runs took
19.6-26.4 seconds for the large case and 11 seconds for isolated draft operation.
These are automation/startup timings on this machine, not latency guarantees.
No retries hide failures. The initial timeout and intermediate CSP test failures
remain reported above; final policy was retained and all assertions passed.

### Final source audit

| Area | Verified implementation |
| --- | --- |
| Runtime network/dynamic imports | No fetch, XHR, WebSocket, EventSource, sendBeacon or dynamic import in product source. src/app.ts:1-8 imports static bundled modules; context URL in annotation.ts:10 is data, never retrieved. |
| DOM sinks | app.ts:48,84,101,117,119 use textContent; textarea/input values are literal. No innerHTML, outerHTML or insertAdjacentHTML in runtime. app.ts:227 creates a generated blob download URL. |
| CSP | shell.html:5 placeholder is replaced by scripts/build.mjs:15-18 with default-src none plus exact script/style hashes. No connect-src directive or unsafe-inline. |
| Offsets | spans.ts:19 handles original CRLF mapping; spans.ts:31,44 convert UTF-16/code-point positions; spans.ts:62 builds exact selectors with 32-code-point context. Surrogate splits fail. |
| Normalization and migration | packet.ts:244 computes a separate NFC hash; original source text/raw SHA stay unchanged. packet.ts:183 enriches available legacy history; reviews.ts:10 exposes normalization-only stale without reanchoring. |
| Native integrity | packet.ts:196 checks current selectors/hash/offsets; packet.ts:276-284 incrementally bounds canonical history bytes. Schema structure is paired with these semantic checks; schema alone is insufficient. |
| Storage | draft.ts:3-24 puts every getter/setItem/getItem/removeItem inside try/catch. app.ts:35 sets the opt-in control false; app.ts:143 persists only while checked. Restore/clear are explicit actions. |
| W3C scope | annotation.ts:4 exports plain-text review annotations to original raw-hash URNs. Missing migrated stale selectors produce an explicit error and retain native export. External consumer interoperability remains unverified. |

Research remains a proposed protocol in docs/study-protocol.md, not measured
annotations. Current publication/security preparation is documented by the
coordinator in RELEASE_READY.md and SECURITY_SETTINGS.md. A clean-clone recheck
and final review belong to the coordinator before push/draft PR.
