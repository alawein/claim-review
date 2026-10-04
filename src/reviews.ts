import { assertReview, parseReview, requireValue, type Packet, type Review } from "./packet";
export function reviewState(packet: Packet, review: Review): "valid" | "stale" {
  const source = packet.sources.find((row) => row.id === review.source_id);
  return source?.sha256 === review.source_sha256 ? "valid" : "stale";
}
export function latestReviews(packet: Packet): Review[] {
  const map = new Map<string, Review>();
  for (const review of packet.reviews)
    map.set(JSON.stringify([review.claim_id, review.source_id]), review);
  return [...map.values()];
}
export function appendReview(packet: Packet, review: Review): Packet {
  review = parseReview(review);
  assertReview(packet, review);
  requireValue(reviewState(packet, review) === "valid", "cannot save review against stale source");
  requireValue(!packet.reviews.some((row) => row.id === review.id), "duplicate review ID");
  requireValue(packet.reviews.length < 10000, "review limit reached");
  requireValue(
    review.rationale.trim().length > 0 &&
      review.rationale.length <= 4000 &&
      review.reviewer.trim().length > 0 &&
      review.reviewer.length <= 200,
    "rationale and reviewer required",
  );
  return { ...packet, reviews: [...packet.reviews, review] };
}
