"""All labels in these tests are synthetic; no empirical result is claimed."""

import unittest
import copy
import hashlib
import json
import tempfile
from pathlib import Path
from analyze import agreement, validate_population, compare_scores, load_labels
from prepare_packets import prepare


class AnalysisTests(unittest.TestCase):
    def test_ais_attribution_requires_interpretability(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "labels.json"
            path.write_text(
                json.dumps(
                    {
                        "population_sha256": "frozen",
                        "items": {
                            "i": {
                                "interpretability": None,
                                "attribution": "attributable",
                            }
                        },
                    }
                ),
                encoding="utf-8",
            )
            with self.assertRaises(ValueError):
                load_labels(path, [{"id": "i"}], "frozen")

    def test_ais_missing_and_abstentions_retained(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "labels.json"
            data = {
                "population_sha256": "frozen",
                "items": {
                    "i": {"interpretability": None, "attribution": None},
                    "j": {"interpretability": "abstain", "attribution": None},
                },
            }
            path.write_text(json.dumps(data), encoding="utf-8")
            restored, abstentions = load_labels(
                path, [{"id": "i"}, {"id": "j"}], "frozen"
            )
            self.assertEqual(restored, data)
            self.assertEqual(abstentions, {"j": "abstain"})

    def test_perfect_missing_abstentions_and_clusters(self):
        items = [
            {"id": "a", "answer_id": "answer1"},
            {"id": "b", "answer_id": "answer1"},
            {"id": "c", "answer_id": "answer2"},
        ]
        result = agreement(
            items,
            {"a": "supported", "b": "abstain"},
            {"a": "supported", "b": "abstain"},
        )
        self.assertEqual(result["raw_agreement"], 1)
        self.assertEqual(result["missing_items"], ["c"])
        self.assertEqual(result["abstentions"], 2)
        self.assertEqual(len(result["answer_clusters"]), 2)
        self.assertEqual(result["paired_items"], 1)

    def test_disagreement_retained(self):
        result = agreement(
            [{"id": "a", "answer_id": "1"}], {"a": "partial"}, {"a": "contradicted"}
        )
        self.assertEqual(result["raw_agreement"], 0)
        self.assertEqual(len(result["disagreements"]), 1)

    def test_population_and_hash_mismatch_rejected(self):
        base = {
            "sources": [{"id": "s", "text": "source", "sha256": "bad"}],
            "claims": [{"id": "c", "text": "claim", "citation_ids": ["s"]}],
        }
        with self.assertRaises(ValueError):
            validate_population(base, base)

    def test_preparation_blinds_scores_preserves_original(self):
        corpus = {
            "asqa": {
                "model": {
                    "answer": {
                        "id": "answer",
                        "output": "Answer [1].",
                        "question": "Q",
                        "overall_precision_score": 1,
                        "automatic_precision_scores": [1],
                        "sentences": [
                            {
                                "text": "Answer [1].",
                                "citations": [
                                    {
                                        "title": "T",
                                        "text": "Source",
                                        "citation_precision_score": 2,
                                    }
                                ],
                            }
                        ],
                    }
                }
            }
        }
        result = prepare(corpus, 1)
        self.assertEqual(result["reviewer_a"]["reviews"], [])
        self.assertNotIn("citation_precision_score", str(result["reviewer_a"]))
        self.assertEqual(
            result["population"]["original_alce"][0]["data"],
            corpus["asqa"]["model"]["answer"],
        )
        self.assertIsNone(result["population"]["items"][0]["original_ais_label"])

    def test_comparison_requires_authentic_scores(self):
        with self.assertRaises(ValueError):
            compare_scores([], {}, {"synthetic": True})

    def valid_packet(self):
        return {
            "sources": [
                {
                    "id": "s",
                    "title": "T",
                    "text": "source",
                    "sha256": hashlib.sha256(b"source").hexdigest(),
                }
            ],
            "claims": [{"id": "c", "text": "claim", "citation_ids": ["s"]}],
            "reviews": [],
        }

    def test_population_mismatches_with_valid_hash_baseline(self):
        base = self.valid_packet()
        self.assertEqual(validate_population(base, copy.deepcopy(base)), {})
        for change in (
            lambda packet: packet["claims"][0].update(text="changed"),
            lambda packet: packet["claims"][0].update(citation_ids=[]),
            lambda packet: packet["sources"][0].update(id="different"),
            lambda packet: packet["sources"][0].update(text="changed"),
        ):
            altered = copy.deepcopy(base)
            change(altered)
            with self.assertRaises(ValueError):
                validate_population(base, altered)

    def test_latest_append_history_and_stale_rejection(self):
        base = self.valid_packet()
        reviewed = copy.deepcopy(base)
        reviewed["reviews"] = [
            {
                "id": "r1",
                "claim_id": "c",
                "source_id": "s",
                "source_sha256": base["sources"][0]["sha256"],
                "start": 0,
                "end": 6,
                "verdict": "partial",
                "reviewer": "Synthetic A",
                "rationale": "Synthetic rationale",
            }
        ]
        reviewed["reviews"].append(
            dict(reviewed["reviews"][0], id="r2", verdict="supported")
        )
        self.assertEqual(validate_population(base, reviewed), {"c:s": "supported"})
        reviewed["reviews"][0]["source_sha256"] = "b" * 64
        with self.assertRaises(ValueError):
            validate_population(base, reviewed)

    def test_compound_exclusions_are_explicit_and_blinded(self):
        corpus = {
            "asqa": {
                "model": {
                    "answer": {
                        "id": "answer",
                        "output": "Answer [1].",
                        "question": "Q",
                        "sentences": [
                            {
                                "text": "Answer [1].",
                                "citations": [
                                    {
                                        "title": "T",
                                        "text": "Source",
                                        "citation_precision_score": 2,
                                    }
                                ],
                            }
                        ],
                    }
                }
            }
        }
        result = prepare(corpus, 1, {"a1-s0:a1-s0-d0": "Synthetic compound exclusion"})
        self.assertEqual(result["population"]["items"], [])
        self.assertEqual(
            result["reviewer_context"],
            [{"answer_id": "a1", "question": "Q", "output": "Answer [1]."}],
        )
        with self.assertRaises(ValueError):
            prepare(corpus, 1, {"unknown": "Reason"})


if __name__ == "__main__":
    unittest.main()
