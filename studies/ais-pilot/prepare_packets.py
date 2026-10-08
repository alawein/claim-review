"""Offline ALCE corpus adapter. No labels or scores are invented."""

import argparse
import hashlib
import json
import random
from pathlib import Path

UPSTREAM_SHA256 = "cfed9293752413d7c7631f36524dd4ee9ef58b209cdf9c63f6fc1e280b43cca6"


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def prepare(corpus, limit=8, excluded=None):
    """First sorted ASQA answers. Each sentence-citation pair is an item.

    Whole original sentences are retained. Any manual compound exclusions must
    be explicit item IDs with reasons; no heuristic claims to detect compoundness.
    """
    excluded = excluded or {}
    sources, claims, items, originals, contexts = [], [], [], [], []
    candidates = set()
    answer_count = 0
    for model, answers in sorted(corpus["asqa"].items()):
        for answer_id, answer in sorted(answers.items()):
            if answer_count >= limit:
                break
            answer_count += 1
            key = f"{model}:{answer_id}"
            originals.append({"answer_id": key, "data": answer})
            contexts.append(
                {
                    "answer_id": f"a{answer_count}",
                    "question": answer["question"],
                    "output": answer["output"],
                }
            )
            cursor = 0
            for index, sentence in enumerate(answer["sentences"]):
                text = sentence["text"]
                start = answer["output"].find(text, cursor)
                if start < 0:
                    raise ValueError("Sentence boundary missing from original output")
                cursor = start + len(text)
                claim_id = f"a{answer_count}-s{index}"
                citations = []
                for citation_index, citation in enumerate(sentence["citations"]):
                    source_id = f"{claim_id}-d{citation_index}"
                    source_text = citation["text"]
                    if not source_text:
                        raise ValueError("Missing supplied source text")
                    item_id = f"{claim_id}:{source_id}"
                    candidates.add(item_id)
                    if item_id in excluded:
                        continue
                    sources.append(
                        {
                            "id": source_id,
                            "title": citation["title"],
                            "text": source_text,
                            "sha256": digest(source_text),
                        }
                    )
                    citations.append(source_id)
                    items.append(
                        {
                            "id": item_id,
                            "claim_id": claim_id,
                            "source_id": source_id,
                            "answer_id": key,
                            "sentence_index": index,
                            "citation_index": citation_index,
                            "answer_start_codepoint": start,
                            "answer_end_codepoint": cursor,
                            "source_sha256": digest(source_text),
                            "original_ais_label": None,
                            "original_alce_citation_label": citation[
                                "citation_precision_score"
                            ],
                            "compound_screening": "pending",
                        }
                    )
                if citations:
                    claims.append(
                        {"id": claim_id, "text": text, "citation_ids": citations}
                    )
    if set(excluded) - candidates or any(
        not isinstance(reason, str) or not reason.strip()
        for reason in excluded.values()
    ):
        raise ValueError("Invalid exclusion ID")
    packet = {"schema_version": 1, "sources": sources, "claims": claims, "reviews": []}
    blinded = []
    for seed in (1103, 2207):
        copy = json.loads(json.dumps(packet))
        random.Random(seed).shuffle(copy["claims"])
        blinded.append(copy)
    population = {
        "schema_version": 1,
        "limit": limit,
        "upstream_sha256": UPSTREAM_SHA256,
        "items": items,
        "original_alce": originals,
        "excluded_compound_items": excluded,
        "independent_collection": "pending",
        "authentic_alce_scores": True,
    }
    population["population_sha256"] = digest(
        json.dumps(items, sort_keys=True, separators=(",", ":"))
    )
    return {
        "reviewer_a": blinded[0],
        "reviewer_b": blinded[1],
        "population": population,
        "reviewer_context": contexts,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--limit", type=int, default=8)
    parser.add_argument("--exclusions", type=Path)
    args = parser.parse_args()
    if not 1 <= args.limit <= 8:
        parser.error("limit must be 1..8 for the pilot")
    raw = args.input.read_bytes()
    if hashlib.sha256(raw).hexdigest() != UPSTREAM_SHA256:
        raise ValueError("Upstream byte checksum mismatch")
    result = prepare(
        json.loads(raw),
        args.limit,
        json.loads(args.exclusions.read_text(encoding="utf-8"))
        if args.exclusions
        else None,
    )
    args.output.mkdir(parents=True, exist_ok=True)
    for name, data in result.items():
        (args.output / f"{name}.json").write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(
        f"Prepared {len(result['population']['items'])} items; independent labels pending"
    )


if __name__ == "__main__":
    main()
