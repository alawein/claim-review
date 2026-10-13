import { test } from "vitest";
import assert from "node:assert/strict";
import { integrityFailures, validateStressKeys, uiFailureCount } from "./invariants.mjs";
test("paired stress keys reject equal-offset swaps and altered quotations", () => {
  const rows = [
    { id: "a", text: "abcd", start_codepoint: 0, end_codepoint: 4 },
    { id: "b", text: "wxyz", start_codepoint: 0, end_codepoint: 4 },
  ];
  const keys = [
    { id: "a", exact: "abcd" },
    { id: "b", exact: "wxyz" },
  ];
  assert.doesNotThrow(() => validateStressKeys(rows, keys));
  assert.throws(() => validateStressKeys(rows, keys.toReversed()), /answer key/);
  assert.throws(
    () => validateStressKeys(rows, [{ ...keys[0], exact: "wrong" }, keys[1]]),
    /answer key/,
  );
  assert.throws(() => validateStressKeys(rows, keys.slice(0, 1)), /answer key/);
});
test("UI benchmark failure count rejects any failed save", () => {
  assert.equal(uiFailureCount([{ errors: 0 }]), 0);
  assert.equal(uiFailureCount([{ errors: 0 }, { errors: 1 }]), 1);
});
test("benchmark gate detects perturbed span, stale and tamper gold predictions", () => {
  const good = { cases: 4, span_correct: 4, stale_detected: 4, tampering_rejected: 4 };
  assert.equal(integrityFailures([good]).length, 0);
  for (const key of ["span_correct", "stale_detected", "tampering_rejected"])
    assert.equal(integrityFailures([{ ...good, [key]: 3 }]).length, 1);
});
