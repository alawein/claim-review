import { test } from "vitest";
import assert from "node:assert/strict";
import { integrityFailures } from "./invariants.mjs";
test("benchmark gate detects perturbed span, stale and tamper gold predictions", () => {
  const good = { cases: 4, span_correct: 4, stale_detected: 4, tampering_rejected: 4 };
  assert.equal(integrityFailures([good]).length, 0);
  for (const key of ["span_correct", "stale_detected", "tampering_rejected"])
    assert.equal(integrityFailures([{ ...good, [key]: 3 }]).length, 1);
});
