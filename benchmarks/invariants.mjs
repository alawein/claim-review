export function validateStressKeys(rows, keys) {
  if (keys.length !== rows.length) throw new Error("Stress answer key count differs");
  for (const [i, row] of rows.entries()) {
    const exact = Array.from(row.text).slice(row.start_codepoint, row.end_codepoint).join("");
    if (keys[i].id !== row.id || keys[i].exact !== exact)
      throw new Error(`Stress answer key does not match row ${row.id}`);
  }
}
export function uiFailureCount(reports) {
  return reports.reduce((count, report) => count + report.errors, 0);
}
export function integrityFailures(results) {
  return results.filter(
    (r) =>
      r.span_correct !== r.cases ||
      r.stale_detected !== r.cases ||
      r.tampering_rejected !== r.cases,
  );
}
