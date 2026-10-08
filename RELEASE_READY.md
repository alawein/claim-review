# Release readiness

## Current state, October 8, 2026

v0.3.0 merged through [PR19](https://github.com/alawein/claim-review/pull/19),
commit `876d78580bca07c3ab7f7ae7c6530db9bd1d9b69`. Its immutable
[tag](https://github.com/alawein/claim-review/tree/v0.3.0) and
[GitHub Release](https://github.com/alawein/claim-review/releases/tag/v0.3.0)
exist. The npm [workflow](https://github.com/alawein/claim-review/actions/runs/37799350424)
failed with `ENEEDAUTH`; npm returned 404 for claim-review@0.3.0 on October 8.
The GitHub assets were built locally and do not establish hosted build provenance.
Preserve those tags and assets. v0.3.1 publication has not yet been attempted.

The owner authorized remaining compatible improvements, registry setup,
publication, Pages and non-Dependabot security controls. Credentials remain
owner-entered. Missing authentication is an access blocker, not a new approval
gate. The coordinator owns remote delivery and authenticated registry bootstrap.

## Build once and distribute the same files

After reviewed v0.3.1 changes merge, push a new annotated `v0.3.1` tag at the
verified main revision. Never reuse or rewrite v0.3.0. `release.yml` runs only
on tags and checks version and main ancestry. Its build job runs checks and
creates the offline HTML exactly once; `npm pack --ignore-scripts` packages it
without a second prepack build. Build tools remain development-only.

`release-assets` contains exactly `claim-review-0.3.1.tgz`, `index.html` and
`SHA256SUMS`. The verifier checks expected name/version, exact inventory, hashes
and byte equality between standalone and packaged HTML. Checksums are separate
from `dist`. All distribution files are retained as an Actions artifact for
90 days before attestation/publication, including when later npm access fails.

The exact tarball and standalone HTML receive hosted build attestations. The
workflow verifies repository, workflow, source commit, tag and hosted-runner
constraints. Full action SHAs were read back from the upstream tags on October 8.
Only the release-upload job receives `contents:write`.

The npm job downloads those files, verifies inventory, checks whether the exact
version already exists, and publishes the same tarball through OIDC with npm
provenance. It downloads registry bytes and compares SHA-256, verifies the hosted
build attestation and checks npm provenance subject, SHA-512, repository,
workflow, tag, commit and hosted builder. `npm audit signatures` verifies registry
signatures and Sigstore provenance cryptographically. Publication does not rebuild.

The GitHub upload job runs after a successful build even if npm fails. It uploads
those same files and the checksum inventory, then downloads and compares bytes.
Existing identical assets are retained; mismatching assets fail without replacing
anything. A matching registry version is verified without publishing it again.

## Registry access and retry states

- Published successfully: download the existing version, compare bytes and verify
  provenance. Do not publish it again. In this suite outcome-check@0.3.0 has
  already succeeded; its publication must not be retried blindly.
- Failed with a verified cause: v0.3.0 claim-review failed with `ENEEDAUTH` and the
  registry version was absent on readback. The owner/coordinator must resolve
  first-publication authentication and configure the trusted publisher. Do not
  manufacture credentials or claim successful setup from prepared workflow code.
- Not yet attempted: v0.3.1 has no new tag/run/publication yet. After merge and
  verified registry access, the new workflow must execute and its live artifact
  comparisons must pass before build/registry/GitHub equality is claimed.

Trusted publisher: owner `alawein`, repository `claim-review`, workflow
`release.yml`, environment `npm`. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
The workflow uses Node 22.23.2 and npm 12.2.0. First-publication bootstrap may be
needed because npm package settings require an existing package. The human enters
credentials through the managed flow. Build preparation and pack dry runs prove
contents, not authentication, provenance or registry publication.

After an ambiguous publish failure, inspect the destination before retrying.
Only HTTP 404 authorizes the pipeline's publish path. Access errors fail closed;
an existing different tarball fails. Even identical existing bytes require
provenance validation rather than a success assertion from presence alone.

## Pages and security

Pages remains manual-only. The coordinator can run the existing workflow within
the named authorization, then verify the actual public output. Local build checks
do not prove Pages deployment. See [security settings](SECURITY_SETTINGS.md).
The entire Dependabot family is excluded; existing report-only npm audits remain.

## Dated prepublication evidence

Before PR19 merged on October 8, the v0.3.0 branch was a prepared release candidate
and remote operations awaited the then-current owner grant. Those conditions were
superseded by the grant recorded in AGENTS.md and actual merge/tag/GitHub delivery.
The original local test evidence remains in [AUDIT_VERIFICATION.md](AUDIT_VERIFICATION.md).
Do not reinterpret those tests as a newer hosted or npm publication result.
