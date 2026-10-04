import { parsePacket, requireValue, type Packet, type Review, type Verdict } from "./packet";
import { sha256 } from "./hash";
import { appendReview, latestReviews, reviewState } from "./reviews";
import { validSpan } from "./spans";
import example from "../examples/packet.json";

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing control ${id}`);
  return node as T;
}
let packet: Packet | null = null,
  generation = 0;
const claimControl = element<HTMLSelectElement>("claim");
const citationControl = element<HTMLSelectElement>("citation");
const sourceControl = element<HTMLTextAreaElement>("source-text");
const startControl = element<HTMLInputElement>("start"),
  endControl = element<HTMLInputElement>("end");
const status = element("status"),
  history = element("history");
function options(control: HTMLSelectElement, rows: { id: string; label: string }[]): void {
  control.replaceChildren(...rows.map((row) => new Option(row.label, row.id)));
}
function source(): Packet["sources"][number] {
  const value = packet?.sources.find((row) => row.id === citationControl.value);
  requireValue(!!value, "Select a citation with source text");
  return value;
}
function showExcerpt(): void {
  if (!packet || !citationControl.value) return;
  const value = source(),
    start = Number(startControl.value),
    end = Number(endControl.value);
  element("excerpt").textContent = validSpan(value.text, start, end)
    ? value.text.slice(start, end)
    : "Select a valid nonempty span";
}
function showSource(): void {
  if (!citationControl.value) {
    sourceControl.value = "";
    element("excerpt").textContent = "No cited source";
    return;
  }
  sourceControl.value = source().text;
  startControl.value = "0";
  endControl.value = "0";
  showExcerpt();
}
function showClaim(): void {
  const claim = packet?.claims.find((row) => row.id === claimControl.value);
  element("claim-text").textContent = claim?.text ?? "No claim selected";
  options(
    citationControl,
    (claim?.citation_ids ?? []).map((id) => ({
      id,
      label: packet?.sources.find((row) => row.id === id)?.title ?? id,
    })),
  );
  showSource();
}
function showHistory(): void {
  const latest = new Set(packet ? latestReviews(packet).map((row) => row.id) : []);
  history.replaceChildren(
    ...(packet?.reviews ?? []).map((review) => {
      const row = document.createElement("p");
      row.dir = "auto";
      row.textContent = `${review.id}: ${review.claim_id} / ${review.source_id} [${review.start},${review.end}) ${review.verdict} (${reviewState(packet!, review)}, ${latest.has(review.id) ? "latest" : "prior"}), ${review.reviewer}: ${review.rationale}`;
      const snapshot = packet!.sources.find((source) => source.id === review.source_id)!;
      row.textContent +=
        reviewState(packet!, review) === "valid"
          ? ` Passage: ${snapshot.text.slice(review.start, review.end)}`
          : " Original passage unavailable; changed source is not quoted.";
      return row;
    }),
  );
}
async function importText(raw: string, ticket: number): Promise<void> {
  const next = await parsePacket(raw, sha256);
  if (ticket !== generation) return;
  packet = next;
  options(
    claimControl,
    next.claims.map((row) => ({ id: row.id, label: row.id })),
  );
  showClaim();
  showHistory();
  status.textContent = "Imported packet. Export to keep changes.";
}
element<HTMLInputElement>("import").addEventListener("change", async (event) => {
  const ticket = ++generation;
  try {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    requireValue(file.size <= 5 * 1024 * 1024, "packet exceeds 5 MiB");
    const bytes = new Uint8Array(await file.arrayBuffer());
    requireValue(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), "BOM forbidden");
    await importText(new TextDecoder("utf-8", { fatal: true }).decode(bytes), ticket);
  } catch (error) {
    if (ticket === generation)
      status.textContent = `Import failed; current work kept: ${String(error)}`;
  }
});
element("example").addEventListener("click", () => {
  void importText(JSON.stringify(example), ++generation).catch((error) => {
    status.textContent = String(error);
  });
});
claimControl.addEventListener("change", showClaim);
citationControl.addEventListener("change", showSource);
startControl.addEventListener("input", showExcerpt);
endControl.addEventListener("input", showExcerpt);
element("selection").addEventListener("click", () => {
  startControl.value = String(sourceControl.selectionStart);
  endControl.value = String(sourceControl.selectionEnd);
  showExcerpt();
});
element<HTMLFormElement>("review-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const previous = packet,
    ticket = generation;
  try {
    requireValue(!!previous, "Import a packet first");
    const selected = source();
    let number = previous.reviews.length + 1;
    while (previous.reviews.some((row) => row.id === `review-${number}`)) number++;
    const review: Review = {
      id: `review-${number}`,
      claim_id: claimControl.value,
      source_id: selected.id,
      source_sha256: selected.sha256,
      start: Number(startControl.value),
      end: Number(endControl.value),
      verdict: element<HTMLSelectElement>("verdict").value as Verdict,
      rationale: element<HTMLTextAreaElement>("rationale").value,
      reviewer: element<HTMLInputElement>("reviewer").value,
    };
    const next = await parsePacket(JSON.stringify(appendReview(previous, review)), sha256);
    requireValue(ticket === generation && previous === packet, "Session changed; save again");
    packet = next;
    showHistory();
    status.textContent = "Saved human review in memory. Export to keep it.";
  } catch (error) {
    status.textContent = `Review not saved: ${String(error)}`;
  }
});
element("export").addEventListener("click", () => {
  if (!packet) {
    status.textContent = "Import a packet first";
    return;
  }
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(packet, null, 2) + "\n"], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "claim-review.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = "Export requested. Confirm your browser saved the file.";
});
