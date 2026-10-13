# Migration

Displayed name is Siftgrain Cite. Repository/package remains claim-review; no import path, namespace, tag or native packet version changes. Build with npm ci and npm run build; open dist/index.html. Existing v0.2 schema1 packets migrate to schema2 without changing source text; use native Export packet to preserve enriched history. W3C and CSV/label exports do not replace the resumable packet.

Preferences use siftgrain-viewer (appearance/vibe only). Drafts retain claim-review.draft.v1 and require explicit opt-in. No automatic restore. Merge right-hand novel history takes append precedence, with labels self-reported. Export both original reviewer packets before merging if you need independently frozen inputs.

## Prepared remote steps

No remote rename/transfer, registry rename, new release or HF upload was performed. These broad publication steps need the owner's exact scope and the relevant independent review/checks. Preserve all existing tags/feature branches.

- Rename only after scoped approval: `gh repo rename siftgrain-cite --repo alawein/claim-review --yes`. Then change the local origin with `git remote set-url origin https://github.com/alawein/siftgrain-cite.git`, verify GitHub redirects, package links, Pages URL, schema namespace policy and consumers. Do not rename published schemas silently.
- Transfer only after exact destination approval: GitHub repository Settings > General > Danger Zone > Transfer ownership > destination kohyr, retaining redirects and verifying required checks and Pages afterward. No transfer command executed.
- Dataset upload, only after rights and named destination approval: `hf upload alawein/siftgrain-cite benchmarks/artifacts --repo-type dataset`. Current local mixed-rights archive must not be bulk uploaded without preserving ALCE MIT notice and Wikipedia attribution/share-alike obligations; synthetic-only publication is the safer scoped choice.
- New release after a named version is approved: `gh release create <approved-version> benchmarks/artifacts/siftgrain-cite-v1.zip --repo alawein/claim-review --target <reviewed-sha> --notes-file <reviewed-notes>`. Placeholders are intentionally unresolved consequential decisions, not executable authorization.

Keep canonical package name claim-review for this compatible improvement. Existing npm publication failures remain historical facts, not evidence of registry ownership or current publication.
