# Packet contract v1

Exact root fields: schema_version(number1), sources(array<=100), claims(array<=1000),
reviews(array<=10000). UTF-8 JSON without BOM, <=5 MiB. No type coercion or dropped
array entries. IDs are unique within each collection, nonblank strings <=200 units.
Text rejects isolated surrogates. Lengths and offsets use UTF-16 code units.

Source fields: id, title(nonblank<=1000), text(possibly empty<=100000), sha256
(lowercase64-digit hex of exact original UTF-8 text). Claim fields: id,
text(nonblank<=10000), citation_ids(unique source IDs<=100). Unknown refs fail.

Review fields: id, claim_id, source_id, source_sha256, start, end, verdict, rationale,
reviewer. Rationale nonblank<=4000, reviewer nonblank<=200. Verdict supported,
partial, contradicted or unverifiable. IDs must reference a claim and cited source.
Offsets safe integers, 0<=start<end<=100000. Current-source spans additionally
must fit its text and cannot split a surrogate pair. Old-hash reviews are stale:
original passage is unavailable, so current text cannot validate or supply it.

Appending requires current source hash and preserves old reviews. Latest is last
append per pair. Invalid imports preserve the current session. Self-reported
reviewer identity and hash consistency are not authentication. No automatic judge,
source retrieval, OCR/PDF extraction, server, accounts, storage or telemetry.

JSON uses the platform parser; duplicate object keys are not an integrity signal
and follow JSON.parse's last-key semantics. Use unique fields in authored packets.
Collection IDs and citations are strictly checked for duplicates. Closing without
export loses work; outputs can contain confidential text the user supplied.

Textarea selection positions are mapped back to original CRLF UTF-16 offsets;
source text and its hash remain exact. Export uses compact JSON without a trailing
newline and checks the exact byte bound, so exported packets can be reimported.
