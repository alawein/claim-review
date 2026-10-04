import { parsePacket, requireValue, type Packet, type Review, type Verdict } from "./packet";
import { sha256 } from "./hash";
import { appendReview, latestReviews, reviewState } from "./reviews";
import { validSpan, sourceOffset } from "./spans";
import { buildPacket, draftClaim, draftSource } from "./builder";
import example from "../examples/packet.json";

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing control ${id}`);
  return node as T;
}
function message(error: unknown): string {
  return String(error).replace(/^Error:\s*/, "");
}
let packet: Packet | null = null,
  generation = 0,
  lastExport = "",
  dirty = false;
const claimControl = element<HTMLSelectElement>("claim");
const citationControl = element<HTMLSelectElement>("citation");
const sourceControl = element<HTMLTextAreaElement>("source-text");
const startControl = element<HTMLInputElement>("start"),
  endControl = element<HTMLInputElement>("end");
const status = element("status"),
  history = element("history");
const importControl = element<HTMLInputElement>("import");
const builderSection = element("builder");
const builderToggle = element<HTMLButtonElement>("builder-toggle");
const builderStatus = element("builder-status");
function options(control: HTMLSelectElement, rows: { id: string; label: string }[]): void {
  control.replaceChildren(...rows.map((row) => new Option(row.label, row.id)));
}
function setStatus(ok: boolean, text: string): void {
  status.textContent = text;
  status.classList.toggle("error", !ok);
  status.setAttribute("role", ok ? "status" : "alert");
  if (!ok) status.focus();
}
function setBusy(busy: boolean): void {
  status.setAttribute("aria-busy", String(busy));
  for (const id of ["import", "example", "export", "builder-toggle"]) {
    element(id).toggleAttribute("disabled", busy);
  }
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
    : "Enter a span inside the source text";
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
function claimLabel(id: string, text: string): string {
  const short = text.length > 80 ? `${text.slice(0, 77)}…` : text;
  return `${id}: ${short}`;
}
function usePacket(next: Packet, note: string): void {
  packet = next;
  dirty = JSON.stringify(packet) !== lastExport;
  options(
    claimControl,
    next.claims.map((row) => ({ id: row.id, label: claimLabel(row.id, row.text) })),
  );
  showClaim();
  showHistory();
  setStatus(true, note);
}
async function importText(raw: string, ticket: number): Promise<void> {
  setBusy(true);
  try {
    const next = await parsePacket(raw, sha256);
    if (ticket !== generation) return;
    usePacket(next, "Imported packet. Export to keep changes.");
  } finally {
    if (ticket === generation) setBusy(false);
  }
}
function useFile(raw: string, ticket: number): void {
  void importText(raw, ticket).catch((error) => {
    if (ticket === generation)
      setStatus(false, `Import failed; current work kept: ${message(error)}`);
  });
}
importControl.addEventListener("change", async (event) => {
  const ticket = ++generation;
  try {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    requireValue(file.size <= 5 * 1024 * 1024, "packet exceeds 5 MiB");
    const bytes = new Uint8Array(await file.arrayBuffer());
    requireValue(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), "BOM forbidden");
    useFile(new TextDecoder("utf-8", { fatal: true }).decode(bytes), ticket);
  } catch (error) {
    if (ticket === generation)
      setStatus(false, `Import failed; current work kept: ${message(error)}`);
  } finally {
    (event.target as HTMLInputElement).value = "";
  }
});
element("example").addEventListener("click", () => {
  const ticket = ++generation;
  void importText(JSON.stringify(example), ticket).catch((error) => {
    if (ticket === generation) setStatus(false, `Example failed: ${message(error)}`);
  });
});
claimControl.addEventListener("change", showClaim);
citationControl.addEventListener("change", showSource);
startControl.addEventListener("input", showExcerpt);
endControl.addEventListener("input", showExcerpt);
element("selection").addEventListener("click", () => {
  if (!packet || !citationControl.value) return;
  startControl.value = String(sourceOffset(source().text, sourceControl.selectionStart));
  endControl.value = String(sourceOffset(source().text, sourceControl.selectionEnd));
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
    dirty = true;
    showHistory();
    setStatus(true, "Saved human review in memory. Export to keep it.");
  } catch (error) {
    setStatus(false, `Review not saved: ${message(error)}`);
  }
});
function download(raw: string, name: string): void {
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
element("export").addEventListener("click", () => {
  if (!packet) {
    setStatus(false, "Import a packet first");
    return;
  }
  const raw = JSON.stringify(packet);
  if (new TextEncoder().encode(raw).byteLength > 5 * 1024 * 1024) {
    setStatus(false, "Export exceeds the 5 MiB import limit; export not created.");
    return;
  }
  download(raw, "claim-review.json");
  lastExport = raw;
  dirty = false;
  setStatus(true, "Export requested. Confirm your browser saved the file.");
});
globalThis.addEventListener("beforeunload", (event) => {
  if (dirty) event.preventDefault();
});

// Packet builder: creation-only mode alongside import. All validation flows through
// parsePacket via buildPacket, so builder packets obey the same caps and hashes.
interface BuilderRow {
  id: HTMLInputElement;
  title?: HTMLInputElement;
  text: HTMLInputElement | HTMLTextAreaElement;
  cite?: HTMLInputElement;
}
const builderSources = element("builder-sources");
const builderClaims = element("builder-claims");
function setBuilderStatus(ok: boolean, text: string): void {
  builderStatus.textContent = text;
  builderStatus.classList.toggle("error", !ok);
  builderStatus.setAttribute("role", ok ? "status" : "alert");
  if (!ok) builderStatus.focus();
}
function builderField(
  parent: HTMLElement,
  label: string,
  control: HTMLInputElement | HTMLTextAreaElement,
): void {
  const tag = document.createElement("label");
  tag.textContent = label;
  tag.append(control);
  parent.append(tag);
}
function addSourceRow(): void {
  const group = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = `Source ${builderSources.childElementCount + 1}`;
  group.append(legend);
  const id = document.createElement("input");
  id.placeholder = "policy-1…";
  id.maxLength = 200;
  id.name = "source-id";
  id.spellcheck = false;
  const title = document.createElement("input");
  title.placeholder = "Synthetic refund policy…";
  title.maxLength = 1000;
  title.name = "source-title";
  const text = document.createElement("textarea");
  text.rows = 4;
  text.placeholder = "Paste exact source text…";
  text.name = "source-text";
  builderField(group, "Source id", id);
  builderField(group, "Source title", title);
  builderField(group, "Source text", text);
  const hashLine = document.createElement("p");
  hashLine.textContent = "SHA-256 appears after typing.";
  group.append(hashLine);
  const update = (): void => {
    void sha256(text.value.replace(/\r\n/g, "\n"))
      .then((digest) => {
        hashLine.textContent = `SHA-256: ${digest.slice(0, 16)}…`;
      })
      .catch(() => {
        hashLine.textContent = "SHA-256 unavailable in this browser context";
      });
  };
  group.id = `builder-source-${builderSources.childElementCount}`;
  text.addEventListener("input", update);
  group.dataset.row = "source";
  builderSources.append(group);
}
function addClaimRow(): void {
  const group = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = `Claim ${builderClaims.childElementCount + 1}`;
  group.append(legend);
  const id = document.createElement("input");
  id.placeholder = "c1…";
  id.maxLength = 200;
  id.name = "claim-id";
  id.spellcheck = false;
  const text = document.createElement("input");
  text.placeholder = "State the claim in one sentence…";
  text.maxLength = 10000;
  text.name = "claim-text";
  const cite = document.createElement("input");
  cite.placeholder = "policy-1, policy-2…";
  cite.name = "claim-citations";
  cite.spellcheck = false;
  builderField(group, "Claim id", id);
  builderField(group, "Claim text", text);
  builderField(group, "Citations", cite);
  group.dataset.row = "claim";
  builderClaims.append(group);
}
function readBuilder(): { sources: BuilderRow[]; claims: BuilderRow[] } {
  return {
    sources: Array.from(builderSources.querySelectorAll("[data-row='source']")).map((group) => {
      const fields = Array.from(group.querySelectorAll("input, textarea"));
      const [id, title, text] = fields;
      return {
        id: id as HTMLInputElement,
        title: title as HTMLInputElement,
        text: text as HTMLTextAreaElement,
      };
    }),
    claims: Array.from(builderClaims.querySelectorAll("[data-row='claim']")).map((group) => {
      const fields = Array.from(group.querySelectorAll("input, textarea"));
      const [id, text, cite] = fields;
      return {
        id: id as HTMLInputElement,
        text: text as HTMLInputElement,
        cite: cite as HTMLInputElement,
      };
    }),
  };
}
builderToggle.addEventListener("click", () => {
  const open = builderSection.hidden;
  builderSection.hidden = !open;
  builderToggle.setAttribute("aria-expanded", String(open));
  builderToggle.textContent = open ? "Hide packet builder" : "New packet";
  if (open && !builderSources.childElementCount) {
    addSourceRow();
    addClaimRow();
  }
});
element("builder-add-source").addEventListener("click", addSourceRow);
element("builder-add-claim").addEventListener("click", addClaimRow);
async function builderPacket(): Promise<Packet> {
  const rows = readBuilder();
  return buildPacket(
    {
      sources: rows.sources.map((row) =>
        draftSource(row.id.value, row.title!.value, row.text.value),
      ),
      claims: rows.claims.map((row) =>
        draftClaim(
          row.id.value,
          (row.text as HTMLInputElement).value,
          row
            .cite!.value.split(",")
            .map((part) => part.trim())
            .filter((part) => part.length > 0),
        ),
      ),
    },
    sha256,
  );
}
element("builder-use").addEventListener("click", () => {
  void builderPacket()
    .then((next) => {
      generation++;
      usePacket(next, "Built packet in memory. Save reviews, then export to keep them.");
      setBuilderStatus(true, "Packet ready in the review form.");
    })
    .catch((error) => setBuilderStatus(false, message(error)));
});
element("builder-download").addEventListener("click", () => {
  void builderPacket()
    .then((next) => {
      download(JSON.stringify(next), "packet.json");
      setBuilderStatus(true, "Packet file download requested.");
    })
    .catch((error) => setBuilderStatus(false, message(error)));
});
