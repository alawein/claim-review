# Release readiness

## Current state, October 8, 2026

v0.3.0 merged through [PR19](https://github.com/alawein/claim-review/pull/19),
commit `876d78580bca07c3ab7f7ae7c6530db9bd1d9b69`. Its immutable
[tag](https://github.com/alawein/claim-review/tree/v0.3.0) and
[GitHub Release](https://github.com/alawein/claim-review/releases/tag/v0.3.0)
exist. The npm [workflow](https://github.com/alawein/claim-review/actions/runs/37799350424)
failed with `ENEEDAUTH`; npm returned 404 for claim-review@0.3.0 on October 8.
The GitHub assets were built locally and do not establish hosted build provenance.
Preserve those tags and assets. v0.3.1 GitHub assets are published from the canonical hosted build; its npm attempt failed before authentication with EALLOWGIT. v0.3.2 is the upcoming corrected release.

The owner authorized remaining compatible improvements, registry setup,
publication, Pages and non-Dependabot security controls. Credentials remain
owner-entered. Missing authentication is an access blocker, not a new approval
gate. The coordinator owns remote delivery and authenticated registry bootstrap.

## Build once and distribute the same files

After reviewed v0.3.2 changes merge, push a new annotated `v0.3.2` tag at the
verified main revision. Never reuse or rewrite v0.3.0 or v0.3.1. `release.yml` runs only
on tags and checks version and main ancestry. Its build job runs checks and
creates the offline HTML exactly once; `npm pack --ignore-scripts` packages it
without a second prepack build. Build tools remain development-only.

`release-assets` contains exactly `claim-review-0.3.2.tgz`, `index.html` and
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
- Not yet attempted: v0.3.2 has no new tag/run/publication yet. After merge and
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

## First npm package bootstrap (owner/coordinator only)

The owner runs `npm login --auth-type=web` and completes the browser login,
including any second factor. Agents never enter or read credentials.
Read `npm view claim-review@0.3.0 version dist --json` again. Only confirmed
E404 permits bootstrap; other errors require resolving access. If the version
exists, inspect its bytes before retrying and do not publish it again.

Use the existing immutable v0.3.0 release, downloaded to a new empty directory:

```powershell
gh release download v0.3.0 --repo alawein/claim-review --pattern claim-review-0.3.0.tgz --pattern index.html --pattern SHA256SUMS --dir bootstrap-assets
node scripts/verify-release-artifacts.mjs verify bootstrap-assets claim-review 0.3.0
Get-FileHash bootstrap-assets/claim-review-0.3.0.tgz -Algorithm SHA256
```

The verifier must pass name/version, inventory and packaged/standalone HTML
comparison. Independently compare the displayed tarball SHA-256 with
`594c86a2ae02d989f55bc9872b72f9306ee1be1a42fad651ff51ed61efbd5a70`.
Stop on any mismatch. After another confirmed registry E404, the authenticated
owner/coordinator may run:

```powershell
npm publish bootstrap-assets/claim-review-0.3.0.tgz --access public --ignore-scripts
npm view claim-review@0.3.0 version dist --json
```

Download the returned registry tarball and compare its SHA-256 with the same
expected value before recording bootstrap success. Manual v0.3.0 publication
has no OIDC registry provenance; future runs cannot add provenance to an already
published version. Preserve its original tag and assets.

Then configure the existing package's npm trusted publisher: owner `alawein`,
repository `claim-review`, workflow `release.yml`, environment `npm`.
Never manually publish v0.3.2: consuming that version prevents later OIDC
publication from adding provenance. Reserve it for the canonical tag workflow.
These instructions establish no actual login, publisher setup or publication.

## Workflow result reporting

Generated GitHub Release bodies use validated build/publish job results.
Only a successful publish job including registry byte, provenance and signature
verification claims verified npm publication. Failure or cancellation leaves
registry state unverified; skipped publication remains pending. Retry uploads
retain matching assets and reconcile the body after all asset checks pass.

## Actual v0.3.1 execution and corrective v0.3.2

[Run 37826160022](https://github.com/alawein/claim-review/actions/runs/37826160022)
ran from immutable v0.3.1 at merged main
`d2fb1b023b6ff0d9f1159005710778b72adedd0b`. Its build passed 94 unit tests,
48 browser cases and schema validation; hosted artifact attestation succeeded.
The [v0.3.1 GitHub Release](https://github.com/alawein/claim-review/releases/tag/v0.3.1)
contains the canonical tarball and HTML. npm failed with EALLOWGIT: npm 12.2.0
interpreted `release-assets/claim-review-0.3.1.tgz` as GitHub shorthand.
This is a local-path parsing defect, not evidence of successful npm publication.
Owner CLI authentication remains blocked with E401 pending human web login.

The corrected invocation resolves the tarball to an absolute local path.
The immutable old tag retains the old script, so retries cannot incorporate
this fix. Preserve v0.3.1 assets/tag and use v0.3.2 for the corrected workflow.
The v0.3.0 bootstrap route above remains conditional on fresh registry absence;
its manual/no-OIDC-provenance limitation remains unchanged. Neither prepared
code nor successful dry runs prove authentication or actual npm publication.
