import { parsePacket, requireValue, type Hash, type Packet } from "./packet";

export interface BuilderSource {
  id: string;
  title: string;
  text: string;
}
export interface BuilderClaim {
  id: string;
  text: string;
  citation_ids: string[];
}
export interface BuilderState {
  sources: BuilderSource[];
  claims: BuilderClaim[];
}

export function draftSource(id = "", title = "", text = ""): BuilderSource {
  return { id, title, text };
}
export function draftClaim(id = "", text = "", citation_ids: string[] = []): BuilderClaim {
  return { id, text, citation_ids: [...citation_ids] };
}

function clean(value: string): string {
  // Textarea reads normalize CRLF to LF; builder stores exactly what is shown.
  return value.replace(/\r\n/g, "\n");
}

export async function buildPacket(state: BuilderState, hash: Hash): Promise<Packet> {
  requireValue(state.sources.length <= 100, "sources: invalid count");
  requireValue(state.claims.length <= 1000, "claims: invalid count");
  requireValue(
    state.sources.length > 0 && state.claims.length > 0,
    "builder: add at least one source and one claim",
  );
  // Make the tamper window explicit: hash once here, then let parsePacket re-hash
  // with the same function as the sole authority over caps, fields, and citations.
  const sources = [];
  for (const draft of state.sources) {
    const source = { id: draft.id, title: draft.title, text: clean(draft.text), sha256: "" };
    source.sha256 = await hash(source.text);
    requireValue(
      (await hash(source.text)) === source.sha256,
      `source ${source.id || "(untitled)"}: hash mismatch`,
    );
    sources.push(source);
  }
  const packet = {
    schema_version: 1 as const,
    sources,
    claims: state.claims.map((claim) => {
      requireValue(claim.citation_ids.length > 0, "builder: claim needs a citation");
      return {
        id: claim.id,
        text: claim.text,
        citation_ids: [...claim.citation_ids],
      };
    }),
    reviews: [],
  };
  // parsePacket is the sole authority: exact fields, caps, hashes, citations.
  return parsePacket(JSON.stringify(packet), hash);
}
