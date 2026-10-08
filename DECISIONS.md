# v0.3.0 decisions

## v0.3.1 closeout, October 8, 2026

- Continue the authorized compatible closeout from merged main, preserving the
  previous feature branch and immutable v0.3.0 release. No runtime schema change.
- Test the specific `jsonld` 9.0.0 consumer with pinned local W3C context; do not
  claim universal interoperability or change unchanged product storage/UI paths.
- Use eight sorted ALCE ASQA answers with original supplied citation passages and
  scores for an AIS-rubric pilot. Original AIS labels are unavailable and remain
  null. Manual compound screening and independent collection remain pending.
- Separate canonical build, OIDC publication and GitHub upload jobs. Retain build
  assets before publication; GitHub upload can complete after npm failure. Existing
  version/asset mismatches fail, without clobber or blind republishing.
- Preserve the observed v0.3.0 npm `ENEEDAUTH` failure and 404 registry readback;
  registry bootstrap is an access matter handled by the coordinator/owner.
- The owner excluded every Dependabot feature, while existing report-only npm
  audits and non-Dependabot controls remain supported.
- Bound unit workers to three after the new tar/JSON-LD suites reproduced a
  five-second Unicode property-test timeout under concurrent Windows work.
  Preserve all seeds, run counts and integrity assertions; these are correctness
  tests, not five-second performance benchmarks. Browser driver/framebuffer
  failures are reported separately and do not justify product changes.

## Original v0.3.0 implementation decisions (historical)

The owner requested autonomous continuous implementation with reversible
ambiguities recorded here. No design approval wait is required for this named
scope. The finished tool remains an explicit-input, deterministic browser-only
single HTML artifact with self-reported judgments and MIT disclaimers.

1. Keep native UTF-16 offsets for textarea selection and v0.2 loading. Introduce
   schema_version 2 for enriched native exports; v0.2 schema_version 1 migrates.
2. Preserve exact-source SHA-256 and add NFC SHA-256 as a comparison aid. Never
   normalize stored source or silently move a judgment to different bytes.
3. Each current judgment records an exact TextQuoteSelector with up to 32 code
   points of prefix/suffix plus code-point TextPositionSelector. Migrated stale
   v0.2 history has unavailable selectors because the original passage is absent;
   its integrity limitation stays explicit rather than fabricated.
4. JSON Schema 2020-12 describes structural constraints. Dev validation pairs it
   with the runtime validator for hashes, references, uniqueness and spans that
   standard JSON Schema cannot express. Equivalence tests exercise both paths.
5. Web Annotation JSON-LD exports review annotations only, with local URNs for
   supplied source identity and textual judgment bodies. It is an export adapter,
   not a promise of arbitrary W3C import or third-party interoperability.
6. Draft persistence is opt-in and off on every new page. Explicit restore is
   separate from enabling saves. Every storage access is guarded; unavailable
   storage leaves review and export usable. The unsaved-close guard remains.
7. Build hashes inline CSS/classic script into a default-src none CSP. No
   connect-src directive, runtime dependencies or network requests are added.
8. Implement selectors/hash migration and negative tests, schema/export tests,
   storage/CSP browser behavior, then full checks and documentation. Root owns
   shared workflows, security readback, release preparation, push and draft PR.

The W3C normative [annotation model](https://www.w3.org/TR/annotation-model/#text-quote-selector)
requires Unicode code point positions. Grapheme boundaries are a SHOULD;
code point boundaries preserve compatibility with existing explicit offsets.
Plain text does not undergo HTML stripping or whitespace normalization here.

1. Enriched legacy packets can become larger because exact quotes are added. Reject
   migration incrementally when its canonical export would exceed 5 MiB, so an
   accepted packet remains resumable. No original history is silently dropped.
2. W3C export is all-history or a visible error if a migrated stale review lacks
    original selectors; native export remains available. This avoids inventing a
    passage or silently omitting judgments.
3. Strict CSP blocks the old doubled-text test's new inline style. Tests alter
    the allowed existing stylesheet through CSSOM to exercise layout; no policy
    exception is introduced. Firefox's baseline large-packet timeout did not
    reproduce in isolated or full subsequent runs; keep this timing fact candid.

4. Bound browser workers to three and allow 60 seconds per workflow. Firefox's
    draft case passed in 11 seconds isolated but timed out at 32.7 seconds with
    six concurrent workers; large-packet cases took 19.6-26.4 seconds. Reduce
    resource contention and keep a finite limit rather than adding retries or
    weakening any assertions. Startup/automation timing is not app latency.

## Release coordination decisions

Hosted link checks returned 404 only for the repository's maintainer-only security
settings URL. Keep its exact click path, exclude only that anchored URL from
anonymous lychee probes, and continue checking all public research/document links.
Read-only API checks separately established the disabled alerts/update settings.
No setting or credential was changed to make the check pass.

Pages deployment is manual-only so approving a merge does not also approve
hosting. A release tag starts trusted package publication, so the tag requires
both tag and registry publication authorization. npm first-publication bootstrap,
if needed, is a separate owner-approved publication using existing access; this
run does not create secrets or bypass registry setup.
