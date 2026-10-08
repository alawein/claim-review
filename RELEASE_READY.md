# v0.3.0 release readiness

Prepared locally, not released. This branch permits one draft PR against `main`.
Merging, tags, GitHub Releases, package publication, Pages deployment, settings,
and secrets are separate owner gates. No step below was executed in this run.

## Merge gate

After explicit merge authorization, mark the draft ready in the PR UI, review
the exact current head and checks, then use the PR number from this branch:

```powershell
gh pr ready --repo alawein/claim-review <PR_NUMBER>
gh pr checks --repo alawein/claim-review <PR_NUMBER>
gh pr merge --repo alawein/claim-review <PR_NUMBER> --squash --match-head-commit <APPROVED_HEAD_SHA>
```

Do not use `--delete-branch` or `--admin`. Passing checks are not merge permission.
Pages was made manual-only so a separately approved merge does not deploy.

## Tag and package publication gates

`release.yml` triggers only on a pushed `v*` tag, checks that the tagged commit
is an ancestor of `origin/main`, and compares the tag to the package version.
It publishes automatically through a configured trusted publisher. Therefore
**pushing the tag crosses both the tag gate and the package publication gate**.
The workflow uses full action commit SHAs, OIDC, and build attestations.

Configure the trusted publisher only after the owner authorizes registry setup.
The workflow filename is `release.yml`, owner `alawein`, repository `claim-review`,
environment `npm`. No secret is needed by the workflow.

After merge, registry configuration, and explicit tag plus publish approval:

```powershell
git fetch origin main
git tag -a v0.3.0 origin/main -m "chore(release): v0.3.0"
git push origin refs/tags/v0.3.0
gh run list --repo alawein/claim-review --workflow release.yml --limit 1
```

Recheck the exact main revision and the absence of an existing tag before tagging.
Never overwrite a tag. Inspect the finished publishing run and download/check
the registry artifact before claiming that publication succeeded.

For npm, [trusted publishing](https://docs.npmjs.com/trusted-publishers/)
requires Node >=22.14 and npm >=11.5.1. The workflow uses Node 22.23.2 and
installs pinned npm 12.2.0 before checking the CLI version. The package is a distributable standalone browser app, not a
JavaScript API library. Local `npm pack --dry-run` proves package contents only.

`claim-review` returned HTTP 404 from the npm registry on October 8, 2026.
That does not reserve the name. npm trusted-publisher configuration lives in
an existing package's Settings > Trusted Publisher. First publication may
require a separate authorized maintainer bootstrap because there is no package
settings page yet. Do not create a token. Resolve first-publication access with
the owner's existing registry account, then configure the workflow before tags.
If first publication requires a maintainer bootstrap, this is a separate npm
publication gate using existing authenticated access, not permission to create
secrets. Build the approved revision with `npm ci` and `npm pack`; after explicit
bootstrap approval run `npm publish claim-review-0.3.0.tgz --access public`.
The later tag workflow supplies trusted publishing and provenance. The local
bootstrap does not establish GitHub-hosted provenance.

## GitHub Release gate

Only after explicit release authorization and verified package publication:

```powershell
gh release create v0.3.0 --repo alawein/claim-review --verify-tag --title "claim-review v0.3.0" --notes-file RELEASE_NOTES.md claim-review-0.3.0.tgz dist/index.html
```

Build the approved tagged revision with `npm ci` and `npm pack` to create
`claim-review-0.3.0.tgz`. Use those files from the approved tagged revision. Check uploaded artifact
hashes after downloading them. [Release notes](RELEASE_NOTES.md) are prepared
from the changelog; add the actual published artifact checks after the release.

## Pages deployment gate

The Pages workflow is manual-only. After explicit Pages authorization:

```powershell
gh workflow run pages.yml --repo alawein/claim-review --ref main
gh run list --repo alawein/claim-review --workflow pages.yml --limit 1
```

The existing `github-pages` environment and Pages source must be configured by
the owner if absent. Inspect the run and <https://alawein.github.io/claim-review/> before
claiming deployment. Changing Pages settings is a separate settings gate.

## Security settings gate

Follow [SECURITY_SETTINGS.md](SECURITY_SETTINGS.md) at
<https://github.com/alawein/claim-review/settings/security_analysis>. Enable dependency
graph, Dependabot alerts, and Dependabot security updates. Add version-update
configuration through a separately authorized PR. No setting was changed here.
