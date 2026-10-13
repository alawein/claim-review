export function integrityFailures(results) {
  return results.filter(
    (r) =>
      r.span_correct !== r.cases ||
      r.stale_detected !== r.cases ||
      r.tampering_rejected !== r.cases,
  );
}
