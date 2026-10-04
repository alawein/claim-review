import { validSpan } from "./spans";
export type Hash = (text: string) => Promise<string>;
export type Verdict = "supported" | "partial" | "contradicted" | "unverifiable";
export interface Source {
  id: string;
  title: string;
  text: string;
  sha256: string;
}
export interface Claim {
  id: string;
  text: string;
  citation_ids: string[];
}
export interface Review {
  id: string;
  claim_id: string;
  source_id: string;
  source_sha256: string;
  start: number;
  end: number;
  verdict: Verdict;
  rationale: string;
  reviewer: string;
}
export interface Packet {
  schema_version: 1;
  sources: Source[];
  claims: Claim[];
  reviews: Review[];
}

export function requireValue(ok: boolean, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function object(value: unknown, keys: string[], label: string): Record<string, unknown> {
  requireValue(
    typeof value === "object" && value !== null && !Array.isArray(value),
    `${label}: object required`,
  );
  const row = value as Record<string, unknown>;
  requireValue(
    JSON.stringify(Object.keys(row).sort()) === JSON.stringify([...keys].sort()),
    `${label}: exact fields required`,
  );
  return row;
}
function text(value: unknown, limit: number, label: string, allowEmpty = false): string {
  requireValue(
    typeof value === "string" && value.length <= limit && (allowEmpty || value.trim().length > 0),
    `${label}: invalid text`,
  );
  // Reject isolated surrogates: TextEncoder would replace them and break exact-source identity.
  requireValue(
    !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value),
    `${label}: invalid Unicode`,
  );
  return value;
}
function digest(value: unknown, label: string): string {
  const result = text(value, 64, label);
  requireValue(/^[a-f0-9]{64}$/.test(result), `${label}: SHA-256 hex required`);
  return result;
}
function entries(value: unknown, limit: number, label: string): unknown[] {
  requireValue(Array.isArray(value) && value.length <= limit, `${label}: invalid count`);
  return value;
}
function unique(rows: { id: string }[], label: string): void {
  requireValue(new Set(rows.map((row) => row.id)).size === rows.length, `${label}: duplicate ID`);
}
export function parseReview(value: unknown): Review {
  const row = object(
    value,
    [
      "id",
      "claim_id",
      "source_id",
      "source_sha256",
      "start",
      "end",
      "verdict",
      "rationale",
      "reviewer",
    ],
    "review",
  );
  requireValue(
    typeof row.start === "number" && typeof row.end === "number",
    "offsets must be numbers",
  );
  requireValue(
    typeof row.verdict === "string" &&
      ["supported", "partial", "contradicted", "unverifiable"].includes(row.verdict),
    "invalid verdict",
  );
  return {
    id: text(row.id, 200, "review ID"),
    claim_id: text(row.claim_id, 200, "claim reference"),
    source_id: text(row.source_id, 200, "source reference"),
    source_sha256: digest(row.source_sha256, "review hash"),
    start: row.start,
    end: row.end,
    verdict: row.verdict as Verdict,
    rationale: text(row.rationale, 4000, "rationale"),
    reviewer: text(row.reviewer, 200, "reviewer"),
  };
}
export function assertReview(packet: Packet, review: Review): void {
  object(
    review,
    [
      "id",
      "claim_id",
      "source_id",
      "source_sha256",
      "start",
      "end",
      "verdict",
      "rationale",
      "reviewer",
    ],
    "review",
  );
  text(review.id, 200, "review ID");
  text(review.claim_id, 200, "claim reference");
  text(review.source_id, 200, "source reference");
  digest(review.source_sha256, "review hash");
  text(review.rationale, 4000, "rationale");
  text(review.reviewer, 200, "reviewer");
  requireValue(
    typeof review.verdict === "string" &&
      ["supported", "partial", "contradicted", "unverifiable"].includes(review.verdict),
    "invalid verdict",
  );
  const source = packet.sources.find((row) => row.id === review.source_id);
  const claim = packet.claims.find((row) => row.id === review.claim_id);
  requireValue(
    !!source && !!claim && claim.citation_ids.includes(source.id),
    "review: unknown or uncited reference",
  );
  requireValue(
    Number.isSafeInteger(review.start) &&
      Number.isSafeInteger(review.end) &&
      review.start >= 0 &&
      review.start < review.end &&
      review.end <= 100000,
    "review: invalid offsets",
  );
  if (review.source_sha256 === source.sha256)
    requireValue(validSpan(source.text, review.start, review.end), "review: invalid current span");
}
export async function parsePacket(raw: string, hash: Hash): Promise<Packet> {
  requireValue(new TextEncoder().encode(raw).byteLength <= 5 * 1024 * 1024, "packet exceeds 5 MiB");
  requireValue(!raw.startsWith("\uFEFF"), "BOM forbidden");
  const root = object(
    JSON.parse(raw),
    ["schema_version", "sources", "claims", "reviews"],
    "packet",
  );
  requireValue(root.schema_version === 1, "schema_version must be 1");
  const sources: Source[] = [];
  for (const value of entries(root.sources, 100, "sources")) {
    const row = object(value, ["id", "title", "text", "sha256"], "source");
    const source = {
      id: text(row.id, 200, "source ID"),
      title: text(row.title, 1000, "title"),
      text: text(row.text, 100000, "source text", true),
      sha256: digest(row.sha256, "source hash"),
    };
    requireValue((await hash(source.text)) === source.sha256, `source ${source.id}: hash mismatch`);
    sources.push(source);
  }
  unique(sources, "sources");
  const claims: Claim[] = entries(root.claims, 1000, "claims").map((value) => {
    const row = object(value, ["id", "text", "citation_ids"], "claim");
    const citation_ids = entries(row.citation_ids, 100, "citations").map((id) =>
      text(id, 200, "citation ID"),
    );
    requireValue(new Set(citation_ids).size === citation_ids.length, "duplicate citation");
    requireValue(
      citation_ids.every((id) => sources.some((source) => source.id === id)),
      "unknown citation",
    );
    return {
      id: text(row.id, 200, "claim ID"),
      text: text(row.text, 10000, "claim text"),
      citation_ids,
    };
  });
  unique(claims, "claims");
  const reviews: Review[] = entries(root.reviews, 10000, "reviews").map((value) =>
    parseReview(value),
  );
  unique(reviews, "reviews");
  const packet: Packet = { schema_version: 1, sources, claims, reviews };
  for (const review of reviews) assertReview(packet, review);
  return packet;
}
