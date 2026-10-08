"""Standard-library offline analysis. Supplied labels only, never a model judge."""

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import random
from prepare_packets import UPSTREAM_SHA256, prepare

VERDICTS = {"supported", "partial", "contradicted", "unverifiable"}


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def validate_population(original, export):
    """History may grow; sources and the entire claim/citation population may not."""
    for packet in (original, export):
        if len({s["id"] for s in packet["sources"]}) != len(packet["sources"]):
            raise ValueError("Duplicate source ID")
        if len({c["id"] for c in packet["claims"]}) != len(packet["claims"]):
            raise ValueError("Duplicate claim ID")
        for source in packet["sources"]:
            if digest(source["text"]) != source["sha256"]:
                raise ValueError("Source hash mismatch")

    def signature(packet):
        return (
            sorted(
                (s["id"], s["title"], s["text"], s["sha256"]) for s in packet["sources"]
            ),
            sorted(
                (c["id"], c["text"], tuple(sorted(c["citation_ids"])))
                for c in packet["claims"]
            ),
        )

    if signature(original) != signature(export):
        raise ValueError("Changed item population or source")
    sources = {s["id"]: s for s in export["sources"]}
    pairs = {f"{c['id']}:{s}" for c in export["claims"] for s in c["citation_ids"]}
    latest = {}
    seen = set()
    for review in export.get("reviews", []):
        key = f"{review['claim_id']}:{review['source_id']}"
        if (
            key not in pairs
            or review["source_sha256"] != sources[review["source_id"]]["sha256"]
        ):
            raise ValueError("Review population/hash mismatch")
        if review["id"] in seen or review["verdict"] not in VERDICTS:
            raise ValueError("Invalid review ID/verdict")
        seen.add(review["id"])
        source = sources[review["source_id"]]["text"].encode("utf-16-le")
        start, end = review["start"], review["end"]
        if (
            type(start) is not int
            or type(end) is not int
            or not 0 <= start < end <= len(source) // 2
        ):
            raise ValueError("Invalid review span")
        source[start * 2 : end * 2].decode("utf-16-le")
        if not review["reviewer"].strip() or not review["rationale"].strip():
            raise ValueError("Missing reviewer/rationale")
        latest[key] = review["verdict"]
    return latest


def agreement(items, a, b):
    allowed = VERDICTS | {"abstain"}
    ids = {item["id"] for item in items}
    if (set(a) | set(b)) - ids or any(
        label not in allowed for label in list(a.values()) + list(b.values())
    ):
        raise ValueError("Unknown item or label")
    clusters = defaultdict(list)
    missing, disagreements, pairs = [], [], []
    table = Counter()
    abstentions = 0
    for item in items:
        key = item["id"]
        left, right = a.get(key), b.get(key)
        clusters[item["answer_id"]].append({"item_id": key, "a": left, "b": right})
        abstentions += (left == "abstain") + (right == "abstain")
        if left is None or right is None:
            missing.append(key)
        if left is not None and right is not None:
            table[(left, right)] += 1
            if left != right:
                disagreements.append({"item_id": key, "a": left, "b": right})
            if "abstain" not in (left, right):
                pairs.append((left, right))

    def alpha(rows):
        if not rows:
            return None
        counts = Counter(label for row in rows for label in row)
        n = sum(counts.values())
        expected = 1 - sum(count * (count - 1) for count in counts.values()) / (
            n * (n - 1)
        )
        observed = sum(left != right for left, right in rows) / len(rows)
        return 1 - observed / expected if expected else None

    cluster_pairs = [
        [
            (row["a"], row["b"])
            for row in rows
            if row["a"] in VERDICTS and row["b"] in VERDICTS
        ]
        for rows in clusters.values()
    ]
    intervals, alpha_intervals = [], []
    rng = random.Random(20261008)
    for _ in range(1000 if cluster_pairs else 0):
        resampled = [pair for _ in cluster_pairs for pair in rng.choice(cluster_pairs)]
        if resampled:
            intervals.append(
                sum(left == right for left, right in resampled) / len(resampled)
            )
            value = alpha(resampled)
            if value is not None:
                alpha_intervals.append(value)
    intervals.sort()
    alpha_intervals.sort()
    return {
        "total_items": len(items),
        "paired_items": len(pairs),
        "raw_agreement": sum(left == right for left, right in pairs) / len(pairs)
        if pairs
        else None,
        "nominal_alpha": alpha(pairs),
        "agreement_cluster_bootstrap_95": [
            intervals[int(0.025 * (len(intervals) - 1))],
            intervals[int(0.975 * (len(intervals) - 1))],
        ]
        if intervals
        else None,
        "alpha_cluster_bootstrap_95": [
            alpha_intervals[int(0.025 * (len(alpha_intervals) - 1))],
            alpha_intervals[int(0.975 * (len(alpha_intervals) - 1))],
        ]
        if alpha_intervals
        else None,
        "bootstrap_seed": 20261008,
        "missing_items": missing,
        "abstentions": abstentions,
        "label_counts": {
            "a": dict(Counter(a.values())),
            "b": dict(Counter(b.values())),
        },
        "disagreements": disagreements,
        "confusion_table": [
            {"a": left, "b": right, "count": count}
            for (left, right), count in sorted(table.items())
        ],
        "answer_clusters": dict(clusters),
    }


def compare_scores(items, labels, population):
    if (
        population.get("synthetic")
        or population.get("authentic_alce_scores") is not True
    ):
        raise ValueError("Authentic supplied ALCE scores required")
    originals = {row["answer_id"]: row["data"] for row in population["original_alce"]}
    rows = []
    for item in items:
        original = originals[item["answer_id"]]
        s, c = item["sentence_index"], item["citation_index"]
        rows.append(
            {
                "item_id": item["id"],
                "human_verdict": labels.get(item["id"]),
                "upstream_human_citation_score": item["original_alce_citation_label"],
                "automatic_citation_precision_score": original.get(
                    "automatic_citation_precision_scores", []
                )[s][c]
                if original.get("automatic_citation_precision_scores")
                else None,
                "automatic_sentence_recall_score": original.get(
                    "automatic_recall_scores", []
                )[s]
                if original.get("automatic_recall_scores")
                else None,
            }
        )
    return rows


def load_labels(path, items, population_hash):
    """Separate two-stage AIS labels and explicit abstentions, no forced mapping."""
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("population_sha256") != population_hash or set(
        data.get("items", {})
    ) != {item["id"] for item in items}:
        raise ValueError("AIS label population mismatch")
    abstentions = {}
    for key, row in data["items"].items():
        if row.get("interpretability") not in (
            None,
            "interpretable",
            "uninterpretable",
            "abstain",
        ) or row.get("attribution") not in (
            None,
            "attributable",
            "not_attributable",
            "abstain",
        ):
            raise ValueError("Unknown AIS label")
        if (
            row.get("interpretability") == "uninterpretable"
            and row.get("attribution") is not None
        ):
            raise ValueError("Uninterpretable AIS item cannot have attribution label")
        if (
            row.get("attribution") in ("attributable", "not_attributable")
            and row.get("interpretability") != "interpretable"
        ):
            raise ValueError("AIS attribution requires interpretable content")
        if "abstain" in (row.get("interpretability"), row.get("attribution")):
            abstentions[key] = "abstain"
    return data, abstentions


def main():
    parser = argparse.ArgumentParser()
    for field in ("population", "original", "reviewer_a", "reviewer_b", "output"):
        parser.add_argument(field, type=Path)
    parser.add_argument("--ais-a", type=Path)
    parser.add_argument("--ais-b", type=Path)
    parser.add_argument("--adjudication", type=Path)
    parser.add_argument("--corpus", type=Path, required=True)
    args = parser.parse_args()
    if args.reviewer_a.resolve() == args.reviewer_b.resolve():
        raise ValueError("Two independently collected exports required")
    read = lambda path: json.loads(path.read_text(encoding="utf-8"))
    population, original = read(args.population), read(args.original)
    corpus_bytes = args.corpus.read_bytes()
    if hashlib.sha256(corpus_bytes).hexdigest() != UPSTREAM_SHA256:
        raise ValueError("Authentic corpus checksum mismatch")
    frozen = prepare(
        json.loads(corpus_bytes),
        population["limit"],
        population["excluded_compound_items"],
    )
    if frozen["population"] != population:
        raise ValueError("Population or original scores differ from pinned corpus")
    validate_population(frozen["reviewer_a"], original)
    items = population["items"]
    if (
        digest(json.dumps(items, sort_keys=True, separators=(",", ":")))
        != population["population_sha256"]
    ):
        raise ValueError("Frozen population checksum mismatch")
    exports = [read(args.reviewer_a), read(args.reviewer_b)]
    labels = [validate_population(original, packet) for packet in exports]
    original_pairs = {
        f"{claim['id']}:{source}"
        for claim in original["claims"]
        for source in claim["citation_ids"]
    }
    if original_pairs != {item["id"] for item in items}:
        raise ValueError("Original packet does not match frozen population")
    identities = [
        {row["reviewer"] for row in packet.get("reviews", [])} for packet in exports
    ]
    if identities[0] & identities[1]:
        raise ValueError(
            "Independent exports must use different self-reported reviewer labels"
        )
    result = {
        "kind": "supplied-label-analysis",
        "population_sha256": population["population_sha256"],
        "identity_limit": "Self-reported identity cannot prove independence",
        "verdict_agreement": agreement(items, *labels),
        "comparison_a": compare_scores(items, labels[0], population),
        "comparison_b": compare_scores(items, labels[1], population),
        "adjudication": None,
        "ais_agreement": None,
    }
    if bool(args.ais_a) != bool(args.ais_b):
        raise ValueError("Supply both independent AIS files")
    if args.ais_a:
        ais = [
            load_labels(path, items, population["population_sha256"])
            for path in (args.ais_a, args.ais_b)
        ]
        result["original_ais_labels"] = [row[0] for row in ais]
        for index in range(2):
            if set(ais[index][1]) & set(labels[index]):
                raise ValueError("Abstention conflicts with supplied verdict")
            labels[index].update(ais[index][1])
        result["verdict_agreement"] = agreement(items, *labels)
        result["ais_agreement"] = {
            field: {
                "paired": sum(
                    ais[0][0]["items"][item["id"]].get(field) is not None
                    and ais[1][0]["items"][item["id"]].get(field) is not None
                    for item in items
                ),
                "equal": sum(
                    ais[0][0]["items"][item["id"]].get(field)
                    == ais[1][0]["items"][item["id"]].get(field)
                    and ais[0][0]["items"][item["id"]].get(field) is not None
                    for item in items
                ),
            }
            for field in ("interpretability", "attribution")
        }
    if args.adjudication:
        adjudicated = validate_population(original, read(args.adjudication))
        result["adjudication"] = {
            "labels": adjudicated,
            "comparison": compare_scores(items, adjudicated, population),
        }
    args.output.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        "Supplied labels analyzed; independent labels and adjudication retained separately"
    )


if __name__ == "__main__":
    main()
