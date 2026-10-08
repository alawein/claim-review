# Changelog

## 0.3.1 (publication not yet attempted)

- Offline JSON-LD expansion/RDF tests with pinned context and Unicode fixtures;
  native compatibility and stale-history integrity remain unchanged.
- Standard-library AIS pilot preparation and supplied-label analysis, blinded
  packet sets, answer clusters, explicit missing labels and separate adjudication.
  Independent human collection remains pending; synthetic tests are not findings.
- One canonical tag build, retained artifacts, exact file checksums, standalone
  HTML attestation, OIDC publication and mismatch-rejecting release/registry retries.
- Current release-state documentation and the entire Dependabot-family exclusion.

## 0.3.0

- Enriched native packets (schema_version 2), with v0.2 migration, retained UTF-16
  spans, exact quote selectors and code-point positions with 32-point context.
- Separate exact-source and NFC hashes; normalization-only changes remain visibly
  stale without reanchoring a judgment or quoting changed text.
- Published JSON Schema 2020-12 and a dev validator paired with runtime integrity
  checks; bounded migration refuses exports over the 5 MiB reimport limit.
- W3C JSON-LD annotation export beside native export, tested on published selector
  examples. Migrated stale history without original selectors retains native export.
- Opt-in device drafts, off by default, explicit restore/clear, guarded unavailable
  storage behavior and the retained unsaved-close guard.
- Standalone CSP with default-src none and minimum hashed inline script/style;
  inert active-text and offline Chromium/Firefox/WebKit coverage.
- Randomized Unicode offset/hash/round-trip tests and a proposed AIS/ALCE annotation
  study protocol. No fabricated human annotations, agreement or accuracy claims.

## 0.2.0

- Guided packet builder: add sources and claims in the page, with in-browser SHA-256,
  CRLF-as-LF storage note, parsePacket as sole validator, use-in-review and download paths.
- Interface hardening: error-styled alert status with focus, import loading state,
  announced span preview, claim-text dropdown labels, file-input reset, ticket-guarded
  example loader, unsaved-work guard with a one-click builder confirm, and cleaned
  save/import messages. A pending-operations counter keeps controls enabled after any
  async builder/import completion.
- Review-hardened: surrogate-safe dropdown labels, name-addressed builder rows, shared
  status styling, and regression tests for the beforeunload guard and packet download.

## 0.1.0

- Browser-only citation review with exact UTF-8 hashes and original UTF-16 spans.
- Human verdicts/rationales, safe imports, append history and portable exports.
- CRLF selection mapping and byte-bounded round trips.
- Standalone offline HTML and GitHub Pages distribution.
