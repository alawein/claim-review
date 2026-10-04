# Bounded usefulness exercise

Actor: Codex, AI-assisted. Original synthetic non-client refund passage/claims,
no external participants, timed study, production use or adoption. Source hash:
959596123ba3f4d152094e378321651174328175fbecbb64dc8e9715661ec22a.

Baseline manual sheet: read123-character passage; record four claim/verdict/
rationale entries. First rule supported at[0,44); all-refunds-five-days partial
at[45,86), because usually does not mean all; expedited processing claim contradicted
at[87,123); bonus claim unverifiable at[0,123), absence does not establish falsity.
These synthetic editorial expectations were fixed before implementation.

Actual browser flow: import packet, choose each claim, enter offsets/verdict/
rationale/reviewer, save4 reviews, export and reimport. Expected/observed verdicts,
spans and rationales match exactly; actual packet in examples/reviewed.json.
Corrupt source import failed while retaining existing reviews. No integrity false
alarm against the specified task; semantic judgments remain self-reported.

Preparation requires permitted source text, hashes and JSON packet creation. The
manual sheet is easier for four claims and no import contract. This tool adds
validated exact spans, visible history and portable export; no measured speed gain.
[Recogito Text Annotator](https://github.com/recogito/text-annotator-js) and
[Label Studio](https://labelstud.io/guide/) offer broader annotation workflows.
Recogito's W3C-oriented annotations use different offset conventions; this
proprietary UTF-16 packet does not claim compatibility. Label Studio adds project/
labeling infrastructure. Those comparisons use documentation, not timed installs.

The local review workflow is usable. Community demand, comparative superiority,
semantic accuracy and practical benefit beyond an existing annotation setup remain
unproven. Source preparation can erase the expected convenience advantage.
