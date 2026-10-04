# Functional evidence

32 product unit cases exercise the SHA-256 known vector, UTF-16 emoji boundaries,
Arabic preservation, stale history/latest-per-pair, all four verdicts, direct-API
forged types/verdicts/references, invalid spans, required rationales/reviewer,
tampered source, duplicate IDs/citations, limits, BOM and byte bounds. Initial
model tests failed on missing imports before implementation. Vitest needed its
Vite peer dependency explicitly installed; all runtime dependencies remain absent.

Fifteen browser cases (five workflows in Chromium, Firefox and WebKit) exercise
four actual synthetic judgments, exact export/reimport, no input-driven requests,
corrupt-import preservation, keyboard navigation, offline standalone import/save/
export/reimport,320px reflow, doubled text size, inert script text and stale labels.
The review-history context assertion failed before claim/source/span text was added.
Initial nested select labels changed with loaded options; separate stable labels
resolved the locator/label mismatch.

Windows WebKit's simulated setOffline flag caused NotReadableError on a local
exported file. The final standalone test blocks all HTTP/HTTPS requests while
allowing local filesystem reads in all three engines. It completes the full flow.
Chromium/Firefox also completed with setOffline(true). This is not an OS network
cable test.320px and doubled CSS text size are observed, not a claim of manual
browser zoom or screen-reader certification. Actual released-download/live checks
are stated in release notes after execution.

Judgments are synthetic expectations, not independent semantic accuracy labels.
No conformance result establishes adoption, source authenticity or annotator agreement.
