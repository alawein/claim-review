# Security settings awaiting owner action

No repository settings were changed in the v0.3.0 branch. Dependency audits in
CI are report-only. A clean audit is not proof that the software is secure.

After explicit authorization, open
<https://github.com/alawein/claim-review/settings/security_analysis> and enable:

1. Dependency graph (if disabled).
2. Dependabot alerts.
3. Dependabot security updates.

For version-update PRs, open the repository Code tab, Add file, Create new file,
and add `.github/dependabot.yml` through a separately authorized branch/PR.
Use `version: 2`, an ecosystem entry for `github-actions` at `/` weekly and
an entry for `npm` at `/` weekly.
The `uv` and `npm` ecosystem names are listed in [GitHub documentation](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories). Enabling
alerts and adding version-update configuration are separate changes.

The release workflow needs a trusted publisher registered by the owner before
a tag is pushed. See [release readiness](RELEASE_READY.md). Do not create or
rotate a token as a workaround.

Ready-to-copy configuration (not active until a separately authorized PR merges):

```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```
