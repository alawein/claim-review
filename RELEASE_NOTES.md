# claim-review v0.3.0

Release candidate. Publication is gated.

0.3.0

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

See [AUDIT_VERIFICATION.md](AUDIT_VERIFICATION.md) for executed checks and limitations,
and [RELEASE_READY.md](RELEASE_READY.md) for gated publication commands.
