# Security settings

## Current authorized controls, October 8, 2026

The owner explicitly excludes the entire Dependabot family: alerts, security
updates, version-update configuration and automated PRs. Do not enable or modify
any of these, including `.github/dependabot.yml`. The earlier enablement proposal
is superseded. No Dependabot setting is changed by this local closeout.

Existing CI performs report-only `npm audit --omit=dev`; development dependency
coverage can be inspected with `npm audit`. Audit results are not proof of security.
Supported non-Dependabot controls include pinned workflow actions, least-privilege
job tokens, exact artifact verification, hosted build attestations, OIDC registry
publication, branch protection and secret scanning/push protection where available.
Observed settings and live execution are reported by the coordinating agent;
prepared workflow code does not prove enforcement or deployment.

The authenticated maintainer UI is
<https://github.com/alawein/claim-review/settings/security_analysis>.
The exact URL is narrowly excluded from anonymous link checks because it requires
maintainer access. Public documentation/release links are not exempted.

Registry trusted-publisher setup is authorized. Credentials remain human-entered
through the managed flow. Do not create/rotate a token to bypass missing access;
see [release readiness](RELEASE_READY.md) for the verified failure and retry states.

## Dated read-only evidence

Before v0.3.0 publication on October 8, API checks found Dependabot security
updates disabled, vulnerability alerts disabled (HTTP 404 with GitHub's explicit
"Vulnerability alerts are disabled" response), and automated security fixes
`enabled: false, paused: false`. No setting was changed in that inspection.
This historical readback does not establish every current non-Dependabot control.
