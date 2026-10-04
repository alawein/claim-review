# Changelog

## 0.2.0

- Guided packet builder: add sources and claims in the page, with in-browser SHA-256,
  CRLF-as-LF storage note, parsePacket as sole validator, use-in-review and download paths.
- Interface hardening: error-styled alert status, import loading state, announced span
  preview, claim-text dropdown labels, file-input reset, ticket-guarded example loader,
  unsaved-work guard, and cleaned save/import messages.
- Builder unit tests plus builder, dirty-guard recovery, error-role, and reselect browser
  coverage; keyboard path extended through the new controls.

## 0.1.0

- Browser-only citation review with exact UTF-8 hashes and original UTF-16 spans.
- Human verdicts/rationales, safe imports, append history and portable exports.
- CRLF selection mapping and byte-bounded round trips.
- Standalone offline HTML and GitHub Pages distribution.
